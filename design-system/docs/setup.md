<!-- Tier: 2 | ~500 tokens | Load for: repo setup, imports, playground scaffolding, build tooling -->
# PLUS Design System — Setup

Implementation requirements only. For design rules, load `guidelines.md`. For component/token lists, use `discovery.md`.

## Stack

- React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10
- SCSS with design tokens from `design-system/src/tokens/`

## Import Aliases

| Alias | Resolves to |
|-------|-------------|
| `@` | `design-system/src` (Storybook, DS Vite, playground configs) |
| `~` | `node_modules` |

**Barrel exports — always import from index:**

```js
import { Button, Alert, Modal } from '@/components';
import { Input, Select, Checkbox } from '@/forms';
import '@/styles/globals.scss';
```

**Entry points:**
- `design-system/src/index.js`
- `design-system/src/components/index.js`
- `design-system/src/forms/index.js`

**Prohibited:** deep imports like `design-system/src/components/Button/Button` — use barrel.

## Package Structure

```
design-system/
  src/           # DS source (components, forms, specs, tokens, styles, MDX)
  docs/          # Hand-authored DS knowledge (discovery, patterns, token-mapping)
  agent-views/   # Generated agent views — mirrors src/ layout (excludes storybook-docs, assets)
  figma/         # Registries + alignment runbooks
playground/{name}/     # Standalone prototypes
.storybook/            # Storybook config
scripts/               # Token sync, registry + agent-view generation
.agent/skills/         # Workflow skills (uno-prototype, uno-review, …)
```

## Playground Conventions

- Each prototype: `playground/{project-name}/` (flat, kebab-case)
- **Starter template:** copy `playground/starter/` — includes DS aliases, SCSS config, shared React resolution
- Update starter `package.json` name, `index.html` title, and pick an unused `server.port` (check `playground/*/vite.config.js`; range ~3000–3025)
- Each prototype has its own `vite.config.js` with `@` → `../../design-system/src`
- Register in `src/pages/PrototypeMarket/prototypes-data.js`
- Root dev script: `"dev:{project-name}": "vite --config playground/{project-name}/vite.config.js"`

**Starter includes:**

| File | Purpose |
|------|---------|
| `index.html` | Entry HTML with DS stylesheet |
| `src/App.jsx` | Root component with DS import examples |
| `src/main.jsx` | React 19 entry point |
| `vite.config.js` | `@` alias, SCSS loadPaths, ESM-safe `__dirname` |

**Minimal structure** (if not using starter):

```
playground/{project-name}/
├── index.html
├── src/App.jsx
├── src/main.jsx
├── vite.config.js
└── package.json
```

## Example Selection

When mirroring existing code: nearest `*.stories.jsx` → matching `specs/**` → `playground/**`. See `.agent/skills/uno-prototype/references/implementation.md` and `examples-index.json`.

## Bootstrap & Providers

- Use PLUS components (Bootstrap-based) — not raw Bootstrap markup for DS surfaces
- Load `globals.scss` or `main.scss` for token variables
- Prototype Vite configs must set `@` alias or imports fail

## Token Workflow

```
Figma → npm run sync:tokens → npm run generate:tokens → commit SCSS
```

- Never edit generated token files (`_colors.scss`, `_spacing_semantics.scss`, etc.) directly
- Token source is Figma; SCSS is generated output
- Figma mapping tables: `design-system/docs/foundations/token-mapping.md`
- Refresh agent views: `npm run generate:agent`

## Local Preview

```bash
npm run build
npm run preview:react -- --host 127.0.0.1 --port 8080 --strictPort
# Storybook: npm run storybook → http://127.0.0.1:6006
```

Full runbook: `.agent/skills/uno-prototype/references/local-preview.md`

## File Naming

- Components: PascalCase (`Button/Button.jsx`)
- Prototypes: kebab-case directories
- Docs/plans: `YYYY-MM-DD-NNN-type-slug-plan.md`

See `docs/context/conventions/coding.md` for full conventions.
