---
embodiment: ide
summary: How to write code in this repo — barrel imports, tokens over literals, styling conventions, and what not to reach for.
---

# Coding Conventions

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-07-07 · applied by every agent writing code in this repo. -->

## File naming

- **Components**: PascalCase directories and files (e.g., `Button/Button.jsx`, `Alert/Alert.scss`)
- **Stories**: Co-located with component (e.g., `Button.stories.jsx`)
- **Prototypes**: kebab-case directories (e.g., `prototypes/home-redesign/`)
- **Docs**: kebab-case with a date prefix for plans (e.g., `2026-03-21-007-refactor-optimal-repo-structure-plan.md`)
- **Prompt-specs**: same folder, same date prefix, `-spec` suffix (e.g., `docs/plans/2026-08-02-001-fill-in-coverage-flow-map-spec.md`). `uno-prototype`'s spec-handoff deliverables — text handed to an external design tool, not code, so nothing builds them.

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
(`@/components/actions/Button/Button`), `_internal/` paths, and the `@plus-ds`
alias.

**What the code actually does**, so the rule is read for what it is rather than
as a description: about 400 deep imports live inside `design-system/src/specs/`
and roughly 70 call sites use the barrel. The spec-side deep imports predate the
rule and are **grandfathered** — they are not a licence to copy the pattern into
a new file, and sweeping them is its own piece of work, not a side effect of
touching a neighbouring line. Two cases are not violations at all: a component
importing its own siblings inside `design-system/src/components/`, and a spec
shell imported from its area group index (`@/specs/Universal/Pages`).

## Token usage

Use design tokens everywhere — never hardcode colors, spacing, typography, or elevation.

| Category | Correct | Incorrect |
|----------|---------|-----------|
| Color | `var(--color-primary)`, `var(--color-on-surface)` | `#3B82F6`, `rgba(0,0,0,0.1)` |
| Spacing | `var(--size-card-pad-x-md)`, `var(--size-section-gap-lg)` | `16px`, `24px` |
| Typography | `var(--font-size-body1)`, `var(--font-family-header)` | `14px`, `'Inter'` |
| Elevation | `var(--elevation-light-2)` | `0 2px 4px rgba(0,0,0,0.1)` |

**Real token examples:**

- Spacing: `--size-element-pad-x-lg`, `--size-card-pad-x-md`, `--size-section-gap-lg`, `--size-modal-radius-lg`, `--size-surface-pad-x`
- Color: `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-surface-container`, `--color-danger`, `--color-primary-state-08`
- Typography: `--font-family-header`, `--font-family-body`, `--font-size-h1`, `--font-weight-semibold-1`, `--font-line-height-body2`
- Elevation: `--elevation-light-1` through `--elevation-light-5`
- Breakpoints: `--breakpoint-md-min`, `--breakpoint-lg-min`, `--breakpoint-xl-min`

## Playground

- Each prototype lives at `prototypes/{project-name}/` (flat, no creator grouping)
- Each has its own `vite.config.js` with `@` alias pointing to `../../design-system/src`
- Creator info is metadata in the prototype's README or marketplace data, not the directory name
- `src/pages/PrototypeMarket/prototypes-data.js` is a LEGACY routing registry for the live-app shell — do not add new experiment IDs for `main` (`skills/uno-publish/references/marketplace.md`); new prototypes register in the Notion marketplace DB

## Token workflow

```
Figma → npm run sync:tokens → npm run generate:tokens → commit SCSS
```

- Never edit generated token files (`_colors.scss`, `_spacing.scss`, etc.) directly
- Always run `generate:tokens` after `sync:tokens`
- Token source is Figma, not the SCSS files

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

A rename is finished when `bash scripts/validate-doc-links.sh` passes, not when
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
| `Failed to import test file` naming a setup file, with a `SyntaxError` that is not a real syntax error | A dependency discovered mid-run forced a Vite re-optimise and the page reloaded through the setup import. Look for `Vite unexpectedly reloaded a test` in the same run | Add the dependency to `optimizeDeps.include` on the `storybook` test project in `vite.config.js` — that is the one field the browser server reads. `design-system/tests/storybook-vitest-project.test.js` holds the assertions |
