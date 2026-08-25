---
embodiment: ide
summary: The documentation IA contract — the shared tree Storybook titles, repo folders and Figma all speak, plus the MDX page shell.
---

<!-- Tier: 2 -->

# Documentation IA contract (2026-07)

One tree, spoken identically by Storybook titles, repo folders, and both Figma
files. Full rationale: `docs/plans/2026-07-12-001-feat-ds-docs-ia-upgrade-plan.md`.

`storybook.taxonomy.json` is the single source of truth for the Storybook
sidebar. After editing it, run `node scripts/sync-storybook-sort.mjs` — the sort
literal in `.storybook/preview.jsx` is generated from it, so edit the taxonomy
and regenerate rather than touching the literal.

## The tree

- **Top level:** Getting started · Foundations (was Styles + Assets; source still lives in `design-system/src/styles/` + `design-system/src/assets/`) · Components · Data visualizations · Patterns · Specs · Deprecated.
- **Components groups** (kebab-case folders under `design-system/src/components/`): `actions`, `forms-and-inputs`, `layout-and-structure`, `messaging`, `navigation`, `overlays`, `status-and-loading`. Undocumented internal composites live in `_internal/` until they graduate.
- **Data viz** lives in `design-system/src/dataviz/<purpose>/` — comparison, correlation, distribution, flow-and-relationships, part-to-whole, temporal.
- **Specs grammar:** `Specs/<Area>/(<Phase>/)<Type>/<Component>`, with Type order Overview → Elements → Cards → Tables → Modals → Sections → Pages. Title Case phases and types, PascalCase component folders, no spaces in folder names. Every area (and Admin sub-area) leads with an `Overview.mdx` featuring its flagship page.
- **Naming:** sentence-case display names in titles ("Button group"); PascalCase code exports. A spec composes core components; a local organism reached from 2+ areas gets promoted into `components/` instead of being re-implemented.

## The MDX page shell

Every docs page uses the same skeleton:

```jsx
<Title />
{/* intro paragraph */}
<ResourcesBlock />
<div className="sb-ds-component-docs sb-ds-component-docs--page not-prose">
  {/* sb-ds-doc-section blocks, each led by an ### heading */}
</div>
```

Markdown pipe-tables do not parse in this MDX setup — use styled `<table>` JSX.
The shared pattern is in `design-system/src/styles/Spacing.stories.jsx`.

## Related

- `overview.md` — where design knowledge lives
- `docs/connectors/storybook-mcp.md` — reading the docs tree through the MCP endpoint
