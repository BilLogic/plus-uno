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

- **Top level:** Get started · Foundations · Components · Patterns · Templates · AI UI, then our own Data visualizations and Tech stack. `npm run check:storybook-categories` holds the sort to that order, fails any page under `design-system/src/` titled under a root the sort does not list, and fails a page placed in the wrong one of Templates and Patterns: the taxonomy's `rootSources` lists each root's source folders.
- **Get started:** Design · Develop · With AI · About. About is the old Introduction page; the other three are short landing pages that point into the tree (`design-system/src/storybook-docs/landing/`).
- **Foundations,** in this order: **Overview**, then the groups **Brand** (Content · Logos · Illustrations) · **Visual** (Color · Typography · Iconography · Elevation · Radius · Border) · **Layout** (Spacing · Grid) · **Expression** (Motion · Sound, each a page group of its own), then **Accessibility** and **Tokens** as single pages, last. Content is a group of three pages, Voice and tone, Language and Messages, titled `Foundations/Brand/Content/<Name>` and filed as `Content<Name>.mdx`. A page in a group is titled `Foundations/<Group>/<Name>` (`Foundations/Visual/Color`, id `foundations-visual-color--docs`); Overview, Accessibility and Tokens are `Foundations/<Name>`; Motion and Sound pages are `Foundations/Expression/Motion/<Name>` and `Foundations/Expression/Sound/<Name>`. Storybook has no heading row that is not a title segment, so a heading is a group. A moved id keeps a `netlify.toml` redirect, and `scripts/storybook-id-redirects.test.mjs` holds each to a live page. Source lives in `design-system/src/styles/`. Motion is a folder of pages, each filed as `Motion<Page>.mdx` with its demos in `Motion<Page>.stories.jsx`; it draws with the illustration kit's motion layer, `design-system/src/storybook-docs/illustrations/motion.jsx`. The folder's Library page (`MotionLibrary.mdx`) is generated: it renders every row of the motion registry through `motion-library.jsx`, with its agent file at `design-system/agent-views/motion/library.md`, and holds no hand-written table. Sound is a folder of pages filed as `Sound<Page>.mdx`, its Sounds page backed by `SoundSounds.stories.jsx`. A foundation that also ships a component keeps guidance here and the component's API under Components: Iconography and `Components/Images and icons/Icon`, Illustrations and `Components/Images and icons/Illustration`.
- **Templates:** Overview (which carries the Templates and patterns section: the three layers, the tie-break, Frame → Screen → Flow) · Frame · Page (its Heading outline is a section of the page) · Section · Card · Table · Form · Modal (its Backdrop is a section of the page) · Panel · Popup, broadest first. A template is an arrangement of components with slots. Sources live in `design-system/src/patterns/` and `design-system/src/storybook-docs/templates/`. Each template page documents its own level only and links to the level above or below for the rest: every Frame state (Sidebar, Panel, overlays, breakpoints) is on Frame.
- **Patterns:** Overview, then one flat page each for Common actions, Forms, Filtering, Navigation, Search, Indicators and Notifications, then the States group (`Patterns/States/<Name>`: Empty, Loading, Errors, Overflow, Disabled, Read-only). The flat pages come first in the sidebar, States last. A pattern is code-free guidance whose examples are templates, and it holds a rule that applies across two or more templates. Sources live in `design-system/src/storybook-docs/patterns/`.
- **AI UI:** About AI UI · AI interaction guidelines · Foundations (Color, Elevation, Motion, Voice and tone) · Components (Button, Icon, Illustration, Generative border, Prompt input, Prompt starters, Suggestion, Skills tag, AI message with AI sources and AI feedback nested) · Patterns (AI chat), named as the Figma AI dividers name them. Everything AI sits here, as on the Figma AI pages. A page with nothing defined yet says so in one line rather than being left out. An AI component is listed in the taxonomy's `aiComponents` and titled `AI UI/Components/<name>`, while its folder stays under its category. Its pages live in `design-system/src/storybook-docs/ai/`.
- **Test harnesses** such as `DocumentedContract.stories.jsx` carry the `!dev` tag: the Storybook tests run them and the sidebar leaves them out. A docs page never carries `!dev`: every docs page shows in the sidebar, in `storybook dev` and in the build. The generators and checks behind the docs are listed on Get started › Develop. After a rename or reorder, `node scripts/verify-docs-link-ids.mjs <built storybook>/index.json` lists every `?path=` href and DocsLink id that names no entry.
- **Components groups** are Atlassian's component categories, in Atlassian's order, and only those with members: ten groups, each with a kebab-case folder under `design-system/src/components/` (`forms-and-inputs`, `images-and-icons`, `labels`, `layout-and-structure`, `loading`, `messaging`, `navigation`, `overlays-and-layering`, `status-indicators`, `text-and-data-display`). The Storybook group is the category in sentence case. A story outside `components/` may also sit in a group: Logo, whose source is in `design-system/src/assets/`, is under Images and icons, and the Navigation system (the Sidebar, source in `design-system/src/patterns/Sidebar/`) is under Navigation with Sidebar tab nested in it, as on the Figma page list. Button sits in Forms and inputs, as on atlassian.design. Undocumented internal composites live in `_internal/` until they graduate; a story there may sit in any category. `npm run check:storybook-categories` holds folders, titles and the taxonomy to this.
- **Pages follow the BS4 Foundation library's page list.** Inside each group the sidebar shows Figma's pages in Figma's order, named as Figma names them. A Figma page that holds several components becomes a folder of the same name, with one docs page per component in the page's section order: `Button/` (Button, Close button), `Status, count & tag/` (Status, Count, Tag, Tag group), `Loading/` (Spinner, Skeleton). A Figma page with no code has no Storybook page; the gap is recorded where the change is reviewed, not as an empty page. Foundations follow Figma's foundation pages the same way.
- **Tech stack:** Overview · Base UI · Font Awesome · Highcharts · Motion. One short page per package PLUS builds on: what it is for, which component wraps it and what not to do. Source lives in `design-system/src/storybook-docs/tech-stack/`. Overview is one table of packages and versions read from `package.json`.
- **Data viz** lives in `design-system/src/dataviz/<purpose>/` — comparison, correlation, distribution, flow-and-relationships, part-to-whole, temporal.
- **Specs** left `main` for their rebuild; the old code is on the `archive/legacy-ds` branch. When they return, the grammar is `Specs/<Area>/(<Phase>/)<Type>/<Component>`, with Type order Overview → Elements → Cards → Tables → Modals → Sections → Pages. Title Case phases and types, PascalCase component folders, no spaces in folder names. Every area (and Admin sub-area) leads with an `Overview.mdx` featuring its flagship page.
- **Naming:** sentence-case display names in titles ("Button group"), using the display name people say ("Text field" for `TextField`); the label family keeps its own names (Status, Count, Tag, Tag group, Suggestion). PascalCase code exports never change with the display name. A spec composes core components; a local organism reached from 2+ areas gets promoted into `components/` instead of being re-implemented.

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
Harness** — as tabs inside the page, not sidebar entries. Four entries per
component would fragment the sidebar, which is the one place the tree above is
spoken out loud.

