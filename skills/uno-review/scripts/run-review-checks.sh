#!/usr/bin/env bash
#
# run-review-checks.sh — Run PLUS convention checks against a directory.
#
# Usage:
#   bash .agent/skills/uno-review/scripts/run-review-checks.sh <target-dir>
#
# Example:
#   bash .agent/skills/uno-review/scripts/run-review-checks.sh playground/home-redesign/src
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

pass() { echo "  PASS  $1"; ((PASS++)); }
warn() { echo "  WARN  $1"; ((WARN++)); }
fail() { echo "  FAIL  $1"; ((FAIL++)); }
count_matches() { wc -l <<< "$1" | tr -d ' '; }

echo "PLUS Review Checks: $TARGET"
echo "==="

# 1. Hardcoded hex colors
HITS=$(grep -rn '#[0-9a-fA-F]\{3,8\}' --include="*.jsx" --include="*.scss" --include="*.css" "$TARGET" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No hardcoded hex colors"
else
    N=$(count_matches "$HITS")
    warn "Found $N lines with hardcoded hex colors (use var(--color-*) tokens)"
    echo "$HITS" | head -5
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

# 3. Deep imports bypassing barrel
HITS=$(grep -rn "from 'design-system/src/\|from \"design-system/src/" --include="*.jsx" --include="*.js" "$TARGET" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No deep imports into design-system/src/"
else
    N=$(count_matches "$HITS")
    fail "Found $N deep imports (use @/ alias)"
    echo "$HITS" | head -5
    echo ""
fi

# 4. Direct Bootstrap imports
HITS=$(grep -rn "from 'react-bootstrap\|from \"react-bootstrap" --include="*.jsx" --include="*.js" "$TARGET" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No direct react-bootstrap imports"
else
    N=$(count_matches "$HITS")
    warn "Found $N direct react-bootstrap imports (prefer @/components/)"
    echo "$HITS" | head -5
    echo ""
fi

# 5. Inline hardcoded pixel values in styles
HITS=$(grep -rn "style={{" --include="*.jsx" "$TARGET" 2>/dev/null | grep -E "(padding|margin|gap|fontSize|borderRadius):\s*['\"]?[0-9]+(px|rem|em)" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No hardcoded pixel values in inline styles"
else
    N=$(count_matches "$HITS")
    warn "Found $N lines with hardcoded sizes (use var(--size-*) tokens)"
    echo "$HITS" | head -5
    echo ""
fi

# 6. Font Awesome Pro icons (forbidden)
HITS=$(grep -rn 'fa-light\|fa-thin\|fa-sharp\|fa-duotone' --include="*.jsx" --include="*.html" "$TARGET" 2>/dev/null || true)
if [ -z "$HITS" ]; then
    pass "No Font Awesome Pro icons"
else
    N=$(count_matches "$HITS")
    fail "Found $N FA Pro icon references (only fa-solid, fa-regular, fa-brands allowed)"
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
