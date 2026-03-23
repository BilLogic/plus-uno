---
title: "feat: npm package publishing strategy with Figma Make and Code Connect"
type: feat
status: active
date: 2026-03-21
related: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
---

# npm Package Publishing Strategy with Figma Make and Code Connect

## Overview

Evaluate whether and how to publish `@tutors.plus/design-system` as a consumable npm package, specifically considering Figma Make integration. This plan resolves the blocker in plan 004 about `guidelines/` being bundled in the npm `files` field.

**TL;DR**: Guidelines should NOT ship with the npm package. No major design system does this. The bridge to Figma is Code Connect (`.figma.tsx` files), not bundled markdown. Storybook is the documentation layer. This unblocks plan 004's docs consolidation.

## Problem Statement

The team is on the fence about npm publishing. Key uncertainties:
1. Is it worth publishing the package externally?
2. What does Figma Make actually need from us?
3. Should `guidelines/` stay in the npm package for consumers?
4. How does this affect the docs consolidation in plan 004?

## Research Findings

### What Every Major DS Does

| Design System | npm `files` | Bundled docs? | Documentation |
|--------------|-------------|---------------|---------------|
| Chakra UI | `["dist"]` only | No | Docs site + Storybook |
| Radix UI | `["dist"]` only | No | Docs site |
| Ant Design | `["dist", "es", "lib"]` | No | Docs site |
| shadcn/ui | Not an npm package | N/A | Docs site + CLI copies source |

**Nobody ships markdown docs in npm packages.** Consumers don't read files from `node_modules/`. Documentation belongs on Storybook (deployed) or a docs site.

### What Figma Make Actually Needs

Figma Make generates code from designs. It needs:
1. **A Figma Library** — your components in Figma (you already have this)
2. **Make Kits** (new, early access) — import your Figma Design Libraries into Make so generated code uses YOUR components, not generic HTML
3. **Code Connect** — `.figma.tsx` files that map Figma component nodes to code imports/props

**Figma Make does NOT need**:
- Markdown docs bundled in npm
- `guidelines/` directory
- Any files in `node_modules/`

### What Code Connect Is

Code Connect maps Figma components → code components. When a developer inspects a Figma component in Dev Mode, they see your actual code instead of generic CSS.

```tsx
// Button.figma.tsx (co-located with Button.jsx)
import figma from "@figma/code-connect"
import { Button } from "./Button"

figma.connect(Button, "https://figma.com/design/...?node-id=65:5", {
  props: {
    variant: figma.enum("Variant", { Primary: "primary", Neutral: "neutral" }),
    disabled: figma.boolean("Disabled"),
    children: figma.string("Label"),
  },
  example: (props) => <Button variant={props.variant}>{props.children}</Button>,
})
```

Key facts:
- Files live in source (co-located with components), NOT in dist/
- Published to Figma via `npx figma connect publish`, NOT via npm
- Requires `@figma/code-connect` package and a Figma access token
- Currently **zero Code Connect files exist** in the project

### Current Package State

| Field | Value | Issue |
|-------|-------|-------|
| `files` | `["dist", "guidelines"]` | guidelines shouldn't be here |
| `main` | `dist/index.js` | Good (CJS) |
| `module` | `dist/index.esm.js` | Good (ESM) |
| `types` | `dist/index.d.ts` | Good |
| `exports` | Proper conditional exports | Good |
| `sideEffects` | `["*.css", "*.scss"]` | Good |
| `peerDependencies` | bootstrap, react, react-bootstrap, react-dom | Good |
| `bundledDependencies` | highcharts, classnames, prop-types | Highcharts inflates size significantly |
| dist/ | Does not exist on disk | Build hasn't been run |
| Code Connect | None | Needs to be created if Figma integration desired |
| Stale tarball | pilot.11 committed, package is pilot.21 | Cleanup needed |

## Decision Framework: Is Publishing Worth It?

### When Publishing IS Worth It

| Scenario | Value |
|----------|-------|
| Multiple projects consume the DS | High — single source of truth for UI |
| Figma Make generates code with your components | High — Code Connect + Make Kits |
| External consumers (partners, contractors) use it | Medium — versioned, documented package |
| You want enforced versioning/changelogs | Medium — npm versioning is well-understood |

### When Publishing Is NOT Worth It

| Scenario | Value |
|----------|-------|
| Only one project (this one) uses the DS | Low — just import from source |
| No Figma Make/Code Connect setup | Low — no bridge to design tools |
| Team is small and co-located | Low — direct imports work fine |
| DS is still rapidly changing (pilot stage) | Low — publishing adds friction to iteration |

### Recommendation

**At v0.1.0-pilot.21, publishing externally is premature.** The DS is in pilot, changing rapidly, and consumed by one project. The overhead of publishing (versioning, changelogs, build pipeline, consumer support) isn't justified yet.

**What IS worth doing now:**
1. **Remove `guidelines` from `files`** — unblocks plan 004, reduces package size
2. **Set up Code Connect** for your most-used components — this is the Figma bridge that actually matters
3. **Deploy Storybook** as the documentation layer (already on Netlify)
4. **Defer formal npm publishing** until v0.2.0 or when a second consumer project exists

**What to do when ready to publish:**
1. Clean up `files: ["dist"]` only
2. Externalize Highcharts (move to `peerDependencies`) — currently bundled, inflates package by ~300KB+
3. Add proper `CHANGELOG.md`
4. Set up CI publishing (GitHub Actions → npm)
5. Create Code Connect files for top 10-15 components
6. Register Make Kit with Figma (when available beyond early access)

