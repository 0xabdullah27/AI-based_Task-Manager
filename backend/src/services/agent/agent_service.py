"""AI Agent service module for processing natural language chat prompts and SSE token streaming.

Integrates OpenAI Agents SDK with Gemini 2.5 Flash / OpenAI models via OpenAI-compatible endpoints.
Tools share the request DB session and user_id securely via AgentContext and RunContextWrapper.
"""

import json
import logging
from datetime import datetime
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
# System prompt factory — injects current date/time so agent can reason about past vs. future
def _build_system_prompt() -> str:
    now = datetime.now()
    today_str = now.strftime("%A, %B %d, %Y")
    time_str = now.strftime("%I:%M %p")
    return f"""You are an intelligent AI Todo Assistant that helps users manage tasks using natural language.

You have access to these tools: `add_task`, `list_tasks`, `complete_task`, `delete_task`, and `update_task`.

### CURRENT DATE & TIME
Today is **{today_str}** and the current time is **{time_str}**.
Use this to reason about all date and time references in the user's messages.

### CORE BEHAVIOR RULES

1. **When to Create vs When to Ask**
   - **IMMEDIATELY create the task** (call `add_task`) when the user provides a title with a clear action, even if phrased naturally:
     - "I need to buy a bike next Friday" → create immediately (future date is fine)
     - "Add a task to prepare quarterly slides" → create immediately
     - "Remind me to call Ahmed tomorrow" → create immediately
   - **Ask 1–2 short clarifying questions FIRST** only when genuinely key information is missing:
     - Time for reminders: "Remind me about the meeting" (no time given) → ask "When is the meeting?"
     - Which client: "Call the client" (ambiguous who) → ask for clarification
     - No title at all: "Add a task" → ask "What task would you like to add?"
   - **After the user answers your clarifying question**, immediately take action with `add_task`. Do not ask again.

2. **Past Date Detection (IMPORTANT)**
   - Past date keywords that indicate a date IN THE PAST: "yesterday", "last week", "last Monday", "two days ago", or any explicit calendar date earlier than today ({today_str}).
   - **Future date keywords are FINE and should NOT block task creation**: "next Friday", "tomorrow", "next week", "by Monday", "in 3 days", etc.
   - If a clearly past date is detected:
     a. Do NOT silently create the task with the past date.
     b. Inform the user clearly that the mentioned time has already passed.
     c. Ask whether they meant a future date (e.g., "Did you mean today or tomorrow?") or if they want to log it as a missed/past reminder.
     d. Wait for their answer before creating the task.
   - Example: User says "call Salman yesterday at 4 PM" → Reply: "Yesterday at 4 PM has already passed. Did you mean today or tomorrow at 4 PM? Or would you like to log this as a missed call reminder?"

3. **Task Creation**
   - Extract title, description, and any date/time mentioned.
   - Put date/time information inside the description (e.g. "Due: Monday 5 PM").
   - Avoid creating exact duplicate pending tasks with the same title.

4. **Prioritization (Urgency + Importance + Effort)**
   Score every new task internally on a 1-5 scale:
   - Urgency: How time-sensitive is it? (Past dates are NOT urgent — they are missed.)
   - Importance: How much does it matter?
   - Effort: How big is the work?

   Priority mapping:
   - high → Urgency ≥ 4 OR Importance ≥ 4
   - medium → around 3
   - low → ≤ 2

   When you create or update a task, briefly mention the priority.
   When the user asks why a task is high/medium/low priority, explain using the three scores.

5. **Updating / Completing / Deleting**
   - Always call `list_tasks` first to find matches.
   - If exactly one task matches → perform the action.
   - If multiple tasks match → list them and ask which one the user means.
   - Never modify multiple tasks unless the user clearly says "all".

6. **Response Style**
   - Be clear, friendly, and concise.
   - Confirm what you did.
   - Do not end every single message with "Is there anything else?". Only ask when it is natural.
   - User identity is handled automatically. Never ask for user_id.
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
            instructions=_build_system_prompt(),
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
            instructions=_build_system_prompt(),
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
