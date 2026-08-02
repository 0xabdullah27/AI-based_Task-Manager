"""AI Agent service for todo management.

Uses OpenAI Agents SDK with Gemini 2.5 Flash via OpenAI-compatible API.
Connects to the MCP server (mounted at /mcp in the same FastAPI app)
via MCPServerStreamableHttp.

Implements the stateless conversation flow per spec:
  1. Receive user message
  2. Fetch conversation history from database
  3. Build message array for agent (history + new message)
  4. Store user message in database
  5. Run agent with MCP tools
  6. Agent invokes appropriate MCP tool(s)
  7. Store assistant response in database
  8. Return response to client
  9. Server holds NO state
"""

import asyncio
import sys
import json
import logging
import re
from typing import Optional, AsyncGenerator

from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from sqlmodel import Session

from agents import (
    Agent,
    AsyncOpenAI,
    OpenAIChatCompletionsModel,
    Runner,
    set_tracing_disabled,
)
from agents.mcp import MCPServerStreamableHttp

from src.core.config import settings
from src.services.conversation_service import conversation_service
from src.schemas.chat import ChatResponse, ToolCallInfo

logger = logging.getLogger(__name__)

# Disable tracing for cleaner output
set_tracing_disabled(True)

# ── Model Setup (Gemini via OpenAI-compatible API) ──
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/"
MODEL_ID = "gemini-2.5-flash"

# MCP server URL (same FastAPI app, mounted at /mcp)
MCP_SERVER_URL = "http://localhost:8000/mcp/"

# Agent system prompt per spec's Agent Behavior Specification
AGENT_SYSTEM_PROMPT = """You are a helpful Todo assistant that manages tasks through natural language.

You have access to MCP tools for task management. Here are your behaviors:

**Task Creation**: When user mentions adding/creating/remembering something, use the `add_task` tool.
**Task Listing**: When user asks to see/show/list tasks, use the `list_tasks` tool with appropriate filter.
**Task Completion**: When user says done/complete/finished, use the `complete_task` tool.
**Task Deletion**: When user says delete/remove/cancel, use the `delete_task` tool.
**Task Update**: When user says change/update/rename, use the `update_task` tool.

IMPORTANT RULES:
- You will be given a `user_id` in the conversation context. ALWAYS pass this `user_id` to every tool call.
- Always confirm actions with a friendly response.
- Gracefully handle errors (e.g., task not found).
- When deleting a task by name, use `list_tasks` first to find the task ID, then `delete_task`.
- Be conversational and helpful.
"""


def _get_model():
    """Create the LLM model instance."""
    if not settings.gemini_api_key:
        raise ValueError(
            "GEMINI_API_KEY not set in .env file. "
            "Get your API key from: https://aistudio.google.com/apikey"
        )
    client = AsyncOpenAI(api_key=settings.gemini_api_key, base_url=GEMINI_API_BASE)
    return OpenAIChatCompletionsModel(model=MODEL_ID, openai_client=client)


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
    4. Build message array (history + new user message + user_id context)
    5. Run agent with MCP tools
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

    # 4. Build message array for agent
    # Add user_id context so agent knows which user_id to pass to tools
    context_message = f"[System context: The current user_id is '{user_id}'. Always pass this user_id to every tool call.]"

    # Build full input: history + context + new message
    messages = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": f"{context_message}\n\n{message}"})

    # Build the input string for Runner.run
    # We combine history and new message into a single prompt
    input_for_agent = messages
    logger.debug(f"Sending {len(messages)} messages to AI agent")

    # 5. Run agent with MCP tools
    model = _get_model()

    mcp_server = MCPServerStreamableHttp(
        name="todo-mcp",
        params={
            "url": MCP_SERVER_URL,
        },
    )

    response_text = ""

    try:
        logger.info(f"Running AI agent with MCP server at {MCP_SERVER_URL}")
        async with mcp_server:
            agent = Agent(
                name="Todo Assistant",
                instructions=AGENT_SYSTEM_PROMPT,
                mcp_servers=[mcp_server],
                model=model,
            )

            result = await Runner.run(agent, input=input_for_agent, max_turns=10)
            response_text = (
                result.final_output or "I'm sorry, I couldn't process that request."
            )

            logger.info(f"AI agent completed. Response length: {len(response_text)} chars")

            # Extract tool calls
            # tool_calls = _extract_tool_calls(result)

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        response_text = f"I encountered an error processing your request: {str(e)}"

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
    4. Build message array (history + new user message + user_id context)
    5. Run agent with MCP tools
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

    # 4. Build message array for agent
    context_message = f"[System context: The current user_id is '{user_id}'. Always pass this user_id to every tool call.]"

    messages = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": f"{context_message}\n\n{message}"})

    input_for_agent = messages
    logger.debug(f"Stream: Sending {len(messages)} messages to AI agent")

    # 5. Run agent with MCP tools and stream response
    model = _get_model()

    mcp_server = MCPServerStreamableHttp(
        name="todo-mcp",
        params={
            "url": MCP_SERVER_URL,
        },
    )

    response_text = ""
    token_count = 0

    try:
        logger.info(f"Stream: Running AI agent with MCP server at {MCP_SERVER_URL}")
        async with mcp_server:
            agent = Agent(
                name="Todo Assistant",
                instructions=AGENT_SYSTEM_PROMPT,
                mcp_servers=[mcp_server],
                model=model,
            )

            # Use run_streamed() for proper streaming (per OpenAI Agents SDK docs)
            streamed = Runner.run_streamed(
                agent,
                input=input_for_agent,
                max_turns=10,
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
