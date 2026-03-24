#!/usr/bin/env bash
#
# validate-prototype.sh — Quick sanity check for a playground prototype.
#
# Usage:
#   bash .agent/skills/uno-prototype/scripts/validate-prototype.sh playground/my-project
#
# Checks:
#   1. src/App.jsx exists
#   2. App.jsx has a default export
#   3. vite.config.js exists
#   4. Uses @/ or @plus-ds aliases (not deep relative paths)
#   5. package.json has a name field

set -euo pipefail

PROJECT_DIR="${1:?Usage: validate-prototype.sh <project-dir>}"

PASS=0
WARN=0
FAIL=0

pass() { echo "  PASS  $1"; ((PASS++)); }
warn() { echo "  WARN  $1"; ((WARN++)); }
fail() { echo "  FAIL  $1"; ((FAIL++)); }

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

# 4. Check for deep relative paths into design-system (should use @ alias instead)
if [ -d "$PROJECT_DIR/src" ]; then
    DEEP_IMPORTS=$(grep -rn 'design-system/src/' "$PROJECT_DIR/src/" --include="*.jsx" --include="*.js" 2>/dev/null || true)
    if [ -z "$DEEP_IMPORTS" ]; then
        pass "No deep relative imports into design-system/src/"
    else
        warn "Found deep relative imports (use @/ alias instead):"
        echo "$DEEP_IMPORTS" | head -5
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
