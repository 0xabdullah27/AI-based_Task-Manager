#!/bin/bash

# verify_red.sh - Verify tests fail in RED phase
# Usage: ./verify_red.sh <frontend|backend> <test-file-path>

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

print_info "Verifying RED phase for: $TEST_FILE"
print_info "Context: $CONTEXT"
echo ""

# Function to verify frontend tests (Jest)
verify_frontend_red() {
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
    npm test -- "$test_file" --no-coverage --silent 2>&1
    TEST_EXIT_CODE=$?
    set -e

    echo ""

    # Analyze results
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_error "Tests PASSED but should FAIL in RED phase"
        echo ""
        echo "RED phase requires tests to fail. Possible reasons:"
        echo "  1. Implementation already exists"
        echo "  2. Test doesn't actually use the new code"
        echo "  3. Test assertions are incorrect"
        echo ""
        echo "Review the test and ensure it imports/uses code that doesn't exist yet."
        return 1
    else
        print_success "Tests FAILED as expected in RED phase"
        echo ""
        echo "RED phase validation passed!"
        echo "Next steps:"
        echo "  1. Commit RED phase: git commit -m 'red: add failing tests for <feature>'"
        echo "  2. Proceed to GREEN phase: implement code to make tests pass"
        return 0
    fi
}

# Function to verify backend tests (pytest)
verify_backend_red() {
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
    pytest "$test_file" -v --tb=short --no-header 2>&1
    TEST_EXIT_CODE=$?
    set -e

    echo ""

    # Analyze results
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        print_error "Tests PASSED but should FAIL in RED phase"
        echo ""
        echo "RED phase requires tests to fail. Possible reasons:"
        echo "  1. Implementation already exists"
        echo "  2. Test doesn't actually use the new code"
        echo "  3. Test assertions are incorrect"
        echo ""
        echo "Review the test and ensure it imports/uses code that doesn't exist yet."
        return 1
    elif [ $TEST_EXIT_CODE -eq 2 ] || [ $TEST_EXIT_CODE -eq 3 ]; then
        print_error "Test execution error (syntax or import error)"
        echo ""
        echo "Fix syntax errors before proceeding. RED phase should fail with logical errors, not syntax errors."
        return 2
    else
        print_success "Tests FAILED as expected in RED phase"
        echo ""
        echo "RED phase validation passed!"
        echo "Next steps:"
        echo "  1. Commit RED phase: git commit -m 'red: add failing tests for <feature>'"
        echo "  2. Proceed to GREEN phase: implement code to make tests pass"
        return 0
    fi
}

# Main execution
echo "========================================"
echo "RED PHASE VERIFICATION"
echo "========================================"
echo ""

if [ "$CONTEXT" = "frontend" ]; then
    verify_frontend_red "$TEST_FILE"
    EXIT_CODE=$?
elif [ "$CONTEXT" = "backend" ]; then
    verify_backend_red "$TEST_FILE"
    EXIT_CODE=$?
fi

echo ""
echo "========================================"

exit $EXIT_CODE
