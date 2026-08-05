# Frontend Summary — Data Flow & Recent Changes

## Current Data Flow

### Tasks
- **Single source of truth:** `src/providers/tasks-provider.tsx` (React Context)
- Mounted in the **root layout** (`src/app/layout.tsx`) → survives all route navigation (home ↔ dashboard).
- Fetches tasks from the backend **once per login session** (guarded by `useSession`; cleared on logout).
- Pages (overview, todos, tags, priority) consume the same in-memory store via `useTasks()` (`src/hooks/useTasks.ts`), so toggling tabs never refetches. CRUD updates both local state and the backend.

### Chat
- **Single source of truth:** `src/providers/chat-provider.tsx` (React Context)
- Mounted in the **dashboard layout** (`src/app/dashboard/layout.tsx`) → survives navigation between dashboard tabs.
- Fetches conversations + latest history once per dashboard session; caches per-conversation messages in memory.
- Sending a message updates the list optimistically (bump to top, fresh `updated_at`, preview).
- `src/app/dashboard/chat/page.tsx` is a thin component; no server-side fetch.

## What Was Changed
1. **Tasks refetch eliminated** — provider moved from dashboard layout to root layout with session guard + reset on logout.
2. **Chat page no longer reloads** — fetching moved server-side (old `chat/page.tsx`) into the client `ChatProvider`; optimistic sidebar updates added.
3. **Sidebar loading state** — shows "Loading conversations..." while fetching instead of "No previous chats".
4. Cleaned up dead commented code and debug `console.log`s in chat files.

## Key Files
- `src/providers/tasks-provider.tsx`, `src/providers/chat-provider.tsx`
- `src/hooks/useTasks.ts`
- `src/app/layout.tsx`, `src/app/dashboard/layout.tsx`
- `src/components/chat/ChatInterface.tsx`, `ChatSidebar.tsx`
- `src/lib/chat-api.ts`

## Future
- Migration to **Redux Toolkit**: replace provider internals with slices — `useTasks()` consumer API stays unchanged. A Redux store (module singleton) also survives layout unmounts.
