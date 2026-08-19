# REST API Best Practices

## URL Design

### Resource Naming

```
Good:
GET /api/todos           # Collection
GET /api/todos/123       # Single resource
POST /api/todos          # Create
PATCH /api/todos/123     # Update
DELETE /api/todos/123    # Delete

Bad:
GET /api/getTodos        # Verb in URL
GET /api/todo            # Singular for collection
POST /api/createTodo     # Verb in URL
```

### Nested Resources

Use for clear parent-child relationships:

```
GET /api/users/123/todos     # Todos for specific user
POST /api/users/123/todos    # Create todo for user
```

But prefer flat structure when resource can exist independently:

```
GET /api/todos?userId=123    # Filter by user (preferred)
```

### Query Parameters

```
# Filtering
GET /api/todos?completed=true
GET /api/todos?completed=false

# Pagination
GET /api/todos?page=1&limit=10
GET /api/todos?offset=0&limit=10

# Sorting
GET /api/todos?sort=createdAt&order=desc
GET /api/todos?sort=-createdAt  # Alternative: prefix with -

# Searching
GET /api/todos?q=meeting

# Combining
GET /api/todos?completed=false&sort=-createdAt&limit=10
```

## HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Partial update | Yes | No |
| DELETE | Remove resource | Yes | No |

### PUT vs PATCH

```
# PUT - Replace entire resource
PUT /api/todos/123
{
  "title": "New title",
  "description": "New description",
  "completed": true
}

# PATCH - Partial update (preferred for updates)
PATCH /api/todos/123
{
  "completed": true
}
```

## Request/Response Patterns

### Create (POST)

```http
POST /api/todos
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

```http
HTTP/1.1 201 Created
Location: /api/todos/abc123

{
  "id": "abc123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "userId": "user123",
  "createdAt": "2025-01-16T10:00:00Z",
  "updatedAt": null
}
```

### Read Collection (GET)

```http
GET /api/todos
Authorization: Bearer <token>
```

```http
HTTP/1.1 200 OK

{
  "data": [
    {
      "id": "abc123",
      "title": "Buy groceries",
      "completed": false,
      "createdAt": "2025-01-16T10:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Read Single (GET)

```http
GET /api/todos/abc123
Authorization: Bearer <token>
```

```http
HTTP/1.1 200 OK

{
  "id": "abc123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "userId": "user123",
  "createdAt": "2025-01-16T10:00:00Z",
  "updatedAt": null
}
```

### Update (PATCH)

```http
PATCH /api/todos/abc123
Content-Type: application/json
Authorization: Bearer <token>

{
  "completed": true
}
```

```http
HTTP/1.1 200 OK

{
  "id": "abc123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": true,
  "userId": "user123",
  "createdAt": "2025-01-16T10:00:00Z",
  "updatedAt": "2025-01-16T11:30:00Z"
}
```

### Delete (DELETE)

```http
DELETE /api/todos/abc123
Authorization: Bearer <token>
```

```http
HTTP/1.1 204 No Content
```

## Status Codes

### Success Codes

| Code | When to Use |
|------|-------------|
| 200 OK | Successful GET, PATCH, PUT |
| 201 Created | Successful POST (resource created) |
| 204 No Content | Successful DELETE |

### Client Error Codes

| Code | When to Use |
|------|-------------|
| 400 Bad Request | Malformed request syntax |
| 401 Unauthorized | Missing or invalid auth token |
| 403 Forbidden | Valid auth but no permission |
| 404 Not Found | Resource doesn't exist |
| 409 Conflict | Resource conflict (duplicate) |
| 422 Unprocessable Entity | Validation errors |

### Server Error Codes

| Code | When to Use |
|------|-------------|
| 500 Internal Server Error | Unexpected server error |
| 503 Service Unavailable | Server temporarily down |

## Error Response Format

### Standard Error

```json
{
  "error": "Not Found",
  "message": "Todo with id 'abc123' not found"
}
```

### Validation Error

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "title",
      "code": "required",
      "message": "Title is required"
    },
    {
      "field": "title",
      "code": "max_length",
      "message": "Title must be at most 200 characters"
    }
  ]
}
```

## Authentication

### Bearer Token

```http
GET /api/todos
Authorization: Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### Unauthorized Response

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer

{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Forbidden Response

```http
HTTP/1.1 403 Forbidden

{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

## Pagination

### Offset-based (Simple)

```http
GET /api/todos?offset=0&limit=10
```

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "offset": 0,
    "limit": 10
  }
}
```

### Page-based

```http
GET /api/todos?page=1&limit=10
```

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## Content Negotiation

### Request Headers

```http
Content-Type: application/json    # Request body format
Accept: application/json          # Expected response format
```

### Response Headers

```http
Content-Type: application/json
```

## CORS Headers

```http
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Anti-Patterns to Avoid

1. **Verbs in URLs**: Use `/api/todos` not `/api/getTodos`
2. **Inconsistent naming**: Pick camelCase or snake_case, stick with it
3. **Ignoring status codes**: Don't return 200 for errors
4. **Missing validation**: Always validate input at API boundary
5. **Exposing internal errors**: Sanitize error messages
6. **No pagination**: Always paginate collections
7. **Inconsistent error format**: Use same structure for all errors
