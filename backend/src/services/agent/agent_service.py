"""AI Agent service module for processing natural language chat prompts and SSE token streaming.

Integrates OpenAI Agents SDK with Gemini 2.5 Flash / OpenAI models via OpenAI-compatible endpoints.
Tools share the request DB session and user_id securely via AgentContext and RunContextWrapper.
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

# Disable tracing for production execution cleanliness
set_tracing_disabled(True)

# Provider default base URLs for LLM endpoints
_PROVIDER_BASE_URLS = {
    "openrouter": "https://openrouter.ai/api/v1",
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "mistral": "https://api.mistral.ai/v1",
    "groq": "https://api.groq.com/openai/v1",
    "freetokenfaucet": "https://freetokenfaucet.com/v1",
}

# System prompt governing AI agent tool usage, priority auto-detection, and response rules
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


def _get_model() -> OpenAIChatCompletionsModel:
    """Instantiate and configure the OpenAIChatCompletionsModel based on application settings.

    Returns:
        OpenAIChatCompletionsModel: Configured model wrapper for OpenAI Agents SDK.

    Raises:
        ValueError: If required provider API key is missing from environment/settings.
    """
    provider = settings.llm_provider
    model_id = settings.llm_model
    base_url = settings.llm_base_url or _PROVIDER_BASE_URLS.get(provider)

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
            f"{env_var} not set in settings for provider '{provider}'. "
            f"Current config: LLM_PROVIDER={provider}, LLM_MODEL={model_id}"
        )

    logger.info(f"Configured LLM provider={provider}, model={model_id}, base_url={base_url}")
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    return OpenAIChatCompletionsModel(model=model_id, openai_client=client)


async def handle_chat(
    user_id: str,
    message: str,
    conversation_id: Optional[str],
    session: Session,
) -> ChatResponse:
    """Process a non-streaming natural language chat message with the AI agent.

    Follows the stateless conversation flow:
    1. Fetch or create target conversation.
    2. Retrieve conversation history context.
    3. Store user prompt in DB.
    4. Run agent with SDK function tools and DB context.
    5. Store generated assistant response in DB.
    6. Return serialized ChatResponse.

    Args:
        user_id (str): ID of the authenticated user.
        message (str): Natural language message prompt from user.
        conversation_id (Optional[str]): Existing conversation UUID, or None to create new.
        session (Session): Active SQLModel database session.

    Returns:
        ChatResponse: Structured response containing conversation ID and text response.
    """
    logger.info(f"Handling chat for user {user_id}, conversation: {conversation_id or 'new'}")

    conversation = conversation_service.get_or_create_conversation(
        session, user_id, conversation_id
    )

    history = conversation_service.get_history(session, conversation.id)

    conversation_service.add_message(
        session, conversation.id, user_id, role="user", content=message
    )

    if history:
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-6:]])
        input_for_agent = f"Conversation History:\n{history_text}\n\nCurrent User Request: {message}"
    else:
        input_for_agent = message

    model = _get_model()
    context = AgentContext(session=session, user_id=user_id)

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
        logger.info(f"AI agent completed response (length: {len(response_text)} chars)")

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        response_text = f"I encountered an error processing your request: {str(e)}"

    conversation_service.add_message(
        session, conversation.id, user_id, role="assistant", content=response_text
    )

    return ChatResponse(
        conversation_id=conversation.id,
        response=response_text,
    )


async def handle_chat_stream(
    user_id: str,
    message: str,
    conversation_id: Optional[str],
    session: Session,
) -> AsyncGenerator[str, None]:
    """Process a streaming natural language chat message with the AI agent.

    Yields Server-Sent Event (SSE) formatted text tokens as they are produced,
    stores the full assistant response in the database upon completion, and sends
    a final completion payload.

    Args:
        user_id (str): ID of the authenticated user.
        message (str): Natural language message prompt from user.
        conversation_id (Optional[str]): Existing conversation UUID, or None.
        session (Session): Active SQLModel database session.

    Yields:
        AsyncGenerator[str, None]: SSE event strings formatted as JSON.
    """
    logger.info(f"Starting streaming chat for user {user_id}, conversation: {conversation_id or 'new'}")

    conversation = conversation_service.get_or_create_conversation(
        session, user_id, conversation_id
    )

    history = conversation_service.get_history(session, conversation.id)

    conversation_service.add_message(
        session, conversation.id, user_id, role="user", content=message
    )

    if history:
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-6:]])
        input_for_agent = f"Conversation History:\n{history_text}\n\nCurrent User Request: {message}"
    else:
        input_for_agent = message

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

        streamed = Runner.run_streamed(
            agent,
            input=input_for_agent,
            context=context,
            max_turns=5,
        )

        async for event in streamed.stream_events():
            if hasattr(event, "type"):
                if event.type == "raw_response_event":
                    if hasattr(event, "data") and event.data:
                        text_delta = ""
                        event_data = event.data

                        if hasattr(event_data, "type"):
                            if hasattr(event_data, "delta") and event_data.delta:
                                text_delta = event_data.delta
                            elif hasattr(event_data, "delta") and hasattr(event_data, "item_id"):
                                text_delta = event_data.delta or ""
                        elif isinstance(event_data, str):
                            text_delta = event_data
                        else:
                            text_delta = str(event_data)

                        if text_delta:
                            response_text += text_delta
                            token_count += 1
                            yield json.dumps({"type": "token", "content": text_delta})

                elif event.type == "agent_updated_stream_event":
                    logger.debug(f"Stream: Agent updated to {getattr(event, 'new_agent', 'unknown')}")

                elif event.type == "final_output":
                    final_text = getattr(event, "output", response_text)
                    if final_text and final_text != response_text:
                        response_text = final_text
                        yield json.dumps({"type": "token", "content": final_text})

        if hasattr(streamed, "final_output") and streamed.final_output:
            response_text = streamed.final_output

        logger.info(
            f"Stream completed. Tokens: {token_count}, Response length: {len(response_text)} chars"
        )

    except Exception as e:
        logger.error(f"Stream agent error: {e}", exc_info=True)
        error_message = f"I encountered an error processing your request: {str(e)}"
        yield json.dumps({"type": "error", "content": error_message})
        response_text = error_message

    if response_text:
        conversation_service.add_message(
            session, conversation.id, user_id, role="assistant", content=response_text
        )

    yield json.dumps(
        {"type": "done", "conversation_id": str(conversation.id), "response": response_text}
    )