## Impact on Plan 004

This resolves the **blocker** in plan 004's review notes:

> `packages/plus-ds/guidelines/` removal — BLOCKER: `files` field includes `"guidelines"`

**Resolution: Option (a) — Remove `"guidelines"` from `files`.** Guidelines are dev docs, not runtime. Consumers use Storybook. Move all content to `docs/design-system/` per plan 004.

### Specific Changes to Plan 004

1. **Phase 2 step 8** now includes: edit `packages/plus-ds/package.json` to change `files: ["dist", "guidelines"]` → `files: ["dist"]`
2. **Phase 4 step 17** (remove `packages/plus-ds/guidelines/`) is now safe — no npm consumer impact
3. **Open question #3** is resolved — guidelines don't need to stay in the package

## Proposed Implementation (If/When Ready)

### Phase 1: Immediate Cleanup (Do Now — Part of Plan 004)

- [ ] Remove `"guidelines"` from `packages/plus-ds/package.json` `files` field
- [ ] Delete stale tarball `tutors.plus-design-system-0.1.0-pilot.11.tgz`
- [ ] Move guidelines/ content to `docs/design-system/` (already in plan 004)

### Phase 2: Code Connect Foundation (Do When Figma Integration Needed)

- [ ] Install `@figma/code-connect` as devDependency
- [ ] Create `figma.config.json` at package root
- [ ] Create `.figma.tsx` files for top 10 components (Button, Alert, Badge, Accordion, Breadcrumb, Modal, Card, Input, Select, Table)
- [ ] Add to `.gitignore`: nothing (Code Connect files should be tracked)
- [ ] Add to `packages/plus-ds/package.json` scripts: `"figma:publish": "npx figma connect publish"`
- [ ] Document Code Connect setup in `docs/design-system/guides/figma-workflow.md`

### Phase 3: Production Publishing (Do When Second Consumer Exists)

- [ ] Move `highcharts` and `highcharts-react-official` to `peerDependencies`
- [ ] Update `files: ["dist"]` (confirm no other cruft)
- [ ] Add `CHANGELOG.md` with keepachangelog format
- [ ] Set up GitHub Actions: build → test → publish on tag
- [ ] Add `.npmrc` with registry configuration
- [ ] Verify `npm pack --dry-run` output is clean
- [ ] Create `PUBLISHING.md` documenting the release process

### Phase 4: Figma Make Kit (Do When Make Kits Exit Early Access)

- [ ] Register Make Kit with Figma using your component library
- [ ] Test Make output uses `@tutors.plus/design-system` imports
- [ ] Document Make Kit usage in `docs/design-system/guides/figma-workflow.md`

## npm Package Best Practices Checklist

For when the team is ready to publish properly:

### Package Structure
- [ ] `files: ["dist"]` — only compiled output
- [ ] Dual format: ESM (`dist/index.esm.js`) + CJS (`dist/index.js`)
- [ ] TypeScript declarations: `dist/index.d.ts`
- [ ] CSS as separate import: `@tutors.plus/design-system/styles`
- [ ] `sideEffects: ["*.css"]` — enables tree-shaking
- [ ] Conditional `exports` map with types/import/require

### Dependencies
- [ ] Framework deps (`react`, `bootstrap`) as `peerDependencies`
- [ ] Large libs (`highcharts`) as `peerDependencies` — let consumers choose versions
- [ ] Only tiny utils (`classnames`) as bundled `dependencies`
- [ ] `prepublishOnly: "npm run build"` ensures fresh build

### Documentation Strategy
- [ ] `README.md` in package: installation, quick start, link to Storybook — NOT comprehensive docs
- [ ] Storybook (deployed on Netlify): interactive component playground, auto-generated prop docs
- [ ] `docs/design-system/` in repo: agent-facing + contributor-facing reference docs
- [ ] `CHANGELOG.md`: versioned change history for consumers

### Versioning
- [ ] Semantic versioning: breaking changes = major, new components = minor, fixes = patch
- [ ] Pre-release tags for pilot: `0.1.0-pilot.22`, `0.2.0-beta.1`
- [ ] Git tags matching npm versions: `v0.1.0-pilot.22`

### CI/CD
- [ ] Build + test on every PR
- [ ] Publish on git tag push (not on every merge)
- [ ] `npm pack --dry-run` in CI to catch unexpected file inclusions

## Acceptance Criteria

- [ ] `"guidelines"` removed from `packages/plus-ds/package.json` `files` field
- [ ] Stale tarball deleted
- [ ] Plan 004 blocker resolved
- [ ] Decision documented: defer formal publishing until v0.2.0 or second consumer
- [ ] Code Connect setup documented as future Phase 2 (not blocked on publishing decision)

## Sources & References

### Research
- Chakra UI, Radix, Ant Design npm package structures — all ship `dist/` only
- Figma Code Connect docs: https://developers.figma.com/docs/code-connect/quickstart-guide/
- Figma Make and Make Kits: https://www.figma.com/solutions/design-to-code/
- Schema 2025 recap: https://www.figma.com/blog/schema-2025-design-systems-recap/

### Internal
- `packages/plus-ds/package.json`: current package config
- `packages/plus-ds/vite.config.js`: build configuration
- `packages/plus-ds/README.md`: current consumer docs
- Plan 004: `docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md`
