---
embodiment: ide
summary: Aliases, package structure, prototype conventions, token workflow, local preview.
---

<!-- Tier: 2 | ~500 tokens | Load for: repo setup, imports, prototypes scaffolding, build tooling -->
# PLUS Design System — Setup

Implementation requirements only. For design rules, load `guidelines.md`. For component/token lists, use `discovery.md`.

## Stack

- React + React-Bootstrap on Bootstrap, built with Vite, documented in Storybook.
- SCSS with design tokens from `design-system/src/tokens/`.
- Versions live in `package.json` and nowhere else — read them there rather than from a doc that goes stale on the next bump.

## Import Aliases

| Alias | Resolves to |
|-------|-------------|
| `@` | `design-system/src` (Storybook, DS Vite, prototypes configs) |
| `~` | `node_modules` |

**Barrel exports — always import from index:**

```js
import { Button, Alert, Modal, Input, Select, Checkbox } from '@/components';
import '@/styles/main.scss';
```

**Entry points:**
- `design-system/src/index.js`
- `design-system/src/components/index.js` (form elements live in `design-system/src/components/forms-and-inputs/`, re-exported via this barrel)

**New files import from the barrel.** Existing deep imports inside
`design-system/src/specs/` are grandfathered — see `coding.md` § Imports for the
full rule and what the code actually does.

## Package Structure

```
design-system/
  src/           # DS source (components, forms, specs, tokens, styles, MDX)
  guidelines/    # Authored DS protocol (foundations, components, composition, figma)
  agent-views/   # Generated facts — component index, forms redirect, token list
  figma/         # Registries + alignment runbooks
prototypes/{name}/     # Standalone prototypes
.storybook/            # Storybook config
scripts/               # Token sync, registry + agent-view generation
skills/         # Workflow skills (uno-prototype, uno-review, …)
```

## Prototype conventions

- Experiments: `prototypes/{project-name}/` on a **feature branch** (flat, kebab-case)
- **Starter template:** scaffold with `bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>` — copies `prototypes/starter/` (DS aliases, SCSS config, shared React resolution) and sets the `index.html` title and an unused `server.port` (check `prototypes/*/vite.config.js`; range ~3000–3025)
- Each prototype has its own `vite.config.js` with `@` → `../../design-system/src`
- Register in **Notion Marketplace** with the Deploy Preview / standalone URL — do **not** add numeric SPA routes on `main`
- Optional local script: `"dev:{project-name}": "vite --config prototypes/{project-name}/vite.config.js"` (branch only)
- **Production on `main`:** live app (`/home`) + Full Demo Walkthrough (`/demo/demo.html`, id `1028`) via `prototypes/home-redesign/`

**Starter includes:**

| File | Purpose |
|------|---------|
| `index.html` | Entry HTML with DS stylesheet |
| `src/App.jsx` | Root component with DS import examples |
| `src/main.jsx` | React 19 entry point |
| `vite.config.js` | `@` alias, SCSS loadPaths, ESM-safe `__dirname` |

**Minimal structure** (if not using starter):

```
prototypes/{project-name}/
├── index.html
├── src/App.jsx
├── src/main.jsx
├── vite.config.js
```

## Example Selection

When mirroring existing code: nearest `*.stories.jsx` → matching `specs/**` → `prototypes/**`.

## Bootstrap & Providers

- Use PLUS components (Bootstrap-based) — not raw Bootstrap markup for DS surfaces
- Load `main.scss` for token variables
- Prototype Vite configs must set `@` alias or imports fail

## Token Workflow

```
Figma → npm run sync:tokens → npm run generate:tokens → commit SCSS
```

- Never edit generated token files (`_colors.scss`, `_spacing_semantics.scss`, etc.) directly
- Token source is Figma; SCSS is generated output
- Figma mapping tables: `design-system/guidelines/figma/token-mapping.md`
- Refresh agent views: `npm run generate:agent`

## Generated skill surfaces

`skills/<name>/SKILL.md` is canonical, and `skills/` is a discovery path for
nothing: Claude Code and Cursor read `.claude/skills/`, and Slack reads the app
manifest. `npm run generate:skill-surfaces` publishes all three from the
canonical frontmatter:

| Surface | Path | Serves |
|---|---|---|
| IDE stubs | `.claude/skills/<name>/SKILL.md` | `/uno-*` in the Claude Code and Cursor slash menus |
| Worker commands | `agents/uno-bot/src/generated/slack-commands.ts` | the Worker's `/slack/commands` route |
| Slack manifest | `agents/uno-bot/slack-app-manifest-commands.yaml` | pasted at api.slack.com |

Edit the canonical `SKILL.md` and regenerate; `npm run check:skill-surfaces`
fails the monthly sweep on drift.

## Local Preview

```bash
npm run build
npm run preview:react -- --host 127.0.0.1 --port 8080 --strictPort
# Storybook: npm run storybook → http://127.0.0.1:4200
```

## File Naming

- Components: PascalCase (`Button/Button.jsx`)
- Prototypes: kebab-case directories
- Docs/plans: `YYYY-MM-DD-NNN-type-slug-plan.md`

See `docs/engineering/coding.md` for full conventions.
