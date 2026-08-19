---
name: architecture-review
description: |
  Validates implementation plan against constitutional principles and tech stack constraints.
  This skill should be used when a draft plan is complete and needs validation before
  finalization. Returns compliance report with violations, warnings, and recommendations.
---

# Architecture Review

Validate plan against constitution before implementation.

## When to Use

- After draft plan is written, before finalizing
- When making significant architectural changes
- Before starting implementation to catch issues early
- When reviewing existing architecture against updated constitution

## Before Review

Gather required documents:

| Document | Purpose |
|----------|---------|
| **Constitution** | Principles, constraints, tech stack |
| **Specification** | Business requirements being addressed |
| **Plan (Draft)** | Technical approach to validate |

## Review Process

### Step 1: Load Constitution

Read `.specify/memory/constitution.md` and extract:
- Core principles (TDD, code quality, etc.)
- Technical constraints
- Technology stack mandate
- Scope boundaries

### Step 2: Load Plan

Read the plan document and extract:
- Proposed architecture
- Technology choices
- Authentication approach
- Database design
- API design
- Testing strategy

### Step 3: Run Compliance Checks

Execute each check category:

#### Category 1: Technology Stack Compliance

| Check | Pass Criteria |
|-------|---------------|
| Frontend framework | Matches constitutional mandate |
| Backend framework | Matches constitutional mandate |
| Database | Matches constitutional mandate |
| ORM | Matches constitutional mandate |
| Auth library | Matches constitutional mandate |

#### Category 2: TDD Compliance

| Check | Pass Criteria |
|-------|---------------|
| Test strategy mentioned | Plan describes testing approach |
| Test-first workflow | Red → Green → Refactor cycle |
| Coverage target | ≥70% coverage mentioned |
| Test types | Unit, integration, E2E covered |

#### Category 3: Security Compliance

| Check | Pass Criteria |
|-------|---------------|
| Authentication | Proper auth mechanism described |
| Authorization | User isolation strategy defined |
| Input validation | Validation approach mentioned |
| No hardcoded secrets | Environment variables used |

#### Category 4: Architecture Quality

| Check | Pass Criteria |
|-------|---------------|
| Separation of concerns | Clear layers (API, service, data) |
| Error handling | Error strategy defined |
| API design | RESTful principles followed |
| Database design | Proper relationships and indexes |

#### Category 5: Spec Coverage

| Check | Pass Criteria |
|-------|---------------|
| All user stories addressed | Each story has implementation plan |
| All FRs covered | Each requirement has technical approach |
| Success criteria achievable | Plan enables meeting criteria |

### Step 4: Generate Report

## Output Format

```markdown
# Architecture Review Report

**Plan**: [plan name/path]
**Constitution Version**: [version]
**Review Date**: [date]

## Summary

| Category | Status | Score |
|----------|--------|-------|
| Tech Stack | ✅ PASS / ❌ FAIL | X/Y |
| TDD | ✅ PASS / ❌ FAIL | X/Y |
| Security | ✅ PASS / ❌ FAIL | X/Y |
| Architecture | ✅ PASS / ❌ FAIL | X/Y |
| Spec Coverage | ✅ PASS / ❌ FAIL | X/Y |

**Overall**: ✅ APPROVED / ❌ NEEDS REVISION

## Violations (Must Fix)

### V-001: [Violation Title]
- **Category**: [category]
- **Severity**: CRITICAL / HIGH
- **Issue**: [description]
- **Constitution Reference**: [section]
- **Recommendation**: [how to fix]

## Warnings (Should Fix)

### W-001: [Warning Title]
- **Category**: [category]
- **Severity**: MEDIUM / LOW
- **Issue**: [description]
- **Recommendation**: [suggestion]

## Recommendations (Nice to Have)

- [Suggestion 1]
- [Suggestion 2]

## Checklist for Revision

- [ ] Fix V-001: [brief]
- [ ] Fix V-002: [brief]
- [ ] Address W-001: [brief]
```

## Severity Levels

| Severity | Description | Action |
|----------|-------------|--------|
| CRITICAL | Violates core constitutional principle | Must fix before proceeding |
| HIGH | Significant deviation from constraints | Must fix before implementation |
| MEDIUM | Minor deviation or risk | Should fix |
| LOW | Suggestion for improvement | Consider fixing |

## Common Violations

### Tech Stack Violations

```markdown
V-XXX: Non-constitutional framework
- Issue: Plan uses [X] instead of constitutional [Y]
- Fix: Replace [X] with [Y] as mandated
```

### TDD Violations

```markdown
V-XXX: Missing test strategy
- Issue: Plan doesn't describe testing approach
- Fix: Add test strategy section with coverage targets
```

### Security Violations

```markdown
V-XXX: Missing user isolation
- Issue: No mechanism to ensure users only access their data
- Fix: Add user_id filtering to all data queries
```

## Checklist Before Approving

- [ ] All CRITICAL violations resolved
- [ ] All HIGH violations resolved
- [ ] MEDIUM/LOW violations documented for tracking
- [ ] Plan addresses all spec requirements
- [ ] Tech stack matches constitution exactly
- [ ] Testing strategy meets coverage requirements
- [ ] Security considerations documented