**The component page template.** Every component page has the same four faces, in this order:

- **Examples:** one story per appearance, state and size, each as a `ComponentExample` (an h3 and a one-line description over the live canvas), then the interactive playground.
- **Code:** generated. The import line (from the `@/components` barrel, `@/patterns` on a pattern page) and the props table, derived from the story meta, so neither is authored.
- **Usage:** the Usage spine below, with parts (anatomy and tokens) and content guidelines after its Usage section.
- **Harness:** generated. The component's generated file, byte for byte — what agents read, with a raw-text view, Copy, and a "Report a problem" link that opens a GitHub issue. Author nothing for it: the page and the source are its inputs.

`Button/Button.mdx` is the reference page.

**Pattern pages take the same template.** A pattern in its own folder,
`patterns/<Name>/<Name>.mdx`, has the same four faces, and its Harness shows
the `index.md` the generator writes beside it. A docs-only pattern page with no
component of its own (Templates, Popups) has no generated file, so it shows
Examples · Code · Usage. The flat reading pages directly under `patterns/` have no Usage spine and stay untabbed.

**One generated file per component is the agent's whole answer.** Agents read
`<Name>/index.md` (`<Name>.md` when filed flat), never the `.mdx`: one file per
question, the same bytes `ds_get` returns. Harness shows that file to the
designer, so a wrong sentence there is fixed on this page or in the source and
regenerated.

The tabs render inside the page from `design-system/src/storybook-docs/docs-tabs.jsx`
(ADR-025, ADR-040), and Harness reads the generated files through one raw
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

## Examples

This section owns how every docs example and drawing is made — Storybook pages,
Figma docs and the review checklists point here.

