<!-- Load when: Figma link provided, implement-design workflow, design-tool integration -->

# Figma MCP Reference Guide

## Official Figma MCP skills (Cursor / plugin)

Figma ships **named skills** with the Figma MCP plugin (e.g. `figma-implement-design`, `figma-use`, `figma-generate-design`, `figma-create-new-file`). They teach the assistant how to call MCP reliably for those workflows. See [Figma skills for MCP](https://help.figma.com/hc/en-us/articles/39166810751895-Figma-skills-for-MCP).

**How this file fits:** The **implement-design (7 steps)** below is the **PLUS repo** checklist (tokens, Cheat Sheet, validation). Use it together with **`figma-implement-design`** when the client offers that skill—same direction (design → code), one vendor skill + one project contract.

**Optional Figma ↔ Cursor loop** (implement in Cursor → user-approved write-back to Figma → tweak in Figma → re-import): under **uno-prototype**, the assistant asks at the **end of each** create/update delivery; if the user agrees and **provides a Figma link**, load `references/figma-round-trip-workflow.md`. That doc maps **write-back** to official skills (`figma-use` before canvas writes, `figma-generate-design` for page push, etc.).

## Available Tools

| Tool | Purpose | Rate-Limited? |
|------|---------|---------------|
| `get_design_context` | Extract component specs, layout, tokens, structure | Yes |
| `get_screenshot` | Capture visual reference for validation | Yes |
| `get_metadata` | XML overview of node structure (IDs, names, positions) | Yes |
| `get_variable_defs` | Inspect design tokens/variables with semantic context | Yes |
| `search_design_system` | Search connected design systems for existing components | Yes |
| `get_code_connect_suggestions` | AI suggestions for component-to-code mapping | Yes |
| `create_design_system_rules` | Encode project conventions as machine-readable rules | No |
| `create_new_file` | Generate Figma designs from code/descriptions (canvas write-back) | No |
| `add_code_connect_map` | Create Figma-to-code component mappings | No |
| `whoami` | Verify authentication and plan tier | No |

## implement-design Workflow (7 Steps)

When implementing a design from a Figma link, follow all 7 steps:

1. **Extract node identifiers** — Parse the Figma URL for `fileKey` and `nodeId` (format: `node-id=1-2` → `nodeId: "1:2"`)
2. **Fetch design context** — `get_design_context(fileKey, nodeId)` → layout, typography, colors, component structure, spacing
3. **Capture screenshot** — `get_screenshot(fileKey, nodeId)` → visual reference for validation throughout
4. **Download assets** — Retrieve images, icons, SVGs from MCP assets endpoint. DO NOT install new icon packages — all assets come from Figma payload
5. **Translate to PLUS conventions** — Map Figma output to PLUS tokens, components, and patterns. Use the Cheat Sheet as law. See token mapping below
6. **Achieve visual parity** — Implement pixel-perfect matching. Use PLUS design tokens, not raw Figma values
7. **Validate against source** — Compare implementation against the captured screenshot. Check: layout, typography, colors, states, spacing, assets, accessibility

## Token Mapping (Figma → PLUS CSS)

| Figma | CSS Token |
|-------|-----------|
| `Primary/500` | `var(--color-primary)` |
| `Display 1` | `var(--font-size-display1)` |
| `Spacing/16` | `var(--size-spacing-between-components-3)` |
| Surface tokens | `var(--color-surface-*)` — prefer `-container` over `-state-08` for elevated surfaces |

For the full token reference, load `docs/context/design-system/components/cheat-sheet.md`.

## When to Use Which Tool

| Scenario | Primary Tool | Also Use |
|----------|-------------|----------|
| Implementing a Figma design | `get_design_context` | `get_screenshot`, `get_variable_defs` |
| Understanding file structure | `get_metadata` | — |
| Verifying token values | `get_variable_defs` | Compare against `design-system/src/tokens/*.scss` |
| Finding existing DS components | `search_design_system` | Also check `docs/context/design-system/components/components-index.json` |
| Encoding PLUS conventions | `create_design_system_rules` | Reference AGENTS.md forbidden patterns |
| Writing designs back to Figma | `create_new_file` | Requires explicit user approval |

## Canvas Write-Back (create_new_file)

Use `create_new_file` only when:
- A code-first feature needs a corresponding Figma spec
- The user explicitly requests generating a Figma design from code
- Always confirm with the user before writing to Figma (treat like forbidden pattern #8 — no unsanctioned writes)

## Code Connect (Future)

`@figma/code-connect` is NOT installed. When Code Connect tools return empty results, fall back to `docs/context/design-system/components/components-index.json` for component discovery. See plan-005 for the implementation roadmap.

## Known Limitations

### Cloud vs Desktop MCP
- **`get_screenshot`** and **`get_metadata`** work reliably from the cloud API with just `fileKey` + `nodeId`
- **`get_design_context`** and **`get_variable_defs`** require the **Figma desktop app** to have the file open. If these tools return "nothing selected", tell the user: *"Please open the Figma file in the desktop app and select the target node, then I'll retry."*
- Do NOT silently skip these tools or assume they are unavailable — always ask the user to open the file first, since they likely have it open already
- **Workaround**: If the user cannot open the desktop app, fall back to `get_screenshot` + `get_metadata` for structure, and repo-native token files for values
- **Rate limiting**: MCP tools are rate-limited. Batch operations (e.g., 67+ `search_design_system` calls for drift analysis) should use `get_metadata` for bulk inventory first, then targeted searches

### Code Connect
- `@figma/code-connect` is NOT installed. Code Connect tools (`get_code_connect_map`, `add_code_connect_map`, `send_code_connect_mappings`) will return empty results
- Fall back to `docs/context/design-system/components/components-index.json` for component discovery

## MCP Fallback

If Figma MCP is unavailable at runtime, state it explicitly and continue with:
- Repo-native stories/specs in `design-system/src/`
- Token files in `design-system/src/tokens/`
- Screenshots or exports provided by the user
