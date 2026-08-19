# Skills Design Plan

> **Purpose**: Track the planning, reference discovery, and creation of 6 custom, conflict-free skills for this full-stack workspace.  
> **Last Updated**: 2026-08-19  
> **Status**: All 6 custom skills created & verified!

---

## ✅ Phase 1: Discovery & Workspace Cleanup (DONE)

- [x] Reviewed existing project structure and tech stack.
- [x] Identified that old skills suffered from domain conflicts (e.g. auth instructions duplicated across frontend & backend).
- [x] Cleaned up workspace by deleting all 28 old/deprecated skills from `.agents/skills/`.
- [x] Kept `find-skills` and `skill-creator` as essential active agent tools.

---

## ✅ Phase 2: Tech Stack & Architecture Confirmation (DONE)

Confirmed the full technology stack:

| Layer | Technology | Notes |
|---|---|---|
| Frontend Framework | Next.js 16 (App Router) | Server/Client components, dynamic caching |
| Frontend Language | TypeScript | Full type safety |
| Styling | Tailwind CSS v4 | `@theme` CSS-first directive, no `tailwind.config.js` |
| Forms & Validation | React Hook Form + Zod | Schema validation |
| HTTP Client | Axios | Custom instances & interceptors |
| State Management | Redux Toolkit + RTK Query | `makeStore` per-request isolation |
| Auth Pattern A | Better Auth (Next.js server) + FastAPI JWKS | Used in current project |
| Auth Pattern B | Production Manual JWT | FastAPI authority, httpOnly refresh cookie, rotation |
| Backend Framework | FastAPI (Python 3.13+) | Managed via `uv` |
| ORM | SQLModel (async) + `asyncpg` | Production async engine |
| Database | PostgreSQL (Neon Serverless) | Multi-tenant isolation |
| Migrations | Alembic | Versioned migrations (no `create_all()` in prod) |
| AI Agent Engine | OpenAI Agents SDK (Python) | Agent, Runner, `@function_tool`, handoffs |
| LLM | Gemini 2.5 Flash | Configured inside OpenAI Agents SDK |
| Streaming | SSE (Server-Sent Events) | Native response streaming |
| MCP | Model Context Protocol | Separate skill (to be built later) |
| Testing Frontend | Jest + React Testing Library + MSW | TDD / unit & integration |
| Testing Backend | `pytest` + FastAPI `TestClient` | TDD / unit & integration |

---

## ✅ Phase 3: Design Principles & Anti-Conflict Rules (DONE)

- [x] **Single Ownership Rule**: Each concept/topic is owned by **exactly ONE skill**.
- [x] **Mutual Exclusivity for Auth**: Projects select **Skill 3 (Better Auth)** OR **Skill 4 (Manual JWT)** — never both.
- [x] **Project Reusability**: Skills describe general architectural patterns, not hardcoded app features.
- [x] **Internal Domain Testing**: Each skill contains its own testing section (Jest in Next.js, `pytest` in FastAPI).
- [x] **Cross-References**: Skills explicitly declare what they do NOT cover and point to the owner skill.

---

## ✅ Phase 4: Reference Skills Discovery & Setup (DONE)

Searched the open agent skills ecosystem using `find-skills` for high-install, official, and authenticated reference skills, installed them, and organized them into `.agents/skills/_reference/` for inspection during skill creation:

| Domain | Source / Package | Installs / Security | Local Reference Location |
|---|---|---|---|
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | 27.6K installs | `.agents/skills/_reference/nextjs-app-router-patterns` |
| FastAPI | `fastapi/fastapi@fastapi` | 7.8K installs (Official) | `.agents/skills/_reference/fastapi` |
| Tailwind v4 | `lombiq/tailwind-agent-skills@tailwind-4-docs` | 10.7K installs | `.agents/skills/_reference/tailwind-4-docs` |
| Redux Toolkit | `reduxjs/redux-toolkit@build-modern-redux-apps/modern-redux` | Official Repo | `.agents/skills/_reference/build-modern-redux-apps-modern-redux` |
| RTK Query | `reduxjs/redux-toolkit@manage-server-data/adopt-rtk-query` | Official Repo | `.agents/skills/_reference/manage-server-data-adopt-rtk-query` |
| OpenAI Agents SDK | `laguagu/claude-code-nextjs-skills@openai-agents-sdk` | 1.5K installs | `.agents/skills/_reference/openai-agents-sdk` |

---

## ✅ Phase 5: Skill Creation Execution (DONE)

Created all 6 custom skills in `.agents/skills/` following `skill-creator` principles:

