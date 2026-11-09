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

- **Top level:** Get started · Foundations · Patterns · Components · AI UI, then our own Data visualizations. Patterns come before Components because a page is composed from them first. `npm run check:storybook-categories` holds the sort to that order and fails any page under `design-system/src/` titled under a root the sort does not list.
- **Get started:** Design · Develop · With AI · Content design · About. About is the old Introduction page; the other four are short landing pages that point into the tree (`design-system/src/storybook-docs/landing/`).
- **Foundations:** Overview · Tokens · Accessibility · Spacing · Grid · Color · Typography · Motion · Iconography · Illustrations · Logos · Elevation · Border · Radius. Source lives in `design-system/src/styles/`. A foundation that also ships a component keeps guidance here and the component's API under Components: Iconography and `Components/Images and icons/Icon`, Illustrations and `Components/Images and icons/Illustration`.
- **Patterns:** Templates · Frame · Page (Page, Heading outline) · Section (Section, Card, Table) · Overlays (Blanket, Modal, Drawer) · Popups, broadest first. There is no separate introduction: what patterns are, the list and how a page layers live on the Templates page. Source lives in `design-system/src/patterns/`. Each pattern page documents its own level only and links to the level above or below for the rest: the browser window is drawn on Templates alone, and every Frame state (Sidebar, Panel, overlays, breakpoints) is on Frame.
- **AI UI:** About AI UI · AI interaction guidelines · Foundations (Color, Elevation, Motion, Voice and tone) · Components (Button, Icon, Illustration, Generative border, Prompt input, Prompt starters, Suggestion, Skills tag, AI message with AI sources and AI feedback nested) · Patterns (AI chat), named as the Figma AI dividers name them. Everything AI sits here, as on the Figma AI pages. A page with nothing defined yet says so in one line rather than being left out. An AI component is listed in the taxonomy's `aiComponents` and titled `AI UI/Components/<name>`, while its folder stays under its category. Its pages live in `design-system/src/storybook-docs/ai/`.
- **Test harnesses** such as `DocumentedContract.stories.jsx` carry the `!dev` tag: the Storybook tests run them and the sidebar leaves them out. The generators and checks behind the docs are listed on Get started › Develop.
- **Components groups** are Atlassian's component categories, in Atlassian's order, and only those with members: ten groups, each with a kebab-case folder under `design-system/src/components/` (`forms-and-inputs`, `images-and-icons`, `labels`, `layout-and-structure`, `loading`, `messaging`, `navigation`, `overlays-and-layering`, `status-indicators`, `text-and-data-display`). The Storybook group is the category in sentence case. A story outside `components/` may also sit in a group: Logo, whose source is in `design-system/src/assets/`, is under Images and icons, and the Navigation system (the Sidebar, source in `design-system/src/patterns/Sidebar/`) is under Navigation with Sidebar tab nested in it, as on the Figma page list. Button sits in Forms and inputs, as on atlassian.design. Undocumented internal composites live in `_internal/` until they graduate; a story there may sit in any category. `npm run check:storybook-categories` holds folders, titles and the taxonomy to this.
- **Pages follow the BS4 Foundation library's page list.** Inside each group the sidebar shows Figma's pages in Figma's order, named as Figma names them. A Figma page that holds several components becomes a folder of the same name, with one docs page per component in the page's section order: `Button/` (Button, Close button), `Status, count & tag/` (Status, Count, Tag, Tag group), `Loading/` (Spinner, Skeleton), `Tabs, nav pills & navbar/` (Tabs, Nav pills, Navbar). A Figma page with no code has no Storybook page; the gap is recorded where the change is reviewed, not as an empty page. Foundations follow Figma's foundation pages the same way.
- **Data viz** lives in `design-system/src/dataviz/<purpose>/` — comparison, correlation, distribution, flow-and-relationships, part-to-whole, temporal.
- **Specs** left `main` for their rebuild; the old code is on the `archive/legacy-ds` branch. When they return, the grammar is `Specs/<Area>/(<Phase>/)<Type>/<Component>`, with Type order Overview → Elements → Cards → Tables → Modals → Sections → Pages. Title Case phases and types, PascalCase component folders, no spaces in folder names. Every area (and Admin sub-area) leads with an `Overview.mdx` featuring its flagship page.
- **Naming:** sentence-case display names in titles ("Button group"), using Atlassian's name where Atlassian has the component ("Text field" for `TextField`, "Popup" for `Popover`); the label family keeps its own names (Status, Count, Tag, Tag group, Suggestion). PascalCase code exports never change with the display name. A spec composes core components; a local organism reached from 2+ areas gets promoted into `components/` instead of being re-implemented.

## The benchmark: Atlassian

