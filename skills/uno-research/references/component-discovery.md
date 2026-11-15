---
embodiment: ide
summary: How to find out whether a component already exists before proposing a new one.
---

<!-- Load for: finding existing components before building new ones, design-to-code mapping -->

# Component Discovery Process

1. **Query the design-system lookup first (`docs/connectors/ds-mcp.md`):**
   - Run `ds_find` (`npm run ds -- find "<query>"`) and `ds_get` (`npm run ds -- get <Name>`) — or read `design-system/agent-views/components/index.md` — before proposing a custom component (`AGENTS.md` § Hard rules 1–2).
   - For screen layout and stage order, start from `design-system/guidelines/overview.md` (`ds_guide`).

2. **Figma design-to-code mapping:**
   - When a Figma link or audit is involved, load `design-system/figma/component-registry.json` and `design-system/figma/token-registry.json` first (`../../../design-system/guidelines/figma/registry-load-gate.md`), then cross-check with `ds_find` / `ds_get`.

3. **Source hierarchy (when inspecting implementation):**
   - Templates: `design-system/src/patterns/*`
   - Components (re-exported via `@/components`): `design-system/src/components/*` and `design-system/src/dataviz/*`
   - Tokens: `design-system/src/tokens/*` (`ds_tokens` / `npm run ds -- tokens`)

4. **Decide when to ask vs proceed:**
   - Ask when design intent is ambiguous, target context level is unclear, or multiple component families fit equally.
   - Proceed when a direct template, pattern, or component match exists (`docs/engineering/local-components.md`).
