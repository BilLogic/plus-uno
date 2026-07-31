#!/usr/bin/env bash
# Fail OPEN if node is unavailable — a GUI-launched IDE without an nvm PATH must
# never have every prompt blocked by this gate (ce:review 065).
command -v node >/dev/null 2>&1 || exit 0
# uno-prototype conversation gate — delegates to the data-driven FSM in uno-prototype/run.mjs
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/uno-prototype/run.mjs"
