#!/usr/bin/env bash
# uno-prototype conversation gate — delegates to the data-driven FSM in uno-prototype/run.mjs
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/uno-prototype/run.mjs"
