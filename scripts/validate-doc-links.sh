#!/usr/bin/env bash
# link extraction with rg->grep fallback (rg is not guaranteed on every machine)
link_grep() {
  if command -v rg >/dev/null 2>&1; then rg -o '\[[^]]+\]\(([^)]+)\)' "$1"; else grep -oE '\[[^]]+\]\([^)]+\)' "$1"; fi
}
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

status=0

echo "[check] validating markdown links in skills/ agents/ docs/conventions/"

while IFS= read -r file; do
  while IFS= read -r link; do
    [[ -z "$link" ]] && continue

    # Skip URLs, anchors, mailto
    if [[ "$link" =~ ^(https?://|mailto:|#) ]]; then
      continue
    fi

    # Drop anchor from local links
    link="${link%%#*}"

    # Skip wildcards/placeholders and non-path tokens
    if [[ "$link" == *"*"* || "$link" == *"{"* || "$link" == *"}"* ]]; then
      continue
    fi

    # Resolve relative to current file dir unless link starts at repo root marker
    if [[ "$link" == /* ]]; then
      target="${link#/}"
    else
      target="$(python3 -c 'import os,sys;print(os.path.normpath(os.path.join(sys.argv[1],sys.argv[2])))' "$(dirname "$file")" "$link")"
      target="${target#$ROOT/}"
    fi

    if [[ ! -e "$target" ]]; then
      echo "[missing] $file -> $link (resolved: $target)"
      status=1
    fi
  done < <(link_grep "$file" | sed -E 's/^.*\(([^)]+)\)$/\1/')
# A `transcripts/` folder holds VERBATIM agent output — the paths inside are a
# record of what an agent said, not links this repo owns, and a record you must
# hand-edit to make CI green is not a record. Excluded by folder so the analysis
# written ALONGSIDE it (README.md) stays checked: only the raw record is exempt.
done < <({ find skills agents docs/conventions docs/evals -type f -name '*.md' -not -path '*/node_modules/*' -not -path '*/transcripts/*'; echo AGENTS.md; echo loading-order.md; } | sort)

echo "[check] validating backticked repo paths resolve"

# The harness writes almost every path as inline code (`docs/conventions/x.md`),
# not as a markdown link — so the check above sees ~none of them, and a broken
# path passed green for weeks. Only tokens rooted at a known top-level directory
# are checked: anything else is prose, a URL fragment, or another repo's path.
path_grep() {
  if command -v rg >/dev/null 2>&1; then rg -o '`[^`]+`' "$1"; else grep -oE '`[^`]+`' "$1"; fi
}

while IFS= read -r file; do
  while IFS= read -r tok; do
    tok="${tok//\`/}"
    [[ -z "$tok" ]] && continue

    # Only tokens rooted at a real top-level dir of this repo.
    [[ "$tok" =~ ^(AGENTS\.md|loading-order\.md|docs/|skills/|agents/|scripts/|design-system/|prototypes/|\.github/) ]] || continue

    # Placeholders, globs, ranges, prose fragments, command lines.
    [[ "$tok" == *"*"* || "$tok" == *"{"* || "$tok" == *"<"* || "$tok" == *" "* ]] && continue
    [[ "$tok" == *"\$"* || "$tok" == *"|"* ]] && continue
    # Template placeholders: `…/YYYY-MM-DD-slug.md`, `design-system/src/specs/…`
    [[ "$tok" == *"…"* || "$tok" == *"YYYY"* || "$tok" == *"<name>"* ]] && continue

    # Paths named in order to FORBID them. The doc is correct precisely because
    # the path does not exist; asserting otherwise would invert the rule.
    case "$tok" in
      docs/solutions/*|docs/solutions) continue ;;
    esac

    # Trailing line/anchor references: src/net.ts:42, file.md#section
    tok="${tok%%#*}"
    tok="${tok%%:*}"
    # Trailing punctuation that belongs to the sentence, not the path.
    tok="${tok%,}"; tok="${tok%.}"; tok="${tok%)}"

    [[ -z "$tok" ]] && continue
    if [[ ! -e "$tok" ]]; then
      echo "[missing] $file -> \`$tok\`"
      status=1
    fi
  done < <(path_grep "$file")
done < <({ find skills agents docs/conventions -type f -name '*.md' -not -path '*/node_modules/*'; echo AGENTS.md; echo loading-order.md; } | sort)

echo "[check] validating AGENTS.md skills-table rows resolve to SKILL.md files"

# NB: process substitution, not a pipeline — status=1 must survive (a `| while`
# subshell silently drops it). Same reason grep gets `|| true`: under
# `set -euo pipefail` a matchless grep would kill the script with no message.
while read -r ref; do
  [[ -z "$ref" ]] && continue
  if [[ ! -f "$ref/SKILL.md" ]]; then
    echo "[missing] AGENTS.md -> $ref/SKILL.md"
    status=1
  fi
done < <(grep -oE 'skills/uno-[a-z-]+' AGENTS.md | sort -u || true)

echo "[check] validating JSON index files"

required_indexes=(
  "docs/context/design-system/index-manifest.json"
  "docs/context/design-system/components/components-index.json"
  "skills/uno-research/references/foundations-index.json"
  "skills/uno-research/references/patterns-index.json"
)

for idx in "${required_indexes[@]}"; do
  if [[ ! -f "$idx" ]]; then
    echo "[missing] required index: $idx"
    status=1
    continue
  fi
  if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$idx" >/dev/null 2>&1; then
    echo "[invalid] invalid JSON: $idx"
    status=1
  fi
done

echo "[check] validating no old path remnants in active files"

old_patterns=(
  "docs/project/"
  "docs/foundations/"
  "docs/design-system/"
  "docs/context/conventions/"
  "\.agent/"
  "bot-skills/"
  "/uno:"
)

for pattern in "${old_patterns[@]}"; do
  # `|| true` inside the substitution: zero matches is the SUCCESS case, but under
  # pipefail a matchless grep would fail the assignment and kill the script.
  # design-system/docs/foundations/ is a VALID current path — only the old
  # repo-root docs/foundations/ counts as stale.
  count=$({ grep -r "$pattern" --include="*.md" --include="*.jsx" --include="*.json" --include="*.mdc" . 2>/dev/null || true; } \
    | { grep -v "node_modules/\|docs/plans/\|docs/knowledge/\|todos/\|storybook-static/\|design-system/docs/foundations/\|design-system/docs/knowledge-audit.json" || true; } \
    | wc -l | tr -d ' ')
  if [[ "$count" -gt 0 ]]; then
    echo "[stale] $count references to old path pattern: $pattern"
    status=1
  fi
done

if [[ $status -eq 0 ]]; then
  echo "[ok] all validation checks passed"
else
  echo "[fail] validation checks failed — see details above"
fi

exit $status
