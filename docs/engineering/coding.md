---
embodiment: ide
summary: How to write code in this repo — barrel imports, tokens over literals, styling conventions, and what not to reach for.
---

# Coding Conventions

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-07-07 · applied by every agent writing code in this repo. -->

## File naming

- **Components**: PascalCase directories and files (e.g., `Button/Button.jsx`, `Alert/Alert.scss`)
- **Stories**: Co-located with component (e.g., `Button.stories.jsx`)
- **Prototypes**: kebab-case directories (e.g., `onboarding-flow`)
- **Docs**: kebab-case with a date prefix for plans (e.g., `2026-04-11-001-refactor-three-tier-context-architecture-plan.md`)
- **Prompt-specs**: same folder, same date prefix, `-spec` suffix (`docs/plans/YYYY-MM-DD-NNN-<slug>-<deliverable>-spec.md`). `uno-prototype`'s spec-handoff deliverables — text handed to an external design tool, not code, so nothing builds them.

## Folder shape

Every component is one folder, under a group, with this shape (not every file is
required — a component with no tests or no docs page just has fewer of them):

```
<group>/Name/Name.jsx|.scss|.stories.jsx|.test.jsx|.mdx|index.js
```

`index.js` is the component's own curated public surface (its default export,
and any named export it chooses to carry alongside it); `design-system/src/components/index.js`
is generated from the folder tree by `npm run generate:component-barrel`
(`npm run check:component-barrel` in CI) — a source for regeneration, same as
the generated token files. Every component folder in
every group is re-exported one hop from its own folder, even in a group that
also owns its own `index.js` (today, only `forms-and-inputs`, kept for the
handful of callers that import it directly): a chained re-export through that
second file is a hop this generator does not take. `_internal/` sits outside
the scan entirely, so the public barrel only ever surfaces a component that
lives in a group folder. A flat file still converging toward this shape
stays that way until its own family PR touches it, rather than as a side
effect of a neighboring line (#1702); a bare PascalCase `Name.jsx` sitting
directly in a group (`Fieldset` in `forms-and-inputs` today) is read exactly
like a folder's `index.js` would be, so the generator does not drop a real
component on its way to this shape.

## Imports

**Alias resolution:**
- `@` maps to `design-system/src` (in Storybook, DS Vite config, and prototypes configs)
- `~` maps to `node_modules`

**Barrel exports — the rule for every new file:**

```js
import { Button, Alert, Modal } from '@/components';
import { Input, Select, Checkbox } from '@/components'; // forms-and-inputs re-exports through the components barrel
import '@/styles/globals.scss';
```

**Explicit entry points:**
- `design-system/src/index.js`
- `design-system/src/components/index.js`
- `design-system/src/components/forms-and-inputs/index.js` (also re-exported from the components barrel)

**Out of new files:** file-level and category-folder paths
(`@/components/forms-and-inputs/Button/Button`), `_internal/` paths, and the `@plus-ds`
alias.

One case is not a violation: a component importing its own siblings inside
`design-system/src/components/`.

## Slot names

A component names a before or after slot by what the slot accepts, so the right prop is predictable:

| Name | Accepts | Used by |
|---|---|---|
| `iconBefore` / `iconAfter` | an icon only | Button, Link button, Status tag, Date tag, Change tag, Sidebar tab |
| `elemBefore` / `elemAfter` | any element: an avatar, a count, a tag | Tag, Smart tag, menu items, Sidebar tab end slot, Table cells, the field box, listbox and option row |
| `icon` | the single icon of a component built around one | Icon button, Banner, Section message, Empty state, Tile, Modal, Rating |
| `trailingMetric` | the count after a label | Tag, Status tag, Filter button |

`leadingVisual`, `trailingVisual` and a bare `leading` slot are retired; `npm run check:slot-names` fails on them.

## Token usage

Use design tokens everywhere — never hardcode colors, spacing, typography, or elevation.

| Category | Correct | Incorrect |
|----------|---------|-----------|
| Color | `var(--ds-background-brand-bold)`, `var(--ds-text)` | `#3B82F6`, `rgba(0,0,0,0.1)` |
| Spacing | `var(--card-pad-default)`, `var(--section-stack-lg)` | `16px`, `24px` |
| Typography | `font: var(--body-default)`, `var(--type-family-heading)` | `14px`, `'Inter'` |
| Elevation | `var(--ds-shadow-raised)` | `0 2px 4px rgba(0,0,0,0.1)` |

**Real token examples:**

- Spacing: `--pad-x-lg`, `--card-pad-default`, `--section-stack-lg`, `--modal-radius`, `--page-pad-x-default`
- Color: `--ds-background-brand-bold`, `--ds-text-inverse`, `--ds-surface`, `--ds-surface-sunken`, `--ds-text-danger`
- Typography: `--heading-large`, `--body-default`, `--type-family-heading`, `--type-weight-medium`, `--font-size-0875`
- Elevation: `--ds-shadow-raised`, `--ds-shadow-overlay`
- Breakpoints: `@media (min-width: 1024px)` and `@media (min-width: 1440px)`, where the token ladder switches modes (a media query takes the number itself)

## Playground

- Each prototype lives at `prototypes/{project-name}/` (flat, no creator grouping)
- Each has its own `vite.config.js` with `@` alias pointing to `../../design-system/src`
- Creator info is metadata in the prototype's README or marketplace data, not the directory name
- New prototypes register in the Notion marketplace DB (`skills/uno-publish/references/marketplace.md`)

## Token workflow

```
Figma export (manual) → npm run generate:tokens → commit SCSS; the token ladder and motion (ADR-038) generate code → Figma instead, via npm run generate:design-tokens
```

- Edit the token source and regenerate: every token file is generated output except `_fonts.scss`, the hand-authored fallback faces and base heading and body type
- Token source is Figma, not the SCSS files — for every family except the
  `--ds-*` color set below

```
scripts/lib/color/plans/plan-*.json → npm run generate:color-tokens → design-system/src/tokens/color/ → Figma (figma-spec.json)
```

- The color set (`--ds-*`, `--palette-*`) runs the other way: the plan files
  are the source, and Figma is downstream, pushed from the generated
  `figma-spec.json` (ADR-035)

## Git

- **Commit prefixes**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`
- **Imperative mood**: "Add button component" not "Added button component"
- **Branch naming**: `feat/description`, `fix/description`, `refactor/description`

## Docs pipeline

```
docs/plans/ → implementation → a rule, an ADR, or nothing
```

- **Plans**: `YYYY-MM-DD-NNN-type-slug-plan.md` — actionable implementation plans
- **What a finished piece of work leaves behind** is one of three things, and `docs/knowledge/INDEX.md` § The disposition rule is the contract: a **rule** in the doc that already owns the subject (this file, `setup.md`, a `docs/connectors/*.md`, a design-system guideline), an **ADR** under `docs/adr/` when the call is hard to reverse, or **nothing** — git keeps the trail and most findings are worth less than the context they cost. A note staged under `docs/knowledge/` carries its `disposition:` in frontmatter from the moment it is written; `npm run check:knowledge-disposition` fails the build otherwise.

## Renames

A rename is finished when `npm run check:docs` passes, not when
the first file is updated. Grep the old literal across `src/`, `*.json`,
`AGENTS.md` and `docs/` in the same change, and count the surfaces before you
start: the 2026-07 sweep found one renamed tool still named in the live system
prompt, a constant whose old value survived in three doc surfaces, and a path
rename that reached `AGENTS.md` and stopped there.

## Known gotchas

| Gotcha | What Happens | Fix |
|--------|-------------|-----|
| Prototype vite configs need own aliases | `@` doesn't resolve in prototypes without config | Add `@: path.resolve(...)` to each prototype's vite.config.js |
| Token generation must follow sync | Generated files overwrite manual edits | Always run sync first, then generate |
| `design-system/src/index.js` is the barrel | New components not exported = import fails | Add to barrel export when creating new components |
| Storybook uses autodocs | Missing JSDoc = empty docs page | Add JSDoc to component exports |
| Raw HTML in marketplace pages | Breaks DS consistency | Use DS components: Button, Input, Badge, Card, Select |
| Nested Router providers | `MemoryRouter` inside `BrowserRouter` renders an empty root in React 19, with a silent console | One Router provider per tree — a shell mounted under another app takes its route from props |
| A shell mounted under `<Route path="/x/*">` | Descendant `<Routes>` sees only the remainder after the prefix, so every path collapses to `/` and the index route always wins | Declare the named shell paths (`/monthly-reports/*`, `/admin/*`) above `/:prototypeId/*` — v6 ranks static segments first — and pass the shell a `contentKey` prop so it knows what to render at `index` |
| `Failed to import test file` naming a setup file, with a `SyntaxError` that is not a real syntax error | A dependency discovered mid-run forced a Vite re-optimize and the page reloaded through the setup import. Look for `Vite unexpectedly reloaded a test` in the same run | Add the dependency to `optimizeDeps.include` on the `storybook` test project in `vite.config.js` — that is the one field the browser server reads. `design-system/tests/storybook-vitest-project.test.js` holds the assertions |
