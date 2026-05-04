---
name: uno-prototype
description: >
  Scaffold a new playground prototype with proper PLUS design system integration.
  Use when the user asks to "create a prototype", "scaffold a new project",
  "set up a playground", "start a new experiment", "build a proof-of-concept",
  needs a standalone prototype for user testing, or provides a Figma design URL
  to implement into the repo (playground or app code per scope).
user-invocable: true
argument-hint: [project-name]
---

# Scaffold Prototype

Create a new playground prototype project with proper DS integration.

## Skill ownership (boundary)

This skill owns **in-repo prototype work**: scoped confirmation → **playground** (or agreed paths) scaffold → runnable UI using the design system → optional **Prototype Market** registration steps in Phase 5. **Deep design-system compliance review** is **`uno-review`**. **Publishing / marketplace submission flow** is **`uno-post`**. **Product scoping without build** is **`uno-plan`**. Figma → code handoff steps live in `references/figma-mcp-guide.md`; optional Figma write-back after delivery is **`Closing — Figma write-back`** plus `references/figma-round-trip-workflow.md`.

## When to Use

- Designer wants to explore a new feature idea
- Need a standalone prototype for user testing
- Building a proof-of-concept for a product pillar

## Auto-Suggest

Proactively suggest this skill when:
- The user describes a new feature idea that doesn't have an existing prototype
- The user wants to explore or validate a concept visually
- A new `playground/` project needs to be set up from scratch

Do not suggest if the user is working on an existing prototype (use the appropriate mode instead).

## Prerequisites

- `docs/context/product/features.md` — understand which product pillar this relates to
- `docs/context/design-system/foundations/layout.md` — understand the atomic hierarchy
- `docs/context/design-system/components/cheat-sheet.md` — available components

## Phase 1: Scope

**Hard gate — no file changes until explicit confirmation:** Even if the prompt sounds complete, first send the user a **scope summary** using the **Scope summary (template)** below. Fill inferred values; label guesses as **Assumptions**. **Do not** run Phase 2, edit files, or invoke write-to-Figma tools until the user **explicitly confirms** the summary (or revises it). (Figma write-back is **not** decided here — see **Closing — Figma write-back** below.)

### Scope summary (template)

Post this block (with values) before any edits:

- **Feature / area:**
- **Product pillar:** (admin | home | toolkit | training | profile | login | universal)
- **Fidelity:** (low | mid | high)
- **`playground/{project-name}`** (or other agreed paths):
- **Relevant `design-system/src/specs/`** (if any):
- **Assumptions:** (explicit; use "none" if none)

1. Ask: What feature or area is this prototype for?
2. Ask: What product pillar? (admin, home, toolkit, training, profile, login, universal)
3. Ask: What fidelity? (low/mid/high)
4. Check: Does a relevant spec already exist in `design-system/src/specs/`? If so, use it as a starting point.
5. **Gate**: Confirm project name and scope (including the filled template above) before scaffolding.

## Phase 2: Scaffold

1. Create `playground/{project-name}/` directory
2. Copy the minimal starter structure:
   ```
   playground/{project-name}/
   ├── index.html
   ├── src/
   │   ├── App.jsx
   │   └── main.jsx
   ├── vite.config.js    (with @ alias → ../../design-system/src)
   └── package.json
   ```
3. Add dev script to root `package.json`: `"dev:{project-name}": "vite --config playground/{project-name}/vite.config.js"`
4. Ensure vite.config.js has proper SCSS loadPaths for tokens

## Phase 3: Build

1. Read `docs/context/design-system/components/cheat-sheet.md` (MANDATORY)
2. Read `docs/context/design-system/components/layout-cheat-sheet.md` if building a page
3. Use design system components — check `@/components/`, `@/forms/`, `@/specs/`
4. Apply tokens for all visual values
5. Use `<PageLayout>` from specs/Universal for page structure
6. If the user **explicitly** asks mid-session to write back to Figma: follow `references/figma-round-trip-workflow.md` (load official **`figma-use`** before canvas writes; user must supply the Figma link and confirm target). Do not write to Figma without that opt-in.

## Phase 4: Validate

- [ ] Imports resolve (`@` alias works)
- [ ] Token-driven styling (no hardcoded colors/spacing)
- [ ] Uses DS components (not raw Bootstrap)
- [ ] Dev server runs (`npm run dev:{project-name}`)

## Phase 5: Register

1. Add entry to `src/pages/PrototypeMarket/prototypes-data.js`
2. Or use `/uno:post` skill for guided submission

## Closing — Figma write-back (mandatory)

Applies after **every** turn of work under this skill that **creates or updates** a prototype in Cursor (new `playground/{project}/` scaffold, or any follow-up edit to that UI / related prototype code).

The **final message** for that delivery **must** include the following before ending:

1. Ask using the **Closing question (verbatim)** below.
2. If the user answers **yes**: ask them to **provide the Figma file link** (full `figma.com/design/...` URL; include `node-id` in the URL if they have a target frame/page). Then load `references/figma-round-trip-workflow.md` and follow its gates before any MCP write.
3. If **no** or **not now**: acknowledge and stop — do not write to Figma.

Do **not** skip this closing ask. It replaces any earlier Phase‑1-only round-trip question.

### Closing question (verbatim)

Use this exact wording (adapt only the language locale if the user session is non-English and they asked for another language):

> Do you want to push this UI back to Figma to refine it there? If yes, paste the Figma file URL (include `node-id` in the link if you have a target frame).

## Next Step

After completing the prototype:
→ Suggest `/uno:review` to check DS compliance before shipping. Pass the prototype's directory path as the argument.

The bullets above are **optional** for the human. They do **not** relax **Closing — Figma write-back**; only the **Next Step** suggestion may be skipped.