**Example fidelity.** If an example's lesson depends on a component's look,
states or wording, show the real component with real labels. If the lesson
still holds with every word removed, draw blocked-out shapes from the
illustration kit, with no words inside the figure.

**One illustration kit.** Every docs diagram and animation, abstract or
specific, is drawn from the shared illustration kit
(`design-system/src/storybook-docs/illustrations/`, the Illustration kit page in
Storybook). A shape the kit lacks is added to the kit the way its Contributing
section says — reuse or extend a primitive first, each part painted by its
real component's role token, one accent, correct in light and dark, with a
gallery entry and its story test green — in its own PR, which the templates and
patterns session, the kit's owner, reviews before merge. A figure on a page is
always a kit composition, so one-off SVGs and hand-drawn figures have no home.

## Spacing

A docs page groups its content the way a PLUS page does, on the app's Page and Section token roles (Spacing foundation). The rules live in one file, `design-system/src/storybook-docs/docs-rhythm.css`, and apply to component, foundation and prose pages alike:

| Between | Token | Role |
|---|---|---|
| Page title and its lead | `--stack-sm` | title to description |
| Page header and the tabs or first section | `--page-stack-md` | page title to content |
| Anything and a section (h2) | `--page-stack-lg` | before a new topic |
| Anything and a subsection (h3) | `--page-stack-md` | between sections |
| A heading and its one-line description | `--stack-sm` | title to description |
| A heading and its body; blocks in one group | `--section-stack-md` | heading to body |

A heading is a real heading: a sub-topic is a `FoundationSubsection` or an `###`, never a bold paragraph, so it takes the subsection gap and appears in the page outline. Demos render inside their canvas (Modal `renderAs="inline"`, `FlagGroup containerPosition="static"`, or a frame); the Storybook tests fail a docs story whose demo covers the page.

## Which Foundations page owns what

One home per fact: the owning page states it, and every other page links to it. Restating a fact on a second page is how two pages come to disagree.

| Fact | Owner | Others |
|---|---|---|
| The four token tiers, their Figma collections and modes, the fallback rule | Tokens | Spacing, Grid, Color link to Tokens |
| Pad, stack, inline and the per-pattern spacing tables | Spacing | Grid links for pattern sizes |
| Breakpoints, "desktop only from 768", gutter 16, page pad 24, content caps, size roles | Grid | Everything else links |
| The focus ring's color, width and offset | Border | Accessibility, Color, Radius link; Radius owns the corner arithmetic (radius + 2) |
| The no-colored-side-stripe rule | Border | None restates it |
| Heading levels and the one `h1` per page | Typography | Accessibility links |
| How disabled looks | Color | Accessibility keeps the behavior rules (not a focus target, a visible reason) |
| Icon sizes 12, 16, 24 | Iconography | Typography, Grid link |
| Contrast pairs and chart color | Color | Accessibility links |
| Alt text for the logo | Logos, under Accessibility | None |

A rule that is not a status is shown as a neutral `Callout`, never a Banner; a do and don't pair is `DoDont`. Developer-only text (`check:*` commands, the token plan, SCSS mixins, test files) is kept off these pages, one short "In code" snippet at most, and lives in `docs/engineering/foundation-docs.md`.

## The landing

A covered Foundations, Templates or Patterns page opens with `<DocsLanding page eyebrow title purpose links />` (`design-system/src/storybook-docs/docs-landing/`), in this order: eyebrow, the page's one `h1`, its purpose, one row of quick links, then the hero. A page in a section with a tab strip (Motion, Sound) passes a `section` id in place of `links`, and the strip comes from the one registry, `docs-landing/sections.js`, so order and labels cannot drift. The hero is chosen by `page` from the hero registry (`hero-registry.jsx`), which also holds the sentence that is its accessible name; a hero draws no text. `npm run check:docs-landing` fails a covered page with no landing or no registry hero, and a later page joins by adding itself to `PAGES` in that script. The check also fails a landing page that still renders a body Contents block (the right rail lists the contents), and an overview card whose `hero` names no registry page.

The hero tile has no outline: its `--ds-surface-sunken` fill against the white page is the edge. The overview cards (`<TypeCard hero="<page id>">`) use the same tile through `HeroCard`: the registry drawing cropped to its 300 × 160-unit stage, never a separate thumbnail.

## Related

- `overview.md` — where design knowledge lives
- `docs/connectors/storybook-mcp.md` — reading the docs tree through the MCP endpoint
