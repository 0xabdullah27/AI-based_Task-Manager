"""AI Agent service for todo management.

Uses OpenAI Agents SDK with Gemini 2.5 Flash via OpenAI-compatible API.
Tools are in-process SDK function tools (src.services.agent.tools) that share
the request's DB session and user_id via RunContextWrapper — no MCP server.

Implements the stateless conversation flow per spec:
  1. Receive user message
  2. Fetch conversation history from database
  3. Build message array for agent (history + new message)
  4. Store user message in database
  5. Run agent with SDK function tools
  6. Agent invokes appropriate tool(s)
  7. Store assistant response in database
  8. Return response to client
  9. Server holds NO state
"""

import json
import logging
from typing import Optional, AsyncGenerator

from sqlmodel import Session

from agents import (
    Agent,
    AsyncOpenAI,
    OpenAIChatCompletionsModel,
    Runner,
    set_tracing_disabled,
)

from src.core.config import settings
from src.services.conversation_service import conversation_service
from src.services.agent.tools import (
    AgentContext,
    add_task_tool,
    complete_task_tool,
    delete_task_tool,
    list_tasks_tool,
    update_task_tool,
)
from src.schemas.chat import ChatResponse

logger = logging.getLogger(__name__)

# Disable tracing for cleaner output
set_tracing_disabled(True)

# ── Provider base URLs (when not using custom llm_base_url) ──
_PROVIDER_BASE_URLS = {
    "openrouter": "https://openrouter.ai/api/v1",
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "mistral": "https://api.mistral.ai/v1",
    "groq": "https://api.groq.com/openai/v1",
    "freetokenfaucet": "https://freetokenfaucet.com/v1",
}

# Agent system prompt per spec's Agent Behavior Specification
AGENT_SYSTEM_PROMPT = """You are an intelligent, proactive AI Todo Assistant that helps users manage their tasks effortlessly using natural language.

You have access to tools: `add_task`, `list_tasks`, `complete_task`, `delete_task`, and `update_task`.

### CORE BEHAVIORS & RULES

1. **CRITICAL TOOL EXECUTION RULE**:
   After you execute any tool (such as `add_task`, `list_tasks`, `complete_task`, `delete_task`, or `update_task`), your next response MUST be a plain text answer to the user summarizing the result. You MUST NOT call any tool a second time for the same request.

2. **Intelligent Priority Auto-Detection**:
   Analyze the user's intent, urgency, and wording to automatically set `priority`:
   - **"high"**: Expressions of urgency, deadlines, or critical importance (e.g., "ASAP", "as soon as possible", "urgent", "critical", "immediately", "must do now", "high priority", "due today", "emergency").
   - **"medium"**: Expressions of importance or standard work items (e.g., "important", "needed soon", "should do", "medium priority", "work item").
   - **"low"**: Casual, non-urgent, or future items (e.g., "low priority", "someday", "when free", "whenever", "casual", "minor", "later").
   - If priority is not explicitly mentioned or implied, default to `null` (or omit priority argument).

3. **Bulk & Multi-Task Creation**:
   If the user lists multiple distinct tasks in a single message (e.g., "Add buy groceries, finish report ASAP, and call John when free"), execute `add_task` ONCE per task, then summarize the created tasks for the user.

4. **Ambiguity & Clarifying Questions**:
   - If the user asks to modify, complete, or delete a task without specifying WHICH task, call `list_tasks` first to see their existing tasks.
   - If there are multiple matching or ambiguous tasks, list the candidate tasks clearly and ask a friendly clarifying question (e.g., *"Which task would you like to update? Here are your matching tasks..."*).
   - Never guess a task ID blindly. Always retrieve tasks with `list_tasks` first when referencing by title.

5. **Multi-Step Action Execution**:
   - When completing, deleting, or updating a task by title or keyword (e.g., "Delete the bike task"):
     1. Call `list_tasks` to search for matching tasks and obtain the task ID.
     2. Call `delete_task`, `complete_task`, or `update_task` using the retrieved `task_id`.

6. **Friendly Confirmation & Clean Markdown**:
   - Confirm all created/updated/deleted tasks with friendly, clear responses.
   - User identity is handled automatically — do NOT ask for or pass a `user_id`.
"""


