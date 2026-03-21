---
title: "refactor: Strip npm publishing infrastructure and simplify package structure"
type: refactor
status: active
date: 2026-03-21
related:
  - docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
  - docs/plans/2026-03-21-005-feat-npm-package-publishing-figma-make-strategy-plan.md
---

# Strip npm Publishing Infrastructure and Simplify Package Structure

## Overview

Now that npm publishing and Figma Code Connect are off the table (see plan 005), strip all publishing-related configuration from `packages/plus-ds/` while keeping the directory structure intact. The directory stays where it is — playground prototypes use relative path aliases to reach it, so moving it would break everything.

## Problem Statement

`packages/plus-ds/` is configured as a publishable npm package but will not be published. This creates:
1. **Misleading configuration** — `files`, `exports`, `prepublishOnly`, `bundledDependencies` suggest npm publishing
2. **Dead artifacts** — stale tarball (`0.1.0-pilot.11`) committed to repo
3. **Unnecessary complexity** — library mode Vite build, dual ESM/CJS output, type declarations via plugin
4. **Bloated dependencies** — Highcharts bundled as a `dependency` (packaging concern) instead of `peerDependency`
5. **`guidelines/` in `files`** — blocks plan 004's docs consolidation

## Proposed Solution: Strip, Don't Restructure

**Keep** `packages/plus-ds/` exactly where it is. **Strip** all npm publishing concerns.

### Why Not Move the Directory?

The project is a pseudo-monorepo with **no npm workspaces**. Every playground prototype resolves the design system via relative paths in its own `vite.config.js`:

```js
// playground/prototyping/bill/home-redesign/vite.config.js
resolve: {
  alias: {
    '@plus-ds': '../../../../../../packages/plus-ds/src'
  }
}
```

Moving `packages/plus-ds/` to `design-system/` or `src/` would break every playground's vite config. The cost of restructuring is high and the benefit is zero — the directory name is just a namespace.

### What to Strip

| Item | Current | After |
|------|---------|-------|
| `files` | `["dist", "guidelines"]` | Remove entirely |
| `exports` map | ESM/CJS/types conditional exports | Remove entirely |
| `main` | `dist/index.js` | Remove (or keep as `src/index.js` for clarity) |
| `module` | `dist/index.esm.js` | Remove |
| `types` | `dist/index.d.ts` | Remove |
| `style` | `dist/design-system.css` | Remove |
| `prepublishOnly` | `npm run build` | Remove |
| `bundledDependencies` | `["classnames", "highcharts", ...]` | Remove |
| `sideEffects` | `["*.css", "*.scss"]` | Keep (still useful for Vite tree-shaking) |
| `peerDependencies` | bootstrap, react, react-bootstrap | Keep (documents what consumers need) |
| Stale tarball | `tutors.plus-design-system-0.1.0-pilot.11.tgz` | Delete |
| `guidelines/` | 16 markdown files | Move to `docs/design-system/` (plan 004) |
| `vite.config.js` build section | Library mode with dual format | Simplify — keep only for Storybook build if needed |

### What to Keep

| Item | Why |
|------|-----|
| `packages/plus-ds/` directory location | Playground relative paths depend on it |
| `packages/plus-ds/src/` structure | Components, forms, DataViz, specs, tokens, styles — all fine |
| `packages/plus-ds/package.json` | Still useful for metadata, but stripped down |
| `packages/plus-ds/vite.config.js` | Still needed for Storybook build and SCSS processing |
| `@` alias in root vite.config | Already points to `packages/plus-ds/src` |
| `name: "@tutors.plus/design-system"` | Can keep for identity, or simplify to `plus-ds` |
| `peerDependencies` | Documents what the DS requires |
| `dependencies` | classnames, prop-types still needed at runtime |

## Implementation

### `packages/plus-ds/package.json` — Before vs After

**Before** (publishing-oriented):
```json
{
  "name": "@tutors.plus/design-system",
  "version": "0.1.0-pilot.21",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "style": "dist/design-system.css",
  "files": ["dist", "guidelines"],
  "sideEffects": ["*.css", "*.scss"],
  "exports": { ... },
  "bundledDependencies": ["classnames", "highcharts", ...],
  "peerDependencies": { ... },
  "scripts": {
    "build": "vite build",
    "prepublishOnly": "npm run build",
    "test": "vitest run"
  }
}
```

