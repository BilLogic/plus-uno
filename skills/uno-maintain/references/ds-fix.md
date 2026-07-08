<!-- Load for: drafting the fix (method.md §2) when the intake targets "Storybook inconsistent / bug" or "Figma components out of date". IDE face only — the Worker files and proposes, never edits repo files (bot.md). DS components are always Tier 2: this runbook produces the draft; the gates in method §3–5 still apply. -->

# DS fix — execution runbook

How to draft a design-system fix once the intake routes there. Harness maintenance only — building or reworking design work routes back through `uno-prototype` (SKILL.md constraint).

## Before drafting

- **Check the registry first:** `docs/conventions/automations.md` — token drift and component sync are owned by standing automations (Figma library poll, daily token sync). If an automation owns the surface, the fix may be "let it run" or "fix the automation," not a manual edit.
- **Evidence over impression:** work from the intake's evidence link. Heavy codebase reads → summon `researchers/explorer`; did-it-happen / how-often evidence → `researchers/source-miner`. Don't dump files into your own context.
- **Cross-estate disagreement** (code vs Figma): DS precedence decides the losing side — **uno-storybook > BS4 Foundation library > Figma spec pages** (AGENTS.md). Flag the intake as cross-estate per method §1; never improvise a routing convention.

## Who executes what

| Surface | Executor |
|---|---|
| `design-system/src/**` (components, tokens source, stories, SCSS, barrels) | this skill — edit directly in a branch (SKILL.md step 2) |
| Figma workspace (frames, pages, annotations) | summon `writers/figma` — never write the workspace yourself |
| Requirement / story implicated by the fix | summon `writers/blueprint` — paired PRD + blueprint, never one alone |
| Notion doc implicated | summon `writers/notion` |

## Workflow A — token sync & regeneration

1. Confirm `.env` Figma values (`FIGMA_FILE_KEY`, `FIGMA_ACCESS_TOKEN`).
2. `npm run sync:tokens` (pull from Figma) → `npm run generate:tokens`.
3. Inspect the diff in `design-system/src/tokens/*.scss` — never hand-edit generated token files (forbidden pattern).
4. Run Storybook; inspect token-dependent stories.
5. Naming/values changed → update the token docs in the same branch.

## Workflow B — component API update

1. Read the component source, its co-located `*.stories.jsx`, and SCSS before changing anything.
2. Update the API and usage; follow existing prop-naming conventions (`style`, `fill`, size props).
3. Update the co-located stories (controls + examples) in the same change.
4. Update exports (`design-system/src/components/index.js` or `forms/index.js`) if the surface changed.
5. Validate stories and any affected specs in Storybook.

## Workflow C — Figma ↔ DS reconcile

1. Diff the built reality against the intake's evidence (frame link, screenshot).
2. Decide the losing side by DS precedence (above).
3. Repo side stale → Workflow A/B in a branch. Figma side stale → summon `writers/figma`. Requirements moved → `writers/blueprint`.
4. Verify states, responsiveness, and that docs still match after the fix.

## The draft package

The drafted fix is what the spotter judges (method §3). Summarize it concretely — this detail backs the three-line impact / effort / risk brief:

```text
Current state:   {what is wrong, with the evidence link}
Proposed change: {the concrete edit}
Files to modify: {paths}
```

## Script inventory (operational)

| Script | Entrypoint | When |
|---|---|---|
| `scripts/sync-figma-tokens.js` | `npm run sync:tokens` | pull token variables from Figma |
| `scripts/generate-all-tokens.js` | `npm run generate:tokens` | regenerate SCSS from token source |
| `scripts/storybook-networkinterfaces-fix.cjs` | auto via `npm run storybook` | Storybook startup stability |
| `scripts/poll-figma-library.js` | `npm run figma:poll` | CI-owned — see automations registry |
| `scripts/fetch-figma-component.js` | `npm run figma:fetch-component` | CI design-context fetch |
| `scripts/figma-write-back.js` / `publish-code-connect.js` | `npm run figma:write-back` / `figma:publish-code-connect` | post-merge Figma annotations / Code Connect |

Investigative one-offs (`inspect_nodes.js`, `debug_token_values.js`, `compare_*_tokens.js`, `fix_*`, `refactor_*`) may carry stale paths — read the source before running, prefer `package.json` scripts, and run on a clean branch so the diff is legible.

## Verify

Storybook renders the touched stories, story paths still resolve under `.storybook/main.js`, `npm run test` passes. Then the draft enters the gate (method §3) and, on yes, the Tier-2 pipeline (§5) — DS components always need the PR + PRD pair and two approvals.
