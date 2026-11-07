#!/usr/bin/env bash
#
# run-review-checks.sh — Run PLUS convention checks against a directory.
#
# Usage:
#   bash skills/uno-review/scripts/run-review-checks.sh <target-dir>
#
# Example:
#   bash skills/uno-review/scripts/run-review-checks.sh prototypes/home-redesign/src
#
# Output: PASS / WARN / FAIL for each check.

set -euo pipefail

TARGET="${1:?Usage: run-review-checks.sh <target-dir>}"

if [ ! -d "$TARGET" ]; then
    echo "Error: '$TARGET' is not a directory"
    exit 1
fi

PASS=0
WARN=0
FAIL=0

pass() { echo "  PASS  $1"; PASS=$((PASS+1)); }
warn() { echo "  WARN  $1"; WARN=$((WARN+1)); }
fail() { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
count_matches() { wc -l <<< "$1" | tr -d ' '; }

echo "PLUS Review Checks: $TARGET"
echo "==="

# 1. Escapes from the design system: raw literals, deep imports, unknown
#    components, props and tokens, primitive reads, Font Awesome Pro, and
#    react-bootstrap where a PLUS component exists. One checker owns the
#    definition (ADR-039); rules: docs/engineering/ds-usage-rules.md.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
if ESCAPES=$(node "$REPO_ROOT/scripts/check-ds-usage.mjs" "$(cd "$TARGET" && pwd)" 2>&1); then
    pass "No escapes from the design system (check:ds-usage)"
    if grep -q "(warning)" <<< "$ESCAPES"; then
        warn "check:ds-usage warnings:"
        grep -B3 "(warning)" <<< "$ESCAPES" | head -12
        echo ""
    fi
else
    fail "Escapes from the design system (check:ds-usage):"
    echo "$ESCAPES" | head -40
    echo ""
fi

# 2. Raw HTML elements that should be DS components
HITS=$(grep -rn '<button\|<input\|<select\|<textarea' --include="*.jsx" "$TARGET" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No raw HTML form elements (using DS components)"
else
    N=$(count_matches "$HITS")
    warn "Found $N lines with raw HTML elements (use DS components)"
    echo "$HITS" | head -5
    echo ""
fi

echo "==="
echo "Results: $PASS passed, $WARN warnings, $FAIL failures"

if [ "$FAIL" -gt 0 ]; then
    echo "STATUS: FAIL"
    exit 1
elif [ "$WARN" -gt 0 ]; then
    echo "STATUS: WARN"
    exit 0
else
    echo "STATUS: PASS"
    exit 0
fi
