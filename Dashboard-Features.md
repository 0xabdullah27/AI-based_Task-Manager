================================================================
AI TASK MANAGER - DASHBOARD SPECIFICATION
================================================================

1. MAIN PAGE: Tasks (Single powerful page)
----------------------------------------------------------------

Layout Structure:

┌─────────────────────────────────────────────────────────────┐
│  Header: "Tasks"                                            │
│  [ + Add Task ] button                                      │
├─────────────────────────────────────────────────────────────┤
│  Search Bar                                                 │
│  [Search tasks by title or description. or more things like |
|        tags etc..............]                              │
├─────────────────────────────────────────────────────────────┤
│  FILTERS SECTION                                            │
│                                                             │
│  Status:     [All] [Active] [Completed]                     │
│                                                             │
│  Quick:      [Overdue] [Today] [Tomorrow] [High Priority]   │
│                                                             │
│  Priority:   [All] [High] [Medium] [Low]                    │
│                                                             │
│  Tags:       [All] [tag1] [tag2] [tag3] ...                 │
│              (single or multi select - your choice)         │
└─────────────────────────────────────────────────────────────┘

Then below filters → Task List (grouped)


2. TASK GROUPING (When viewing Active / All)
----------------------------------------------------------------

Always group tasks in this order:

⚠️ Overdue
   - Tasks whose due date is before today

📅 Due Today
   - Tasks due today

🔥 Upcoming
   - High priority tasks due in the future
   - Or tasks due in next few days

📌 Later
   - Remaining pending tasks

✅ Completed (only show when filter = Completed or All)


3. INDIVIDUAL TASK CARD
----------------------------------------------------------------

Each task should show:

┌──────────────────────────────────────────────┐
│ ☐  Task Title                     [High]     │
│    Due: Sep 3, 2026 (12 days left)           │
│    Description (optional, truncated)         │
│                                              │
│    Subtasks:                                 │
│       ☐ Review chapters                      │
│       ☐ Practice past papers                 │
│       ☑ Make notes                           │
│                                              │
│    Tags: #exam #urgent                       │
│                                              │
│    [Edit]  [Delete]  [Complete]              │
└──────────────────────────────────────────────┘

Important details on card:
- Checkbox to complete
- Priority badge (color coded)
- Due date + days remaining
- Subtasks indented under parent
- Tags
- Quick actions


4. PRIORITY COLORS (Recommended)
----------------------------------------------------------------

High     → Red / Orange
Medium   → Blue / Yellow
Low      → Gray / Green


5. FILTER BEHAVIOR RULES
----------------------------------------------------------------

- Filters should work together (combine them)
- Example: Active + High Priority + Overdue
- Search works across title + description
- Clear filters button is useful
- Default view on load: Active tasks (grouped)


6. EMPTY STATES
----------------------------------------------------------------

When no tasks match filters:

"No tasks found"
"Try changing your filters or create a new task"


7. SIDEBAR (Simplified)
----------------------------------------------------------------

Recommended sidebar:

- Tasks                ← Main page (default)
- Dashboard / Overview ← Optional later
- Settings             ← Optional

Remove or demote:
- Separate "By Priority" page
- Separate "By Tags" page

(Everything should be controlled by filters on the main Tasks page)


8. BEST FEATURES TO INCLUDE
----------------------------------------------------------------

Must Have:
✓ Grouped task list (Overdue / Today / Upcoming / Later)
✓ Status filters (All / Active / Completed)
✓ Smart filters (Overdue, Today, Tomorrow, High Priority)
✓ Priority filter
✓ Tag filter
✓ Search
✓ Subtasks display under parent
✓ Priority color badges
✓ Days remaining on due dates
✓ Clean task cards

Nice to Have:
✓ Clear all filters button
✓ Task count in each group (e.g. Overdue (3))
✓ Collapse / expand groups
✓ Mobile responsive design
✓ Loading skeleton while fetching
✓ Smooth animations (optional)


9. FINAL VISUAL HIERARCHY
----------------------------------------------------------------

Most important information first:
1. Overdue tasks
2. Due today
3. High priority upcoming
4. Everything else

This makes the dashboard feel intelligent even without chatting with the AI.


10. SUCCESS CRITERIA
----------------------------------------------------------------

Dashboard is considered good when:
- User can understand priorities in 3 seconds
- Overdue tasks are impossible to miss
- Filtering feels fast and flexible
- Subtasks are clearly nested
- UI looks clean and professional
- Works well on both desktop and mobile