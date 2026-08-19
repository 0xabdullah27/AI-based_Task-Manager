# ChatKit Server — Tools and Widgets

Source: openai/chatkit-python, openai/openai-chatkit-advanced-samples (Context7, High reputation)

---

## Two Types of Tools

| Type | Runs Where | How Registered | Use Case |
|------|-----------|----------------|----------|
| **Server tool** | Your backend | `@function_tool` on async function, passed to `Agent(tools=[...])` | DB queries, API calls, business logic |
| **Client tool** | Browser/frontend | `ClientToolCall` set in server tool | UI mutations, DOM updates, theme changes |

---

## Server Tools

### Basic Pattern

```python
from agents import function_tool, RunContextWrapper
from chatkit.agents import AgentContext

@function_tool(description_override="Search tasks for the user")
async def search_tasks(
    ctx: RunContextWrapper[AgentContext],
    query: str,
) -> list[dict]:
    # ctx.context.request_context → your RequestContext (user_id etc.)
    user_id = ctx.context.request_context.user_id
    results = await db.search_tasks(user_id=user_id, query=query)
    return [r.model_dump() for r in results]
```

Register on the agent:
```python
assistant = Agent(
    name="assistant",
    instructions="Help users manage their tasks.",
    model="gpt-4o-mini",
    tools=[search_tasks, create_task, delete_task],
)
```

### Stream Progress Updates from a Tool

```python
from chatkit.types import ProgressUpdateEvent

@function_tool()
async def process_document(
    ctx: RunContextWrapper[AgentContext],
    document_id: str,
) -> str:
    await ctx.context.stream(ProgressUpdateEvent(icon="document", text="Loading document..."))
    doc = await fetch_document(document_id)

    await ctx.context.stream(ProgressUpdateEvent(icon="search", text="Analyzing content..."))
    result = await analyze(doc)

    await ctx.context.stream(ProgressUpdateEvent(icon="check", text="Done"))
    return result
```

Valid icons: `"document"`, `"search"`, `"upload"`, `"check"`, `"spinner"` (check SDK for full list)

### Stream Client Effects from a Tool

```python
from chatkit.types import ClientEffectEvent

@function_tool()
async def highlight_text(
    ctx: RunContextWrapper[AgentContext],
    index: int,
    length: int,
) -> None:
    await ctx.context.stream(
        ClientEffectEvent(
            name="highlight_text",
            data={"index": index, "length": length},
        )
    )
```

---

## Client Tools

Client tools run in the browser. The server triggers them via `ClientToolCall`.

### Server side — trigger a client tool

```python
from chatkit.agents import AgentContext, ClientToolCall

@function_tool(description_override="Record a fact shared by the user")
async def save_fact(
    ctx: RunContextWrapper[AgentContext],
    fact: str,
) -> dict | None:
    try:
        saved = await fact_store.create(text=fact)

        # Trigger browser-side "record_fact" tool
        ctx.context.client_tool_call = ClientToolCall(
            name="record_fact",
            arguments={"fact_id": saved.id, "fact_text": saved.text},
        )

        return {"fact_id": saved.id, "status": "saved"}
    except Exception:
        return None
```

### Frontend side — handle the client tool invocation

```typescript
// In useChatKit({ onClientTool })
onClientTool: async (invocation) => {
  if (invocation.name === "record_fact") {
    const { fact_id, fact_text } = invocation.params;
    await saveToLocalStorage(fact_id, fact_text);
    return { success: true };
  }
  return { success: false };
}
```

---

## Widgets

Widgets render interactive UI elements in the chat.

### Stream a Widget from a Tool

```python
from chatkit.widgets import Card, Image, Text

@function_tool(description_override="Show weather data")
async def get_weather(
    ctx: RunContextWrapper[AgentContext],
    location: str,
) -> dict:
    data = await weather_api.fetch(location)

    widget = Card(
        children=[
            Text(value=data.location, size="xl", weight="bold"),
            Text(value=f"{data.temp}°F", size="3xl", weight="bold"),
            Text(value=data.condition, size="md", color="secondary"),
            Image(src=f"/icons/{data.icon}.svg", alt=data.condition, width=64, height=64),
        ]
    )

    # Stream widget to UI; copy_text is optional clipboard text
    await ctx.context.stream_widget(widget, copy_text=f"{data.location}: {data.temp}°F")

    return {"location": data.location, "temp": data.temp}
```

### Widget Components

```python
from chatkit.widgets import Card, Image, Text

# Text — size: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
#         weight: "normal" | "medium" | "bold"
#         color: "primary" | "secondary" | "muted"
Text(value="Hello", size="lg", weight="bold", color="primary")

# Image
Image(src="/path/to/image.png", alt="description", width=64, height=64)

# Card — container for other widgets
Card(children=[Text(...), Image(...)])
```

### Widget Actions (Frontend)

When users click buttons or interact with widgets:

```typescript
// Frontend: useChatKit onAction callback
widgets: {
  onAction: async (action, widgetItem) => {
    switch (action.type) {
      case "approve":
        await fetch("/api/approve", {
          method: "POST",
          body: JSON.stringify({ id: action.payload?.id }),
          headers: { "Content-Type": "application/json" },
        });
        // Notify server to update the widget
        await control.ref.current?.sendCustomAction(
          { type: "approved", payload: action.payload },
          widgetItem.id,
        );
        break;

      case "open_details":
        // Client-only — no server call needed
        window.open(`/details/${action.payload?.id}`, "_blank");
        break;
    }
  },
}
```

---

## Tool Error Handling

```python
@function_tool()
async def risky_operation(ctx: RunContextWrapper[AgentContext], input: str) -> dict | None:
    try:
        result = await external_service(input)
        return {"status": "ok", "data": result}
    except ExternalServiceError as e:
        # Return None to signal failure to the agent
        # The agent will report the failure in its response
        return None
    except Exception as e:
        # Log unexpected errors but don't crash the agent run
        logger.error(f"Tool error: {e}")
        return None
```
