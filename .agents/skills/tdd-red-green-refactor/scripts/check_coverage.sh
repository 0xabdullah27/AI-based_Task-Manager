#!/bin/bash

# check_coverage.sh - Check test coverage meets threshold
# Usage: ./check_coverage.sh <frontend|backend> [threshold]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}INFO: $1${NC}"
}

# Check arguments
if [ $# -lt 1 ]; then
    print_error "Usage: $0 <frontend|backend> [threshold]"
    echo "Example: $0 frontend 70"
    exit 2
fi

CONTEXT="$1"
THRESHOLD="${2:-70}"  # Default 70% if not specified

# Validate context
if [ "$CONTEXT" != "frontend" ] && [ "$CONTEXT" != "backend" ]; then
    print_error "Context must be 'frontend' or 'backend'"
    exit 2
fi

# Validate threshold
if ! [[ "$THRESHOLD" =~ ^[0-9]+$ ]] || [ "$THRESHOLD" -lt 0 ] || [ "$THRESHOLD" -gt 100 ]; then
    print_error "Threshold must be a number between 0 and 100"
    exit 2
fi

print_info "Checking test coverage for: $CONTEXT"
print_info "Coverage threshold: ${THRESHOLD}%"
echo ""

# Function to check frontend coverage (Jest)
check_frontend_coverage() {
    local threshold="$1"

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

    print_info "Running Jest with coverage..."
    echo ""

    # Run Jest with coverage
    set +e
    cd "$PROJECT_ROOT/frontend"
    COVERAGE_OUTPUT=$(npm test -- --coverage --coverageReporters=text --coverageReporters=text-summary --silent 2>&1)
    TEST_EXIT_CODE=$?
    set -e

    echo "$COVERAGE_OUTPUT"
    echo ""

    # Parse coverage percentage
    # Jest outputs format: "Statements   : 85.5% ( 123/144 )"
    COVERAGE_PERCENTAGE=$(echo "$COVERAGE_OUTPUT" | grep -oP "Statements\s+:\s+\K[0-9]+(\.[0-9]+)?" | head -1)

    if [ -z "$COVERAGE_PERCENTAGE" ]; then
        print_warning "Could not parse coverage percentage from output"
        print_info "Check the coverage report above manually"
        return 2
    fi

    # Compare coverage to threshold
    print_info "Statement coverage: ${COVERAGE_PERCENTAGE}%"

    # Use bc for floating point comparison
    if command -v bc &> /dev/null; then
        if (( $(echo "$COVERAGE_PERCENTAGE >= $threshold" | bc -l) )); then
            print_success "Coverage meets threshold (${COVERAGE_PERCENTAGE}% >= ${threshold}%)"
            echo ""
            echo "Coverage check PASSED!"
            return 0
        else
            print_error "Coverage below threshold (${COVERAGE_PERCENTAGE}% < ${threshold}%)"
            echo ""
            echo "Coverage check FAILED!"
            echo ""
            echo "To improve coverage:"
            echo "  1. Add tests for uncovered code paths"
            echo "  2. Test edge cases and error conditions"
            echo "  3. Review coverage report for gaps"
            return 1
        fi
    else
        # Fallback to integer comparison if bc not available
        COVERAGE_INT=${COVERAGE_PERCENTAGE%.*}
        if [ "$COVERAGE_INT" -ge "$threshold" ]; then
            print_success "Coverage meets threshold (${COVERAGE_PERCENTAGE}% >= ${threshold}%)"
            echo ""
            echo "Coverage check PASSED!"
            return 0
        else
            print_error "Coverage below threshold (${COVERAGE_PERCENTAGE}% < ${threshold}%)"
            echo ""
            echo "Coverage check FAILED!"
            echo ""
            echo "To improve coverage:"
            echo "  1. Add tests for uncovered code paths"
            echo "  2. Test edge cases and error conditions"
            echo "  3. Review coverage report for gaps"
            return 1
        fi
    fi
}

# Function to check backend coverage (pytest-cov)
check_backend_coverage() {
    local threshold="$1"

    # Check if backend directory exists
    if [ ! -d "$PROJECT_ROOT/backend" ]; then
        print_error "Backend directory not found"
        exit 2
    fi

    # Check if pytest is available
    if ! command -v pytest &> /dev/null; then
        print_error "pytest not found. Please install pytest"
        echo "Install with: pip install pytest pytest-cov"
        exit 2
    fi

    # Check if pytest-cov is available
    if ! pytest --cov 2>&1 | grep -q "usage"; then
        print_error "pytest-cov not found. Please install pytest-cov"
        echo "Install with: pip install pytest-cov"
        exit 2
    fi

    print_info "Running pytest with coverage..."
    echo ""

    # Run pytest with coverage
    set +e
    cd "$PROJECT_ROOT/backend"
    COVERAGE_OUTPUT=$(pytest --cov=app --cov-report=term --cov-report=term-missing 2>&1)
    TEST_EXIT_CODE=$?
    set -e

    echo "$COVERAGE_OUTPUT"
    echo ""

    # Parse coverage percentage
    # pytest-cov outputs format: "TOTAL    123    45    63%"
    COVERAGE_PERCENTAGE=$(echo "$COVERAGE_OUTPUT" | grep "TOTAL" | grep -oP "[0-9]+%" | tr -d '%')

    if [ -z "$COVERAGE_PERCENTAGE" ]; then
        print_warning "Could not parse coverage percentage from output"
        print_info "Check the coverage report above manually"
        return 2
    fi

    # Compare coverage to threshold
    print_info "Total coverage: ${COVERAGE_PERCENTAGE}%"

    if [ "$COVERAGE_PERCENTAGE" -ge "$threshold" ]; then
        print_success "Coverage meets threshold (${COVERAGE_PERCENTAGE}% >= ${threshold}%)"
        echo ""
        echo "Coverage check PASSED!"
        return 0
    else
        print_error "Coverage below threshold (${COVERAGE_PERCENTAGE}% < ${threshold}%)"
        echo ""
        echo "Coverage check FAILED!"
        echo ""
        echo "To improve coverage:"
        echo "  1. Add tests for uncovered code paths"
        echo "  2. Test edge cases and error conditions"
        echo "  3. Review coverage report for gaps"
        echo "  4. Check 'Missing' column for uncovered lines"
        return 1
    fi
}

# Function to provide coverage improvement tips
provide_coverage_tips() {
    local context="$1"

    echo ""
    echo "Tips for improving coverage:"
    echo ""
    echo "1. Test all code paths:"
    echo "   - if/else branches"
    echo "   - try/catch blocks"
    echo "   - switch/case statements"
    echo ""
    echo "2. Test edge cases:"
    echo "   - Empty inputs"
    echo "   - Null/undefined values"
    echo "   - Boundary values"
    echo ""
    echo "3. Test error conditions:"
    echo "   - Invalid input"
    echo "   - Network failures"
    echo "   - Authorization failures"
    echo ""
    echo "4. Use coverage report to identify gaps:"

    if [ "$context" = "frontend" ]; then
        echo "   - Run: npm test -- --coverage"
        echo "   - Open: coverage/lcov-report/index.html"
    else
        echo "   - Run: pytest --cov=app --cov-report=html"
        echo "   - Open: htmlcov/index.html"
    fi
}

# Main execution
echo "========================================"
echo "COVERAGE CHECK"
echo "========================================"
echo ""

if [ "$CONTEXT" = "frontend" ]; then
    check_frontend_coverage "$THRESHOLD"
    EXIT_CODE=$?
elif [ "$CONTEXT" = "backend" ]; then
    check_backend_coverage "$THRESHOLD"
    EXIT_CODE=$?
fi

# Provide tips if coverage is insufficient
if [ $EXIT_CODE -eq 1 ]; then
    provide_coverage_tips "$CONTEXT"
fi

echo ""
echo "========================================"

# Summary
if [ $EXIT_CODE -eq 0 ]; then
    print_success "Coverage validation complete"
    echo ""
    echo "Next steps:"
    echo "  1. Commit your changes with coverage noted in commit message"
    echo "  2. Continue to next TDD cycle or next task"
elif [ $EXIT_CODE -eq 1 ]; then
    print_error "Coverage validation failed"
    echo ""
    echo "Action required:"
    echo "  1. Add more tests to improve coverage"
    echo "  2. Run check_coverage.sh again to verify"
    echo "  3. Aim for ${THRESHOLD}% minimum coverage"
fi

exit $EXIT_CODE
