#!/bin/bash

# verify_green.sh - Verify tests pass in GREEN/REFACTOR phase
# Usage: ./verify_green.sh <frontend|backend> <test-file-path>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Function to print colored output
print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_info() {
    echo "INFO: $1"
}

# Check arguments
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <frontend|backend> <test-file-path>"
    exit 2
fi

CONTEXT="$1"
TEST_FILE="$2"

# Validate context
if [ "$CONTEXT" != "frontend" ] && [ "$CONTEXT" != "backend" ]; then
    print_error "Context must be 'frontend' or 'backend'"
    exit 2
fi

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    print_error "Test file not found: $TEST_FILE"
    exit 2
fi

print_info "Verifying GREEN/REFACTOR phase for: $TEST_FILE"
print_info "Context: $CONTEXT"
echo ""

# Function to verify frontend tests (Jest)
verify_frontend_green() {
    local test_file="$1"

    # Check if package.json exists
    if [ ! -f "$PROJECT_ROOT/frontend/package.json" ]; then
        print_error "Frontend package.json not found"
        exit 2
    fi

    # Check if Jest is available
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js"
        exit 2
    fi

    # Run Jest on specific test file
    print_info "Running Jest tests..."
    echo ""

    # Run tests and capture exit code
    set +e
    cd "$PROJECT_ROOT/frontend"
    npm test -- "$test_file" --no-coverage --verbose 2>&1
    TEST_EXIT_CODE=$?
    set -e

    echo ""

    # Analyze results
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_success "All tests PASSED"
        echo ""
        echo "GREEN/REFACTOR phase validation passed!"
        echo ""
        echo "Next steps:"
        echo "  - GREEN phase: Commit implementation"
        echo "    git commit -m 'green: implement <feature>'"
        echo ""
        echo "  - REFACTOR phase: Improve code, run verify_green.sh again, then commit"
        echo "    git commit -m 'refactor: clean up <feature>'"
        return 0
    else
        print_error "Tests FAILED"
        echo ""
        echo "GREEN/REFACTOR phase requires all tests to pass."
        echo ""
        echo "Possible issues:"
        echo "  1. Implementation incomplete or incorrect"
        echo "  2. Test expectations not met"
        echo "  3. Refactoring broke functionality"
        echo ""
        echo "Fix the implementation and run verify_green.sh again."
        return 1
    fi
}

# Function to verify backend tests (pytest)
verify_backend_green() {
    local test_file="$1"

    # Check if backend directory exists
    if [ ! -d "$PROJECT_ROOT/backend" ]; then
        print_error "Backend directory not found"
        exit 2
    fi

    # Check if pytest is available
    if ! command -v pytest &> /dev/null; then
        print_error "pytest not found. Please install pytest"
        echo "Install with: pip install pytest"
        exit 2
    fi

    # Run pytest on specific test file
    print_info "Running pytest tests..."
    echo ""

    # Run tests and capture exit code
    set +e
    cd "$PROJECT_ROOT/backend"
    pytest "$test_file" -v --tb=short 2>&1
    TEST_EXIT_CODE=$?
    set -e

    echo ""

    # Analyze results
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_success "All tests PASSED"
        echo ""
        echo "GREEN/REFACTOR phase validation passed!"
        echo ""
        echo "Next steps:"
        echo "  - GREEN phase: Commit implementation"
        echo "    git commit -m 'green: implement <feature>'"
        echo ""
        echo "  - REFACTOR phase: Improve code, run verify_green.sh again, then commit"
        echo "    git commit -m 'refactor: clean up <feature>'"
        return 0
    elif [ $TEST_EXIT_CODE -eq 2 ] || [ $TEST_EXIT_CODE -eq 3 ]; then
        print_error "Test execution error (syntax or import error)"
        echo ""
        echo "Fix syntax/import errors before proceeding."
        return 2
    else
        print_error "Tests FAILED"
        echo ""
        echo "GREEN/REFACTOR phase requires all tests to pass."
        echo ""
        echo "Possible issues:"
        echo "  1. Implementation incomplete or incorrect"
        echo "  2. Test expectations not met"
        echo "  3. Refactoring broke functionality"
        echo ""
        echo "Fix the implementation and run verify_green.sh again."
        return 1
    fi
}

# Check for skipped tests
check_skipped_tests() {
    local context="$1"
    local test_output="$2"

    if echo "$test_output" | grep -qi "skipped\|skip\|xfail"; then
        print_warning "Some tests are skipped or marked as expected failures"
        echo ""
        echo "Skipped tests don't count toward GREEN phase completion."
        echo "Consider removing skip markers if tests should pass."
    fi
}

# Main execution
echo "========================================"
echo "GREEN/REFACTOR PHASE VERIFICATION"
echo "========================================"
echo ""

if [ "$CONTEXT" = "frontend" ]; then
    verify_frontend_green "$TEST_FILE"
    EXIT_CODE=$?
elif [ "$CONTEXT" = "backend" ]; then
    verify_backend_green "$TEST_FILE"
    EXIT_CODE=$?
fi

echo ""

# If tests passed, suggest checking coverage
if [ $EXIT_CODE -eq 0 ]; then
    print_info "Consider checking coverage with check_coverage.sh"
    echo ""
    echo "Example:"
    echo "  .claude/skills/tdd-red-green-refactor/scripts/check_coverage.sh $CONTEXT 70"
fi

echo ""
echo "========================================"

exit $EXIT_CODE
