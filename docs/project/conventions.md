# Conventions

## File Naming

- **Components**: PascalCase directories and files (e.g., `Button/Button.jsx`, `Alert/Alert.scss`)
- **Stories**: Co-located with component (e.g., `Button.stories.jsx`)
- **Prototypes**: kebab-case directories (e.g., `playground/home-redesign/`)
- **Docs**: kebab-case with date prefix for plans/ideation (e.g., `2026-03-21-007-refactor-optimal-repo-structure-plan.md`)

## Import Patterns

```js
// Internal (design system source) — use @ alias
import Alert from '@/components/Alert';
import { Button } from '@/components/Button';
import '@/styles/globals.scss';

// Alias resolution
// @  → design-system/src
// @plus-ds → design-system/src (alias)
// ~  → node_modules

// Barrel exports — always import from index, not deep paths
import { Button, Alert, Modal } from '@/components';
import { Input, Select, Checkbox } from '@/forms';

// Never deep-import like this:
// import Button from 'design-system/src/components/Button/Button'; ❌
```

## Playground Prototypes

- Each prototype lives at `playground/{project-name}/` (flat, no creator grouping)
- Each has its own `vite.config.js` with `@` alias pointing to `../../design-system/src`
- Creator info is metadata in the prototype's README or marketplace data, not the directory name
- Register new prototypes in `src/pages/PrototypeMarket/prototypes-data.js`

## Git Conventions

- **Commit prefixes**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`, `test:`
- **Imperative mood**: "Add button component" not "Added button component"
- **Branch naming**: `feat/description`, `fix/description`, `refactor/description`

## Docs Pipeline

```
docs/ideation/ → docs/plans/ → implementation → docs/solutions/
```

- **Ideation**: `YYYY-MM-DD-topic-ideation.md` — exploratory docs with ranked ideas
- **Plans**: `YYYY-MM-DD-NNN-type-slug-plan.md` — actionable implementation plans
- **Solutions**: `docs/solutions/{category}/description.md` — compound loop learnings

## Token Workflow

```
Figma → npm run sync:tokens → npm run generate:tokens → commit SCSS
```

- Never edit generated token files (`_colors.scss`, `_spacing.scss`, etc.) directly
- Always run `generate:tokens` after `sync:tokens`
- Token source is Figma, not the SCSS files

## Known Gotchas

| Gotcha | What Happens | Fix |
|--------|-------------|-----|
| Prototype vite configs need own aliases | `@` doesn't resolve in playground without config | Add `@: path.resolve(...)` to each prototype's vite.config.js |
| Token generation must follow sync | Generated files overwrite manual edits | Always run sync first, then generate |
| `design-system/src/index.js` is the barrel | New components not exported = import fails | Add to barrel export when creating new components |
| Storybook uses autodocs | Missing JSDoc = empty docs page | Add JSDoc to component exports |
