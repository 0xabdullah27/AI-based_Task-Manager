---
name: integration-pattern-finder
description: |
  Discovers integration patterns between constitutional tech stack components.
  This skill should be used when you have a specification (WHAT to build) and need
  to find HOW different technologies in your stack integrate together. Returns
  verified patterns, code examples, gotchas, and best practices.
---

# Integration Pattern Finder

Find integration patterns for your constitutional tech stack + specification requirements.

## When to Use

- After completing specification (WHAT) and before planning (HOW)
- When connecting frontend authentication to backend API
- When integrating database with API layer
- When combining multiple technologies that need to work together

## Before Implementation

Gather context to ensure successful pattern discovery:

| Source | Gather |
|--------|--------|
| **Constitution** | Tech stack mandate, constraints |
| **Specification** | Requirements that need integration |
| **Skill References** | Patterns from `references/` |
| **Official Docs** | Context7, Better Auth MCP |

## Required Inputs

1. **Tech Stack** (from constitution):
   - Frontend framework (e.g., Next.js 16)
   - Authentication library (e.g., Better Auth)
   - Backend framework (e.g., FastAPI)
   - ORM/Database (e.g., SQLModel + PostgreSQL)

2. **Integration Requirements** (from specification):
   - Which components need to communicate
   - Authentication/authorization flows
   - Data flow patterns

## Discovery Process

### Step 1: Identify Integration Points

Map which technologies need to connect:

```
Frontend Auth → Backend API (JWT/Bearer tokens)
Backend API → Database (ORM queries)
Frontend → Backend (HTTP/REST)
```

### Step 2: Search for Patterns

Use MCP tools in this order:

1. **Better Auth MCP** (`mcp__better-auth-docs__search`):
   - Search for framework-specific integration
   - Search for JWT/Bearer token patterns
   - Search for session management

2. **Context7** (`mcp__context7__query-docs`):
   - Query backend framework docs for auth middleware
   - Query ORM docs for model patterns

3. **WebSearch** (if needed):
   - "[tech1] + [tech2] integration 2025"
   - "[tech1] + [tech2] best practices"

### Step 3: Validate Patterns

For each pattern found:
- [ ] Confirmed in official documentation
- [ ] Has working code example
- [ ] Identifies potential gotchas
- [ ] Compatible with other stack components

## Output Format

Return patterns in this structure:

```markdown
## Integration: [Component A] → [Component B]

### Pattern: [Pattern Name]

**Use Case**: When you need to...

**Flow**:
1. Step one
2. Step two
3. Step three

**Code Example**:
[Frontend code]
[Backend code]

**Gotchas**:
- Gotcha 1
- Gotcha 2

**Official Source**: [Link to documentation]
```

## Common Integration Patterns

See `references/` for detailed patterns:

| Integration | Reference File |
|-------------|----------------|
| Better Auth + FastAPI | `better-auth-fastapi.md` |
| Next.js + Better Auth | `nextjs-better-auth.md` |
| FastAPI + SQLModel | `fastapi-sqlmodel.md` |

## Anti-Patterns to Avoid

1. **Don't store JWT in localStorage for sensitive apps** - Use httpOnly cookies or Bearer plugin
2. **Don't validate JWT on every request by calling auth server** - Use JWKS caching
3. **Don't hardcode secrets** - Use environment variables
4. **Don't skip token expiration checks** - Always validate `exp` claim

## Checklist Before Returning Patterns

- [ ] Each pattern has official documentation source
- [ ] Code examples are complete and runnable
- [ ] Security considerations documented
- [ ] Gotchas and edge cases identified
- [ ] Patterns are compatible with constitutional constraints
