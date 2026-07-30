<!-- Load when: Figma link provided, implement-design workflow, design-tool integration -->

# Figma MCP Reference Guide

## MANDATORY load gate (before any MCP call or JSX)

Read in this order — **do not skip**:

1. `design-system/figma/component-registry.json`
2. `design-system/figma/token-registry.json`
3. `references/figma-registry-mandatory-load.md` (enforcement checklist)

Then load `design-system/figma/component-alignment.md` for implement + write-back rules.

## Component alignment (Figma ↔ code)

- `design-system/figma/component-registry.json` — code import ↔ Figma component set ↔ props
- `design-system/figma/component-alignment.md` — implement + write-back rules
- `design-system/figma/token-registry.json` — Figma variable ↔ `var(--*)`

**Figma → code:** resolve library instances via `component-registry.json` + `search_design_system`; never hallucinate components.  
**Code → Figma:** place component **instances** from registry; never redraw mapped components as raw frames.

Pilot: `Button` tonal set (`979:20977`). See `design-system/figma/README.md`.

## Available Tools

| Tool | Purpose | Rate-Limited? |
|------|---------|---------------|
| `get_design_context` | Extract component specs, layout, tokens, structure | Yes |
| `get_screenshot` | Capture visual reference for validation | Yes |
| `get_metadata` | XML overview of node structure (IDs, names, positions) | Yes |
| `get_variable_defs` | Inspect design tokens/variables with semantic context | Yes |
| `search_design_system` | Search connected design systems for existing components | Yes |
| `create_design_system_rules` | Encode project conventions as machine-readable rules | No |
| `create_new_file` | Generate Figma designs from code/descriptions (canvas write-back) | No |
| `whoami` | Verify authentication and plan tier | No |

## implement-design Workflow (7 Steps)

When implementing a design from a Figma link, follow all 7 steps:

1. **Extract node identifiers** — Parse the Figma URL for `fileKey` and `nodeId` (format: `node-id=1-2` → `nodeId: "1:2"`)
2. **Fetch design context** — `get_design_context(fileKey, nodeId)` → layout, typography, colors, component structure, spacing
3. **Capture screenshot** — `get_screenshot(fileKey, nodeId)` → visual reference for validation throughout
4. **Download assets** — Retrieve images, icons, SVGs from MCP assets endpoint. DO NOT install new icon packages — all assets come from Figma payload
5. **Translate to PLUS conventions** — Map Figma output to PLUS tokens, components, and patterns. Use the Cheat Sheet as law. Resolve components via `component-registry.json`. See token mapping below
6. **Achieve visual parity** — Implement pixel-perfect matching. Use PLUS design tokens, not raw Figma values
7. **Validate against source** — Compare implementation against the captured screenshot. Check: layout, typography, colors, states, spacing, assets, accessibility

## Token Mapping (Figma → PLUS CSS)

| Figma | CSS Token |
|-------|-----------|
| `Primary/500` | `var(--color-primary)` |
| `Display 1` | `var(--font-size-display1)` |
| Spacing (contextual) | Pick by layer: `var(--size-card-pad-{x\|y}-{sm\|md\|lg})`, `var(--size-element-gap-{xs\|sm\|md\|lg})`, etc. There is no single `Spacing/N` → one token. |
| Surface tokens | `var(--color-surface-*)` — prefer `-container` over `-state-08` for elevated surfaces |

For the full token reference, load `design-system/agent-views/tokens/tokens.md` and `design-system/figma/token-registry.json`.

## When to Use Which Tool

| Scenario | Primary Tool | Also Use |
|----------|-------------|----------|
| Implementing a Figma design | `get_design_context` | `get_screenshot`, `get_variable_defs` |
| Understanding file structure | `get_metadata` | — |
| Verifying token values | `get_variable_defs` | `token-registry.json`, `design-system/src/tokens/*.scss` |
| Finding existing DS components | `component-registry.json` | `search_design_system`, `components-index.json` for unmapped |
| Encoding PLUS conventions | `create_design_system_rules` | Reference AGENTS.md forbidden patterns |
| Writing designs back to Figma | `create_new_file` | Requires explicit user approval |

## Canvas Write-Back (create_new_file)

Use `create_new_file` only when:
- A code-first feature needs a corresponding Figma spec
- The user explicitly requests generating a Figma design from code
- Always confirm with the user before writing to Figma (treat like forbidden pattern #8 — no unsanctioned writes)

## Round-trip loop (code → Figma → code) — optional, opt-in

For iterating a prototype between the repo and Figma (build here → designer tweaks on canvas → re-import). Never offer it unprompted as a mandatory step; it starts only when the user asks to push work to Figma, and every canvas write goes through **`writers/figma`** (placement, naming, and annotations per `docs/conventions/figma-workspace.md`).

1. **Implement in the repo** — the normal hi-fi path (implement-design 7 steps if the source was Figma).
2. **Write-back (gated)** — user opts in and names the target file/page. The **DS write-back hook** activates (`active-writeback-gate.json`). Load `figma-use` before ANY canvas write; place registry component **instances**, never redrawn frames. **`generate_figma_design` is forbidden as the final deliverable** (reference layer only, delete after). Run `validate:figma-writeback` + `audit:figma-writeback` before `writeback:audit-passed`.
3. **Designer tweaks in Figma** — human work; the agent stays out.
4. **Re-import** — treat the updated frame link as a fresh design handoff: run the full implement-design 7 steps again (registries first). No shortcuts because "it came from our own write-back".
5. Repeat 2–4 until the user stops.

**Keep one source of truth per iteration** — either "Figma wins this round" or "code wins"; never blind two-way sync without human review. If MCP write access is unavailable, say so and stay on Figma → code (or screenshots).

## Component resolution fallback

1. **Primary:** `design-system/figma/component-registry.json` — import path, props, Figma set node IDs (generated from each component's MDX `figmaMeta`; read-only — edit MDX to change a mapping)
2. **Secondary:** `search_design_system` MCP — confirm library instance names
3. **Tertiary:** `docs/context/design-system/components/components-index.json` — unmapped components only

If a node is not in the registry, flag as a gap. Do not invent imports or props.

## Known Limitations

### Cloud vs Desktop MCP
- **`get_screenshot`** and **`get_metadata`** work reliably from the cloud API with just `fileKey` + `nodeId`
- **`get_design_context`** and **`get_variable_defs`** require the **Figma desktop app** to have the file open. If these tools return "nothing selected", tell the user: *"Please open the Figma file in the desktop app and select the target node, then I'll retry."*
- Do NOT silently skip these tools or assume they are unavailable — always ask the user to open the file first, since they likely have it open already
- **Workaround**: If the user cannot open the desktop app, fall back to `get_screenshot` + `get_metadata` for structure, and repo-native token files for values
- **Rate limiting**: MCP tools are rate-limited. Batch operations (e.g., 67+ `search_design_system` calls for drift analysis) should use `get_metadata` for bulk inventory first, then targeted searches

## MCP Fallback

If Figma MCP is unavailable at runtime, state it explicitly and continue with:
- `design-system/figma/component-registry.json` and `token-registry.json`
- Repo-native stories/specs in `design-system/src/`
- Token files in `design-system/src/tokens/`
- Screenshots or exports provided by the user
