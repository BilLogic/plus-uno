#!/usr/bin/env bash
#
# validate-spec.sh — deterministic completeness check for a prompt-spec before
# it is handed to the designer. Specs previously shipped unchecked; the rubric
# demands "usable with <=1 regeneration" but nothing enforced the sections that
# make that possible.
#
# Usage:
#   bash skills/uno-prototype/scripts/validate-spec.sh <spec-file.md>
#
# Checks (case-insensitive grep, so wording can vary):
#   1. The confirmed brief is restated (brief/goal near the top)
#   2. Trigger → steps → outcome skeleton present (flow language)
#   3. Out-of-scope / won't-include is named
#   4. The self-check block is embedded (method §3)
#   5. Interactive/functional specs name screen states incl. empty/error

set -euo pipefail

spec="${1:-}"
[[ -f "$spec" ]] || { echo "usage: $0 <spec-file.md>" >&2; exit 1; }

fail=0
check() { # check <label> <regex>
  if grep -qiE "$2" "$spec"; then
    echo "[ok]   $1"
  else
    echo "[MISS] $1"
    fail=1
  fi
}

check "brief restated (goal)"            'goal|brief'
check "out-of-scope named"               "out of scope|won'?t include|not include|excluded|do not (add|draw)"
check "self-check block embedded"        'self-check|pass/fail|verify.*(output|against)'

# Shape-specific checks: flow skeleton for diagram-shaped specs, screen-state
# coverage for screen-shaped ones. A spec can be both; each check binds only
# when its shape is present.
if grep -qiE 'flow map|user flow|journey|data-flow' "$spec"; then
  check "flow skeleton (trigger/steps/outcome)" 'trigger'
fi
if grep -qiE 'interactive prototype|functional prototype|screen|mockup|wireframe|table view' "$spec"; then
  # Require an explicit states SECTION, not a stray "empty" anywhere in the file —
  # a flow map's open questions used to satisfy this on a spec with no screens.
  check "screens/states section" '^#+.*(state|screen)|^\*\*(screen|state)'
  check "  … covering empty/zero-results" 'empty|zero.?result'
fi

# Structural honesty: a spec that says nothing is unresolved on an incomplete PRD
# is usually hiding invention. Warn (never fail) when no gap is surfaced.
if ! grep -qiE 'open question|unresolved|undecided|not specified|unspecified|ask' "$spec"; then
  echo "[warn] no open questions or gaps surfaced — confirm the PRD really had none"
fi

if [[ $fail -eq 1 ]]; then
  echo "[fail] spec incomplete — fill the [MISS] sections before handoff" >&2
  exit 1
fi
echo "[pass] spec structurally complete"
