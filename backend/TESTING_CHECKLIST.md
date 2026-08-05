# MCP Agent Testing Checklist

Use this checklist to verify all MCP tools and agent capabilities are working correctly.

---

## Phase 1: MCP Server Validation

### 1.1 Server Startup
- [ ] MCP server starts without errors: `python todo_mcp_server.py`
- [ ] No import errors for backend modules
- [ ] No database connection errors
- [ ] Server listens on stdio

### 1.2 Tool Discovery
- [ ] MCP Inspector can list tools: `npx @modelcontextprotocol/inspector`
- [ ] All 6 tools appear in tool list
- [ ] Tool descriptions are clear and non-empty
- [ ] Input schemas are valid JSON

### 1.3 Tool Descriptions
```
☐ todo_create_task: "Create a new todo task with optional tags and priority"
☐ todo_list_tasks: "List all todo tasks with optional filtering"
☐ todo_update_task: "Update an existing todo task"
☐ todo_delete_task: "Delete a todo task by ID"
☐ todo_toggle_task: "Mark a task as done or undone"
☐ todo_list_tags: "List all tags with task counts"
```

---

## Phase 2: Agent Connection

### 2.1 Agent Startup
- [ ] Agent starts: `python agent.py`
- [ ] Connects to MCP server: "✅ Connected to todo MCP server"
- [ ] Shows welcome message
- [ ] No timeout errors (if timeout, check 30s setting in agent.py)

### 2.2 MCP Server Connection
- [ ] Server initializes without hanging
- [ ] Agent waits for user input within 5 seconds
- [ ] No "Server not initialized" errors

---

## Phase 3: Individual Tool Tests

### 3.1 Create Task
```
Input: "Create a task called 'Buy milk' with high priority"

Expected:
✅ Tool responds within 2 seconds
✅ Response contains "Created task"
✅ Response contains task ID (uuid format)
✅ No errors in server logs

Verify in database:
SELECT COUNT(*) FROM task WHERE title='Buy milk';
Expected result: 1
```

- [ ] Create simple task (title only)
- [ ] Create task with description
- [ ] Create task with high priority
- [ ] Create task with medium priority
- [ ] Create task with tags: "urgent, work"
- [ ] Create task with very long description (test truncation)

### 3.2 List Tasks
```
Input: "Show all my tasks"

Expected:
✅ Returns formatted list with emojis
✅ Shows status (✅ Done or ⏳ Pending)
✅ Shows priority for each task
✅ No database errors
```

- [ ] List all tasks (after creating some)
- [ ] List with status filter: "Show pending tasks"
- [ ] List with priority filter: "Show high priority tasks"
- [ ] List with search: "Find tasks about shopping"
- [ ] List with tags: "Show tasks tagged 'work'"
- [ ] List with no results: "Show tasks tagged 'nonexistent'"

### 3.3 Update Task
```
Input: "Update the first task to high priority"

Expected:
✅ Task updated in database
✅ Response confirms update
✅ New priority is reflected in subsequent lists
```

- [ ] Update task title
- [ ] Update task description
- [ ] Update task priority
- [ ] Update task tags
- [ ] Update multiple fields at once
- [ ] Try updating non-existent task (error handling)

### 3.4 Delete Task
```
Input: "Delete the task called 'Buy milk'"

Expected:
✅ Task removed from database
✅ Subsequent list doesn't include deleted task
✅ No orphaned tags left behind
```

- [ ] Delete by reference: "Delete the first task"
- [ ] Delete by ID
- [ ] Delete non-existent task (error handling)
- [ ] Verify deleted task doesn't appear in list
- [ ] Check tags cleanup

### 3.5 Toggle Task Completion
```
Input: "Mark the task as done"

Expected:
✅ Task.completed = true in database
✅ Response shows "✅ Done"
✅ Subsequent list shows task as completed
```

- [ ] Toggle pending → done
- [ ] Toggle done → pending
- [ ] Toggle non-existent task (error handling)
- [ ] Verify status reflected in list

### 3.6 List Tags
```
Input: "Show all tags"

Expected:
✅ Returns formatted tag list with counts
✅ Shows tasks per tag
✅ No errors if no tags exist
```

- [ ] List tags when some exist
- [ ] List tags when none exist
- [ ] Verify counts are accurate

---

## Phase 4: Complex Agent Interactions

