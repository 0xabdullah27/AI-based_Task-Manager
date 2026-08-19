---
name: tdd-red-green-refactor
description: |
  Executes Test-Driven Development red-green-refactor workflow for the todo web application.
  This skill should be used when implementing features using TDD cycle, ensuring tests fail first,
  then pass, then refactor with 70% minimum coverage. Handles both frontend (Jest) and backend (pytest).
---

# TDD Red-Green-Refactor

Execute the complete Test-Driven Development cycle with automated verification and git commits.

## When to Use

- Implementing new features following TDD workflow
- Adding tests before writing implementation code
- Ensuring proper test coverage (≥70%)
- Following constitutional TDD requirement
- Committing code at each TDD phase (red, green, refactor)

## What This Skill Does

- Guides through red-green-refactor cycle step by step
- Verifies tests fail in red phase (no false positives)
- Verifies tests pass in green phase
- Checks coverage meets 70% minimum threshold
- Creates git commits after each phase
- Supports both frontend (Jest) and backend (pytest)

## What This Skill Does NOT Do

- Write tests or implementation code (Claude Code does this)
- Skip phases or take shortcuts
- Proceed if coverage below threshold
- Handle test framework installation
- Deploy or run production code

---

## Before Starting

Gather context to ensure successful TDD execution:

| Source | Gather |
|--------|--------|
| **Specification** | Feature requirements, acceptance criteria |
| **Task** | Current task ID and what needs implementation |
| **Codebase** | Existing test patterns, file structure |
| **Test Setup** | Jest/pytest configuration, test locations |

Verify test framework is installed and configured before proceeding.

---

## TDD Workflow

```
RED → Verify Fail → Commit → GREEN → Verify Pass → Commit → REFACTOR → Verify Pass → Commit
```

### Phase 1: RED (Write Failing Test)

**Goal**: Write a test that fails for the right reason.

#### Steps

1. **Write Test First**
   - Create test file if needed
   - Write test cases for the feature
   - Test MUST import/use code that doesn't exist yet (or doesn't work yet)
   - Use references: `references/red-phase-patterns.md`

2. **Run Verification Script**
   ```bash
   # Frontend
   .claude/skills/tdd-red-green-refactor/scripts/verify_red.sh frontend <test-file-path>

   # Backend
   .claude/skills/tdd-red-green-refactor/scripts/verify_red.sh backend <test-file-path>
   ```

3. **Verify Test Failure**
   - Script MUST report test failures
   - Failures MUST be for expected reasons (not syntax errors)
   - Document failure reason

4. **Commit Red Phase**
   ```bash
   git add <test-files>
   git commit -m "red: add failing tests for <feature>

   Task: <task-id>
   Phase: RED

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

**Exit Criteria**: Tests fail with expected error messages, red commit created.

### Phase 2: GREEN (Make Tests Pass)

**Goal**: Write minimal code to make tests pass.

#### Steps

1. **Implement Minimum Code**
   - Write only enough code to pass tests
   - No extra features
   - No premature optimization
   - Use references: `references/green-phase-patterns.md`

2. **Run Verification Script**
   ```bash
   # Frontend
   .claude/skills/tdd-red-green-refactor/scripts/verify_green.sh frontend <test-file-path>

   # Backend
   .claude/skills/tdd-red-green-refactor/scripts/verify_green.sh backend <test-file-path>
   ```

3. **Verify Tests Pass**
   - Script MUST report all tests passing
   - Check coverage meets threshold
   - No skipped or pending tests

4. **Commit Green Phase**
   ```bash
   git add <source-files> <test-files>
   git commit -m "green: implement <feature> to pass tests

   Task: <task-id>
   Phase: GREEN
   Coverage: <percentage>%

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

**Exit Criteria**: All tests pass, coverage ≥70%, green commit created.

### Phase 3: REFACTOR (Improve Code)

**Goal**: Clean up code while keeping tests green.

#### Steps

1. **Identify Improvements**
   - Remove duplication
   - Improve naming
   - Extract functions/components
   - Apply patterns
   - Use references: `references/refactor-patterns.md`

2. **Refactor Incrementally**
   - Make one change at a time
   - Run tests after each change
   - Keep tests passing throughout

3. **Run Verification Script**
   ```bash
   # Frontend
   .claude/skills/tdd-red-green-refactor/scripts/verify_green.sh frontend <test-file-path>

   # Backend
   .claude/skills/tdd-red-green-refactor/scripts/verify_green.sh backend <test-file-path>
   ```

