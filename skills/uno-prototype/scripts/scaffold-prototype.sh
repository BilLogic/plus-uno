#!/usr/bin/env bash
#
# scaffold-prototype.sh — copy prototypes/starter into a new prototype slug,
# patching the name and picking the next free dev port automatically.
#
# Usage:
#   bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>
#
# The slug must be kebab-case: ^[a-z0-9][a-z0-9-]{1,40}$
# Port collisions were a manual step ("pick an unused port — check other
# prototypes configs"); this script makes it deterministic.

set -euo pipefail

slug="${1:-}"
if [[ -z "$slug" ]]; then
  echo "usage: $0 <slug>" >&2
  exit 1
fi
if [[ ! "$slug" =~ ^[a-z0-9][a-z0-9-]{1,40}$ ]]; then
  echo "[fail] slug must be kebab-case (^[a-z0-9][a-z0-9-]{1,40}\$): $slug" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
src="$repo_root/prototypes/starter"
dest="$repo_root/prototypes/$slug"

[[ -d "$src" ]] || { echo "[fail] starter template missing: $src" >&2; exit 1; }
[[ -e "$dest" ]] && { echo "[fail] already exists: $dest" >&2; exit 1; }

# Next free port: max port used by any prototype vite config, plus one.
max_port=$(grep -rhoE 'port: *[0-9]+' "$repo_root"/prototypes/*/vite.config.js 2>/dev/null \
  | grep -oE '[0-9]+' | sort -n | tail -1)
port=$(( ${max_port:-3000} + 1 ))

cp -R "$src" "$dest"

# Patch the port and the prototype name (starter README/title placeholders).
sed -i '' -E "s/port: *[0-9]+/port: $port/" "$dest/vite.config.js"
sed -i '' "s/starter/$slug/g" "$dest/index.html" 2>/dev/null || true

echo "[ok] scaffolded prototypes/$slug (dev port $port)"
echo "     next: edit $dest/src/App.jsx — build against the confirmed plan"
