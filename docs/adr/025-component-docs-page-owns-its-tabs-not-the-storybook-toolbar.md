---
embodiment: ide
summary: Tabs move from Storybook's manager toolbar into the component docs page, below the title — the toolbar sits in a different document and can never render under in-page content (2026-08-26)
status: active
verified: 2026-08-26
---

# ADR-025: A component docs page owns its tabs, not the Storybook toolbar (2026-08-26)

**Decision.** Render Examples · Code · Usage · Changelog **inside** the component
docs page, immediately below the title and one-line description, and retire the
three `types.TAB` addons that put them in Storybook's preview toolbar. The tab
strip appears on the 48 component docs pages plus `styles/DesignTokens.mdx`, and
nowhere else. A tab with no content does not render at all.

**Why.** The toolbar cannot be moved. Storybook's preview toolbar
(`section.sb-bar[data-testid="sb-preview-toolbar"]`) lives in the **manager**
document; `<Title />` renders inside the **preview iframe**. They are two
documents, so no CSS and no `previewTabs` config can place the toolbar below the
title. The requested order — title, then tabs, then content — is only reachable
by moving the tabs into the preview.

Two further defects came free with the same move, both consequences of the
toolbar being manager chrome:

*The tab list was global.* Storybook filters **tools** by their `match` and never
tabs (`Preview.tsx` in `storybook/dist/manager/runtime.js`). Measured on the
running Storybook: the Button docs entry, the Button *story* entry, and the
**Colors** foundation page all rendered the identical four tabs. A foundation
page offered a Usage tab because there was no mechanism to withhold it.

*The manager cannot read the repo.* It is a browser bundle with no file access,
so Code and Usage could only ever be routers — links out to GitHub. Inside the
preview that constraint lifts, which is why Code becomes a real props table
(`ArgTypes`, derived from story meta) rather than a link.

This also matches Atlassian, which the four tabs were copied from in #168.
Measured on atlassian.design: tabs appear only under `/components/**` — Button,
Avatar (which has five, including a Migration guide), the Box primitive, and
Design tokens at `/components/tokens/all-tokens`, whose first tab is named "All
tokens". `/foundations`, `/foundations/tokens`, `/color`, `/spacing`,
`/accessibility`, `/content` and `/patterns` have **no** tabs and use sidebar
sub-navigation instead. Atlassian never renders an empty tab; the set is
per-entity, not global. Hence the one named exception: Design tokens is not a
visual component but is filed under `/components/`, so `DesignTokens.mdx` gets a
strip while Colors, Spacing and Typography do not.

**Considered and rejected.** Partitioning sections automatically inside a shared
`DocsContainer` by matching heading text needs no file edits, but makes tab
membership implicit — renaming a heading would silently relocate its content, and
the container would wrap all 387 MDX pages, so the 339 non-component ones would
need excluding from inside it. Explicit `<DocsTabs>` / `<DocsTab>` wrappers were
chosen instead because #242's conclusion applies directly: the static shape of a
thing is not the defect, and a check needs something real to assert against.

**Consequences.**

Deleting the registration and `previewTabs` removes the toolbar's tab strip
entirely — measured, not assumed: with both disabled, both the docs entry and the
story entry reported `tabStrip: false, tabs: []`. Storybook does not draw a strip
for a single view, so no "Canvas" stub is left behind. `previewTabs` was also the
only supported way to rename the built-in canvas tab, so the name "Examples" now
lives in this component and each page may override it.

`types.TAB` is deprecated in Storybook 10.5 and removed in 11. Retiring it clears
that blocker, and `scripts/check-deprecated-apis.mjs` — which pinned the
deprecation to `.storybook/addons/component-tabs/register.jsx` — is amended in
the same change. `contract.js` survives intact: its path derivation and changelog
shape never depended on how the surface was rendered, which is what its own
README predicted.

Because inactive tabs unmount, one tab's content is in the DOM at a time. That
keeps the document outline honest and the "On this page" TOC listing only what is
on screen, at the cost of re-rendering story canvases on tab switch.

Changelog is hidden on every component today. `CHANGELOG_ADOPTED = '2026-08-26'`
and nothing is backfilled, so no component has entries yet; the tab appears the
day one declares them. This is deliberate — the alternative is 48 pages carrying
a permanently empty tab to prove a mechanism exists.

Coverage, not structure, is the real friction: 30 of the 48 pages have no Usage
content at all and simply gain a strip, while 18 move content. The section
markup made the move safe — 289 headings, all `###`, one-to-one with 289
byte-identical `sb-ds-doc-section` divs, all at column 0 and flat siblings.
Section headings are promoted to `##` in the same pass, since `###` under
`<Title />`'s `<h1>` was a level skip on all 48 pages. That promotion is
**unverified by any gate**: `check:storybook`'s 1136 tests are story tests, and
docs pages are not in the suite, so nothing here is caught by the a11y ratchet or
by `heading-order`. It was fixed on inspection, not on a measurement.
