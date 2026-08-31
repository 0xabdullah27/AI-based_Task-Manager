# TaskCortex Frontend Architecture Audit

---

## 1. Rendering Strategy

### Route Inventory & Component Types

| Route | File Path | Component Type | Rendering Strategy |
| :--- | :--- | :--- | :--- |
| **Root Layout** | [`src/app/layout.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/layout.tsx#L12) | **Server Component** | Global HTML shell & metadata; mounts client providers (`ThemeProvider`, `TasksProvider`, `Toaster`). |
| **Landing Page** (`/`) | [`src/app/(landing)/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/(landing)/page.tsx#L9) | **Server Component** | Static prerender (SSG shell) importing interactive client sections (`Hero`, `Features`, `HowItWorks`, `Pricing`, `CTA`, `Footer`, `InteractiveAgent`). |
| **Auth Layout** | [`src/app/(auth)/layout.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/(auth)/layout.tsx#L1) | **Server Component** | Passthrough layout shell. |
| **Sign In** (`/sign-in`) | [`src/app/(auth)/sign-in/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/(auth)/sign-in/page.tsx#L5) | **Server Component** | Static prerender shell importing client `SignInForm`. |
| **Sign Up** (`/sign-up`) | [`src/app/(auth)/sign-up/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/(auth)/sign-up/page.tsx#L5) | **Server Component** | Static prerender shell importing client `SignUpForm`. |
| **Better Auth Handler** | [`src/app/api/auth/[...all]/route.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/api/auth/%5B...all%5D/route.ts#L5) | **Route Handler** | Server-side handler delegating to Better Auth (`toNextJsHandler(auth)`). |
| **Dashboard Layout** | [`src/app/dashboard/layout.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/layout.tsx#L9) | **Client Component** | Has `"use client"`. Controls mobile drawer state, mounts `ChatProvider`, and renders `Sidebar` + `DashboardNav`. |
| **Dashboard Home** (`/dashboard`) | [`src/app/dashboard/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/page.tsx#L6) | **Async Server Component** | **SSR** (`export const dynamic = "force-dynamic"`); fetches initial tasks server-side via `getInitialTasks()`. |
| **Overview** (`/dashboard/overview`) | [`src/app/dashboard/overview/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/overview/page.tsx#L3) | **Server Component** | Static shell mounting `<TaskCommandCenter />`. |
| **Todos** (`/dashboard/todos`) | [`src/app/dashboard/todos/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/todos/page.tsx#L6) | **Async Server Component** | **SSR** (`export const dynamic = "force-dynamic"`); fetches initial tasks server-side via `getInitialTasks()`. |
| **Chat Assistant** (`/dashboard/chat`) | [`src/app/dashboard/chat/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/chat/page.tsx#L3) | **Server Component** | Static shell mounting `<ChatInterface />`. |
| **Create Task** (`/dashboard/create-task`) | [`src/app/dashboard/create-task/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/create-task/page.tsx#L14) | **Client Component** | Has `"use client"`. Handles task creation form submission, toasts, and navigation. |
| **Settings** (`/dashboard/settings`) | [`src/app/dashboard/settings/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/settings/page.tsx#L22) | **Client Component** | Has `"use client"`. Manages BYOK LLM provider configuration and encrypted key updates. |

---

### SSR, SSG, or ISR?

* **SSR (Server-Side Rendering on Every Request)**:
  * [`src/app/dashboard/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/page.tsx#L4) and [`src/app/dashboard/todos/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/todos/page.tsx#L4) explicitly export `export const dynamic = "force-dynamic"`.
  * They invoke the Server Action helper [`getInitialTasks()`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L50-L73) which executes `fetch(`${BACKEND_URL}/api/todos/`, { cache: "no-store", headers })`.
* **SSG (Static Site Generation / Prerendered Static Shells)**:
  * `/`, `/sign-in`, `/sign-up`, `/dashboard/overview`, and `/dashboard/chat` have no dynamic route parameters or headers evaluated at the root page function level, allowing Next.js to generate static HTML shells during build time.
* **ISR (Incremental Static Regeneration)**:
  * **Not present in the codebase.** There are no `export const revalidate = ...` exports and no `fetch(..., { next: { revalidate: ... } })` calls.

---

### Mixing Server and Client Components (The `"use client"` Boundary)

The codebase leverages Next.js App Router composition where **Server Component Shells pass data across the `"use client"` boundary via props and React children slots**:

1. **Dashboard Data Passing**:
   * [`src/app/dashboard/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/page.tsx#L6-L15) (Server Component) awaits `getInitialTasks()` on the server and passes `initialTasks` and `initialTotal` into [`TaskCommandCenter`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/components/TaskCommandCenter.tsx#L47) (Client Component).
   * Inside `TaskCommandCenter.tsx` (lines 60–64), a `useEffect` seeds this data into the client-side [`TasksProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L92), eliminating client loading spinners on first paint.
2. **Dashboard Layout vs Children**:
   * [`src/app/dashboard/layout.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/layout.tsx#L1) declares `"use client"` to manage drawer state and provide `ChatProvider`.
   * Even though the layout is a Client Component, Next.js allows `{children}` from `/dashboard/page.tsx` and `/dashboard/todos/page.tsx` to remain Server Components and execute on the server.
3. **Landing Page**:
   * [`src/app/(landing)/page.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/(landing)/page.tsx#L9) is a Server Component importing client leaf sections (`Hero.tsx`, `Navigation.tsx`, `InteractiveAgent.tsx`).

---

## 2. Data Fetching

### Fetching Mechanisms & Locations

Data fetching from the FastAPI backend follows a deliberate hybrid strategy:

1. **Server-Side Initial Hydration**:
   * Executed via [`getInitialTasks()`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L50) in `src/actions/tasks.ts` using Node `fetch` with `cache: "no-store"`.
   * Reads cookies using `headers()` from `next/headers` and resolves the JWT via Better Auth `auth.api.getToken()`.
2. **Client-Side Centralized Axios Client**:
   * REST requests in client providers and hooks run through [`apiClient`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/api-client.ts#L5):
     * Task list queries & refetches: [`TasksProvider.tsx:120`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L120) (`api.get<TaskListResponse>("/api/todos/...")`).
     * Tag queries: [`useTags.ts:27`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/hooks/useTags.ts#L27) (`api.get<{ tags: Tag[] }>("/api/tags/")`).
     * LLM BYOK settings: [`settings-api.ts:20`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/settings-api.ts#L20) (`apiClient.get("/api/settings/llm")`).
3. **Client-Side Native Fetch for SSE Streaming**:
   * Chat message streaming and history fetching use native `fetch` and a `ReadableStreamDefaultReader` in [`src/lib/chat-api.ts:117`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/chat-api.ts#L117).
4. **Server Actions for Task Mutations**:
   * Task mutations (`createTaskAction`, `updateTaskAction`, `deleteTaskAction`, `toggleTaskAction` in `src/actions/tasks.ts`) execute on the Next.js server to update FastAPI and revalidate cache paths.

---

### Centralized API Client Architecture

The centralized client is [`src/lib/api-client.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/api-client.ts):

```typescript
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Automatically transmits httpOnly session cookies
});
```

* **Request Interceptor** (lines 15–30): Dynamically calls `authClient.token()` to attach `Authorization: Bearer <jwt>` to outgoing requests if not already set.
* **Response Interceptor** (lines 33–57): Catches HTTP 401s, invokes `signOut()`, and performs a clean redirect to `/sign-in?returnUrl=...`.

---

### Client-Side Caching Libraries

* **React Query / SWR / RTK Query**: **Not used.**
* **Current Implementation**: Custom React Context state management ([`TasksProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L71) and [`ChatProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/chat-provider.tsx#L40)) with in-memory `useState`, `useRef`, and `localStorage` caching for preferences.

---

### End-to-End Data Trace: From FastAPI to Rendered UI

```
FastAPI Backend (GET /api/todos/)
   │
   ▼
[Server Path]: getInitialTasks() in src/actions/tasks.ts (Node fetch + getServerAuthHeaders)
   │
   ▼
DashboardPage (src/app/dashboard/page.tsx) passes initialTasks to TaskCommandCenter
   │
   ▼
TaskCommandCenter seeds TasksProvider (seedTasks in src/providers/tasks-provider.tsx)
   │
   ▼
[Client Path]: useTasks() Context hook provides tasks: Task[]
   │
   ├─► useDashboardStats(tasks) ──► Computes total, overdue, completed counts
   ├─► useMemo(filteredTasks)   ──► Filters by status, priority, preset, tags, search
   └─► groupTasksByUrgency()    ──► Buckets into Overdue, Today, Tomorrow, Upcoming
   │
   ▼
TaskGroupSection ──► TodoCard (Renders interactive item, tags, dates, subtask progress)
```

1. **RSC Server Execution**: When `/dashboard` is requested, `DashboardPage` runs server-side and calls `getInitialTasks()`.
2. **Auth Header Extraction**: `getServerAuthHeaders()` reads incoming cookie headers and resolves the JWT via Better Auth `auth.api.getToken()`.
3. **FastAPI Query**: Node `fetch` retrieves `{ tasks, total, filtered }` from FastAPI (`http://localhost:8000/api/todos/`).
4. **Props Passing & Hydration**: `DashboardPage` renders `<TaskCommandCenter initialTasks={initialData.tasks} initialTotal={initialData.total} />`.
5. **Context Seeding**: Inside `TaskCommandCenter.tsx:61`, `useEffect` calls `seedTasks()` to populate `TasksProvider` state immediately.
6. **Filtering & Presentation**: `useMemo` applies active filters from `FilterBar`, `groupTasksByUrgency()` structures the items chronologically, and `TodoCard` renders each task and subtask.

---

## 3. Server Actions vs. API Routes vs. Direct Backend Calls

### Server Actions Inventory

All Server Actions are located in [`src/actions/tasks.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts) with the `"use server"` directive:

| Action | Function Signature | Description |
| :--- | :--- | :--- |
| `getInitialTasks` | `(): Promise<TaskListResponse>` | Server-side data fetcher for RSC initial page rendering (`cache: "no-store"`). |
| `createTaskAction` | `(data: TaskCreateInput): Promise<Task>` | POSTs new task to FastAPI `/api/todos/`, then calls `revalidatePath("/dashboard")` & `/dashboard/todos`. |
| `updateTaskAction` | `(id: string, data: TaskUpdateInput): Promise<Task>` | PATCHes task at FastAPI `/api/todos/${id}`, then triggers `revalidatePath`. |
| `deleteTaskAction` | `(id: string): Promise<void>` | DELETEs task at FastAPI `/api/todos/${id}`, then triggers `revalidatePath`. |
| `toggleTaskAction` | `(id: string): Promise<Task>` | POSTs to FastAPI `/api/todos/${id}/toggle`, then triggers `revalidatePath`. |

---

### Route Handlers vs Direct Calls

* **Next.js Route Handlers (`app/api/.../route.ts`)**:
  * The only route handler is [`src/app/api/auth/[...all]/route.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/api/auth/%5B...all%5D/route.ts#L5), which delegates to Better Auth via `toNextJsHandler(auth)`.
  * **There are NO custom proxy Route Handlers** forwarding requests to FastAPI.
* **Direct Backend Calls**:
  * In Server Actions and Server Components, Next.js calls FastAPI directly via `process.env.NEXT_PUBLIC_API_URL` (`http://localhost:8000`).
  * In Client Components, browser calls FastAPI directly using `apiClient` or `chatApi` with `withCredentials: true` and Bearer JWT headers.

---

### Mutation Breakdown

| Mutation | Mechanism | Location | Rationale |
| :--- | :--- | :--- | :--- |
| **Create Task** | Server Action (`createTaskAction`) | [`src/actions/tasks.ts:78`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L78) | Server-side cookie forwarding, path revalidation, and optimistic state appending in `TasksProvider`. |
| **Update Task** | Server Action (`updateTaskAction`) | [`src/actions/tasks.ts:100`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L100) | Server-side mutation with path revalidation and optimistic field updates in `TasksProvider`. |
| **Delete Task** | Server Action (`deleteTaskAction`) | [`src/actions/tasks.ts:125`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L125) | Optimistic removal from React state for 0ms latency, backed by Server Action execution and rollback on failure. |
| **Toggle Task** | Server Action (`toggleTaskAction`) | [`src/actions/tasks.ts:144`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L144) | Optimistic checkbox toggle and subtask cascade; Server Action confirms with FastAPI. |
| **Update LLM Settings** | Direct Axios `PUT /api/settings/llm` | [`src/lib/settings-api.ts:24`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/settings-api.ts#L24) | Isolated settings form; does not require multi-route server cache invalidation. |
| **Send Chat Message** | Native `fetch` `POST /api/chat/stream` | [`src/lib/chat-api.ts:106`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/chat-api.ts#L106) | Native `fetch` with `ReadableStream` reader allows real-time token streaming over HTTP/SSE without serverless timeout or proxy buffering. |

---

## 4. Revalidation & Cache Invalidation

### How UI Updates After Mutations

1. **Optimistic Updates**: For `toggleTask` and `deleteTask`, [`TasksProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L177,L207,L237) updates React state synchronously before the async Server Action completes.
2. **Server Cache Invalidation**: The Server Actions call `revalidatePath("/dashboard")` and `revalidatePath("/dashboard/todos")` ([`src/actions/tasks.ts:92, 117, 137, 157`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L92)).
3. **Hierarchical Tree Sync**: When modifying subtasks or reordering items, `TasksProvider` issues `fetchTasks(lastParamsRef.current, { silent: true })` to ensure nested trees match backend relational state.
4. **Rollback on Error**: If a Server Action throws, `TasksProvider` catches the error and reverts to `tasksRef.current` ([`src/providers/tasks-provider.tsx:194`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L194)).
5. **Agent Action Invalidation**: When the conversational AI completes tool actions (creating, updating, or completing tasks), [`ChatProvider.tsx:234`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/chat-provider.tsx#L234) automatically calls `fetchTasks()` at stream completion (`onDone`).

* **Next.js Cache Tags (`next: { tags: [...] }`)**: **None are used.** The application relies on `cache: "no-store"` combined with `revalidatePath()`.

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

1. **Architecture**: React Context API combined with custom hooks (`useTasks`, `useTaskFilters`, `useDashboardStats`, `useDebounce`, `useTags`).
2. **Global Tasks State**: Managed in [`TasksProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L71), mounted in `RootLayout`. Task data remains in memory when switching between `/dashboard`, `/dashboard/todos`, `/dashboard/chat`, and `/dashboard/settings` without redundant refetches.
3. **Global Chat State**: Managed in [`ChatProvider`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/chat-provider.tsx#L40), mounted in `DashboardLayout`. Holds conversation list, message history, active thread ID, and an in-memory cache (`Record<string, ChatMessage[]>`).
4. **Better Auth Session Access**: Accessed using the `useSession()` hook exported from [`src/lib/auth-client.ts:17`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/auth-client.ts#L17). Consumed in `TasksProvider.tsx`, `Sidebar.tsx`, and `DashboardNav.tsx`.

---

## 6. Authentication Integration (Frontend Side)

### Token Injection (Axios, Fetch, & Server Actions)

#### Axios Request Interceptor ([`src/lib/api-client.ts:15-30`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/api-client.ts#L15-L30))
```typescript
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined" && !config.headers.Authorization) {
      try {
        const { data } = await authClient.token();
        if (data?.token) {
          config.headers.Authorization = `Bearer ${data.token}`;
        }
      } catch {
        // Fallback to cookie
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);
```

#### Axios Response 401 Interceptor ([`src/lib/api-client.ts:33-57`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/api-client.ts#L33-L57))
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/sign-in") &&
        !window.location.pathname.startsWith("/sign-up")
      ) {
        await signOut().catch(() => {});
        const returnUrl = window.location.pathname;
        window.location.replace(
          `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`
        );
      }
    }
    return Promise.reject(error);
  }
);
```

#### Server Action Auth Header Extraction ([`src/actions/tasks.ts:20-45`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/actions/tasks.ts#L20-L45))
```typescript
async function getServerAuthHeaders(): Promise<HeadersInit> {
  const reqHeaders = await headers();
  const tokenData = await auth.api.getToken({ headers: reqHeaders }).catch(() => null);
  const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (tokenData?.token) {
    requestHeaders["Authorization"] = `Bearer ${tokenData.token}`;
  }
  const cookie = reqHeaders.get("cookie");
  if (cookie) requestHeaders["Cookie"] = cookie;
  return requestHeaders;
}
```

---

### Route Protection

Route protection is enforced via **Next.js Edge Middleware** ([`src/middleware.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/middleware.ts#L4-L29)):

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    getSessionCookie(request) ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 1. Unauthenticated user trying to access protected dashboard routes
  if (isDashboardRoute && !sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Authenticated user trying to access auth pages
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
```

---

## 7. Streaming / SSE Integration

### Consuming the SSE Stream

The SSE stream is consumed in [`src/lib/chat-api.ts:106-206`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/chat-api.ts#L106-L206) using native `fetch` and `ReadableStreamDefaultReader`:

```typescript
const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...authHeaders,
  },
  body: JSON.stringify({ message, conversation_id }),
  signal: controller.signal,
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
```

---

### Event Parsing & UI Mid-Stream States

* **Stream Parsing** ([`src/lib/chat-api.ts:150-179`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/chat-api.ts#L150-L179)):
  * Lines starting with `data:` are JSON parsed into `{ type: "token" | "error" | "done", content, conversation_id, response }`.
  * **`type === "token"`**: Appends text chunks to the active assistant message in [`ChatProvider.tsx:173`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/chat-provider.tsx#L173).
  * **`type === "error"`**: Dispatches error string to UI.
  * **`type === "done"`**: Replaces temporary thread IDs with database `conversation_id`, updates message cache, and triggers `fetchTasks()` to refresh any tasks modified by backend agent tools.
* **Mid-Stream UI Presentation**:
  * *Before tokens arrive*: Shows an animated spinner with `"Thinking..."` ([`ChatInterface.tsx:124-128`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/chat/ChatInterface.tsx#L124)).
  * *While streaming*: Renders markdown in real time via [`ChatMessageContent.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/chat/ChatMessageContent.tsx#L17) with a blinking vertical cursor (`<span className="inline-block w-0.5 h-4 bg-muted-foreground/70 ml-0.5 animate-pulse align-middle" />`) and pulsing Sparkles icon.

---

## 8. Folder Structure & Routing

```
frontend/src/
├── actions/
│   └── tasks.ts                  # Server Actions for task CRUD & server initial fetch
├── app/
│   ├── (auth)/                   # Route Group: Guest-only authentication pages
│   │   ├── layout.tsx            # Passthrough auth layout
│   │   ├── sign-in/page.tsx      # /sign-in
│   │   └── sign-up/page.tsx      # /sign-up
│   ├── (landing)/                # Route Group: Public marketing landing page
│   │   ├── components/           # Hero, Features, Pricing, Navigation, CTA, etc.
│   │   └── page.tsx              # / (Root landing page)
│   ├── api/
│   │   └── auth/[...all]/        # Route Handler: Better Auth server integration
│   │       └── route.ts
│   ├── dashboard/                # Protected Dashboard section
│   │   ├── chat/page.tsx         # /dashboard/chat (AI Chat interface)
│   │   ├── components/           # TaskCommandCenter, FilterBar, Sidebar, TodoCard, etc.
│   │   ├── create-task/page.tsx  # /dashboard/create-task
│   │   ├── overview/page.tsx     # /dashboard/overview
│   │   ├── settings/page.tsx     # /dashboard/settings
│   │   ├── todos/page.tsx        # /dashboard/todos
│   │   ├── error.tsx             # Dashboard error boundary
│   │   ├── layout.tsx            # Dashboard sidebar & top nav layout (Client Component)
│   │   ├── loading.tsx           # Dashboard skeleton loading boundary
│   │   └── page.tsx              # /dashboard root (Server Component)
│   ├── error.tsx                 # Root application error boundary
│   ├── global-error.tsx          # Critical global crash error boundary
│   ├── globals.css               # Tailwind CSS v4 design tokens and theme variables
│   └── layout.tsx                # Root HTML layout (ThemeProvider, TasksProvider, Toaster)
├── components/
│   ├── auth/                     # SignInForm, SignUpForm
│   ├── chat/                     # ChatInterface, ChatSidebar, ChatMessageContent, etc.
│   ├── tasks/                    # TaskForm, TagInput, PriorityBadge, SearchBar, etc.
│   └── ui/                       # Reusable design system primitives (Radix UI wrappers)
├── hooks/                        # useTasks, useTaskFilters, useDashboardStats, useDebounce, useTags
├── lib/                          # apiClient, authClient, auth, chatApi, settingsApi, validations
├── middleware.ts                 # Next.js Edge Middleware for route protection
├── providers/                    # TasksProvider, ChatProvider, ThemeProvider
└── types/                        # TypeScript domain interfaces (Task, Todo, etc.)
```

* **Route Groups `(group)`**: `(auth)` and `(landing)` organize pages into separate domains without affecting URL paths.
* **Parallel / Intercepting Routes**: None in use; dialogs and modals use Radix UI primitives.

---

## 9. Forms & Validation

* **Form Handling**: Complex forms ([`TaskForm.tsx:55`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/tasks/TaskForm.tsx#L55), [`SignInForm.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/auth/SignInForm.tsx), [`SignUpForm.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/auth/SignUpForm.tsx)) use **React Hook Form** paired with **Zod validation schemas** through `@hookform/resolvers/zod`.
  * Plain `useState` controlled inputs are used in simpler pages like [`SettingsPage.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/settings/page.tsx#L23) and [`ChatInterface.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/chat/ChatInterface.tsx#L23).
* **Client-Side Validation**:
  * Defined in [`src/lib/validations/task.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/validations/task.ts#L125) and [`src/lib/validations/auth.ts`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/validations/auth.ts#L4).
  * **Complements Backend Pydantic Schemas**: Validates title length (1–200 chars), description (≤ 2000 chars), single-word lowercase tags without spaces (max 20 tags per task, deduplicated with `Set`), and priority enum (`low | medium | high`).

---

## 10. Error Handling & Loading States

* **Special Next.js Routing Files**:
  * [`src/app/error.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/error.tsx#L8): Root error boundary (`GlobalAppError`) with reset action.
  * [`src/app/global-error.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/global-error.tsx#L5): Catches root layout crashes, replacing the HTML tree.
  * [`src/app/dashboard/error.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/error.tsx#L8): Dashboard-scoped error boundary (`DashboardError`).
  * [`src/app/dashboard/loading.tsx`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/loading.tsx#L3): Renders animated `<Skeleton />` blocks while server components resolve async data.
  * `not-found.tsx`: Uses Next.js default 404.
* **Surfacing API Errors**:
  1. **Sonner Toasts** (`toast.error(...)`): Used for general action failures ([`TaskCommandCenter.tsx:188`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/components/TaskCommandCenter.tsx#L188)).
  2. **Field-Level Inline Validation**: Rendered directly below affected form inputs in red text (`errors.title.message`).
  3. **Inline Error Alerts**: `<Alert variant="destructive">` in [`SettingsPage.tsx:234`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/settings/page.tsx#L234).
  4. **Centralized Error Classifier**: [`src/lib/error-classifier.ts:16`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/lib/error-classifier.ts#L16) classifies raw network errors, 429 rate limits, 401 session expirations, and 500 server errors into friendly user messages.

---

## 11. Performance Considerations

* **`useMemo` Usage**:
  * [`TaskCommandCenter.tsx:102`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/components/TaskCommandCenter.tsx#L102) (`filteredTasks`): Memoizes multi-dimensional filtering (search text, status, priority, presets, tags) across the in-memory tasks array.
  * [`TaskCommandCenter.tsx:167`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/app/dashboard/components/TaskCommandCenter.tsx#L167) (`taskGroups`): Memoizes grouping tasks by chronological urgency buckets (`groupTasksByUrgency`).
  * [`useDashboardStats.ts:6`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/hooks/useDashboardStats.ts#L6): Memoizes calculation of completion percentages, overdue counts, and totals.
  * [`TaskForm.tsx:39, 64`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/components/tasks/TaskForm.tsx#L39): Memoizes formatted default values and parsed due date objects.
* **`useCallback` Usage**:
  * [`TasksProvider.tsx:98, 153, 173, 201, 233`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/tasks-provider.tsx#L98): Stable callback references for `fetchTasks`, `createTask`, `updateTask`, `deleteTask`, and `toggleTask`.
  * [`ChatProvider.tsx:91, 115, 122`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/src/providers/chat-provider.tsx#L91): Stable references for `selectConversation`, `newChat`, and `sendMessage`.
* **React Compiler**: Enabled via `reactCompiler: true` in [`next.config.ts:5`](file:///d:/AbdullahQureshi/workspace/TaskCortex/frontend/next.config.ts#L5), automatically optimizing component re-renders at compile time.
* **Dynamic Imports**: Next.js automatically code-splits routes by route folder. Explicit `next/dynamic` is not used.

---

## Architecture Summary (For Interview Presentation)

> *"TaskCortex is built on Next.js 16 with the App Router and TypeScript, using a hybrid rendering strategy where protected dashboard routes leverage Server-Side Rendering (SSR) via Server Components to pre-fetch task data from a FastAPI backend with `cache: 'no-store'`, which is then seeded directly into a client-side React Context (`TasksProvider`) to eliminate loading waterfalls. Authentication is managed through Better Auth with an Edge Middleware layer for route protection, issuing signed JWTs that are attached via Axios interceptors and Server Action headers to our FastAPI resource server. For state and mutations, we combine Server Actions with optimistic client-side UI updates and path revalidation, while our conversational AI assistant directly streams real-time Server-Sent Events (SSE) via native Fetch readers into a cached `ChatProvider` that automatically triggers task revalidation when the agent executes backend tools."*
