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

if [[ $status -eq 0 ]]; then
  echo "[ok] markdown link check passed"
else
  echo "[fail] markdown link check failed"
fi

exit $status
