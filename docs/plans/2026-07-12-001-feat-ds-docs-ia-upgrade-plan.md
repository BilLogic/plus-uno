# Design System Documentation IA Upgrade (Atlassian-informed)

**Date:** 2026-07-12 · **Status:** EXECUTED 2026-07-12 — repo phases 1–3, Figma phases 4–5, docs-consistency phase 6 (canvas primitives, clipping fix, ResponsiveFrame controls, phase Overviews)
**Scope:** Storybook sidebar IA · repo file structure · Figma "BS4 Foundation + Component Library" · Figma "Web App Specs" · spec docs component sections

**Execution decisions (ratified):** Dropdown → Forms and inputs · Forms folded into Components · Type order Elements → Pages with a leading `Overview` page per area featuring its flagship page · kebab-case group folders.

**Execution notes:** migration scripts live in `scripts/` (`migrate-storybook-titles.mjs`, `migrate-folder-structure.mjs`, `migrate-specs-folders.mjs`, `sync-storybook-sort.mjs` — the last one is permanent tooling, the rest are one-shot). `styles/` and `assets/` deliberately kept in place physically (runtime globals + staticDirs); only their titles moved under Foundations. Patterns MDX remain `.mdx.bak` (disabled pre-migration), retitled to `Patterns/*` for whenever they're re-enabled. Legacy Admin duplicates archived to `../_archive/design-system-legacy-2026-07-12/`. Pre-migration snapshot: scratchpad `pre-ia-snapshot.tar.gz`.

Research inputs: live extraction of atlassian.design (components nav tree, foundations, per-component tab contract, release-phases policy); audit of `design-system/src`, `.storybook/preview.jsx`, `storybook.taxonomy.json`, per-area `STRUCTURE.md`, `AGENTS.md`; Figma metadata scans of both files.

## Problems this fixes

1. `storybook.taxonomy.json` is stale and unreferenced — real sort order is hardcoded in `.storybook/preview.jsx` (they disagree on Toolkit phases and DataViz subgroups).
2. `Components` (26) and `Forms` (19) are flat sibling lists with no functional grouping layer.
3. `specs/Admin/` has three parallel folder sets (`Group Admin/`, `GroupAdmin/`, `group/`); only the spaced ones are canonical.
4. Toolkit folders are lowercase/spaced (`pre-session/tables/`, `CTA Sign-Up Related Buttons/`) while titles are Title Case; legacy Title-Case type folders coexist.
5. Base components re-implemented inside specs: Toast, SidebarTab, Rating (×6), OverviewCard, SessionInfoCard, Pre-/In-Session badge & dropdown twins.
6. Figma File 1 fakes page hierarchy with leading spaces; variant-prop casing inconsistent per page. File 2's `Components (Local organisms)` sub-section order varies by page.
7. `Textarea ver 2` is a versioned title; stray casing splits (`Pre-session`, `onboarding/` vs `TrainingLessons/`).

## The shared taxonomy

Top level (Storybook order):
**Getting started** (was PLUS Docs) · **Foundations** (was Styles + Assets) · **Components** (absorbs Forms) · **Data visualizations** · **Patterns** (promoted from Styles/Patterns) · **Specs** · **Deprecated** (new).

### Foundations
Color · Typography · Layout & grid · Elevation · Iconography · Logos · Imagery · Design tokens (surfaces `foundations/token-mapping.md`) · Accessibility (new).

### Components — seven functional groups (Atlassian-moderated)

| Group | Components |
|---|---|
| Actions | Button, Button group, Dropdown |
| Forms and inputs | Input, Input group, Number input, Textarea, Rich text editor, Select, Cascader, Checkbox, Radio, Radio button group, Switch, Range, Rating, Scale, Choice grid, Multiple choice, Date picker, Time picker, Date & time picker, File upload, Label & caption |
| Layout and structure | Accordion, Card, Carousel, Collapse, Divider, Jumbotron, List group, Media object |
| Messaging | Alert, Modal, Toast |
| Navigation | Breadcrumb, Nav pills, Nav tabs, Pagination, Scrollspy, Sidebar tab |
| Overlays | Popover, Tooltip |
| Status and loading | Badge, Loading, Progress, Spinner |

### Data visualizations
Keep Comparison / Correlation / Distribution / Part-to-whole / Temporal; rename **Other → Flow & relationships**.

### Specs grammar
`Specs / <Area> / (<Phase>) / <Type> / <Component>`
- Areas: Universal, Login, Home, Profile, Training, Toolkit, Admin
- Phases only where real: Toolkit (Pre-Session, In-Session, Post-Session), Training (Onboarding, Lessons), Admin (Tutor, Session, Student, Group)
- **Canonical Type order everywhere: Elements → Cards → Tables → Modals → Sections → Pages**

### Naming contract

