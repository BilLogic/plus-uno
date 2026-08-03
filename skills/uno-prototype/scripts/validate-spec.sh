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
#
# Shape is read from the spec's OWN DECLARATION — the title line and the
# "Confirmed brief" Artifact clause — not from anywhere in the body. Scanning
# the whole file made a flow map that says "no screens yet" fail the screens
# check: the disclaimer matched as a screen (live run 2026-08-02).
#
# Bounded by HEAD, not by match count: `grep … | head -20` still reached the
# self-check block at the bottom of a short spec, where "artifact =" appears
# again as a checklist item. The declaration is at the top by construction.
declare_lines=$(head -40 "$spec" | grep -iE '^#|confirmed brief|artifact')

# Narrative deliverables have frames and scenes, not screens or flow steps —
# neither shape check applies, and forcing one made a concept image fail for
# having no screens section. Checked first: a storyboard OF a flow still says
# "flow" in its title.
narrative=0
grep -qiE 'concept image|storyboard|moodboard' <<<"$declare_lines" && narrative=1

if [[ $narrative -eq 0 ]] && grep -qiE 'flow map|user flow|journey|data-flow' <<<"$declare_lines"; then
  check "flow skeleton (trigger/steps/outcome)" 'trigger'
fi
# `interactive` bare, not `interactive prototype`: real specs title themselves
# "interactive draft", and the golden example silently stopped being
# screen-checked once shape detection was scoped to the declaration.
if [[ $narrative -eq 0 ]] && grep -qiE 'interactive|functional prototype|mockup|wireframe|table view|screens?\b' <<<"$declare_lines"; then
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
