# TaskCortex Frontend Architecture Audit

---

## 1. Rendering Strategy

### Route Inventory & Component Types

| Route | File Path | Type | Details |
| :--- | :--- | :--- | :--- |
| **Root Layout** | [`src/app/layout.tsx`](src/app/layout.tsx) | **Server Component** | Defines HTML/body shell and metadata. Mounts Client Component providers (`ThemeProvider`, `AuthProvider`, `TasksProvider`, `Toaster`). |
| **Landing Page** (`/`) | [`src/app/(landing)/page.tsx`](src/app/(landing)/page.tsx) | **Server Component** | Static shell importing and rendering interactive client sections (`Hero`, `Features`, `HowItWorks`, `Pricing`, `CTA`, `Footer`, `InteractiveAgent`). |
| **Auth Layout** | [`src/app/(auth)/layout.tsx`](src/app/(auth)/layout.tsx) | **Client Component** | Has `"use client"`. Runs client-side session checks (`useSession`) to redirect already-logged-in users to `/dashboard`. |
| **Sign In** (`/sign-in`) | [`src/app/(auth)/sign-in/page.tsx`](src/app/(auth)/sign-in/page.tsx) | **Server Component** | Static page shell rendering the Client Component `SignInForm`. |
| **Sign Up** (`/sign-up`) | [`src/app/(auth)/sign-up/page.tsx`](src/app/(auth)/sign-up/page.tsx) | **Server Component** | Static page shell rendering the Client Component `SignUpForm`. |
| **Better Auth Handler** | [`src/app/api/auth/[...all]/route.ts`](src/app/api/auth/[...all]/route.ts) | **Route Handler** | Server-side API endpoint for Better Auth (`toNextJsHandler(auth)`). |
| **Dashboard Layout** | [`src/app/dashboard/layout.tsx`](src/app/dashboard/layout.tsx) | **Client Component** | Has `"use client"`. Enforces client route protection (`useSession`), manages mobile drawer state, and mounts `ChatProvider`. |
| **Dashboard Loading** | [`src/app/dashboard/loading.tsx`](src/app/dashboard/loading.tsx) | **Server Component** | Server-rendered skeleton loading state. |
| **Dashboard Home** (`/dashboard`) | [`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx) | **Server Component** | Thin server wrapper rendering `<TaskCommandCenter />`. |
| **Overview** (`/dashboard/overview`) | [`src/app/dashboard/overview/page.tsx`](src/app/dashboard/overview/page.tsx) | **Server Component** | Thin server wrapper rendering `<TaskCommandCenter />`. |
| **Todos** (`/dashboard/todos`) | [`src/app/dashboard/todos/page.tsx`](src/app/dashboard/todos/page.tsx) | **Server Component** | Thin server wrapper rendering `<TaskCommandCenter />`. |
| **Priority View** (`/dashboard/priority`) | [`src/app/dashboard/priority/page.tsx`](src/app/dashboard/priority/page.tsx) | **Client Component** | Has `"use client"`. Consumes `useTasks()` to render tabbed priority views. |
| **Tags View** (`/dashboard/tags`) | [`src/app/dashboard/tags/page.tsx`](src/app/dashboard/tags/page.tsx) | **Client Component** | Has `"use client"`. Consumes `useTasks()` to filter tasks by custom tags. |
| **Create Task** (`/dashboard/create-task`) | [`src/app/dashboard/create-task/page.tsx`](src/app/dashboard/create-task/page.tsx) | **Client Component** | Has `"use client"`. Manages form submission, toasts, and programmatic router navigation. |
| **Chat Assistant** (`/dashboard/chat`) | [`src/app/dashboard/chat/page.tsx`](src/app/dashboard/chat/page.tsx) | **Server Component** | Thin server wrapper rendering `<ChatInterface />`. |
| **Settings** (`/dashboard/settings`) | [`src/app/dashboard/settings/page.tsx`](src/app/dashboard/settings/page.tsx) | **Client Component** | Has `"use client"`. Manages BYOK LLM settings state and form mutations. |

---

### SSR, SSG, or ISR?
- **No ISR or on-demand SSR data fetching exports exist in the app.** There are **no** `export const dynamic = ...`, **no** `export const revalidate = ...`, and **no** `next: { revalidate: ... }` options.
- The build strategy follows **Static Site Generation (SSG / Static Shell Prerendering)** at build time for all page shells, which then hydrate into a **Client-Side SPA Architecture**. All dynamic application data (tasks, tags, chat history, settings) is fetched on demand from the browser via Axios and `fetch` within React Context and hooks.

---

### Mixing Server and Client Components (The `"use client"` Boundary)

The codebase follows the classic Next.js pattern of **Server Component Shells wrapping Client Leaf/Subtree Components**:

1. **Root Layout** ([`src/app/layout.tsx`](src/app/layout.tsx)):
   - Remains a **Server Component** so it can export static page metadata (`export const metadata: Metadata = { ... }`).
   - The `"use client"` boundary begins immediately inside its JSX by wrapping children in `ThemeProvider`, `AuthProvider`, and `TasksProvider`.
2. **Landing Page** ([`src/app/(landing)/page.tsx`](src/app/(landing)/page.tsx)):
   - The page itself is a **Server Component**.
   - Every individual child section (`Hero.tsx`, `Navigation.tsx`, `InteractiveAgent.tsx`, etc.) declares `"use client"` at line 1 because they handle interactive UI states (mobile navigation toggles, animations, tabs).
3. **Dashboard Route Pages** (`/dashboard/page.tsx`, `/dashboard/todos/page.tsx`, `/dashboard/chat/page.tsx`):
   - These are 5-line **Server Components** that simply import and return client components (`<TaskCommandCenter />` and `<ChatInterface />`).
   - Because `dashboard/layout.tsx` is already marked `"use client"` to handle session checking, the entire dashboard subtree executes within the client boundary.

---

## 2. Data Fetching

### Fetching Mechanisms & Locations
Data fetching from the FastAPI backend is **not** performed inside Server Components or Server Actions. It is executed entirely from the browser using a combination of **Axios (with a centralized interceptor)** and **native `fetch` (for SSE streaming)**:

1. **Tasks (`GET /api/todos/`)**: Fetched inside [`TasksProvider`](src/providers/tasks-provider.tsx) (lines 78–125) via Axios (`api.get`). An initial fetch is triggered inside a `useEffect` as soon as `userId` becomes available from Better Auth.
2. **Tags (`GET /api/tags/`)**: Fetched inside the [`useTags`](src/hooks/useTags.ts) hook (lines 23–36) via Axios.
3. **Conversations & Chat History (`GET /api/conversations`, `GET /api/chat/history/:id`)**: Fetched inside [`ChatProvider`](src/providers/chat-provider.tsx) (lines 69–113) via [`chatApi`](src/lib/chat-api.ts) using native `fetch`.
4. **LLM Settings (`GET /api/settings/llm`)**: Fetched inside [`SettingsPage`](src/app/dashboard/settings/page.tsx) (lines 39–53) via [`getLLMSettings`](src/lib/settings-api.ts) using Axios.

---

### Centralized API Client

The centralized client is [`src/middleware/api-interceptor.ts`](src/middleware/api-interceptor.ts):

```typescript
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
```

- **Request Interceptor** (lines 18–32): Automatically extracts the JWT from `localStorage` (`getJwtToken()`) and sets `Authorization: Bearer <token>`.
- **Response Interceptor** (lines 34–65): Catches HTTP 401s, clears credentials via `clearJwtToken()`, triggers `signOut()`, and redirects to `/sign-in?returnUrl=...`.

---

### Client-Side Caching Libraries
**No React Query, SWR, or RTK Query is used.** The application manages state and cache manually via React Context (`TasksProvider` and `ChatProvider`) and local `useState` hooks.

---

### End-to-End Data Flow: From FastAPI to Rendered UI

```
FastAPI (GET /api/todos/)
   │
   ▼
apiClient Axios Interceptor (attaches JWT Bearer token)
   │
   ▼
TasksProvider (fetchTasks updates tasks state: Task[])
   │
   ▼
useTasks() Hook (consumed in TaskCommandCenter)
   │
   ├─► useDashboardStats() (memoized stats calculation)
   ├─► useMemo(filteredTasks) (filters by search, priority, tags, status)
   └─► groupTasksByUrgency() (categorizes into Overdue, Today, Tomorrow, etc.)
   │
   ▼
TaskGroupSection ──► TodoCard (renders task items, badges, and subtasks)
```

1. User logs in; Better Auth JWT is stored in `localStorage` under `better_auth_jwt`.
2. [`TasksProvider`](src/providers/tasks-provider.tsx) detects `session.user.id` and executes `fetchTasks()`.
3. Axios calls `GET /api/todos/` at `http://localhost:8000`. The request interceptor adds `Authorization: Bearer <jwt>`.
4. FastAPI validates the token against JWKS and returns `{ tasks: [...], total: N, filtered: N }`.
5. `TasksProvider` sets `tasks` in React state.
6. [`TaskCommandCenter`](src/app/dashboard/components/TaskCommandCenter.tsx) reads `tasks` via `useTasks()`.
7. `useMemo` in `TaskCommandCenter` filters tasks according to current `FilterBar` inputs and calls `groupTasksByUrgency()`.
8. `TaskGroupSection` and `TodoCard` map over the grouped tasks and render them to the DOM.

---

## 3. Server Actions vs. API Routes vs. Direct Backend Calls

- **Server Actions (`"use server"`):** **Not used anywhere** in this codebase.
- **Next.js Route Handlers (`app/api/...`):** There is only **one** route handler: [`src/app/api/auth/[...all]/route.ts`](src/app/api/auth/[...all]/route.ts). It serves Better Auth endpoints (`/api/auth/sign-in`, `/api/auth/sign-up`, `/.well-known/jwks.json`) by forwarding requests directly to the Better Auth engine. There are **no proxy route handlers** for FastAPI; all business logic calls go straight from the browser to FastAPI.

---

### Mutation Breakdown

| Mutation | Mechanism | File & Lines | Rationale |
| :--- | :--- | :--- | :--- |
| **Create Task** | Axios `POST /api/todos/` | [`tasks-provider.tsx:127-144`](src/providers/tasks-provider.tsx) | Prepends task to local React state directly on success; triggers silent background refetch if it's a subtask with `parent_id`. |
| **Update Task** | Axios `PATCH /api/todos/:id` | [`tasks-provider.tsx:146-163`](src/providers/tasks-provider.tsx) | Updates matching item in `tasks` state; refetches hierarchy if positions or subtasks changed. |
| **Delete Task** | Axios `DELETE /api/todos/:id` | [`tasks-provider.tsx:165-194`](src/providers/tasks-provider.tsx) | **Optimistic delete**: removes item from state immediately for 0ms latency, rolls back on network error. |
| **Toggle Task** | Axios `POST /api/todos/:id/toggle` | [`tasks-provider.tsx:196-247`](src/providers/tasks-provider.tsx) | **Optimistic toggle**: flips checkbox and cascades completion through subtasks immediately; rolls back on failure. |
| **Update LLM Settings** | Axios `PUT /api/settings/llm` | [`settings-api.ts:24-27`](src/lib/settings-api.ts) | Direct PUT request with updated BYOK keys; updates page state on resolve. |
| **Send Chat Message** | `fetch` `POST /api/chat/stream` | [`chat-api.ts:88-186`](src/lib/chat-api.ts) | Native `fetch` with `ReadableStream` reader allows real-time token streaming over HTTP/SSE without serverless timeout or proxy buffering. |

---

## 4. Revalidation & Cache Invalidation

### How UI Updates After Mutations
1. **Optimistic Updates with Rollback**: For `deleteTask` and `toggleTask`, `TasksProvider` updates React state synchronously before the HTTP request is dispatched. If the network call rejects, it reverts to the snapshot saved in `tasksRef.current`.
2. **Local State Append/Replace**: For top-level `createTask` and `updateTask`, the response object from FastAPI is inserted directly into the `tasks` array (`setTasks([response.data, ...prev])`).
3. **Silent Background Refetch**: When modifying hierarchical structures (subtasks, ordering, re-parenting), `TasksProvider` triggers `fetchTasks(lastParamsRef.current, { silent: true })`, refreshing the tree without triggering loading spinners.
4. **Agent Action Invalidation**: When the AI chatbot finishes executing tools via the SSE stream, `ChatProvider` invokes `fetchTasks()` at line 234 of [`chat-provider.tsx`](src/providers/chat-provider.tsx) so all created or toggled tasks appear in the dashboard automatically.

- **Next.js Cache Tags (`next: { tags: [...] }`)**: **None exist.**
- **`revalidatePath` / `revalidateTag` / `router.refresh()`**: **None are used**, as there is no Server Component data cache to purge.

---

### Inconsistencies & Minor Gaps in Revalidation
1. **Empty Edit Stubs in Secondary Views**:
   - In [`PriorityPage`](src/app/dashboard/priority/page.tsx) (lines 36–37), `onEdit` is an empty stub (`// Edit functionality handled in main dashboard`). Clicking edit on a card in `/dashboard/priority` does not open an edit dialog.
   - In [`TagsPage`](src/app/dashboard/tags/page.tsx) (lines 85–86), `onEdit` is also an empty handler.
2. **Full Page Reload on 401**:
   - In [`api-interceptor.ts:48`](src/middleware/api-interceptor.ts), unauthenticated session expiration does a hard browser reload via `window.location.href = ...` rather than a soft Next.js `router.push`.

---

## 5. State Management

```
┌─────────────────────────────────────────────────────────────┐
│                       RootLayout                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                      ThemeProvider                      │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │                    TasksProvider                    │ │ │
│ │ │   - tasks, total, filtered, isLoading, error       │ │ │
│ │ │   - createTask, updateTask, deleteTask, toggleTask │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │                DashboardLayout                  │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │                ChatProvider                 │ │ │ │ │
│ │ │ │ │   - conversations, messages, activeId       │ │ │ │ │
│ │ │ │ │   - sendMessage (SSE), selectConversation   │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

1. **Architecture**: React Context API + Custom Hooks (`useTasks`, `useTaskFilters`, `useTags`, `useDebounce`, `useDashboardStats`). No Redux or Zustand.
2. **Global Tasks State**: Managed in [`TasksProvider`](src/providers/tasks-provider.tsx) (lines 62–263), mounted in `RootLayout`. Because it sits at the root, task data remains in memory when switching between `/dashboard`, `/dashboard/todos`, `/dashboard/priority`, `/dashboard/tags`, and `/dashboard/chat` without re-fetching.
3. **Global Chat State**: Managed in [`ChatProvider`](src/providers/chat-provider.tsx) (lines 40–277), mounted in `DashboardLayout`. Holds conversation list, current message history, active conversation ID, and an in-memory history cache (`Record<string, ChatMessage[]>`).
4. **Better Auth Session Access**: Accessed using the `useSession()` hook provided by Better Auth (`import { useSession } from "@/lib/auth-client"`). Used in `(auth)/layout.tsx`, `dashboard/layout.tsx`, `tasks-provider.tsx`, `Sidebar.tsx`, and `DashboardNav.tsx`.

---

## 6. Authentication Integration (Frontend Side)

### Token Injection (Axios & Fetch)
- **Axios Interceptor** ([`src/middleware/api-interceptor.ts:18-32`](src/middleware/api-interceptor.ts)):
  ```typescript
  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getJwtToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```
- **Fetch Calls (SSE Streaming)** ([`src/lib/chat-api.ts:100-104`](src/lib/chat-api.ts)):
  ```typescript
  const token = getJwtToken();
  const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversation_id }),
    signal: controller.signal,
  });
  ```

---

### Better Auth Client & Session Management
- Client config is in [`src/lib/auth-client.ts`](src/lib/auth-client.ts). It initializes `createAuthClient` with the `jwtClient` plugin.
- On successful login/signup ([`SignInForm.tsx:45`](src/components/auth/SignInForm.tsx)), `fetchAndStoreJwt()` calls `authClient.token()` to obtain the signed JWT and stores it in `localStorage` under `better_auth_jwt`.
- Client components reactively observe authentication state through `useSession()`.

---

### Route Protection

There is **no Next.js Edge `middleware.ts` file**. Route protection is handled at the **Layout level via Client Components with `useEffect`**:

1. **Dashboard Protection** ([`src/app/dashboard/layout.tsx:21-46`](src/app/dashboard/layout.tsx)):
   ```typescript
   const { data: session, isPending } = useSession();
   useEffect(() => {
     if (!isPending && !session) {
       router.push("/sign-in");
     }
   }, [session, isPending, router]);

   if (isPending) return <AuthenticatingSpinner />;
   if (!session) return null;
   ```
2. **Auth Pages Reverse Protection** ([`src/app/(auth)/layout.tsx:15-37`](src/app/(auth)/layout.tsx)): Redirects already-authenticated users from `/sign-in` or `/sign-up` to `/dashboard`.
3. **API 401 Interceptor** ([`src/middleware/api-interceptor.ts:38-50`](src/middleware/api-interceptor.ts)): Clears credentials and redirects to `/sign-in` if any API request returns a 401 Unauthorized status.

---

## 7. Streaming / SSE Integration

### Consuming the SSE Stream
The SSE stream is consumed in [`src/lib/chat-api.ts:88-186`](src/lib/chat-api.ts) using **native `fetch` with a `ReadableStreamDefaultReader` and `TextDecoder`** (rather than `EventSource`, because `EventSource` cannot send POST requests with JSON payloads and Bearer headers):

```typescript
const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ message, conversation_id }),
  signal: controller.signal,
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const raw = trimmed.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;

    const parsed = JSON.parse(raw);
    if (parsed.type === "token" && parsed.content) {
      callbacks.onToken(parsed.content);
    } else if (parsed.type === "error" && parsed.content) {
      callbacks.onError(parsed.content);
    } else if (parsed.type === "done") {
      callbacks.onDone(parsed.conversation_id, parsed.response);
    }
  }
}
```

---

### Event Parsing & UI Mid-Stream States
- **Token Chunks (`type: "token"`)**: `onToken` appends each token string to the last assistant message in `ChatProvider`, producing a real-time typing effect.
- **Stream Completion (`type: "done"`)**: Replaces temporary thread IDs with the real database `conversation_id`, saves history to local cache, and calls `fetchTasks()` to reflect any task updates performed by tools.
- **Errors (`type: "error"`)**: Displays the error message directly in the assistant bubble.
- **Mid-Stream UI Display**:
  - *Before first token arrives*: Shows an animated spinner with `"Thinking..."` ([`ChatInterface.tsx:124-128`](src/components/chat/ChatInterface.tsx)).
  - *While streaming*: Renders markdown in real time via `<ChatMessageContent />` with a blinking vertical cursor (`<span className="inline-block w-0.5 h-4 bg-muted-foreground/70 ml-0.5 animate-pulse align-middle" />`) and a pulsing Sparkles icon.

---

## 8. Folder Structure & Routing

```
src/
├── app/
│   ├── (auth)/                 # Route Group: Guest-only authentication pages
│   │   ├── layout.tsx          # Redirects authenticated users to /dashboard
│   │   ├── sign-in/page.tsx    # /sign-in
│   │   └── sign-up/page.tsx    # /sign-up
│   ├── (landing)/              # Route Group: Public marketing landing page
│   │   ├── components/         # Landing-specific client sections (Hero, CTA, etc.)
│   │   └── page.tsx            # / (Root landing page)
│   ├── api/
│   │   └── auth/[...all]/      # Route Handler: Better Auth server integration
│   │       └── route.ts
│   ├── dashboard/              # Protected Dashboard section
│   │   ├── chat/page.tsx       # /dashboard/chat (AI Chat interface)
│   │   ├── components/         # TaskCommandCenter, FilterBar, Sidebar, TodoCard
│   │   ├── create-task/        # /dashboard/create-task
│   │   ├── overview/           # /dashboard/overview
│   │   ├── priority/           # /dashboard/priority
│   │   ├── settings/           # /dashboard/settings
│   │   ├── tags/               # /dashboard/tags
│   │   ├── todos/              # /dashboard/todos
│   │   ├── layout.tsx          # Route protection, Sidebar/Nav, ChatProvider
│   │   ├── loading.tsx         # Dashboard Skeleton placeholder
│   │   └── page.tsx            # /dashboard
│   ├── globals.css             # Tailwind v4 theme & CSS design tokens
│   └── layout.tsx              # Root HTML shell & global Providers
├── components/
│   ├── auth/                   # SignInForm, SignUpForm
│   ├── chat/                   # ChatInterface, ChatSidebar, ChatMessageContent
│   ├── tasks/                  # TaskForm, TagInput, PriorityBadge, TaskList
│   └── ui/                     # Radix UI primitives (Button, Dialog, Sonner, etc.)
├── hooks/                      # useTasks, useTags, useTaskFilters, useDebounce
├── lib/                        # auth-client, chat-api, settings-api, validations
├── middleware/                 # api-interceptor.ts (Axios JWT & error handler)
├── providers/                  # tasks-provider, chat-provider, theme-provider
└── types/                      # TypeScript task & user definitions
```

- **Route Groups `(group)`**:
  - `(auth)`: Groups `/sign-in` and `/sign-up` so they share a client redirection layout without modifying the URL path.
  - `(landing)`: Isolates marketing page components from application logic.
- **Parallel / Intercepting Routes**: **None in use.** Modals and dialogs (e.g. task creation and delete confirmation) are controlled via local React state and Radix UI dialog primitives.

---

## 9. Forms & Validation

- **Form Handling**: Form logic uses **React Hook Form** paired with **Zod validation schemas** through `@hookform/resolvers/zod`.
  - Implemented in [`TaskForm.tsx`](src/components/tasks/TaskForm.tsx) (lines 48–58), [`SignInForm.tsx`](src/components/auth/SignInForm.tsx) (lines 22–28), and [`SignUpForm.tsx`](src/components/auth/SignUpForm.tsx) (lines 23–29).
  - *Exception*: [`SettingsPage.tsx`](src/app/dashboard/settings/page.tsx) (lines 23–84) uses plain `useState` controlled inputs to facilitate dynamic conditional fields and `hasChanges` comparison.
- **Client-Side Validation**:
  - Defined in [`src/lib/validations/task.ts`](src/lib/validations/task.ts) and [`src/lib/validations/auth.ts`](src/lib/validations/auth.ts).
  - **Complements Backend Pydantic Schemas**: Validates title length (1–200 chars), description (≤ 2000 chars), single-word lowercase tags without spaces (max 20 tags per task, deduplicated with `Set`), and priority enum (`low | medium | high`). This provides instant client-side feedback and prevents unnecessary invalid requests from hitting FastAPI.

---

## 10. Error Handling & Loading States

- **Special Next.js Routing Files**:
  - [`src/app/dashboard/loading.tsx`](src/app/dashboard/loading.tsx): **Present**. Renders animated `<Skeleton />` blocks while dashboard route segments mount.
  - `error.tsx`: **Not present**.
  - `not-found.tsx`: **Not present**.
- **Surfacing API Errors**:
  1. **Sonner Toasts** (`toast.error(...)`): Used for general action failures (e.g., "Failed to create task", "Failed to update task status").
  2. **Field-Level Inline Validation**: React Hook Form errors render directly below affected form inputs in red text (`errors.title.message`).
  3. **Inline Error Alerts**:
     - `SignInForm` and `SignUpForm` display stylized error boxes for invalid credentials or existing accounts.
     - `SettingsPage` displays an inline `<Alert variant="destructive">` containing the backend's error detail.
     - `ChatInterface` renders network and rate-limit errors directly inside the chat stream bubble.

---

## 11. Performance Considerations

- **`useMemo` Usage**:
  - [`TaskCommandCenter.tsx:86-148`](src/app/dashboard/components/TaskCommandCenter.tsx) (`filteredTasks`): Memoizes multi-dimensional filtering (search text, status, priority, presets, tags) across the in-memory tasks array.
  - [`TaskCommandCenter.tsx:151-153`](src/app/dashboard/components/TaskCommandCenter.tsx) (`taskGroups`): Memoizes grouping tasks by chronological urgency buckets (`groupTasksByUrgency`).
  - [`useDashboardStats.ts:5-17`](src/hooks/useDashboardStats.ts): Memoizes calculation of completion percentages, overdue counts, and totals.
- **`useCallback` Usage**:
  - [`TasksProvider.tsx:78-247`](src/providers/tasks-provider.tsx): Memoizes `fetchTasks`, `createTask`, `updateTask`, `deleteTask`, and `toggleTask` so that passing them down through context does not trigger re-renders in subscribing components.
- **`React.memo` & React Compiler**:
  - `React.memo` is not manually applied to component exports because **Next.js React Compiler is enabled** in [`next.config.ts`](next.config.ts) (line 5, `reactCompiler: true`), which automatically memoizes components and hooks at build time.
- **Dynamic Imports**: No `next/dynamic` or `React.lazy` imports are defined; standard Next.js route-level code splitting is utilized.

---

## Architecture Summary (For Interview Presentation)

> *"TaskCortex is built on a Next.js App Router architecture that pairs statically pre-rendered page shells with a reactive, client-side SPA runtime backed by FastAPI and PostgreSQL. Authentication is handled by Better Auth using JWTs and JWKS verification, with an Axios request interceptor managing token injection and automatic 401 eviction. We manage application state centrally through custom React Context providers—`TasksProvider` at the root to keep tasks persistent across navigation without redundant refetches, and `ChatProvider` in the dashboard to consume real-time agent SSE streams via `fetch` and `ReadableStream`. Mutations use optimistic updates with rollback guarantees for instant UI feedback, forms are validated end-to-end with React Hook Form and Zod mirroring backend Pydantic models, and the React Compiler handles component memoization automatically."*