atlassian.design is the benchmark for every Figma and Storybook docs page. Take
Atlassian's structure, guidance, do and don'ts and wording, then adapt them to
PLUS: the tutoring context, PLUS component names, our tokens. Read the
benchmark silently — the page never cites atlassian.design, links to it, or
names it.

- **Order:** code and Storybook first. The component and its Storybook MDX are
  built to Atlassian best practice on the Core docs-parts template structure
  (Component, Pattern, Foundation, AI, Overview, Index). The Figma page in the
  BS4 library is backfilled from the shipped code afterwards, one family at a
  time through the single-writer Figma queue.
- **One standard:** the same sections, in the same order and voice, on every
  page. The MDX carries the Core docs-parts sections; Figma's section list is
  `figma/page-documentation.md` § The Docs frame, and the backfilled page
  mirrors the MDX one-to-one.

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
Build them from `DocsTable` (`design-system/src/storybook-docs/ds-docs-layout.jsx`),
except a component's Properties section, which is `<DocsProperties of={XStories} />`:
the table is generated from the story's `argTypes`, so descriptions and defaults
belong there, not in the page;
foundation pages use its `TokenTable` and `RefTable` wrappers and the `DoDont`
pair in `design-system/src/storybook-docs/foundation-blocks.jsx`.

## The four tabs

A component page has four faces below its title — **Examples · Code · Usage ·
Agent view** — as tabs inside the page, not sidebar entries. Four entries per
component would fragment the sidebar, which is the one place the tree above is
spoken out loud.

**The component page template.** Every component page has the same four faces, in this order:

- **Examples:** one story per appearance, state and size, each as a `ComponentExample` (an h3 and a one-line description over the live canvas), then the interactive playground.
- **Code:** generated. The import line (from the `@/components` barrel, `@/patterns` on a pattern page) and the props table, derived from the story meta, so neither is authored.
- **Usage:** the Usage spine below, with parts (anatomy and tokens) and content guidelines after its Usage section.
- **Agent view:** generated. The component's generated file, byte for byte — what agents read, with a raw-text view, Copy, and a "Report a problem" link that opens a GitHub issue. Author nothing for it: the page and the source are its inputs.

`Button/Button.mdx` is the reference page.

**Pattern pages take the same template.** A pattern in its own folder,
`patterns/<Name>/<Name>.mdx`, has the same four faces, and its Agent view shows
the `index.md` the generator writes beside it. A docs-only pattern page with no
component of its own (Templates, Popups) has no generated file, so it shows
Examples · Code · Usage. The flat reading page directly under `patterns/`
(Heading outline) has no Usage spine and stays untabbed.

**One generated file per component is the agent's whole answer.** Agents read
`<Name>/index.md` (`<Name>.md` when filed flat), never the `.mdx`: one file per
question, the same bytes `ds_get` returns. Agent view shows that file to the
designer, so a wrong sentence there is fixed on this page or in the source and
regenerated.

The tabs render inside the page from `design-system/src/storybook-docs/docs-tabs.jsx`
(ADR-025, ADR-040), and Agent view reads the generated files through one raw
glob there; a page with no usage content, no props or no generated file shows
fewer.

## The Usage spine

The Usage tab holds the text designers and agents share: the page shows it, and
the generated `index.md` renders the same sentences for agents with rule ids
added. Five `##` sections carry it, in this order:

1. **Usage:** what the component is for, led by its glossary term: "Use `Modal` when the next step has to happen before anything else can."
2. **Alternatives:** one route per bullet, each naming a component the components index lists: "For a short notice, use `Flag`." A route names the component to reach for instead.
3. **Best practices:** one rule per `###` heading, written as one sentence of glossary term, condition and rule. The heading's slug is the rule id (`### Give the Modal footer a button.` is `give-the-modal-footer-a-button`). The body under it explains the rule, and each picture there has its rule sentence. A number in a rule comes from a code constant imported into the page, or names that constant in backticks.
4. **Accessibility:** keyboard, focus and naming, as the component behaves today.
5. **Related:** one bullet per neighbor, each with its "use when": "`SectionMessage`: use when the message stays in the page."

Parts and Content guidelines sit after Usage. Each section states current
behavior; a known gap lives in a GitHub issue, so the page carries no `TODO`,
`outdated` or `known stale` line.

`npm run check:ds-writing` holds every component page to this shape, and
`scripts/check-ds-writing.mjs` keeps each rule's reason. It warns on every page,
fails on a stale marker, and fails a page in its strict list (`STRICT_PAGES`,
`Modal` first) on every rule.

## Related

- `overview.md` — where design knowledge lives
- `docs/connectors/storybook-mcp.md` — reading the docs tree through the MCP endpoint