def _get_model():
    """Create the LLM model instance based on settings."""
    provider = settings.llm_provider
    model_id = settings.llm_model
    base_url = settings.llm_base_url or _PROVIDER_BASE_URLS.get(provider)

    # Pick the API key for the selected provider
    api_key_map = {
        "openrouter": settings.openrouter_api_key,
        "openai": settings.openai_api_key,
        "gemini": settings.gemini_api_key,
        "mistral": settings.mistral_api_key,
        "groq": settings.groq_api_key,
        "freetokenfaucet": settings.freetokenfaucet_api_key,
    }
    api_key = api_key_map.get(provider)

    if not api_key:
        env_var = f"{provider.upper()}_API_KEY"
        raise ValueError(
            f"{env_var} not set in .env file for provider '{provider}'. "
            f"Current config: LLM_PROVIDER={provider}, LLM_MODEL={model_id}"
        )

    logger.info(f"Using LLM provider={provider}, model={model_id}, base_url={base_url}")
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    return OpenAIChatCompletionsModel(model=model_id, openai_client=client)


async def handle_chat(
    user_id: str,
    message: str,
    conversation_id: Optional[str],
    session: Session,
) -> ChatResponse:
    """Handle a chat message — the main entry point.

    Per spec stateless conversation flow:
    1. Get or create conversation
    2. Fetch history from DB
    3. Store user message
    4. Build message array (history + new user message)
    5. Run agent with SDK function tools
    6. Store assistant response
    7. Return response
    """
    logger.info(f"Handling chat for user {user_id}, conversation: {conversation_id or 'new'}")
    
    # 1. Get or create conversation
    conversation = conversation_service.get_or_create_conversation(
        session, user_id, conversation_id
    )
    logger.debug(f"Conversation ID: {conversation.id}")

    # 2. Fetch conversation history from DB
    history = conversation_service.get_history(session, conversation.id)
    logger.debug(f"Fetched {len(history)} messages from history")

    # 3. Store user message in database
    conversation_service.add_message(
        session, conversation.id, user_id, role="user", content=message
    )
    logger.debug(f"Stored user message: {message[:50]}...")

    # 4. Build prompt for agent (including recent conversation history context if available)
    if history:
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-6:]])
        input_for_agent = f"Conversation History:\n{history_text}\n\nCurrent User Request: {message}"
    else:
        input_for_agent = message

    logger.debug(f"Sending prompt to AI agent: {input_for_agent[:80]}...")

    # 5. Run agent with SDK function tools (shared session via context)
    model = _get_model()
    context = AgentContext(session=session, user_id=user_id)

    response_text = ""

    try:
        logger.info("Running AI agent with SDK function tools")
        agent = Agent(
            name="Todo Assistant",
            instructions=AGENT_SYSTEM_PROMPT,
            tools=[add_task_tool, list_tasks_tool, complete_task_tool, delete_task_tool, update_task_tool],
            model=model,
        )

        result = await Runner.run(agent, input=input_for_agent, context=context, max_turns=10)
        response_text = (
            result.final_output or "I'm sorry, I couldn't process that request."
        )
        # response_text = "This is a placeholder response. The agent execution is currently disabled for testing."
        logger.info(f"AI agent completed. Response length: {len(response_text)} chars")

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise
        # logger.error(f"Agent error: {e}", exc_info=True)
        # response_text = f"I encountered an error processing your request: {str(e)}"

    # 6. Store assistant response in database
    conversation_service.add_message(
        session, conversation.id, user_id, role="assistant", content=response_text
    )
    logger.debug(f"Stored assistant response: {response_text[:50]}...")

    # 7. Return response
    logger.info(f"Chat completed for user {user_id}, conversation: {conversation.id}")
    return ChatResponse(
        conversation_id=conversation.id,
        response=response_text,
        # tool_calls=tool_calls,
    )