| Order | Skill Name | Primary Responsibility & Scope | Reference Material Used | Status |
|---|---|---|---|---|
| 1 | [`fastapi-python-backend`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/fastapi-python-backend/SKILL.md) | Routers, async SQLModel + `asyncpg`, Alembic migrations, middleware, SSE sending, `pytest` | `_reference/fastapi`, official FastAPI/SQLModel docs | ✅ Complete |
| 2 | [`nextjs-app-router`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/nextjs-app-router/SKILL.md) | App Router layouts/pages, Tailwind v4 (`@theme`), React Hook Form + Zod, Axios, SSE consuming, Jest/RTL | `_reference/nextjs-app-router-patterns`, `_reference/tailwind-4-docs` | ✅ Complete |
| 3 | [`better-auth-fullstack`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/better-auth-fullstack/SKILL.md) | **Pattern A Auth**: Better Auth server/client, JWKS endpoint, FastAPI `PyJWKClient` verification, Axios Bearer token interceptor | Better Auth docs, JWKS patterns | ✅ Complete |
| 4 | [`production-jwt-auth`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/production-jwt-auth/SKILL.md) | **Pattern B Auth**: FastAPI JWT creation, `httpOnly` refresh cookie + memory access token, token rotation, reuse detection, silent refresh | Production OAuth2/JWT specs, FastAPI security docs | ✅ Complete |
| 5 | [`redux-toolkit-typescript`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/redux-toolkit-typescript/SKILL.md) | `makeStore` per-request pattern, `StoreProvider` client wrapper, pre-typed `withTypes` hooks, RTK Query API slices, RSC guidance | `_reference/build-modern-redux-apps-modern-redux`, `_reference/manage-server-data-adopt-rtk-query` | ✅ Complete |
| 6 | [`openai-agents-sdk`](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/.agents/skills/openai-agents-sdk/SKILL.md) | Agent & Runner setup, `@function_tool`, handoffs, streaming, Gemini 2.5 Flash config, `pytest` mocking | `_reference/openai-agents-sdk`, OpenAI Agents SDK Python docs | ✅ Complete |

---

## ✅ Phase 6: Validation & Verification (DONE)

- [x] Verified each created skill against `skill-creator` guidelines (<500 lines, progressive disclosure).
- [x] Ensured description frontmatter is descriptive and optimized for accurate triggering.
- [x] Verified zero conflicts and clean cross-references across all 6 skills.

---

## Skill Ownership Quick Reference (Anti-Conflict Map)

| Topic / Feature | Single Owner Skill | Explicitly Excluded From |
|---|---|---|
| Next.js routing, layouts, RSC/Client boundaries | `nextjs-app-router` | All other skills |
| Tailwind v4 styling & CSS `@theme` | `nextjs-app-router` | All other skills |
| Form handling (React Hook Form + Zod) | `nextjs-app-router` | All other skills |
| Axios HTTP instance & base setup | `nextjs-app-router` | All other skills |
| SSE client consumption (EventSource/fetch) | `nextjs-app-router` | All other skills |
| Frontend testing (Jest + RTL + MSW) | `nextjs-app-router` | All other skills |
| FastAPI routers, dependencies, middleware | `fastapi-python-backend` | All other skills |
| Async SQLModel & `asyncpg` queries | `fastapi-python-backend` | All other skills |
| DB Migrations (Alembic) | `fastapi-python-backend` | All others |
| SSE response streaming (backend) | `fastapi-python-backend` | All other skills |
| Backend testing (`pytest` + `TestClient`) | `fastapi-python-backend` | All other skills |
| Better Auth server (`auth.ts`) & client (`auth-client.ts`) | `better-auth-fullstack` | All other skills |
| FastAPI JWKS token verification | `better-auth-fullstack` | All other skills |
| FastAPI JWT issuance (`/auth/login`, `/auth/refresh`) | `production-jwt-auth` | All other skills |
| `httpOnly` refresh token cookie & rotation | `production-jwt-auth` | All other skills |
| Frontend silent refresh logic & race guard | `production-jwt-auth` | All other skills |
| Redux store (`makeStore`) & `StoreProvider` | `redux-toolkit-typescript` | All other skills |
| Typed hooks (`useAppDispatch`, `useAppSelector`) | `redux-toolkit-typescript` | All other skills |
| RTK Query API slices & cache invalidation | `redux-toolkit-typescript` | All other skills |
| OpenAI Agent & Runner orchestration | `openai-agents-sdk` | All other skills |
| `@function_tool`, handoffs, agents-as-tools | `openai-agents-sdk` | All other skills |
| Gemini 2.5 LLM model configuration | `openai-agents-sdk` | All other skills |
| Agent mocking for `pytest` | `openai-agents-sdk` | All other skills |
