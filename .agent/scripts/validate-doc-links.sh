#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

status=0

echo "[check] validating markdown links in .agent/ docs"

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
      target="$(cd "$(dirname "$file")" && realpath -m "$link")"
      target="${target#$ROOT/}"
    fi

    if [[ ! -e "$target" ]]; then
      echo "[missing] $file -> $link (resolved: $target)"
      status=1
    fi
  done < <(rg -o '\[[^]]+\]\(([^)]+)\)' "$file" | sed -E 's/^.*\(([^)]+)\)$/\1/')
done < <(find .agent -type f -name '*.md' | sort)

echo "[check] validating AGENTS.md 'See' references"

grep "^See " AGENTS.md | sed 's/^See //' | while read -r ref; do
  ref="${ref%% *}"  # Strip trailing description
  if [[ ! -f "$ref" ]]; then
    echo "[missing] AGENTS.md -> $ref"
    status=1
  fi
done

echo "[check] validating SKILL.md skill links"

grep -oE 'skills/[a-z-]+/SKILL\.md' .agent/SKILL.md | while read -r ref; do
  if [[ ! -f ".agent/$ref" ]]; then
    echo "[missing] SKILL.md -> .agent/$ref"
    status=1
  fi
done

echo "[check] validating JSON index files"

required_indexes=(
  "docs/context/design-system/index-manifest.json"
  "docs/context/design-system/components/components-index.json"
  ".agent/skills/uno-research/references/foundations-index.json"
  ".agent/skills/uno-research/references/patterns-index.json"
  ".agent/skills/uno-prototype/references/tokens-index.json"
  ".agent/skills/uno-prototype/references/examples-index.json"
  ".agent/skills/uno-prototype/references/integrations-index.json"
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
  "\.agent/assets/"
  "\.agent/references/"
)

for pattern in "${old_patterns[@]}"; do
  count=$(grep -r "$pattern" --include="*.md" --include="*.jsx" --include="*.json" --include="*.mdc" 2>/dev/null \
    | grep -v "node_modules/" | grep -v "docs/plans/" | grep -v "docs/knowledge/" | grep -v "storybook-static/" \
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