4. **Check Final Coverage**
   ```bash
   # Frontend or Backend
   .claude/skills/tdd-red-green-refactor/scripts/check_coverage.sh <frontend|backend> <coverage-threshold>
   ```

5. **Commit Refactor Phase**
   ```bash
   git add <refactored-files>
   git commit -m "refactor: clean up <feature> implementation

   Task: <task-id>
   Phase: REFACTOR
   Coverage: <percentage>%
   Changes: <brief-description>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

**Exit Criteria**: Code improved, all tests pass, coverage maintained/improved, refactor commit created.

---

## Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| Frontend (Jest) | 70% | 80%+ |
| Backend (pytest) | 70% | 80%+ |

Coverage is checked after GREEN and REFACTOR phases.

---

## Error Handling

### Test Won't Fail (Red Phase)

**Problem**: Tests pass when they should fail.

**Solutions**:
1. Verify test actually uses new/changed code
2. Check test assertions are correct
3. Ensure implementation doesn't already exist
4. Review `references/red-phase-patterns.md`

### Test Won't Pass (Green Phase)

**Problem**: Implementation doesn't make tests pass.

**Solutions**:
1. Check implementation matches test expectations
2. Verify imports and exports
3. Debug test output for clues
4. Review `references/green-phase-patterns.md`

### Coverage Below Threshold

**Problem**: Coverage <70% after implementation.

**Solutions**:
1. Add missing test cases
2. Test edge cases
3. Test error paths
4. Review `references/tdd-best-practices.md`

### Tests Break During Refactor

**Problem**: Tests fail after refactoring.

**Solutions**:
1. Revert last change
2. Make smaller refactoring steps
3. Ensure behavior unchanged
4. Review `references/refactor-patterns.md`

---

## Scripts

### verify_red.sh

Verifies tests fail in red phase.

**Usage**:
```bash
.claude/skills/tdd-red-green-refactor/scripts/verify_red.sh <frontend|backend> <test-file-path>
```

**Checks**:
- Test framework available
- Tests execute
- Tests fail with expected errors
- No syntax errors

**Exit codes**:
- 0: Tests fail correctly (RED phase valid)
- 1: Tests pass (should fail in RED)
- 2: Syntax or configuration error

### verify_green.sh

Verifies tests pass in green/refactor phases.

**Usage**:
```bash
.claude/skills/tdd-red-green-refactor/scripts/verify_green.sh <frontend|backend> <test-file-path>
```

**Checks**:
- Test framework available
- Tests execute
- All tests pass
- No skipped tests

**Exit codes**:
- 0: All tests pass (GREEN/REFACTOR phase valid)
- 1: Tests fail (implementation incomplete)
- 2: Syntax or configuration error

### check_coverage.sh

Checks test coverage meets threshold.

**Usage**:
```bash
.claude/skills/tdd-red-green-refactor/scripts/check_coverage.sh <frontend|backend> <threshold>
```

**Parameters**:
- `<frontend|backend>`: Which codebase to check
- `<threshold>`: Minimum percentage (default: 70)

**Checks**:
- Runs tests with coverage
- Calculates coverage percentage
- Compares to threshold

**Exit codes**:
- 0: Coverage meets/exceeds threshold
- 1: Coverage below threshold
- 2: Coverage tool error

---

## Constitutional Compliance

This skill enforces:

- **Principle I**: Test-Driven Development mandatory
- **Principle III**: Test coverage minimum 70%
- **Principle IV**: Specification → Implementation workflow

All phases must complete successfully to maintain constitutional compliance.

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/red-phase-patterns.md` | Patterns for writing failing tests |
| `references/green-phase-patterns.md` | Patterns for minimal implementation |
| `references/refactor-patterns.md` | Safe refactoring techniques |
| `references/tdd-best-practices.md` | TDD principles and common pitfalls |

---

## Quick Reference

**Full Cycle**:
```bash
# 1. RED
# - Write test
./scripts/verify_red.sh <frontend|backend> <test-file>
git commit -m "red: ..."

# 2. GREEN
# - Write implementation
./scripts/verify_green.sh <frontend|backend> <test-file>
git commit -m "green: ..."

# 3. REFACTOR
# - Improve code
./scripts/verify_green.sh <frontend|backend> <test-file>
./scripts/check_coverage.sh <frontend|backend> 70
git commit -m "refactor: ..."
```

**Remember**:
- Tests first, code second
- One cycle per feature/task
- Commit after each phase
- Maintain 70% minimum coverage
