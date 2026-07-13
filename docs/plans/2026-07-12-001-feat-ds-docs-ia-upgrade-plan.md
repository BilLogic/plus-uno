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

## Round 6 execution (2026-07-12)

- **Popup root cause fixed:** Admin page components portaled react-bootstrap modals to document.body (fixed + backdrop over the docs page). New `.plus-modal-boundary` utility + `containModal` prop on StudentAdminPage / SessionAdminPage / TutorPerformancePage (container ref + ModalManager without scroll-lock + no focus stealing); OnboardingInnerPage scrim fixed→absolute. WithModal stories arg-driven; verified on the repro page: 0 fixed overlays, modals contained, no body scroll-lock. 13/13 tests green.
- **Page display outline removed:** ResponsiveFrame inner frame no longer draws border/shadow — the page itself is the only visible content.
- **Grid foundation shipped:** Foundations/Grid Storybook page (Atlassian's grid rules adapted: desktop-only MD/LG/XL, fixed-wide 1296 / fixed-narrow 864 / fluid, 12 columns, SideNav/TopNav/Main/Panel region naming with Panel-as-off-canvas note, full do's/don'ts, single min-width rule deprecating min–max drag). Figma: grid styles Grid/MD 768 (12/12/16), Grid/LG 1024 (12/16/32), Grid/XL 1440 (12/16/32), Grid/Main region (12/16/0) created and applied to Breakpoint variants + the Main-region Surface container.
- **Patterns corrected after native-slot conversion (slots verified as SLOT nodes):** Card widths 320/480/720 with min/max bounds, Section 480/720/1080, Modal min/max per size; Body slots 140–180px vs Footer 48–56px (proportions fixed); Surface container reframed as the app-shell Main region (1164 = XL math, min 672) carrying the Main grid.
- **Flagged decisions:** sidebar width drift — token 164px vs PageLayout code 184px; Breakpoint set still carries Mobile 320 / Tablet 600 variants contradicting desktop-only (deprecation candidates; renaming variant values may break instances). Follow-up: thorough grid-alignment testing round across specs.

## Round 7 — Grid/Spacing consolidation, sidebar 164, Vercel purge, Figma breakpoint fix

- **Docs consolidation.** Removed the redundant `Foundations/Layout & grid` page
  (deleted `Layout.mdx` + `Layout.stories.jsx`). The two clean pages the user
  wanted now stand alone: **Spacing** (token scale + per-context value tables,
  moved into new `Spacing.stories.jsx`) and **Grid** (12-col grid, breakpoints,
  regions, column reference — now via new `Grid.stories.jsx`). Taxonomy reordered
  to `… Typography, Spacing, Grid, Patterns …`; storySort regenerated. Updated the
  two inbound links (Introduction.mdx, Grid.mdx).
- **Table parsing.** Grid tables converted from markdown to styled `<table>`
  components (matching the proven Layout/Spacing pattern) so they parse and style
  consistently. Verified in-browser.
- **Do's & don'ts.** Now a sectioned, side-by-side two-column block (green Do /
  red Don't with icons) via `GridStories.DosAndDonts`. Verified in-browser.
- **Sidebar 164.** Reconciled the 164↔184 drift in favour of **164px**
  (`--layout-sidebar-width`). Finding: the 184 was a hardcoded tab width, not a
  different grouping. Introduced `SIDEBAR_WIDTH = 164` constant in PageLayout and
  fixed all shell refs: PageLayout wrapper+inner, both SidebarTab copies
  (specs + components/navigation), TopBar `TOPBAR_LEFT_EXPANDED_WIDTH`. Grid math
  (1164 @ XL) now holds on both sides.
- **Vercel purge.** No real Vercel config existed (no vercel.json/.vercel/workflow).
  Removed the stray refs: `.vercel/` from .gitignore and `vercel.app` from the
  uno-bot preflight preview-link regex. Any GitHub↔Vercel integration the user sees
  is an external app/dashboard connection to disconnect on Vercel's side.
- **Figma breakpoint.** `Breakpoint` set (6:349) made desktop-only: deleted the
  off-spec `05 - Mobile (320)` and `04 - Tablet Small (600)` variants + their 2
  demo instances on the Layout & Grid page; added an MD (768) demo instance to
  complete the XL/LG/MD row; renumbered Fluid 06→04; compacted variants (set width
  6132→5012). Result: XL / LG / MD / Fluid. Flagged variant *naming* (Desktop HD /
  Desktop / Tablet vs MD/LG/XL) for user review.

## Round 8 — table fixes, cross-page consistency, app-shell component

- **Figma breakpoint naming.** Renamed variant values to **MD (768) / LG (1024) /
  XL (1440) / Fluid** (6:349); demo instances re-resolve cleanly.
- **Spacing page (was "very broken").** Root cause: markdown tables don't parse in
  this MDX setup — the Primitive scale etc. rendered as raw pipes. Converted ALL
  Spacing tables to styled components (Spacing.stories.jsx) with ONE shared column
  geometry (`tableLayout: fixed` + colgroup) so Token/Value/Description line up
  across every context table. Rewrote Spacing.mdx to the canonical wrapper +
  doc-section + `###` structure.
- **Grid Do/Don't → matched pairs.** Rebuilt as a 2-col grid where each row is one
  Do and its corresponding Don't on the same topic (zebra rows), not two big blocks.
- **Cross-page consistency.** Normalized foundation pages: `###` section headings
  everywhere (Grid, Spacing, DesignTokens, Accessibility converted from `##`);
  removed the `padding:24px, margin:0 auto` indent wrappers from Colors/Icons/
  Elevation/Typography stories so content is flush-left with headings (fixes the
  Iconography optical-balance drift). Also converted the last two broken-markdown
  pages (Accessibility, DesignTokens) to styled tables + canonical structure.
- **Display block bg+border restored.** `DocsPreviewCard` was missing its border;
  now surface-container-lowest fill + outline-variant border. ResponsiveFrame outer
  wrapper is now the DISPLAY WELL (surface-container-lowest fill, outline-variant
  border, 12px radius, padding) while the inner page stays clean — display blocks
  are distinguishable again without the doubled-outline the user disliked.
- **Figma app-shell starting point (NEW).** Built `Pattern/App shell` component on
  the Patterns page: TopNav (52) + SideNav (**164**) + Main (an INSTANCE of
  Pattern/Surface container = 1164px, carrying the 12-col grid + a fillable Content
  slot). All fills token-bound (surface / surface-container). Grid math matches
  PageLayout exactly: 1440 − 32 − 164 − 16 − 64 = 1164. Consumers instance it and
  fill the Main slot to start an empty screen.
- **Container #4 = Fluid.** The Fluid breakpoint variant is the fluid-grid mode
  (columns stretch to fill Main; no fixed max width) — for boards/timelines/canvases.
- **FLAGGED:** the existing breakpoint grid-annotation frames still label the SideNav
  at **200px** (should be 164). Left untouched to avoid disturbing the grid overlay
  alignment — needs a careful pass or user confirmation.

All Storybook builds green (exit 0).

## Round 9 — top-padding fix, correct app-shell (real components + slot), naming

- **Foundation top-padding inconsistency fixed.** Grid/Spacing/DesignTokens/
  Accessibility had a literal `# H1` INSIDE the `--page` wrapper (which carries
  margin-top 4–6rem), pushing the title down vs Color/Typography (which put
  `<Title/>` OUTSIDE the wrapper). Moved all four to `<Title/>`-outside + intro
  paragraph inside. Build green; verified Spacing title now flush like Color.
- **App-shell corrected.** Deleted my wrong BS4 placeholder shell. Learned the real
  structure: the typical page is the `App Outer Layout` component (Top Bar variant
  set + Main Container[ Side Bar 164 + Content Container ]) using the REAL Top Bar +
  Side Bar components. Built a correct reference shell in the Web App Specs file
  using instances of the real Top Bar (expanded) + Side Bar (164) + a Main region
  (surface, 12-col grid, 32 pad) with a slot-ready Content frame. Exact math:
  164 + 16 + 1228 (inner 1164).
- **Cross-file slot gap found.** The BS4 `Pattern/Surface container` slot
  (key 8df64f18…) is NOT published/enabled in the Web App Specs file
  (`importComponentByKeyAsync` → "key not found"), and this file has NO local color
  variables (they come from the BS4 library). Native slots can't be created via API.
  So making typical pages truly use the slot needs either: publish BS4 pattern as a
  library + enable here, OR create a local Surface-container slot component here
  (with the one manual "convert frame to slot" UI step).
- **Naming alignment (PENDING — figma-plus transport dropping).** Target mapping to
  match Storybook: Figma `Side Bar`→`Sidebar`, `Side Bar Tab`→`Sidebar Tab`,
  `App Outer Layout`→`Page Layout` (`Top Bar` already matches). Rename attempts
  failed on repeated MCP transport drops; needs a retry when the connection is stable.
- **Patterns docs** (skip the `--page` wrapper, off styling) — deferred to the
  Storybook-finalization phase per the user's gate.

## Round 10 — full docs-shell sweep, adaptive mode-driven grid, Badge parity fix

- **Storybook shell consistency (370 MDX audited, 131 fixed).** Canonical shell
  ratified from Button.mdx: `<Title/>` → intro → ResourcesBlock → `--page` wrapper
  → doc-sections. Codemod: 76 specs pages missing `--page`; 40 dataviz pages
  wrapped; 11 Overview/H1 pages converted to `<Title>` blocks (## → ###);
  Patterns/Introduction rewritten canonical (its markdown table → styled JSX
  table); Grid/Spacing/DesignTokens/Accessibility intros + ResourcesBlocks moved
  to Button position. Re-audit: 0 offenders. Build green (exit 0).
- **BS4 adaptive grid + tokens (THE mode-driven design).** Discovered `size /
  layout` collection already has MD/LG/XL MODES with `Breakpoints/min width`
  (768/1024/1440), `Columns/col-1..12`, and `Display/*` visibility booleans.
  Derived from col-* math that the CONTENT grid gutter is **8px** (12×89.67+11×8
  = 1164), not the 12/16 viewport gutters. Created mode-varying vars: Grid/columns,
  Grid/content-gutter (8), Grid/viewport-gutter (12/16/16), Grid/viewport-margin
  (16/32/32), Main/width (736/812/1228).
  - **Pattern/Surface container retokenized** from wrong element-tier bindings
    (pad 12/6, gap 10, radius 4, surface-container fill) to Surface tier: fill →
    surface, pad → Surface/pad-x/y (32/24), gap → Surface/gap-md, radius →
    Surface/radius (16), width BOUND to Main/width, minWidth 736. ONE grid style
    "Grid/Adaptive (12-col)" (count/gutter bound to Grid/*, offset bound to
    Surface/pad-x) applied to it. **Mode-flip verified: MD 736/672, LG 812/748,
    XL 1228/1164 — slot width = col-12 at every mode.**
  - **Breakpoint set**: ONE "Grid/Viewport (adaptive)" style on all variants, each
    variant pinned to its size/layout mode, widths bound to Breakpoints/min width.
    Old static grid styles (MD 768/LG 1024/XL 1440/Main region) retired.
  - Pattern audit: Card/Modal fully bound; Table no-fill + Section no-fill are
    per-SSOT intentional; nothing numeric left unbound.
- **Naming sync (Web App Specs)**: `Side Bar`→`Sidebar`, `Side Bar Tab`→`Sidebar
  Tab`, `App Outer Layout`→`Page Layout`; `Top Bar` already matched Storybook.
- **Badge parity FIXED (user's example).** Figma truth (Static Badges 25:568):
  rounded rectangles, radius by tier — h1–h3 radius-lg 8, h4–h6 radius-150 6,
  b1–b3 radius-md 4; state-08 fills (already matched). Code rendered a 999px PILL.
  Badge.scss now applies the tiered radii; verified in-browser (b2 → 4px).
- **NEXT (user gate)**: user publishes the BS4 library → then rebuild Page Layout
  in Web App Specs as ONE mode-adaptive component: insert Pattern/Surface
  container instance as Main, bind width to Breakpoints/min width, Sidebar
  visibility → Display/* booleans, tokenized shell paddings; then finalize
  Storybook docs (Grid doc gutter correction: content grid = 8px) + full
  component-parity sweep.

## Round 12 — full parity sweep (inventory, naming, spec links)

- Extracted full inventories: BS4 197 top-level components/sets; Web App Specs
  180 organisms (per-page shallow section walk); Storybook 58 component/pattern
  titles + 266 spec MDX.
- **figmaLinks: 0 placeholders remain** (was 145): 28 name-matched, 70 curated
  to parent sets, 47 page-anchored (each page-anchor = a Figma-side
  componentization gap, listed in the report).
- Naming sync: BS4 `Side Bar Tab`→`Sidebar Tab`, `Pattern/Table shell`→`Pattern/Table`.
- Report: docs/context/design-system/figma-storybook-parity-2026-07.md — open
  decisions: graduate `_internal/Table` + `_internal/Navbar` (Figma documents
  both publicly), add missing `Pattern/Surface` in Figma, archive legacy Input
  Group generations, de-[wip] the Card page.
- Verified: build green, 117/117 spec tests. Committed ca3dd6d9, pushed.

## Round 13 — responsive page previews: fullscreen, reflow, breakpoint pickup

User asks (page documentation): (1) always-available fullscreen, (2) pages
display responsively to the width given, (3) pick up the breakpoint spec
(Sidebar hidden + TopBar collapsed at MD).

- **ResponsiveFrame rewritten.** Was: forced fixed width (768/1024/1440) + scroll,
  fullscreen button gated behind `showToolbar` (never passed). Now: inner is
  `width:100%, maxWidth:<bp>` — the page fills the given width and reflows (block
  layout so it doesn't shrink to min-content), `containerType: inline-size`. An
  always-visible **Fullscreen** button (top-right); toggle uses native Fullscreen
  API with a CSS `position:fixed` overlay fallback where the host iframe blocks it.
  Nesting-safe via React context (inner RF → pass-through) so the 17 stories that
  wrap themselves don't double-frame.
- **Global coverage.** preview.jsx decorator now wraps EVERY `Specs/*/Pages/*`
  story in ResponsiveFrame (covers the 26 pages that never imported it), folding
  the Breakpoint toolbar in. Elements/Cards keep the lightweight width constraint.
- **Breakpoint pickup fixed.** Root cause: the old fixed 1440 inner made
  PageLayout's ResizeObserver always see ≥1024, so the Sidebar never collapsed.
  With the responsive inner it sees the real width → Sidebar hides + TopBar
  collapses below LG. Verified: MD → sidebarW 0, TopBar hamburger; XL → sidebar 164.
- **No flash.** Added a `useLayoutEffect` initial measure in PageLayout so a page
  mounted narrow starts collapsed before paint (no expanded→collapsed flicker).
- Build green (exit 0); verified across Page Layout, PostSessionPage (no-RF page),
  MD/XL, and the fullscreen button on all page stories.
