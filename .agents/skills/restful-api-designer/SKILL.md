---
name: restful-api-designer
description: |
  Designs RESTful API endpoints from specification requirements.
  This skill should be used when you have user stories and functional requirements
  and need to design the API contract. Returns endpoint definitions, request/response
  schemas, status codes, and OpenAPI-compatible specifications.
---

# RESTful API Designer

Design API endpoints from specification requirements following REST best practices.

## When to Use

- After completing specification (user stories, functional requirements)
- Before implementation to define the API contract
- When designing CRUD operations for resources
- When defining authentication-protected endpoints

## Before Implementation

Gather context to ensure successful API design:

| Source | Gather |
|--------|--------|
| **Specification** | User stories, functional requirements, acceptance criteria |
| **Constitution** | Tech stack (affects schema format), constraints |
| **Existing Patterns** | If extending an API, check existing conventions |
| **Skill References** | REST best practices from `references/` |

## Required Inputs

1. **Functional Requirements**: List of FR-XXX requirements
2. **User Stories**: Acceptance scenarios
3. **Resources**: Entities being managed (User, Todo, etc.)
4. **Auth Requirements**: Which endpoints need authentication

## Design Process

### Step 1: Identify Resources

Extract resources from requirements:

```
FR-007: Users can create tasks → Resource: Task/Todo
FR-001: Users can sign up → Resource: User/Auth
```

### Step 2: Map CRUD Operations

For each resource, identify needed operations:

| Operation | HTTP Method | Endpoint Pattern |
|-----------|-------------|------------------|
| Create | POST | /api/{resources} |
| Read All | GET | /api/{resources} |
| Read One | GET | /api/{resources}/{id} |
| Update | PATCH | /api/{resources}/{id} |
| Delete | DELETE | /api/{resources}/{id} |

### Step 3: Design Request/Response Schemas

For each endpoint:

1. **Request Body** (POST/PATCH): Required and optional fields
2. **Response Body**: Data structure returned
3. **Path Parameters**: Resource identifiers
4. **Query Parameters**: Filtering, pagination, sorting

### Step 4: Define Status Codes

| Scenario | Status Code |
|----------|-------------|
| Success (with data) | 200 OK |
| Created | 201 Created |
| No Content | 204 No Content |
| Bad Request | 400 Bad Request |
| Unauthorized | 401 Unauthorized |
| Forbidden | 403 Forbidden |
| Not Found | 404 Not Found |
| Conflict | 409 Conflict |
| Validation Error | 422 Unprocessable Entity |
| Server Error | 500 Internal Server Error |

## Output Format

Return API design in this structure:

```markdown
## Resource: [Resource Name]

### POST /api/{resources}
**Description**: Create a new {resource}
**Auth Required**: Yes/No

**Request Body**:
```json
{
  "field1": "string (required)",
  "field2": "string (optional)"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "field1": "string",
  "field2": "string",
  "createdAt": "ISO8601"
}
```

**Errors**:
- 400: Invalid request body
- 401: Not authenticated
- 422: Validation failed
```

## Naming Conventions

### URL Paths
- Use lowercase with hyphens: `/api/user-preferences`
- Use plural nouns for collections: `/api/todos`
- Use nouns, not verbs: `/api/todos` not `/api/getTodos`

### JSON Fields
- Use camelCase: `createdAt`, `userId`
- Be consistent across all endpoints

### Query Parameters
- Filtering: `?completed=true`
- Pagination: `?page=1&limit=10` or `?offset=0&limit=10`
- Sorting: `?sort=createdAt&order=desc`
- Searching: `?q=searchterm`

## Authentication Patterns

### Bearer Token Header
```
Authorization: Bearer <token>
```

### Protected Endpoint Response Pattern
```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

## Validation Patterns

### Request Validation
- Validate at API boundary
- Return specific error messages
- Use 422 for validation failures

### Validation Error Response
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "title",
      "message": "Title must be at most 200 characters"
    }
  ]
}
```

## Checklist Before Returning Design

- [ ] All functional requirements mapped to endpoints
- [ ] CRUD operations complete for each resource
- [ ] Authentication requirements specified
- [ ] Request/response schemas defined
- [ ] Status codes documented
- [ ] Error responses defined
- [ ] Naming conventions consistent
- [ ] Validation rules from spec included
