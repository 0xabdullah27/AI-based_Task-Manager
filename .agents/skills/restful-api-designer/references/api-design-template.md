# API Design Template

Use this template to document API endpoints.

---

## API Design: [Feature Name]

**Version**: 1.0.0
**Base URL**: `/api`
**Authentication**: Bearer JWT Token

---

## Resource: [Resource Name]

### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/{resources} | Create {resource} | Yes |
| GET | /api/{resources} | List all {resources} | Yes |
| GET | /api/{resources}/{id} | Get {resource} by ID | Yes |
| PATCH | /api/{resources}/{id} | Update {resource} | Yes |
| DELETE | /api/{resources}/{id} | Delete {resource} | Yes |

---

### POST /api/{resources}

**Description**: Create a new {resource}

**Authentication**: Required

**Request Body**:
```json
{
  "field1": "string",
  "field2": "string | null"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| field1 | string | Yes | max 200 chars |
| field2 | string | No | max 2000 chars |

**Response (201 Created)**:
```json
{
  "id": "string (uuid)",
  "field1": "string",
  "field2": "string | null",
  "createdAt": "string (ISO8601)",
  "updatedAt": "string | null"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid JSON body |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 422 | VALIDATION_ERROR | Validation failed |

---

### GET /api/{resources}

**Description**: List all {resources} for authenticated user

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 100) |
| sort | string | createdAt | Sort field |
| order | string | desc | Sort order (asc/desc) |

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "string",
      "field1": "string",
      "createdAt": "string"
    }
  ],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pages": 0
  }
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

### GET /api/{resources}/{id}

**Description**: Get a single {resource} by ID

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (uuid) | Resource ID |

**Response (200 OK)**:
```json
{
  "id": "string",
  "field1": "string",
  "field2": "string | null",
  "createdAt": "string",
  "updatedAt": "string | null"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Resource not found |

---

### PATCH /api/{resources}/{id}

**Description**: Update a {resource}

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (uuid) | Resource ID |

**Request Body** (all fields optional):
```json
{
  "field1": "string",
  "field2": "string | null"
}
```

**Response (200 OK)**:
```json
{
  "id": "string",
  "field1": "string",
  "field2": "string | null",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid JSON body |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Resource not found |
| 422 | VALIDATION_ERROR | Validation failed |

---

### DELETE /api/{resources}/{id}

**Description**: Delete a {resource}

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (uuid) | Resource ID |

**Response (204 No Content)**: Empty body

**Errors**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Resource not found |

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "{Resource} with id '{id}' not found"
}
```

### 422 Validation Error
```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "field1",
      "code": "required",
      "message": "Field1 is required"
    }
  ]
}
```

---

## Data Types Reference

| Type | Format | Example |
|------|--------|---------|
| string | UTF-8 | "Hello World" |
| integer | 32-bit signed | 42 |
| boolean | true/false | true |
| uuid | UUID v4 | "550e8400-e29b-41d4-a716-446655440000" |
| datetime | ISO 8601 | "2025-01-16T10:30:00Z" |
| email | RFC 5322 | "user@example.com" |