async def handle_chat_stream(
    user_id: str,
    message: str,
    conversation_id: Optional[str],
    session: Session,
) -> AsyncGenerator[str, None]:
    """Handle a chat message with streaming response.

    Per spec stateless conversation flow with streaming:
    1. Get or create conversation
    2. Fetch history from DB
    3. Store user message
    4. Build message array (history + new user message)
    5. Run agent with SDK function tools
    6. Stream response tokens as they arrive
    7. Store complete assistant response in database
    8. Send final SSE event with conversation_id

    Yields:
        SSE-formatted strings: "data: {...}\n\n"
    """
    logger.info(f"Starting streaming chat for user {user_id}, conversation: {conversation_id or 'new'}")
    
    # 1. Get or create conversation
    conversation = conversation_service.get_or_create_conversation(
        session, user_id, conversation_id
    )
    logger.debug(f"Stream conversation ID: {conversation.id}")

    # 2. Fetch conversation history from DB
    history = conversation_service.get_history(session, conversation.id)
    logger.debug(f"Stream: Fetched {len(history)} messages from history")

    # 3. Store user message in database
    conversation_service.add_message(
        session, conversation.id, user_id, role="user", content=message
    )
    logger.debug(f"Stream: Stored user message: {message[:50]}...")

    # 4. Build prompt for agent
    if history:
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-6:]])
        input_for_agent = f"Conversation History:\n{history_text}\n\nCurrent User Request: {message}"
    else:
        input_for_agent = message

    logger.debug(f"Stream: Sending prompt to AI agent: {input_for_agent[:80]}...")

    # 5. Run agent with SDK function tools and stream response
    model = _get_model()
    context = AgentContext(session=session, user_id=user_id)

    response_text = ""
    token_count = 0

    try:
        logger.info("Stream: Running AI agent with SDK function tools")
        agent = Agent(
            name="Todo Assistant",
            instructions=AGENT_SYSTEM_PROMPT,
            tools=[add_task_tool, list_tasks_tool, complete_task_tool, delete_task_tool, update_task_tool],
            model=model,
        )

        # Use run_streamed() for proper streaming (per OpenAI Agents SDK docs)
        streamed = Runner.run_streamed(
            agent,
            input=input_for_agent,
            context=context,
            max_turns=5,
        )

        # Stream the response events
        async for event in streamed.stream_events():
            # Handle different event types per SDK documentation
            if hasattr(event, 'type'):
                if event.type == "raw_response_event":
                    # Token-by-token streaming - extract just the text delta
                    if hasattr(event, 'data') and event.data:
                        # Extract text from various event types
                        text_delta = ""
                        event_data = event.data
                        
                        # Handle different event data structures
                        if hasattr(event_data, 'type'):
                            # ResponseTextDeltaEvent - has 'delta' attribute
                            if hasattr(event_data, 'delta') and event_data.delta:
                                text_delta = event_data.delta
                            # ResponseFunctionCallArgumentsDeltaEvent - tool call arguments
                            elif hasattr(event_data, 'delta') and hasattr(event_data, 'item_id'):
                                text_delta = event_data.delta or ""
                        elif isinstance(event_data, str):
                            text_delta = event_data
                        else:
                            # Fallback: convert to string
                            text_delta = str(event_data)
                        
                        # Only yield if we have actual text content
                        if text_delta:
                            response_text += text_delta
                            token_count += 1
                            # EventSourceResponse adds 'data: ' automatically
                            yield json.dumps({'type': 'token', 'content': text_delta})

                elif event.type == "agent_updated_stream_event":
                    # Agent handoff happened (if using multiple agents)
                    logger.debug(f"Stream: Agent updated to {getattr(event, 'new_agent', 'unknown')}")

                elif event.type == "final_output":
                    # Final output event
                    final_text = getattr(event, 'output', response_text)
                    if final_text and final_text != response_text:
                        response_text = final_text
                        # EventSourceResponse adds 'data: ' automatically
                        yield json.dumps({'type': 'token', 'content': final_text})

        # Get final output from the streamed result
        if hasattr(streamed, 'final_output') and streamed.final_output:
            response_text = streamed.final_output

        logger.info(f"Stream: AI agent completed. Tokens streamed: {token_count}, Response length: {len(response_text)} chars")

    except Exception as e:
        logger.error(f"Stream: Agent error: {e}", exc_info=True)
        error_message = f"I encountered an error processing your request: {str(e)}"
        # EventSourceResponse adds 'data: ' automatically
        yield json.dumps({'type': 'error', 'content': error_message})
        response_text = error_message

    # 6. Store assistant response in database
    if response_text:
        conversation_service.add_message(
            session, conversation.id, user_id, role="assistant", content=response_text
        )
        logger.debug(f"Stream: Stored assistant response: {response_text[:50]}...")

    # 7. Send final event with conversation_id
    logger.info(f"Stream: Completed for user {user_id}, conversation: {conversation.id}, tokens: {token_count}")
    # EventSourceResponse adds 'data: ' automatically
    yield json.dumps({'type': 'done', 'conversation_id': str(conversation.id), 'response': response_text})

