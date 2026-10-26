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
- **Components groups** are Atlassian's component categories, in Atlassian's order, and only those with members: nine groups, eight of them with a kebab-case folder under `design-system/src/components/` (`forms-and-inputs`, `images-and-icons`, `labels`, `layout-and-structure`, `loading`, `messaging`, `navigation`, `overlays-and-layering`), and Text and data display, whose one member lives in `_internal/`. The Storybook group is the category in sentence case. A story outside `components/` may also sit in a group: Logo, whose source is in `design-system/src/assets/`, is under Images and icons, as on the Figma page list. Button sits in Forms and inputs, as on atlassian.design. Undocumented internal composites live in `_internal/` until they graduate; a story there may sit in any category, which is how Table, still in `_internal/`, sits in Text and data display beside Figma's three table pages. `npm run check:storybook-categories` holds folders, titles and the taxonomy to this.
- **Pages follow the BS4 Foundation library's page list.** Inside each group the sidebar shows Figma's pages in Figma's order, named as Figma names them. A Figma page that holds several components becomes a folder of the same name, with one docs page per component in the page's section order: `Button/` (Button, Close button), `Status, count & tag/` (Status, Count, Tag, Tag group), `AI label/` (AI label, Suggestion), `Loading/` (Spinner, Skeleton), `Tabs, nav pills & navbar/` (Tabs, Nav pills, Navbar). A Figma page with no code has no Storybook page; the gap is recorded where the change is reviewed, not as an empty page. Foundations follow Figma's foundation pages the same way.
- **Data viz** lives in `design-system/src/dataviz/<purpose>/` — comparison, correlation, distribution, flow-and-relationships, part-to-whole, temporal.
- **Specs grammar:** `Specs/<Area>/(<Phase>/)<Type>/<Component>`, with Type order Overview → Elements → Cards → Tables → Modals → Sections → Pages. Title Case phases and types, PascalCase component folders, no spaces in folder names. Every area (and Admin sub-area) leads with an `Overview.mdx` featuring its flagship page.
- **Naming:** sentence-case display names in titles ("Button group"), using Atlassian's name where Atlassian has the component ("Text field" for `Input`, "Popup" for `Popover`); the label family keeps its own names (Status, Count, Tag, Tag group, Suggestion). PascalCase code exports never change with the display name. A spec composes core components; a local organism reached from 2+ areas gets promoted into `components/` instead of being re-implemented.

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
Build them from `DocsTable` (`design-system/src/storybook-docs/ds-docs-layout.jsx`);
foundation pages use its `TokenTable` and `RefTable` wrappers and the `DoDont`
pair in `design-system/src/storybook-docs/foundation-blocks.jsx`.

## The four tabs

A component page has four faces above the canvas — **Examples · Code · Usage ·
Changelog** — as real Storybook tabs, not sidebar entries. Four entries per
component would fragment the sidebar, which is the one place the tree above is
spoken out loud.

**The tabs are a human affordance and change nothing for an agent.** The
agent-facing file stays one flat generated `index.md` per component. An agent
that had to open four files to answer one question would be paying for a
navigation aid it cannot see.

`Examples` is Storybook's canvas tab, renamed. The other three are registered by
the local manager addon in `.storybook/addons/component-tabs/`, whose README
states the mechanism, the Storybook 11 deprecation it rides on, and what
replaces it.

## Related

- `overview.md` — where design knowledge lives
- `components/changelog.md` — what a component records about itself, and when it does not
- `docs/connectors/storybook-mcp.md` — reading the docs tree through the MCP endpoint
