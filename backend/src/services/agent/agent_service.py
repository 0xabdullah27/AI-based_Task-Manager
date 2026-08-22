"""AI Agent service module for processing natural language chat prompts and SSE token streaming.

Integrates OpenAI Agents SDK with Gemini 2.5 Flash / OpenAI models via OpenAI-compatible endpoints.
Tools share the request DB session and user_id securely via AgentContext and RunContextWrapper.
"""

import json
import logging
from datetime import datetime
from typing import Optional, AsyncGenerator
from agents import enable_verbose_stdout_logging

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
enable_verbose_stdout_logging()

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
Today is **{today_str}**. Current time is **{time_str}**.
Always use this to resolve relative dates.

### INTENT DETECTION (Do this first)

Classify the user message into one of these three intents:

**A) QUERY** — User is asking about existing tasks
- Examples: "when is the meeting about 17 rules", "what tasks do I have", "tell me about my project task", "show pending tasks"
- Action: Call `list_tasks` once with a relevant search term.
- Response style: Directly show the task details. Do NOT say "I found your task". Just present the information cleanly.

**B) UPDATE / ACTION** — User wants to complete, delete, or change a task
- Examples: "complete the call task", "delete the bike task", "make it high priority", "reschedule the meeting"
- Action: Call `list_tasks` once → if one match, perform the action → if multiple, ask which one.

**C) CREATE** — User wants to add a new task
- Examples: "I need to buy a laptop", "remind me to call Ahmed tomorrow", "add prepare slides"
- Follow the creation rules below.

### CREATION RULES

0. MANDATORY PRE-CHECK: Before calling add_task, you must call list_tasks with 
   keywords and synonyms from the user's request (e.g., "youtube submit submission"). The database uses a broad OR search, so it will return many possible matches. You must intelligently read the returned list to determine if any of the tasks are the actual semantic duplicate. Do this even if you are confident no 
   duplicate exists.
   
   Compare the returned titles against the new task title/topic:
   - If any existing task shares the same core subject (ignore minor wording 
     differences — "AI Chat-Based Task Manager Project" and "Create AI Chat-
     Based Task Manager Project" are THE SAME TASK), you MUST NOT call add_task.
     Instead, tell the user this task already exists, show its details, and 
     ask whether to update it or proceed anyway despite the duplicate.
   - Only call add_task if list_tasks returned no meaningful match, or the 
     user explicitly confirmed they want a duplicate anyway.
   
   Skipping this check is not allowed under any circumstance, including when 
   the request looks new to you.
1. If the user provides at least a basic title (or title + date), CREATE THE TASK IMMEDIATELY. Do not wait for more details. (e.g. if they say "I have a meeting tomorrow", create it immediately, do NOT ask for time or priority first).
2. After creating the task, you may ask follow-up questions if you need more details like a specific time or priority.
3. NEVER mention that "no existing task was found" when performing the pre-check. If no duplicate exists, just silently proceed to create the new task.
4. Immediately after creating ANY task, run the Subtask Check — before asking "anything else?".

### OPTIONAL SUBTASK SUGGESTION (run after task creation)

If a newly created task is large or complex (takes multiple days, has multiple steps, or the title is broad like "Prepare for exam"), you should optionally suggest subtasks.

When suggesting subtasks, your response MUST follow this exact structure:
1. Confirm task creation directly: "I've added the task '[Title]' for you."
2. Propose subtasks naturally: "Since this is a larger task, would you like me to break it down into these subtasks?"
3. List 3-5 concrete subtasks clearly.
4. Ask for confirmation: "Should I add these?"

CRITICAL: NEVER say "This task qualifies as complex" or explain your internal reasoning to the user. Just offer the subtasks using the exact natural language structure above.
Do NOT call `add_task` for the subtasks until the user explicitly says yes.

If the task is not complex (e.g. "Buy milk"), skip straight to asking "Is there anything else?".

### DATE HANDLING

- Always convert relative dates ("tomorrow", "next Friday", "after 15 days") into actual calendar dates.
- Store dates in description as: `Due: September 6, 2026`
- When showing any task that has a due date, always display:
  `Due: September 6, 2026 (15 days left)` or `(tomorrow)` / `(due today!)` / `(overdue by X days)`
- If the user mentions a clearly past date, do not create the task. Inform them and ask for clarification.

### PRIORITIZATION

Score tasks on Urgency, Importance, and Effort (1-5 each).
- high → Urgency ≥ 4 or Importance ≥ 4
- medium → around 3
- low → ≤ 2

Briefly mention the priority when creating or updating a task.
If asked why, explain using the three scores.

### RESPONSE STYLE

- Be clear, friendly, and concise.
- For QUERY intent: Answer directly. Example:
  "Meeting about 17 rules of Pakistan  
  Due: September 6, 2026 (15 days left)  
  Priority: Medium"
- If `list_tasks` returns that no tasks were found, DO NOT call it again:
  - For QUERY intent, tell the user they have no matching tasks.
  - For CREATE intent, DO NOT tell the user that "no existing task was found". Just proceed to create the task.
- Do not start with "I found your task" or "Here's what I found".
- Only ask "Is there anything else?" when it feels natural.
- Never ask for user_id.
- NEVER output internal rule/section names (e.g. "Subtask Check:", "Intent 
  Detection:", "Creation Rules:") in your reply to the user. These are for 
  your own reasoning only. Speak in natural, plain language as if explaining 
  to a person, not narrating which internal step you're on.

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
    print(f"handle_chat called with user_id={user_id}, conversation_id={conversation_id}, message={message}")
    
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
