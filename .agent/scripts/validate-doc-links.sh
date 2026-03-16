#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

status=0

echo "[check] validating markdown links in .agent docs"

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

echo "[check] validating .agent/assets markdown policy"

while IFS= read -r md_asset; do
  rel="${md_asset#./}"
  if [[ "$rel" != ".agent/assets/README.md" ]]; then
    echo "[policy] markdown reference file found in assets: $rel"
    status=1
  fi
done < <(find .agent/assets -type f -name '*.md' | sort)

echo "[check] validating .agent/assets index json files"

required_asset_indexes=(
  ".agent/assets/index-manifest.json"
  ".agent/assets/foundations-index.json"
  ".agent/assets/components-index.json"
  ".agent/assets/patterns-index.json"
  ".agent/assets/tokens-index.json"
  ".agent/assets/examples-index.json"
  ".agent/assets/integrations-index.json"
)

for idx in "${required_asset_indexes[@]}"; do
  if [[ ! -f "$idx" ]]; then
    echo "[missing] required asset index: $idx"
    status=1
    continue
  fi
  if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$idx" >/dev/null 2>&1; then
    echo "[invalid] invalid JSON: $idx"
    status=1
  fi
done

if [[ $status -eq 0 ]]; then
  echo "[ok] markdown link check passed"
else
  echo "[fail] markdown link check failed"
fi

exit $status
