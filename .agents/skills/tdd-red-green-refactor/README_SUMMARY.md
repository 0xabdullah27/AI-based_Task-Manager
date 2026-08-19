# TDD Red-Green-Refactor Skill - Creation Summary

## Overview

This automation skill executes the complete Test-Driven Development workflow for the todo web application project, supporting both frontend (Jest) and backend (pytest) testing environments.

## Skill Structure

```
tdd-red-green-refactor/
├── SKILL.md (360 lines)
├── references/
│   ├── red-phase-patterns.md (12K)
│   ├── green-phase-patterns.md (16K)
│   ├── refactor-patterns.md (17K)
│   └── tdd-best-practices.md (17K)
└── scripts/
    ├── verify_red.sh* (executable)
    ├── verify_green.sh* (executable)
    └── check_coverage.sh* (executable)
```

## Skill Type: Automation

Following skill-creator-pro framework for automation skills with:
- Executable scripts for deterministic verification
- Error handling and exit codes
- Dependencies checking (npm, pytest, coverage tools)
- Clear success/failure feedback

## Key Features

### 1. Three-Phase Workflow
- **RED**: Write failing tests first
- **GREEN**: Implement minimal code to pass tests
- **REFACTOR**: Improve code while keeping tests green

### 2. Automated Verification Scripts

#### verify_red.sh
- Verifies tests fail in RED phase
- Prevents false positives (tests passing when should fail)
- Exit codes: 0 (valid RED), 1 (tests pass), 2 (syntax error)

#### verify_green.sh
- Verifies all tests pass in GREEN/REFACTOR phases
- Ensures implementation complete
- Exit codes: 0 (all pass), 1 (tests fail), 2 (syntax error)

#### check_coverage.sh
- Measures test coverage percentage
- Validates against threshold (default 70%)
- Provides improvement tips if below threshold
- Exit codes: 0 (meets threshold), 1 (below threshold), 2 (parse error)

### 3. Constitutional Compliance

Enforces constitution requirements:
- **Principle I**: TDD mandatory
- **Principle III**: 70% minimum coverage
- **Principle IV**: Tests pass before code complete

### 4. Git Workflow Integration

Structured commit messages for each phase:
```bash
# RED phase
git commit -m "red: add failing tests for <feature>

Task: <task-id>
Phase: RED

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# GREEN phase
git commit -m "green: implement <feature> to pass tests

Task: <task-id>
Phase: GREEN
Coverage: <percentage>%

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# REFACTOR phase
git commit -m "refactor: clean up <feature> implementation

Task: <task-id>
Phase: REFACTOR
Coverage: <percentage>%
Changes: <brief-description>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Reference Files

### red-phase-patterns.md
- Frontend patterns (React/Jest)
- Backend patterns (FastAPI/pytest)
- Test structure examples
- Common mistakes and fixes
- RED phase checklist

### green-phase-patterns.md
- Minimal implementation strategies
- Fake it till you make it
- Progressive implementation
- Type safety patterns
- GREEN phase checklist

### refactor-patterns.md
- Safe refactoring workflow
- Common refactoring patterns
- Frontend-specific refactorings
- Backend-specific refactorings
- REFACTOR phase checklist

### tdd-best-practices.md
- Core TDD principles
- Test quality guidelines
- Coverage targets
- Frontend testing best practices
- Backend testing best practices
- Common pitfalls

## Usage Example

```bash
# 1. RED Phase
# Write failing tests
# Run verification
.claude/skills/tdd-red-green-refactor/scripts/verify_red.sh frontend src/components/__tests__/TodoForm.test.tsx
# Commit if valid RED
git commit -m "red: add failing tests for todo form"

# 2. GREEN Phase
# Write minimal implementation
# Run verification
.claude/skills/tdd-red-green-refactor/scripts/verify_green.sh frontend src/components/__tests__/TodoForm.test.tsx
# Check coverage
.claude/skills/tdd-red-green-refactor/scripts/check_coverage.sh frontend 70
# Commit if tests pass and coverage adequate
git commit -m "green: implement todo form component"

# 3. REFACTOR Phase
# Improve code quality
# Run verification
.claude/skills/tdd-red-green-refactor/scripts/verify_green.sh frontend src/components/__tests__/TodoForm.test.tsx
# Verify coverage maintained
.claude/skills/tdd-red-green-refactor/scripts/check_coverage.sh frontend 70
# Commit refactoring
git commit -m "refactor: extract form validation logic"
```

## Script Dependencies

### Frontend
- Node.js and npm
- Jest (configured in package.json)
- React Testing Library

### Backend
- Python
- pytest
- pytest-cov (for coverage)

Scripts automatically check for dependencies and provide installation instructions if missing.

## Error Handling

All scripts include:
- Argument validation
- Dependency checking
- Clear error messages
- Exit codes (0=success, 1=failure, 2=config error)
- Colored output for readability
- Actionable next steps

## Coverage Requirements

| Component | Minimum | Target |
|-----------|---------|--------|
| Frontend  | 70%     | 80%+   |
| Backend   | 70%     | 80%+   |

## Skill Compliance

### skill-creator-pro Framework

✅ **Domain Discovery**: TDD, Jest, pytest best practices
✅ **Type**: Automation (scripts + workflows)
✅ **SKILL.md**: 360 lines (<500 limit)
✅ **Description**: Clear triggers and use cases
✅ **Scripts**: Error handling, dependencies, exit codes
✅ **References**: Domain expertise embedded (62K total)
✅ **Reusability**: Works for any feature in project
✅ **Zero-shot**: Complete context in skill

### Quality Checklist

- [x] Clear workflow steps
- [x] Automated verification
- [x] Error handling complete
- [x] Dependencies documented
- [x] Scripts executable
- [x] Reference patterns comprehensive
- [x] Constitutional compliance
- [x] Git integration
- [x] Coverage validation
- [x] Frontend and backend support

## Integration with Project

This skill integrates with:
- Project constitution (TDD requirement)
- Spec-Driven Development workflow
- Git workflow (commits after each phase)
- Frontend testing (Jest)
- Backend testing (pytest)
- Test-first-generator skill (creates test files)
- Other implementation skills

## Next Steps for Users

When implementing features:

1. **Before**: Read specification and tasks
2. **During**: Use this skill for TDD cycle
3. **After**: Verify coverage and commit

Example workflow:
```
Read spec → Generate tasks → For each task:
  → Write test (RED) → Implement (GREEN) → Clean up (REFACTOR)
  → Verify coverage → Commit → Next task
```

## Maintenance

To update this skill:
- Patterns: Add new examples to reference files
- Scripts: Update for new test frameworks
- Coverage: Adjust thresholds as needed
- Workflow: Refine based on team feedback

---

**Created**: 2026-01-16
**Version**: 1.0.0
**Framework**: skill-creator-pro
**Type**: Automation
**Status**: Production Ready
