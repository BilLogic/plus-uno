#!/usr/bin/env bash
#
# validate-prototype.sh — Quick sanity check for a prototype.
#
# Usage:
#   bash skills/uno-prototype/scripts/validate-prototype.sh prototypes/my-project
#
# Checks:
#   1. src/App.jsx exists
#   2. App.jsx has a default export
#   3. vite.config.js exists
#   4. No escapes from the design system (npm run check:ds-usage, every file
#      held to zero; the rules are docs/engineering/ds-usage-rules.md)
#   5. package.json has a name field

set -euo pipefail

PROJECT_DIR="${1:?Usage: validate-prototype.sh <project-dir>}"

PASS=0
WARN=0
FAIL=0

# NB: `$((PASS+1))`, not `((PASS++))`. Post-increment evaluates to the OLD
# value, so the first call returns 0 — which bash reads as a failed command, and
# `set -e` above kills the script. Every prototype validation used to stop after
# its first passing check and report success (flagged in PR #83).
pass() { echo "  PASS  $1"; PASS=$((PASS + 1)); }
warn() { echo "  WARN  $1"; WARN=$((WARN + 1)); }
fail() { echo "  FAIL  $1"; FAIL=$((FAIL + 1)); }

echo "Validating prototype: $PROJECT_DIR"
echo "---"

# 1. src/App.jsx exists
if [ -f "$PROJECT_DIR/src/App.jsx" ]; then
    pass "src/App.jsx exists"
else
    fail "src/App.jsx is missing"
fi

# 2. App.jsx exports default
if [ -f "$PROJECT_DIR/src/App.jsx" ]; then
    if grep -q 'export default' "$PROJECT_DIR/src/App.jsx"; then
        pass "App.jsx has default export"
    else
        fail "App.jsx is missing 'export default'"
    fi
fi

# 3. vite.config.js exists
if [ -f "$PROJECT_DIR/vite.config.js" ]; then
    pass "vite.config.js exists"
else
    fail "vite.config.js is missing"
fi

# 4. Escapes from the design system: one checker owns the definition (ADR-039)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
if [ -d "$PROJECT_DIR/src" ]; then
    if ESCAPES=$(node "$REPO_ROOT/scripts/check-ds-usage.mjs" "$(cd "$PROJECT_DIR" && pwd)/src" 2>&1); then
        pass "No escapes from the design system (check:ds-usage)"
    else
        fail "Escapes from the design system (check:ds-usage):"
        echo "$ESCAPES"
    fi
fi

# 5. package.json has a name
if [ -f "$PROJECT_DIR/package.json" ]; then
    if grep -q '"name"' "$PROJECT_DIR/package.json"; then
        pass "package.json has a name field"
    else
        warn "package.json is missing a name field"
    fi
else
    warn "No package.json found"
fi

echo "---"
echo "Results: $PASS passed, $WARN warnings, $FAIL failures"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