| Context | Convention | Example |
|---|---|---|
| Display/doc name | Sentence case | Button group |
| Code export & component folder | PascalCase | `ButtonGroup/ButtonGroup.jsx` |
| Group folder | kebab-case, never spaces | `components/forms-and-inputs/` |
| Story title | `Components/Actions/Button group` | |
| Figma component set | Matches code export; `_` prefix = private base | `ButtonGroup`, `_Button` |
| Figma variant props | lowercase `prop=value`; no spaces around `/` | `size=small, state=rest` |
| Lifecycle | `[wip]` → `[beta]` → stable → `[deprecated]`, same tags on all surfaces | `[deprecated] Textarea ver 2 → Textarea` |

Subcomponent rule: compositional parts (Alert close button, Breadcrumb item) document inside the parent page — no separate `*.Subcomponents.stories.jsx` sidebar entries. User-chosen variants get child pages under the parent.

Promotion rule: a spec-local organism used in 2+ product areas is promoted to the core library or `Specs/Universal` (immediate candidates: UserAvatar, OverviewCard, SmartBadges, UserTypeIndicator). Specs never re-implement a core component.

### Per-component docs contract (Storybook MDX + Figma doc frames)
1. Overview & anatomy · 2. Examples (existing docsSpine = the example order) · 3. Usage (Do/Don't, content guidelines, accessibility) · 4. Code (barrel import, props table) · 5. Related.

## Rollout phases

1. **Standardize the language.** Ratify taxonomy; repair `storybook.taxonomy.json` and generate `preview.jsx` sort from it (script). State the contract once in AGENTS.md.
2. **Storybook re-title.** New title paths only — no file moves. Retire Subcomponents entries into parent docs.
3. **Repo folder alignment + cleanups.** `foundations/`, `components/<group>/<Component>/`, `dataviz/`, `patterns/`, `specs/<Area>/(<Phase>/)<Type>/<Component>/`. Collapse Admin triplicates; fix Toolkit casing/de-space folders; resolve Textarea ver 2; apply promotion rule to duplicates. Imports go through barrels, so moves are contained.
4. **Figma core library.** Order component pages by the 7 groups with `———` divider pages (drop leading-space indentation); rename sets to code exports; normalize variant casing; adopt `[wip]/[deprecated]` + Archive page. Re-verify File 1's full page list in the desktop app first (MCP enumeration was partial).
5. **Specs Figma file.** Fix `Components (Local organisms)` sub-section order on every page; align page names to grammar (`Toolkit / Pre-Session`); promote shared organisms; Context blocks name the core components each organism composes.
6. **Docs contract enforcement** across component MDX and spec docs component sections; lifecycle badges in the sidebar.

## Open decisions

- Dropdown: Actions (proposed) vs Forms and inputs (Atlassian-literal)
- Forms folded into Components (proposed) vs kept top-level
- Type order micro→macro (proposed) vs macro→micro
- Group folder casing: kebab-case (proposed) vs PascalCase

## Code ↔ Figma inventory fact-check (2026-07-12, post-Figma-cleanup)

Figma-only (no code component — candidates to build or explicitly defer):
- **Tree Select** (Figma page exists; code only has Cascader — related but distinct)
- **Scroll Bar** (Figma page exists; no code component or doc)

Naming mismatches (documented, resolved or accepted):
- Figma **"Navigation"** page covers what code splits into **Nav tabs + Nav pills** — acceptable; Figma page kept as the family page.
- Code `DateAndTimePicker` was titled "Time picker" → retitled **"Date & time picker"** to match the Figma page (taxonomy updated).
- Code `RadioButtonGroup.jsx` implements the **Scale** component (title "Scale" matches Figma's Scale page) — file name is legacy; rename candidate.
- Figma "Spinner & Loading GIF" page ↔ code `Loading` docs (Spinner + LoadingGif) — consistent enough; no action.
- Figma "Progress Bar" ↔ code "Progress" — display-name variance; acceptable.

Figma cleanup executed (phases 4–5): File 1 pages renamed/regrouped under labeled dividers for the 7 groups, `[wip]` lifecycle tag adopted, variant props/values lowercased on Typography & Content page, slash spacing fixed. File 2 page names aligned to spec grammar (`Toolkit / Pre-Session`, `Universal`), dividers unified to `───`, Training reordered Onboarding→Lessons, and every spec page's `Components (Local organisms)` sub-sections re-stacked to Elements → Cards → Tables → Modals → Sections → Pages.

## Round 3 execution (2026-07-12, same day)

- **Storybook upgraded 10.2.7 → 10.5.0** (automigrations: `tags: ['autodocs']`, framework deps consolidated, addon-mcp added). `@storybook/addon-vitest` installed and wired (browser-mode story tests via Playwright/Chromium in vite.config.js `test.projects`); verified with `npx vitest --project=storybook --run <story>`. Onboarding: Controls task done, viewport via native toolbar, publish skipped (Netlify).
- **Docs canvas air:** attached-source canvases now pad 2.5rem top / 3.5rem bottom (was 2rem) so components clear the controls strip below.
- **ResponsiveFrame:** custom toolbar removed (breakpoint is the native `breakpoint` arg in Controls, already wired in all 17 page-story files); legacy toolbar available via `showToolbar` for browser-fullscreen only.
- **Link fact-check:** 162 stale GitHub links canonicalized from each MDX's real path; Figma links verified to reference only the two canonical files.
- **Figma Foundations cleanup (File 1):** Color & Elevation → `Color` (9 dated/scratch nodes archived to new 🗄 Archive page); Typography & Content → `Typography` (Table sets → new `Table` page under Layout & Structure; Image/Figure → `Iconography, Logos & Imagery`); Layout & Grid decluttered (OUTDATED frame + scratch sections + loose spec instances archived; 12k-px Spacing Token Guidelines moved to new `Spacing` page linking the Design-System-Upgrade-2026 WIP cheatsheet); new `Elevation` starter page (no canvas elevation docs existed).
- **Patterns componentized (both sides):** Figma `Patterns` page (after Foundations) with `_Slot` base + Pattern/Card, Section, Modal, Surface container, Table shell — variable-bound fills/radius/paddings/gaps, Elevation effect styles, min/max width constraints, INSTANCE_SWAP content slots, TEXT and BOOLEAN properties. Code twins in `design-system/src/patterns/` (Surface, SurfaceContainer, PatternCard, PatternSection, PatternModal, PatternTable) with stories/MDX under `Patterns/*` — the Patterns sidebar section is now live. Token gaps noted in patterns SCSS comments.

## Round 4 execution (2026-07-12)

- **Patterns corrected per authority** (`styles/patterns/Introduction.mdx.bak` = declared SSOT; Notion has no PLUS pattern docs — the "Tokens" page there is unrelated and contains plaintext API keys, flagged to owner): per-pattern slot components in Figma (`_Slot/Card|Section|Modal|Surface container|Table` — allowed content differs per pattern); Card = surface-container-lowest + `outline` outer border, Modal = surface-container-high, Table = no-fill; **elevation mapping fixed** — semantic level 1 (cards) = `--elevation-light-2` / Elevation Light/2, level 3 (modals) = `--elevation-light-4` / Light/4 per token-mapping.md; state layers documented as additive on-surface 8/12/16% overlays. Patterns folded under Foundations on both sides (Figma page inside Foundations block; Storybook titles `Foundations/Patterns/*`). Known open item: Cards.mdx.bak is a corrupted copy of Modals — superseded by the live PatternCard docs.
- **Built-in viewports**: preview.jsx now ships MD 768 / LG 1024 / XL 1440 (no mobile), matching the Figma Breakpoint set.
- **Specs display names**: 109 titles de-PascalCased into spaced words (folders unchanged).
- **Figma foundations tidied**: moved clusters translated to clean origins (Spacing, Table) and moved imagery placed below existing content (Iconography page).
- **Storybook MCP**: addon-mcp verified live at :4200/mcp, registered in `.mcp.json` as `plus-storybook`; AGENTS.md instructs agents to use list-all-documentation / get-documentation / get-storybook-story-instructions and the AI story-authoring best practices.
- **Testing onboarding**: addon-a11y installed; story tests green (patterns 22/22, coverage 100% stmts / 83% branches); full-suite + Chromatic visual tests + CI automation deliberately deferred.

## Round 5 execution (2026-07-12)

- **Figma patterns, native-slot-ready:** all 16 slot positions across Card/Section/Modal/Surface container/Table shell are plain inner frames labeled "◇ … convert this frame to a slot" (the Plugin API doesn't expose the native slot feature yet — figma.createSlot absent, runtime-verified); INSTANCE_SWAP props removed, text/boolean props kept; _Slot components archived. Card/Section/Modal are documented variant sets (size=sm/md/lg, per-size tokens). Figma component pages renamed to Storybook names (Progress, Loading, Sidebar Tab, Nav Tabs & Nav Pills).
- **Global breakpoint toggle:** `plusBreakpoint` globalType (toolbar: Native/MD/LG/XL) + decorator constrains any Specs/* story width — works in docs AND canvas, at every level (pages, sections, cards, elements).
- **Popup containment sweep (42 story files):** portal/fixed modals no longer cover docs pages — Admin modals arg-gated default-off; UserFeedbackModal contained via noOverlay; OnboardingInnerPage scrim arg-gated; 9 Toolkit WithModals pages gated behind `open` (default off); 51 Modal usages in 27 spec files switched to `renderAs="inline"` — which also FIXED ~27 stories that previously rendered nothing at all. Known pre-existing: AllSessionsWithModals modalMap references missing exports.
- **Inventory closed:** TreeSelect (forms-and-inputs) and ScrollBar (layout-and-structure) built with stories/MDX/tests (9/9 green); taxonomy updated. No component now exists on only one side.
- **Audit findings (to schedule):** 7 component MDX missing 4–5 docsSpine sections (worst: RichTextEditor); 145/266 spec figmaLinks are file-level placeholders (need node-ids); Login specs least documented (5 stories without MDX); Layout & grid page documents 4 phantom tokens (--layout-grid-gap, --layout-sidebar-width, --size-surface-container-pad-x-sm, --col-1..12).
