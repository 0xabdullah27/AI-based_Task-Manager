---
name: database-schema-architect
description: |
  Designs database schemas from specification requirements and API design.
  This skill should be used when you have functional requirements and API endpoints
  and need to design the database structure. Returns table definitions, relationships,
  indexes, and SQLModel/Prisma-compatible schemas.
---

# Database Schema Architect

Design database schemas from specifications following best practices.

## When to Use

- After API design is complete
- When defining data models for resources
- When planning relationships between entities
- Before implementing ORM models

## Before Implementation

Gather context to ensure successful schema design:

| Source | Gather |
|--------|--------|
| **Specification** | Functional requirements, data constraints |
| **API Design** | Resource schemas, field requirements |
| **Constitution** | Database type (PostgreSQL), ORM (SQLModel) |
| **External Schemas** | Better Auth user schema (if applicable) |

## Required Inputs

1. **Resources**: Entities from API design (User, Todo, etc.)
2. **Field Requirements**: Types, constraints, validation rules
3. **Relationships**: How entities relate to each other
4. **External Dependencies**: Auth library schemas to integrate with

## Design Process

### Step 1: Identify Entities

Extract from API resources:

```
Resource: Todo → Table: todo
Resource: User → Table: user (may be external)
```

### Step 2: Define Fields

For each entity, map API fields to database columns:

| API Field | DB Column | Type | Constraints |
|-----------|-----------|------|-------------|
| id | id | UUID/String | PRIMARY KEY |
| title | title | VARCHAR(200) | NOT NULL |
| createdAt | created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

### Step 3: Define Relationships

```
Todo.userId → User.id (Foreign Key, Many-to-One)
```

### Step 4: Add Indexes

```sql
-- Performance indexes
CREATE INDEX idx_todo_user_id ON todo(user_id);
CREATE INDEX idx_todo_created_at ON todo(created_at);
```

## Output Format

Return schema design in this structure:

```markdown
## Table: [table_name]

**Description**: What this table stores

### Columns

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | PRIMARY KEY |
| field_name | VARCHAR(200) | No | - | - |

### Indexes

| Name | Columns | Type |
|------|---------|------|
| idx_table_field | field | B-TREE |

### Foreign Keys

| Column | References | On Delete |
|--------|------------|-----------|
| user_id | user(id) | CASCADE |

### SQLModel Definition

```python
class Table(SQLModel, table=True):
    ...
```
```

## Data Types Reference

### PostgreSQL to SQLModel Mapping

| PostgreSQL | SQLModel/Python | Notes |
|------------|-----------------|-------|
| UUID | str | Use uuid.uuid4() for default |
| VARCHAR(n) | str | Use Field(max_length=n) |
| TEXT | str | No max_length |
| INTEGER | int | - |
| BOOLEAN | bool | - |
| TIMESTAMP | datetime | - |
| JSONB | dict | - |

## Better Auth Integration

When integrating with Better Auth, do NOT create these tables:

- `user` - Managed by Better Auth
- `session` - Managed by Better Auth
- `account` - Managed by Better Auth
- `verification` - Managed by Better Auth

### Reading Better Auth User Schema

```python
# Read-only reference to Better Auth user
class User(SQLModel, table=True):
    __tablename__ = "user"

    id: str = Field(primary_key=True)
    name: str
    email: str
    email_verified: bool
    image: Optional[str]
    created_at: datetime
    updated_at: datetime
```

### Referencing User in Your Tables

```python
class Todo(SQLModel, table=True):
    __tablename__ = "todo"

    id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    # ... other fields
```

## Naming Conventions

### Tables
- Use lowercase snake_case: `user_preference`
- Use singular nouns: `todo` not `todos`

### Columns
- Use lowercase snake_case: `created_at`
- Foreign keys: `{referenced_table}_id`
- Boolean columns: Use `is_` or `has_` prefix when clarifying

### Indexes
- Pattern: `idx_{table}_{column(s)}`
- Example: `idx_todo_user_id`

### Foreign Keys
- Pattern: `fk_{table}_{referenced_table}`
- Example: `fk_todo_user`

## Index Strategy

### Always Index
- Foreign key columns
- Columns used in WHERE clauses
- Columns used in ORDER BY

### Consider Composite Indexes
```sql
-- For queries filtering by user_id and ordering by created_at
CREATE INDEX idx_todo_user_created ON todo(user_id, created_at DESC);
```

## Checklist Before Returning Schema

- [ ] All API resources have corresponding tables
- [ ] All required fields are NOT NULL
- [ ] All foreign keys are defined and indexed
- [ ] Timestamps (created_at, updated_at) included
- [ ] Primary keys use UUID for distributed safety
- [ ] Better Auth tables NOT recreated
- [ ] Naming conventions consistent
- [ ] SQLModel definitions included
