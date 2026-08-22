---
id: 008-subtasks-0002
title: Agent subtask suggestion prompt update
stage: green
date: 2026-08-22
surface: project
model: ox-alpha
feature: 008-subtasks
branch: phase-2-agentic-capabilities
user: AbdullahQureshi
command: chat (implementation)
labels: [subtasks, agent, system-prompt, ux]
links:
  spec: specs/008-subtasks/
  ticket: none
  adr: none
  pr: none
files:
  - path: backend/src/services/agent/agent_service.py
    action: modified
    note: added SUBTASK SUGGESTION section to _build_system_prompt()
tests:
  - note: verified prompt builds and contains "SUBTASK SUGGESTION" via backend venv import check; no behavior tests required for prompt-only change
---

## Prompt

User prompts (verbatim, in order):

1. "one question that is how does the schema on the /docs like like what fields are there and what are not when creating the task also tell me what is the difference between the schema and hte modal and why there are two and which is user where?"

2. "how does the position works in the task who assign this value and when"

3. "?" / "tell me"

4. "now time to update the system prompt so the agent should works like as it should suggest the sub task like: ```When a user creates a large or complex task (e.g. \"Prepare for final exam\", \"Plan the event\", \"Launch the website\"), you should:

1. Create the main task first.
2. Suggest 3–5 logical subtasks.
3. Ask the user if they want you to add those subtasks.
4. If the user says yes, create each subtask using the `add_task` tool and pass the `parent_id` of the main task.

Subtasks should be clear, actionable, and in a sensible order.
Do not force the user to complete them in sequence — they are independent. ``` (make sure don't add the noice in the prompt"

## Response snapshot

Explained TaskCreate schema fields (title required; description/completed/priority/tags/parent_id optional) vs server-controlled fields (id, user_id, position, timestamps). Explained model (`backend/src/models/task.py`) = database shape vs schemas (`backend/src/schemas/task.py`) = API request/response shapes. Explained position auto-assignment via `next_position()` on subtask create/reparent, client override only through PATCH.

Then updated `_build_system_prompt()` in `backend/src/services/agent/agent_service.py`: inserted a `### SUBTASK SUGGESTION` section between CREATION RULES and DATE HANDLING with the exact user-provided workflow text (create main task → suggest 3–5 subtasks → confirm with user → add each via `add_task` with `parent_id`), verbatim as requested, no extra noise added.

Acceptance checks:
- [x] Prompt contains SUBTASK SUGGESTION section with all 4 steps
- [x] Verified via backend venv import: `_build_system_prompt()` output contains "SUBTASK SUGGESTION"
- [x] No unrelated edits to other sections of the prompt

Follow-ups:
- Manual E2E test: ask agent to create a complex task in ChatKit UI and confirm it suggests subtasks
- Note: `.specify/scripts/bash/create-phr.sh` has CRLF line endings and fails under WSL bash ("pipefail: invalid option name"); PHR created manually this time

Risks:
- Agent may over-trigger subtask suggestions on simple tasks; wording relies on "large or complex" judgment