### 4.1 Multi-Step Workflows
```
Test Case: Create task → List → Update → Mark Done

Steps:
☐ User: "Create a task: 'Write report' with high priority"
  Expected: Task created ✅

☐ User: "Show all tasks"
  Expected: Task appears in list ✅

☐ User: "Update the description to 'Write quarterly report'"
  Expected: Task updated ✅

☐ User: "Mark it as done"
  Expected: Task status = done ✅
```

### 4.2 Filtering & Searching
```
Setup: Create 5 tasks with different priorities/statuses

☐ "Show pending tasks" → should only show incomplete
☐ "Show high priority tasks" → should only show high
☐ "Find tasks about bug" → should search titles/descriptions
☐ "Show tasks tagged work" → should filter by tag
☐ "Show completed tasks" → should only show done items
```

### 4.3 Error Recovery
```
☐ Agent: Try nonsensical command
  Expected: Agent doesn't crash, provides helpful response

☐ Agent: Ask to delete non-existent task
  Expected: Error message, agent continues working

☐ Agent: Request with missing required field
  Expected: Agent asks for clarification or provides error
```

### 4.4 Conversation Flow
```
☐ Multiple sequential requests work without agent restarting
☐ Context is maintained across requests (tasks stay in DB)
☐ Agent can handle rapid requests (no blocking)
☐ 'quit' command exits cleanly without errors
```

---

## Phase 5: Performance & Reliability

### 5.1 Performance
- [ ] Single tool call completes in < 2 seconds
- [ ] List with 50 tasks completes in < 2 seconds
- [ ] Agent responds to human language input in < 5 seconds (first time: ~10s)
- [ ] No memory leaks (test with 100+ operations)

### 5.2 Data Integrity
- [ ] Database commits are durable (check .db file exists)
- [ ] No duplicate tasks created from repeated requests
- [ ] No data corruption after tool failures
- [ ] Sessions are properly closed (no connection pool exhaustion)

### 5.3 Error Handling
- [ ] Missing .env → clear error message
- [ ] Invalid API key → API error caught and displayed
- [ ] Database connection error → graceful failure
- [ ] Tool execution error → error message to user, agent continues
- [ ] MCP server crash → agent detects and reports
- [ ] Malformed input → validation error

---

## Phase 6: Windows-Specific Tests

### 6.1 Windows Compatibility
- [ ] Agent runs on Windows 11 without special setup
- [ ] Event loop policy set correctly (no assertion errors)
- [ ] 30-second timeout allows cold start of npx
- [ ] No path issues (uses forward slashes in URIs)

### 6.2 Windows Performance
- [ ] First run: ~10-15 seconds (normal for npx cold start)
- [ ] Subsequent runs: < 5 seconds
- [ ] No hanging processes left behind after `quit`

---

## Phase 7: Integration Tests

### 7.1 Backend Integration
```
☐ MCP server connects to real backend services
☐ Tasks created via agent appear in backend database
☐ Backend API calls (if running) show same data as agent
☐ Multiple tools in sequence work correctly
```

### 7.2 Database Integration
```
☐ SQLite database file created at correct location
☐ Tables exist with correct schema
☐ Data persists after agent restart
☐ Indexes are used (query performance is good)
```

---

## Test Results Summary

| Test Suite | Status | Notes |
|---|---|---|
| MCP Server Validation | ☐ Pass | |
| Agent Connection | ☐ Pass | |
| Create Task | ☐ Pass | |
| List Tasks | ☐ Pass | |
| Update Task | ☐ Pass | |
| Delete Task | ☐ Pass | |
| Toggle Completion | ☐ Pass | |
| List Tags | ☐ Pass | |
| Multi-Step Workflows | ☐ Pass | |
| Error Recovery | ☐ Pass | |
| Performance | ☐ Pass | |
| Windows Compatibility | ☐ Pass | |
| Integration Tests | ☐ Pass | |

**Overall Status:** ☐ READY FOR PRODUCTION

---

## Known Issues

List any known issues discovered during testing:

1. _[Issue]: [Workaround]_
2. _[Issue]: [Workaround]_

---

## Tested By

- **Date:** YYYY-MM-DD
- **Tester:** [Name]
- **Environment:** Windows 11 / Python 3.x / OpenAI API
- **Test Duration:** [X] minutes

---

## Sign-Off

- [ ] All tests passed
- [ ] No blockers remain
- [ ] Ready for user acceptance testing
- [ ] Ready for production deployment

**Approved By:** _________________ **Date:** _________
