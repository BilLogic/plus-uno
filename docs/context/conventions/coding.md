<!-- Tier: 2 -->

# Coding Conventions

## File Naming

- **Components**: PascalCase directories and files (e.g., `Button/Button.jsx`, `Alert/Alert.scss`)
- **Stories**: Co-located with component (e.g., `Button.stories.jsx`)
- **Prototypes**: kebab-case directories (e.g., `playground/home-redesign/`)
- **Docs**: kebab-case with date prefix for plans/ideation (e.g., `2026-03-21-007-refactor-optimal-repo-structure-plan.md`)

## Imports

**Alias resolution:**
- `@` maps to `design-system/src` (in Storybook, DS Vite config, and playground configs)
- `~` maps to `node_modules`

**Barrel exports — always import from index, never deep paths:**

```js
import { Button, Alert, Modal } from '@/components';
import { Input, Select, Checkbox } from '@/forms';
import '@/styles/globals.scss';
```

**Explicit entry points:**
- `design-system/src/index.js`
- `design-system/src/components/index.js`
- `design-system/src/forms/index.js`

**Prohibited:**
- Deep imports: `import Button from 'design-system/src/components/Button/Button'` — use barrel
- Ad hoc legacy paths — prefer existing index exports over deep relative traversals

## Token Usage

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

- Each prototype lives at `playground/{project-name}/` (flat, no creator grouping)
- Each has its own `vite.config.js` with `@` alias pointing to `../../design-system/src`
- Creator info is metadata in the prototype's README or marketplace data, not the directory name
- Register new prototypes in `src/pages/PrototypeMarket/prototypes-data.js`

## Token Workflow

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

## Docs Pipeline

```
docs/knowledge/ideations.md → docs/plans/ → implementation → docs/knowledge/lessons/
```

- **Ideation**: `YYYY-MM-DD-topic-ideation.md` — exploratory docs with ranked ideas
- **Plans**: `YYYY-MM-DD-NNN-type-slug-plan.md` — actionable implementation plans
- **Lessons**: `docs/knowledge/lessons/{domain}.md` — compound loop learnings (atomic entries with YAML frontmatter)

## Known Gotchas

| Gotcha | What Happens | Fix |
|--------|-------------|-----|
| Prototype vite configs need own aliases | `@` doesn't resolve in playground without config | Add `@: path.resolve(...)` to each prototype's vite.config.js |
| Token generation must follow sync | Generated files overwrite manual edits | Always run sync first, then generate |
| `design-system/src/index.js` is the barrel | New components not exported = import fails | Add to barrel export when creating new components |
| Storybook uses autodocs | Missing JSDoc = empty docs page | Add JSDoc to component exports |
| Raw HTML in marketplace pages | Breaks DS consistency | Use DS components: Button, Input, Badge, Card, Select |
