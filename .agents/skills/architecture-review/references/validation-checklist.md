# Architecture Validation Checklist

Quick checklist for validating plan against constitution.

---

## Pre-Review Setup

- [ ] Constitution loaded from `.specify/memory/constitution.md`
- [ ] Plan document identified and loaded
- [ ] Specification loaded for cross-reference

---

## 1. Technology Stack (Constitutional Mandate)

| Technology | Constitutional | Plan Uses | Status |
|------------|----------------|-----------|--------|
| Frontend Framework | Next.js 16 | | ⬜ |
| CSS Framework | Tailwind CSS | | ⬜ |
| Auth Library | Better Auth | | ⬜ |
| Backend Framework | FastAPI | | ⬜ |
| ORM | SQLModel | | ⬜ |
| Database | PostgreSQL (Neon) | | ⬜ |
| Validation | Pydantic | | ⬜ |

**Verdict**: ⬜ PASS / ⬜ FAIL

---

## 2. TDD Compliance

| Check | Evidence | Status |
|-------|----------|--------|
| Test strategy section exists | | ⬜ |
| Red-Green-Refactor mentioned | | ⬜ |
| Coverage target ≥70% | | ⬜ |
| Unit tests planned | | ⬜ |
| Integration tests planned | | ⬜ |
| E2E tests planned | | ⬜ |

**Verdict**: ⬜ PASS / ⬜ FAIL

---

## 3. Security

| Check | Evidence | Status |
|-------|----------|--------|
| Auth mechanism defined | | ⬜ |
| JWT/session strategy | | ⬜ |
| User isolation (data filtering) | | ⬜ |
| Input validation approach | | ⬜ |
| Password requirements | | ⬜ |
| No hardcoded secrets | | ⬜ |
| CORS configuration | | ⬜ |

**Verdict**: ⬜ PASS / ⬜ FAIL

---

## 4. Architecture Quality

| Check | Evidence | Status |
|-------|----------|--------|
| Separation of concerns | | ⬜ |
| API follows REST principles | | ⬜ |
| Error handling strategy | | ⬜ |
| Database indexes planned | | ⬜ |
| Foreign keys defined | | ⬜ |
| Response schemas defined | | ⬜ |

**Verdict**: ⬜ PASS / ⬜ FAIL

---

## 5. Specification Coverage

| User Story | Addressed in Plan | Status |
|------------|-------------------|--------|
| US-1: Authentication | | ⬜ |
| US-2: Create Tasks | | ⬜ |
| US-3: View Tasks | | ⬜ |
| US-4: Update Tasks | | ⬜ |
| US-5: Mark Complete | | ⬜ |
| US-6: Delete Tasks | | ⬜ |

| Functional Requirement | Addressed | Status |
|------------------------|-----------|--------|
| FR-001 through FR-022 | | ⬜ |

**Verdict**: ⬜ PASS / ⬜ FAIL

---

## Summary

| Category | Verdict |
|----------|---------|
| Tech Stack | ⬜ |
| TDD | ⬜ |
| Security | ⬜ |
| Architecture | ⬜ |
| Spec Coverage | ⬜ |

**Overall**: ⬜ APPROVED / ⬜ NEEDS REVISION

---

## Violations Found

| ID | Severity | Category | Issue |
|----|----------|----------|-------|
| | | | |

---

## Action Items

- [ ]
- [ ]
- [ ]