**After** (local-only):
```json
{
  "name": "plus-ds",
  "version": "0.1.0",
  "private": true,
  "sideEffects": ["*.css", "*.scss"],
  "peerDependencies": {
    "bootstrap": ">=5.3.0",
    "react": ">=18.0.0",
    "react-bootstrap": ">=2.10.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "classnames": "^2.5.1",
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "highcharts": "^11.4.8",
    "highcharts-react-official": "^3.2.3",
    "vite-plugin-dts": "^4.5.4"
  },
  "scripts": {
    "build": "vite build",
    "test": "vitest run"
  }
}
```

Key changes:
- `private: true` — explicitly not for npm
- Name simplified to `plus-ds` (no npm scope needed)
- Removed `main`, `module`, `types`, `style`, `files`, `exports`
- Removed `prepublishOnly` and `bundledDependencies`
- Moved `highcharts` to `devDependencies` (only needed for Storybook/dev, not bundled)
- Kept `build` script (still needed for Storybook static build)

### Vite Config Simplification

`packages/plus-ds/vite.config.js` — strip library mode if Storybook doesn't need `dist/`:

**Check**: Does Storybook read from `src/` directly or from `dist/`?
- If Storybook reads from `src/` (via `@` alias) → remove library build entirely
- If Storybook needs compiled output → keep build but simplify (single format, no source maps)

Based on `.storybook/main.js` story globs pointing to `packages/plus-ds/src/**/*.stories.jsx`, **Storybook reads from source directly**. The library build is only for npm consumers. It can be removed or kept as a dormant capability.

**Recommendation**: Keep `build` script but add a comment that it's dormant until publishing is needed. This preserves optionality without creating confusion.

### File Deletions

| File | Action |
|------|--------|
| `packages/plus-ds/tutors.plus-design-system-0.1.0-pilot.11.tgz` | Delete — stale artifact |
| `packages/plus-ds/dist/` | Delete if exists — build output not needed |
| `packages/plus-ds/guidelines/` | Moved to `docs/design-system/` (plan 004 handles this) |

### Import Pattern Changes

**No import changes needed.** The `@` alias and relative paths in playground configs resolve to `packages/plus-ds/src/` regardless of package.json configuration. Imports like:

```jsx
import { Button } from '@tutors.plus/design-system'  // ← this may need alias update
import Alert from '@/components/Alert'                 // ← this works unchanged
```

**One potential issue**: If any playground imports use the npm package name `@tutors.plus/design-system` and resolve it through node_modules (from the tarball), those imports will break when the tarball is deleted.

**Migration**: Grep for `@tutors.plus/design-system` imports and ensure they all resolve through vite aliases, not node_modules.

## Migration Steps

1. Grep entire project for `@tutors.plus/design-system` imports — verify all resolve via alias
2. Update `packages/plus-ds/package.json` (strip publishing config, add `private: true`)
3. Delete stale tarball
4. Delete `dist/` if it exists on disk
5. Add comment to `vite.config.js` build section noting it's dormant
6. Verify Storybook still works: `npm run storybook`
7. Verify playground prototypes still work: `npm run dev:home-redesign`
8. `guidelines/` removal handled by plan 004

## Impact on Plan 004

Plan 004 Phase 4 step 17 (remove `packages/plus-ds/guidelines/`) is now fully unblocked:
- `"guidelines"` removed from `files` field
- `private: true` means no npm consumers to worry about
- Content moves to `docs/design-system/` cleanly

Plan 004 should also update its target architecture tree to note `packages/plus-ds/` stays but is simplified.

## Acceptance Criteria

- [ ] `packages/plus-ds/package.json` has `private: true` and no publishing fields
- [ ] Stale tarball deleted
- [ ] `dist/` directory deleted (if exists)
- [ ] No imports resolve through node_modules to the old tarball
- [ ] `npm run storybook` works
- [ ] `npm run dev:home-redesign` works
- [ ] `npm run dev:monthly-report` works
- [ ] All `@tutors.plus/design-system` or `@plus-ds` imports resolve via vite alias

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Playground imports break after tarball deletion | Grep first, fix alias resolution before deleting |
| Storybook needs `dist/` | Verify Storybook reads from src/ via alias (it does) |
| Future npm publishing becomes needed | `private: true` is easy to revert; build script preserved |
| Highcharts import breaks as devDependency | Test in dev — Storybook/dev server resolves devDeps fine |

## Sources

- Plan 005: `docs/plans/2026-03-21-005-feat-npm-package-publishing-figma-make-strategy-plan.md` — decision to defer npm publishing
- Plan 004: `docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md` — docs consolidation (blocked on guidelines/)
- `packages/plus-ds/package.json`: current publishing config
- `packages/plus-ds/vite.config.js`: library mode build config
- Root `vite.config.js`: alias resolution
- Playground vite configs: relative path resolution to packages/plus-ds/src
