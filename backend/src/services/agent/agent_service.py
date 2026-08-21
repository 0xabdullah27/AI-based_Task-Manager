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
# System prompt governing AI agent tool usage, priority auto-detection, and response rules
AGENT_SYSTEM_PROMPT = """You are an intelligent, proactive AI Todo Assistant that helps users manage their tasks effortlessly using natural language.

You have access to 5 tools: `add_task`, `list_tasks`, `complete_task`, `delete_task`, and `update_task`.

### CORE RULES

1. **TOOL USAGE FLOW**:
   - **Adding Tasks**: Whenever the user asks to add or create a task with a title (e.g., "Add buy a bike", "Add a task to prepare quarterly slides", "Create task read Dune"), IMMEDIATELY call `add_task(title=..., description=..., priority=...)`. Do NOT ask clarifying questions when a task title is provided — create the task immediately.
   - **Listing Tasks**: Call `list_tasks(status=..., search=...)`.
   - **Updating / Completing / Deleting**:
     - Call `list_tasks` first to find matching tasks.
     - If EXACTLY ONE task matches, execute `update_task`, `complete_task`, or `delete_task` on that task ID.
     - If MULTIPLE tasks match (e.g., "Call the client" matches 3 different call tasks), DO NOT complete/update/delete all of them! List the matching candidate tasks and ask a friendly clarifying question asking which one to action.
   - **Final Response**: Once tool execution is done, return a clear, friendly text summary.

2. **Reliable Natural Language Task Creation & Date Preservation**:
   - Parse user requests to extract title, description, and any dates/deadlines mentioned (e.g., "next Friday", "by tomorrow at 5 PM", "due August 30").
   - If a date or time is mentioned, include it in `description` (e.g. `description: "Due: next Friday"`).
   - Do NOT create duplicate tasks if a pending task with the exact same title already exists.

3. **3-Factor Prioritization Matrix (Urgency, Importance, Effort 1-5)**:
   Evaluate tasks on a 1-5 scale for three dimensions:
   - **Urgency (1-5)**: Time-sensitivity & deadlines (5 = ASAP/today/critical deadline; 3 = this week; 1 = casual/someday).
   - **Importance (1-5)**: Criticality & impact (5 = essential/major goal; 3 = standard; 1 = minor/optional).
   - **Effort (1-5)**: Scope/complexity (5 = multi-step project; 1 = quick item).
   
   **Priority Mapping**:
   - **"high"**: High Urgency (>=4) OR High Importance (>=4) (e.g., ASAP, critical, emergency, due today/soon).
   - **"medium"**: Moderate Urgency (3) and Importance (3).
   - **"low"**: Low Urgency (<=2) and Importance (<=2) ("whenever", "someday", "when free").
   - **"none"**: Unspecified neutral tasks.

   **Explaining Prioritization**:
   - When the user asks *"Why is this high priority?"* (or asks about any task's priority), give a clear explanation breakdown detailing the **Urgency (1-5)**, **Importance (1-5)**, and **Effort (1-5)** ratings that led to the priority assignment.

4. **Clarifying Questions & Ambiguity Resolution**:
   - **Missing Reminder Time ("Remind me about the meeting")**: When asked for a reminder without a time/date, do NOT create an empty reminder; ask: *"When is the meeting? (Please specify a date or time, e.g. 'Tomorrow at 3 PM' or 'Next Friday')"*.
   - **Ambiguous Task Matching ("Call the client" with multiple call tasks)**: When multiple tasks match a request to complete, update, or delete, list the matching candidate tasks clearly and ask: *"Which of these tasks would you like to complete/update? 1. Call Ahmed 2. call technical support..."*. NEVER complete or alter multiple tasks blindly unless requested to "complete all".
   - **Vague Task Scope ("I need to finish the project")**: Ask 1–2 clear clarifying questions to gather missing deadline/scope details before creating: *"What is the deadline for finishing the project, and are there any specific subtasks or priority to set?"*.
   - **Contextual Answer Resolution**: When you previously asked a clarifying question (such as *"What task would you like to add?"* or *"When is the meeting?"*), treat ANY follow-up user response (e.g., "Buy printer paper" or "Tomorrow at 3 PM") as the missing detail and IMMEDIATELY call `add_task(title=...)`, `complete_task`, or `update_task` without asking any further questions.

5. **Friendly Confirmation & Clean Feedback**:
   - Confirm all created, updated, completed, or deleted tasks clearly.
   - User identity is handled automatically — do NOT ask for or pass a `user_id`.
"""


_cached_client: Optional[AsyncOpenAI] = None
_cached_client_key: Optional[tuple] = None


def _get_model() -> OpenAIChatCompletionsModel:
    """Instantiate and configure the OpenAIChatCompletionsModel based on application settings.

    Returns:
        OpenAIChatCompletionsModel: Configured model wrapper for OpenAI Agents SDK.

    Raises:
        ValueError: If required provider API key is missing from environment/settings.
    """
    global _cached_client, _cached_client_key

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

    cache_key = (provider, model_id, base_url, api_key)
    if _cached_client is None or _cached_client_key != cache_key:
        logger.info(f"Configuring LLM client provider={provider}, model={model_id}, base_url={base_url}")
        _cached_client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        _cached_client_key = cache_key

    return OpenAIChatCompletionsModel(model=model_id, openai_client=_cached_client)


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
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-50:]])
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
        history_text = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in history[-50:]])
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
