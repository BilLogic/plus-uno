#!/usr/bin/env bash
# link extraction with rg->grep fallback (rg is not guaranteed on every machine)
link_grep() {
  if command -v rg >/dev/null 2>&1; then rg -o '\[[^]]+\]\(([^)]+)\)' "$1"; else grep -oE '\[[^]]+\]\([^)]+\)' "$1"; fi
}
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

status=0

echo "[check] validating markdown links in skills/ agents/ docs/ design-system/guidelines/ + root"

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
# docs/adr/ is scanned for markdown links but NOT for backticked paths: an ADR's
# job includes naming a path that was retired, and rewriting those would erase
# the decision's own record. Live claims inside ADRs were repointed by hand.
done < <({ find skills agents docs/connectors docs/engineering docs/conventions docs/adr docs/product-and-service design-system/guidelines docs/evals -type f -name '*.md' -not -path '*/node_modules/*' -not -path '*/transcripts/*'; echo AGENTS.md; echo CONTEXT.md; echo SETUP.md; echo README.md; echo loading-order.md; } | sort)

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
# design-system/guidelines/components/overview.md is EXCLUDED by name: it carries
# its own staleness banner (pre-2026-07 component paths, five components that do
# not exist) and #165/#166 own its rebuild. Excluding it keeps 50 known findings
# from burying new ones; it is not a pass.
done < <({ find skills agents docs/connectors docs/engineering docs/conventions docs/product-and-service design-system/guidelines -type f -name '*.md' -not -path '*/node_modules/*' -not -path 'design-system/guidelines/components/overview.md'; echo AGENTS.md; echo CONTEXT.md; echo SETUP.md; echo loading-order.md; } | sort)

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
  "design-system/guidelines/index-manifest.json"
  "design-system/guidelines/components/components-index.json"
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
  "docs/product-and-service/conventions/"
  "\.agent/"
  "bot-skills/"
  "/uno:"
  "docs/product-and-service/design-system"
  "design-system/docs/"
)

for pattern in "${old_patterns[@]}"; do
  # `|| true` inside the substitution: zero matches is the SUCCESS case, but under
  # pipefail a matchless grep would fail the assignment and kill the script.
  # design-system/docs/ retired in #170 (four homes collapsed into
  # design-system/guidelines/), so it is now itself a stale pattern.
  count=$({ grep -r "$pattern" --include="*.md" --include="*.jsx" --include="*.json" --include="*.mdc" . 2>/dev/null || true; } \
    | { grep -v "node_modules/\|docs/plans/\|docs/knowledge/\|docs/adr/\|todos/\|storybook-static/\|design-system/figma/knowledge-audit.json" || true; } \
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
