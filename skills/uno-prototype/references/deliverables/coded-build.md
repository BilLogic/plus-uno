---
embodiment: ide
summary: Hi-fi build on the design system — staged build, Template check-in, ds check as the exit gate
---

<!-- ~900 tokens | Load when: the confirmed route is a hi-fi build on the design system -->

# Deliverable — coded build (hi-fi, on the design system)

**Execution mode: UNO builds directly** in `prototypes/`, against
uno-storybook. Direction is settled; the work is execution on the system
(method §2) — DS compliance by construction, not by review catching it later.

## Plan first (Step 3)

Generate the prototype plan — **open by restating the confirmed brief card**
(goal · artifact · fidelity dials · won't include), then map the screen across
the five stages in `design-system/guidelines/overview.md`
(**Template → Blocks → Pieces → Polish → Motion**): the template shell and slots ·
blocks and governing patterns · components and any local components (method §4) ·
token roles · motion and prototype outputs.

## Build (Step 4)

a. **Ask for a Figma file first — one question, before any build:** *"Do you
   already have a Figma file you want to build upon?"*
   - **Yes** → get the link, then follow the full implement-design workflow in
     `design-system/guidelines/figma/mcp-guide.md` — no skipped steps; registries load
     first per `design-system/guidelines/figma/registry-load-gate.md` (MANDATORY);
     variables translate to tokens via `design-system/figma/token-registry.json`.
   - **No** → build from the confirmed plan on the design system directly.
b. Scaffold: `bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>`
   — writes the Vite app with a first page in the default template, names it, picks the next free port
   (details: `docs/engineering/setup.md`; config shape:
   `skills/uno-prototype/examples/vite-config-example.js`).
c. **Follow the staged build** (`design-system/guidelines/overview.md`).
   Look names up with `ds find` / `ds get` / `ds tokens` (or the MCP tools
   `ds_find`, `ds_get`, `ds_tokens`, `ds_guide`).
d. **One human check-in after the Template stage.** Once Stage 1 (Template) is
   in place — the outer shell (`Frame` with `Sidebar`, `Page`, `Modal`,
   `Panel`, `Popup`) and what fills each slot — pause for one check-in with the
   designer before building Blocks, Pieces, Polish and Motion. Headless runs
   continue through all five stages in one pass.
e. **Reuse ladder (method §4):** take the lowest rung that fits — use a template
   slot or component as is, arrange existing components in a slot, extract a
   local component under `prototypes/<slug>/src/components/`, or mark a core
   candidate and file a `uno-maintain` intake.
f. Playground or WIP pages in Figma → summon **writers/figma**
   (obeys `docs/connectors/figma/overview.md`).

`AGENTS.md` § Hard rules apply in full; `ds check` (`check:ds-usage`) is their
gate in code. Build only what the plan names — never add screens or
interactions just because the PRD lists more.

## Outside plus-uno

When the working directory is not plus-uno (no `design-system/` here), there is no `prototypes/`, no barrel and no `agent-views/`: build with the registry and the package instead (ADR-047).

- Lookup: the MCP `plus-ds` (`npx -y @plus-uno/cli mcp`) or `npx @plus-uno/cli find | get | tokens | guide`. Look names up with `ds find` / `ds get` / `ds tokens`.
- Install: `npx @plus-uno/cli add <item>` for each component, pattern, template or chart the plan names (`find` names the item). Load `plus-ds/styles/main.scss` once at the entry and paste `plus-ds/head.html` into the HTML head.
- Reuse ladder: follow `references/method.md` § 4 when `find` has no direct fit.
- Exit gate: `npx @plus-uno/cli check <paths>` replaces `check:ds-usage`; fix every fail-level finding.
- The Figma question and `AGENTS.md` hard rules (Font Awesome Free, tokens over literals) still apply; the scaffold script and Vite aliases are plus-uno only.

## Validate & exit (method §5)

Validation is the post-edit hook as you write, one re-read pointed at fit, and
one exit `ds check`, while honoring the brief-card contract (the artifact
serves the confirmed goal, sits at the confirmed fidelity dials, and contains
nothing from the won't-include list):

1. **Re-read for fit**: apply the closing *Before you finish* re-read of
   `design-system/agent-views/components/index.md` to verify template and
   pattern fit.
2. **Exit check**: the post-edit hook catches escapes as you edit; run one exit
   `npm run ds -- check prototypes/{project}` (`npm run check:ds-usage -- prototypes/{project}`)
   and fix what it reports. Each finding names its fix; the rules are
   `docs/engineering/ds-usage-rules.md`.

The rest of the check set — a runtime without Storybook MCP or a browser runs
the shape script and records the rest as unavailable, not as failures:

- `bash skills/uno-prototype/scripts/validate-prototype.sh prototypes/{project}`
  — the project's shape (App, export, config, name).
- Stories touched → Storybook MCP `test-run` (a11y included).
- Open the running preview: pages render, key interactions work, console
  clean — scripts can pass while the page is visibly broken; the browser is
  the check of record for UI.

**Exit:** summon **reviewers/ds-lens** for the conformance pass · write the
one-line artifact manifest: fidelity · tools · PRD link · `ds check`
(`check:ds-usage`) result (`clean`, or remaining escapes by rule) · any other
unresolved check failures · hand to `skills/uno-review` for the stage lens.
