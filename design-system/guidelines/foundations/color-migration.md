---
summary: How to move one component from the legacy color tokens onto the --ds- tokens, end to end
---

<!-- Tier: 2 -->

# Color migration

This guide moves one component from the legacy color tokens (`--color-*`,
`--surface-*` colors, `--elevation-light-*`) onto the `--ds-*` tokens. The
legacy names keep working while the sweep runs, so you can migrate one
component at a time and ship it alone. They are light-only, though: a
component that reads `--color-*` or a hex fallback stays light in dark mode.
New code uses `--ds-*`, and `npm run check:legacy-colors` fails a file whose
legacy count rises above its baseline (a new file's baseline is zero). The list at the end says which
components are left; when it is empty, this guide is deleted.

The new tokens are named `color.property.role.emphasis.state`. In CSS, drop
the leading `color.` or `elevation.` and turn the dots into dashes:
`color.text.subtle` is `var(--ds-text-subtle)`, `elevation.surface.raised` is
`var(--ds-surface-raised)`. Every name is listed under § Color Tokens in
`design-system/agent-views/tokens/tokens.md`. Each token has four values —
light, dark, and each with increased contrast — so one name covers every mode.

## The steps

Do these in order, one component per pull request.

1. **Pick** a component from § Components still on legacy tokens. Start with
   one that has few uses, and take only a row whose Status starts with `take`.
   In Forms & Inputs, move colors only: shape and states stay with Cynthia's
   Button refresh.
2. **Branch** from the latest main: `git fetch origin && git checkout -b color/<component> origin/main`.
3. **List** every legacy use in the component's files, stories and MDX
   included. Use the first command for a component with its own folder, the
   second for flat files (`Checkbox.jsx`, `Checkbox.scss`). The second filter
   drops the spacing names and tests, which the list does not count either.

   ```sh
   grep -rnE "var\(--(color|surface|elevation)-" design-system/src/components/<category>/<Name>/ | grep -vE "var\(--surface-(container|pad|stack|radius)|\.test\."
   grep -nE "var\(--(color|surface|elevation)-" design-system/src/components/<category>/<Name>.* | grep -vE "var\(--surface-(container|pad|stack|radius)|\.test\."
   ```
4. **Map** each line to a new token, using § Reading the map and § Pattern
   rows. Write the target beside the line before you change anything.
5. **Replace** each `var()`. Delete comments that quote the old hex value
   (`// Figma: #3f484a`); they describe a color that is gone.
6. **Regenerate** what reads the component: `npm run generate:component-docs`
   (the component's `index.md` lists its tokens) and
   `npm run generate:legacy-color-list` (the list at the end of this guide).
7. **Check** with the commands in § Checks, then **verify** in Storybook in
   all four modes (§ Verify in the four modes).

The component is done when the grep in step 3 prints nothing, it has left the
generated list, every check passes, and every story reads correctly in all
four modes.

## Reading the map

The map is `scripts/lib/color/legacy-map.mjs`. Each entry in `ROWS` has:

- `today`: the legacy name, as a reader would say it.
- `match`: a pattern over the CSS name. `rowFor('--color-outline-variant')`
  returns the row a name falls under.
- `proposed`: the new token, or several separated by `·`.
- `note`: why, when it is not obvious.

**Read the map by (token, CSS property), not by token alone.** One legacy name
often does two jobs, and each job has its own target. Look at the property the
`var()` sits on and at what the element is, then pick the target for that job.

| Legacy name | Used as | New token |
|---|---|---|
| `--color-on-surface` | `color` of text | `--ds-text` |
| | `color` or `fill` of an icon | `--ds-icon` |
| `--color-on-surface-variant` | text | `--ds-text-subtle` |
| | meta text: breadcrumbs, timestamps, metadata | `--ds-text-subtlest` (see below) |
| | icon | `--ds-icon-subtle` |
| `--color-outline-variant` | `border`, divider | `--ds-border` |
| | text (it would fall to 1.2:1) | `--ds-text-subtlest` |
| | track or bar fill | `--ds-background-neutral` |
| `--color-outline` | border of a control | `--ds-border-input` |
| | strong edge, table head rule | `--ds-border-bold` |
| `--color-primary` | `background` | `--ds-background-brand-bold` |
| | `border` | `--ds-border-brand` |
| | link text | `--ds-link` |
| `--color-primary-text` | brand text that is not a link | `--ds-text-brand` |
| | `color` of a link | `--ds-link` (see below) |
| `--color-on-primary` | text or icon on a bold fill | `--ds-text-inverse`, `--ds-icon-inverse` |
| `--color-surface-container*` | well or recessed area | `--ds-surface-container`, `--ds-background-neutral` |
| `--color-surface-container-lowest` | card, page or menu fill | `--ds-surface`, `--ds-surface-raised`, `--ds-surface-overlay` |

Two of these rows go past a single map row, and each rests on a source:

- **A link takes `--ds-link`, whatever brand name it used.** The map's
  `--color-primary (border / text)` row sends a brand color used as a link to
  `color.link`, and the proposal's Links spec sets every link to `color.link`
  (lagoon.800, the same step as `color.text.brand`). The `--color-primary-text`
  row only lists `color.text.brand` because it describes brand text in general.
- **Meta text takes `--ds-text-subtlest`.** That token is
  tertiary text, such as meta-data and breadcrumbs. PLUS darkened it a half
  step (neutral 750) so it keeps 4.5:1 on hovered and selected rows, which is
  why it is safe for text.

**Interaction states map by what the element is.** The set has opaque named
steps:

- A selected element (`aria-selected`, `aria-current`, `.active`, expanded)
  takes `--ds-background-selected`, and `--ds-background-selected-hovered`
  when hovered.
- A row, menu item or sidebar item takes `--ds-background-neutral-subtle-hovered`
  and `-pressed`.
- A bold fill takes its role's own steps: `--ds-background-brand-bold-hovered`,
  `--ds-background-danger-bold-pressed`.
- Only an avatar or an image, whose fill cannot change, keeps a translucent
  overlay: `--ds-interaction-hovered` and `-pressed`.

**Status, info, tertiary and SMART colors move here too.** `--color-danger-text`
becomes `--ds-text-danger`. Info becomes the blue `information` role
(`--ds-text-information`, `--ds-background-information`). Tertiary becomes the
teal accent (`--ds-text-accent-teal`, `--ds-background-accent-teal-subtler`).
Each SMART subject becomes its own role (`--ds-text-smart-relationship`,
`--ds-border-smart-relationship`). Their hues change under the new ramps, so
look at them in Storybook.

**Disabled is a color, not an opacity.** Use `--ds-text-disabled` and
`--ds-background-disabled`. `--ds-opacity-disabled` is for images only.

When a name has no row, or none of the row's targets fits the job, stop and ask
in the pull request rather than choosing by eye. A name used in a component
and defined nowhere (`npm run check:undefined-tokens` lists them) is a bug at
the call site: replace it with the token it meant.

## Partners move together

A text color and the background it is drawn on move in the same change. The
`PAIRS` list in `legacy-map.mjs` names the partners: brand text with the brand
container, secondary text with the secondary container,
on-surface text with every surface, inverse text with the inverse surface.

Moving one side alone pairs a new color with an old one nobody chose, and the
pair can fall under the 4.5:1 floor. `check:color-system` refuses an alias sheet
that splits a pair. Inside a component, you hold the rule yourself: if a rule
sets both `color` and `background-color`, move both lines, and if you move a
background, move the text and icons on it. `check:text-contrast` measures each
`color:` against the ground its own rule sets.

Partners move together only when they paint in the same rule or the same
component. A component that sets no background sits on a ground someone else
owns, so only its own lines move.

## Pattern rows

When the component is one of these patterns, or draws one, the pattern row
wins over the per-name map: each pattern gets exactly one elevation level, so
nobody chooses a shadow by eye. Names here drop the leading `color.` where the
proposal does (`background.selected` is `color.background.selected`, so
`--ds-background-selected`); `elevation.` names keep theirs.

| Pattern | Tokens |
|---|---|
| Frame (topbar and docked sidebar) | `elevation.surface.sunken`; topbar has no border |
| Sidebar item | hovered `background.neutral.subtle.hovered`; selected `background.selected` + `text.selected` + `icon.selected`, label in the medium weight, no leading bar |
| Sidebar peek (floating, below 1024) | `elevation.surface.overlay` + `elevation.shadow.overlay` |
| Surface (the inner box) | `elevation.surface`, no border; the docked sidebar ends in `color.border` |
| Section | no fill; `color.border` divider when needed |
| Card, at rest | `elevation.surface.raised` + `elevation.shadow.raised`, no border |
| Card, clickable | hovered `elevation.surface.raised.hovered` + `elevation.shadow.overlay`; pressed `elevation.surface.raised.pressed` + `elevation.shadow.raised` |
| Well inside a card | `elevation.surface.container` |
| Table and Tree | grid lines `color.border`; head rule `color.border.bold`; row hovered `background.neutral.subtle.hovered`; row selected `background.selected` across the whole row (no leading bar; the checkbox is the non-color cue); sticky cells `utility.elevation.surface.current`; sticky edge `elevation.shadow.overflow` while scrolled |
| Tile | rest `background.neutral.subtle`; hovered `background.neutral.subtle.hovered`; selected `background.selected` + `border.selected` |
| Popover: menu, popup, flag | `elevation.surface.overlay` + `elevation.shadow.overlay` |
| Tooltip | `background.neutral.bold` + `text.inverse` |
| Flag | `elevation.surface.overlay` + `elevation.shadow.overlay` + `icon.<role>` |
| Alert (inline) | `background.<role>` + `icon.<role>` + `color.text` |
| Overlay (scrim) | `color.blanket` |
| Modal | `elevation.surface.overlay` + `elevation.shadow.overlay` |
| Input | `background.input` + `border.input`; focus ring `border.focused` (2px, offset 2px); invalid `border.danger` + `text.danger` helper; placeholder `text.subtlest`; helper `text.subtle`; read-only `background.neutral` |
| Progress and meter | track `background.neutral`; fill `background.brand.bold`, `background.success.bold` or `background.warning.bold` |
| Chart | one series `color.chart.brand`; comparison `color.chart.neutral`; series 1–4 `color.chart.categorical.1` to `color.chart.categorical.4` |
| Skeleton | `color.skeleton` / `color.skeleton.subtle` |
| SMART subject tag | `background.smart.<subject>` + `text.smart.<subject>` |
| SMART illustration body | `background.smart.<subject>.subtle`, the mid step at `background.accent.<hue>.subtle` strength; line work `icon.subtle` |
| Avatar fallback | `background.accent.<hue>.subtler` + `text.accent.<hue>` (for example `background.accent.teal.subtler` + `text.accent.teal`); hovered `color.interaction.hovered` |
| Divider | `color.border` |
| Scroll bar thumb | `background.neutral.hovered` / `background.neutral.pressed` |
| Empty state | `icon.subtlest` + `text.subtle` |

Two rules ride with the patterns. Links in running text are underlined at rest,
because `--ds-link` alone is too close to body text; navigation, menus,
buttons and card titles may drop the underline. The focus ring sits outside the
element on the surface; inside a bold fill, use `--ds-border-focused-inverse`.

## Checks

Run each before you open the pull request. `check:harness` runs most of them in
one go and is what CI runs.

| Command | Catches |
|---|---|
| `npm run check:color-system` | a broken contrast promise in any mode, and a legacy name with no map row |
| `npm run check:color-tokens` | a hand edit to the generated files in `design-system/src/tokens/color/` |
| `npm run check:ds-fallbacks` | a fallback on a new token: write `var(--ds-text)`, never `var(--ds-text, #000)` |
| `npm run check:storybook` | stories that fail to render, and new accessibility violations (needs `npm ci` and Playwright's Chromium) |
| `npm run check:harness` | the rest, including `check:text-contrast`, `check:component-docs` and `check:legacy-color-list` |

## Verify in the four modes

Run `npm run storybook` and open the component. The toolbar has two menus:
**Color mode** (Light, Dark, Auto (follow the OS)) and **Contrast**
(Standard contrast, More contrast, Auto (follow the OS)). The four modes are
the combinations of the explicit choices:

1. Light + Standard contrast
2. Dark + Standard contrast
3. Light + More contrast
4. Dark + More contrast

In each mode, go through every story and check that text and icons read
against their ground, that edges and dividers are visible, and that hovered,
pressed, selected, focused and disabled states are each distinct. Open the
**Accessibility** panel and confirm it shows no new violation. Each Auto only
follows the operating system's setting; check it once to see it switch.

## Pull request checklist

Copy this into the pull request body:

```markdown
- [ ] One component: `<category>/<Name>`, a `take` row in the guide's list
- [ ] The grep for `var(--color-`, `var(--surface-`, `var(--elevation-` in its folder prints nothing
- [ ] Each target chosen by (token, CSS property); any judgment call named below
- [ ] Text and its background moved together
- [ ] No fallbacks, no hex literals, no stale hex comments
- [ ] `npm run generate:component-docs` and `npm run generate:legacy-color-list` run
- [ ] `check:harness` and `check:storybook` pass
- [ ] Checked in Light, Dark, Light + More contrast, Dark + More contrast
- [ ] Screenshots: before and after, light and dark
```

## Worked example: Breadcrumb

`navigation/Breadcrumb` has five legacy uses across two names, which makes it a
good first component.

**List.** The grep from step 3 finds four lines in `Breadcrumb.scss` and one in
`Breadcrumb.Subcomponents.stories.jsx`:

| Where | Today | Property and job |
|---|---|---|
| `.breadcrumb-item + .breadcrumb-item::before` | `--color-on-surface-variant` | `color` of the `/` separator: meta text |
| `.breadcrumb-item a` | `--color-primary-text` | `color` of a link |
| `.breadcrumb-item a:hover` | `--color-primary-text` | `color` of a hovered link |
| `.breadcrumb-item.active` | `--color-on-surface-variant` | `color` of the current page: meta text |
| the story's separator `<span>` | `--color-on-surface-variant` | `color` of the separator |

**Map.** The separator and the current page are breadcrumb meta text, so both
take `--ds-text-subtlest`, the token for breadcrumbs (§ Reading
the map). The two link rules are `color` on an `<a>`, so they take `--ds-link`
by the link row, which rests on the map's `--color-primary (border / text)`
row and the Links spec. `--ds-link` has no hovered step, so the hover rule
keeps `--ds-link` and the underline it already adds. A token swap changes no
states: add no `:active` rule. Breadcrumb is navigation, so the link may stay
without an underline at rest.

**Partners.** Breadcrumb sets `background-color: transparent` and no other
ground: it sits on whatever surface holds it. Its text paints in no rule that
also paints a background, so nothing else moves.

**Replace.** Swap the five `var()`s and delete the three `// Figma: #…`
comments beside them.

**Regenerate.** `npm run generate:component-docs` updates the token line in
`navigation/Breadcrumb/index.md`. `npm run generate:legacy-color-list` drops
Breadcrumb from the list below.

**Check and verify.** Run § Checks, then open Breadcrumb in Storybook and step
through the four modes. In dark, confirm the link reads against the dark
surface and the current page still reads as meta text, not disabled.

## Components still on legacy tokens

The list counts `var()` uses. One holdout is invisible to it: Dropdown's
toggle themes name legacy tokens as strings in a Sass map, and they stay on
legacy with Button until Cynthia's Button refresh moves both.

<!-- gen:LEGACY-COMPONENTS -->
325 rows, 2287 legacy uses — design-system components, specs and prototype files alike. Generated by `npm run generate:legacy-color-list`; edit the components or `HOLDS` in that script, not this table.

| Component | Uses | Legacy names | Status |
|---|---:|---|---|
| `prototypes/monthly-report/src/MonthlyReportPage.scss` | 125 | 23 names | take |
| `prototypes/storybook-ai-agent-llm-api/StorybookAIAgent.scss` | 92 | 44 names | take |
| `specs/Toolkit/In-Session/Modals/InSessionPopUpModal.stories.jsx` | 63 | 7 names | take |
| `specs/Training/Lessons/Pages/LessonsDetailPage/LessonsDetailPage.scss` | 42 | 13 names | take |
| `images-and-icons/Tile` | 39 | 31 names | take |
| `specs/Toolkit/Pre-Session/Tables/SignInTable.stories.jsx` | 34 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `prototypes/storybook-ai-agent-llm-api/StorybookAIAgent.jsx` | 31 | 19 names | take |
| `navigation/Pagination` | 29 | 8 names | take |
| `specs/Toolkit/In-Session/Elements/RequestTutor/RequestTutorOffCanvas.jsx` | 29 | 9 names | take |
| `specs/Toolkit/Pre-Session/Modals/SessionFillIns/SessionFillIns.stories.jsx` | 28 | 7 names | take |
| `specs/Toolkit/Pre-Session/Modals/SessionDetailsAllUser/SessionDetails.stories.jsx` | 26 | 5 names | take |
| `forms-and-inputs/RichTextEditor` | 25 | 11 names | take |
| `specs/Toolkit/Pre-Session/Elements/SupervisorControls/SupervisorControls.stories.jsx` | 25 | 7 names | take |
| `layout-and-structure/ListGroup` | 24 | 18 names | take |
| `specs/Toolkit/Pre-Session/Modals/TutorCallOffDetailsModals.stories.jsx` | 24 | 9 names | take |
| `specs/Toolkit/Pre-Session/Tables/FillInTable.stories.jsx` | 22 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `forms-and-inputs/FileUpload` | 21 | 7 names | take |
| `navigation/NavPills` | 20 | 8 names | take |
| `prototypes/in-session-ux/ReflectionAssistant/ReflectionWidgets.jsx` | 19 | 6 names | take |
| `specs/Universal/Cards/OverviewCard/OverviewCard.scss` | 19 | 15 names | take |
| `navigation/Scrollspy` | 18 | 10 names | take |
| `prototypes/in-session-ux/StudentInsightsModal.jsx` | 18 | 6 names | take |
| `specs/Home/Modals/UserFeedbackModal/UserFeedbackModal.scss` | 18 | 10 names | take |
| `specs/Toolkit/In-Session/Tables/StudentListItems.stories.jsx` | 18 | 8 names | take |
| `specs/Toolkit/Pre-Session/Tables/AllSessionsTable.stories.jsx` | 18 | 6 names | take |
| `specs/Home/Cards/TrainingProgressCard/TrainingProgressCard.jsx` | 17 | 12 names | take |
| `specs/Home/Sections/StudentsOverviewSection/StudentsOverviewSection.scss` | 17 | 8 names | take |
| `specs/Profile/Pages/TutorProfilePage/TutorProfilePage.stories.jsx` | 17 | 5 names | take |
| `specs/Universal/Cards/OverviewCard/OverviewCard.jsx` | 17 | 17 names | take |
| `layout-and-structure/Collapse` | 16 | 8 names | take |
| `specs/Toolkit/In-Session/Modals/AddModal.stories.jsx` | 16 | 5 names | take |
| `specs/Toolkit/In-Session/Pages/StudentDashboard.stories.jsx` | 16 | `--color-on-surface` · `--color-on-surface-variant` · `--color-outline-variant` | take |
| `specs/Training/Training.stories.jsx` | 16 | 6 names | take |
| `prototypes/in-session-ux/ManageAssignmentModal.jsx` | 15 | 5 names | take |
| `specs/Admin/Student/Modals/StudentModal/StudentModal.scss` | 15 | 8 names | take |
| `specs/Home/Modals/UpdateNotification/UpdateNotification.scss` | 15 | 7 names | take |
| `specs/Toolkit/Pre-Session/Modals/Sign-Ups/SignUps.stories.jsx` | 15 | 4 names | take |
| `specs/Admin/Tutor/Elements/AdminDateRangeFilter/AdminDateRangeFilter.stories.jsx` | 14 | 7 names | take |
| `specs/Home/Cards/DataVisualization/DataVisualization.scss` | 14 | 7 names | take |
| `specs/Profile/Modals/PreviewImage.stories.jsx` | 14 | 7 names | take |
| `specs/Toolkit/Pre-Session/Tables/ReflectionsTable.stories.jsx` | 14 | 5 names | take |
| `forms-and-inputs/Rating` | 13 | 7 names | take |
| `prototypes/live-app/src/LiveAppNav.scss` | 13 | 7 names | take |
| `specs/Admin/Tutor/Modals/TutorModal/TutorModal.scss` | 13 | 7 names | take |
| `specs/Toolkit/Pre-Session/Tables/CallOffsTable.stories.jsx` | 13 | 4 names | take |
| `specs/Admin/Student/Sections/StudentOverviewSection/StudentOverviewSection.scss` | 12 | 6 names | take |
| `navigation/Navbar` | 11 | 8 names | take |
| `prototypes/starter/src/App.jsx` | 11 | 7 names | take |
| `specs/Admin/Tutor/Tables/TutorsTrainingProgressTable/TutorsTrainingProgressTable.scss` | 11 | 7 names | take |
| `specs/Toolkit/Pre-Session/Cards/CallOffAlerts.stories.jsx` | 11 | 6 names | take |
| `specs/Toolkit/Pre-Session/Elements/SessionAttendeeListItems/SessionAttendeeListItems.stories.jsx` | 11 | 4 names | take |
| `specs/Toolkit/Pre-Session/Tables/FillInSchedule.stories.jsx` | 11 | `--color-on-surface` · `--color-outline-variant` · `--color-secondary-text` | take |
| `layout-and-structure/Divider` | 10 | `--color-on-surface` · `--color-outline` · `--color-outline-variant` | take |
| `layout-and-structure/ScrollBar` | 10 | 4 names | take |
| `prototypes/home-redesign/src/App.css` | 10 | 5 names | take |
| `prototypes/in-session-ux/ReflectionAssistant/CompactReflectionBar.jsx` | 10 | 7 names | take |
| `prototypes/research-assistant-chat/src/components/CompactChatBar.tsx` | 10 | 7 names | take |
| `specs/Login/Cards/LoginPortal/LoginPortal.scss` | 10 | 8 names | take |
| `specs/Toolkit/In-Session/Tables/StudentList.stories.jsx` | 10 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/Call-Offs/CallOffRequestDetails.stories.jsx` | 10 | 5 names | take |
| `specs/Toolkit/Pre-Session/Pages/AllSessionsWithModals.stories.jsx` | 10 | 5 names | take |
| `specs/Toolkit/Pre-Session/Tables/MySessions.stories.jsx` | 10 | `--color-on-surface` · `--color-outline-variant` · `--color-secondary-text` | take |
| `_internal/SessionManagementSnackbar` | 9 | 7 names | take: internal composite; verify in the stories that render it |
| `messaging/Alert` | 9 | 5 names | take |
| `specs/Admin/Session/Tables/SessionBreakdownTable/SessionBreakdownTable.scss` | 9 | 4 names | take |
| `specs/Home/Cards/MetricsCard/MetricsCard.scss` | 9 | 5 names | take |
| `specs/Toolkit/In-Session/Elements/SessionControlsConsolidated/SessionControlsConsolidated.stories.jsx` | 9 | 4 names | take |
| `specs/Toolkit/Pre-Session/Pages/SignUpsWithModals.stories.jsx` | 9 | 5 names | take |
| `forms-and-inputs/ChoiceGrid` | 8 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-low` | take |
| `prototypes/home-redesign/src/components/DevIndexPage.jsx` | 8 | 6 names | take |
| `prototypes/templates/admin/tutor-admin.js` | 8 | 5 names | take |
| `specs/Admin/Session/Sections/SessionOverviewSection/SessionOverviewSection.scss` | 8 | 6 names | take |
| `specs/Home/Cards/RecommendedLessons/RecommendedLessons.scss` | 8 | 6 names | take |
| `specs/Toolkit/Pre-Session/Pages/MySessions.stories.jsx` | 8 | 5 names | take |
| `specs/Toolkit/Pre-Session/Pages/_pageHelpers.jsx` | 8 | 4 names | take |
| `specs/Training/Lessons/Sections/LessonListSection/LessonListSection.scss` | 8 | 7 names | take |
| `specs/Training/Lessons/Sections/LessonWelcomeSection/LessonWelcomeSection.scss` | 8 | 6 names | take |
| `specs/Training/Lessons/Tables/LessonsTable/LessonsTable.scss` | 8 | 6 names | take |
| `layout-and-structure/Accordion` | 7 | `--color-on-surface` · `--color-outline-variant` | take |
| `prototypes/home-redesign/src/components/MonthlyReportsContent.scss` | 7 | 4 names | take |
| `prototypes/in-session-ux/ReflectionAssistant/ToolUI.jsx` | 7 | `--color-primary` | take |
| `prototypes/monthly-report/src/MonthlyReportsListPage.scss` | 7 | 4 names | take |
| `specs/Admin/Group/Tables/GroupTrainingProgressTable/GroupTrainingProgressTable.jsx` | 7 | 4 names | take |
| `specs/Admin/Session/Tables/SessionsTable/SessionsTable.scss` | 7 | 4 names | take |
| `specs/Admin/Student/Tables/StudentsTable/StudentsTable.jsx` | 7 | 4 names | take |
| `specs/Admin/Tutor/Tables/TutorSessionsTable/TutorSessionsTable.scss` | 7 | 4 names | take |
| `specs/Admin/Tutor/Tables/TutorsPerformanceTable/TutorsPerformanceTable.scss` | 7 | 4 names | take |
| `specs/Admin/Tutor/Tables/TutorsToolUsageTable/TutorsToolUsageTable.scss` | 7 | 4 names | take |
| `specs/Home/Sections/HomepageJumbotron/HomepageJumbotron.scss` | 7 | 5 names | take |
| `specs/Home/Sections/StudentsOverviewSection/StudentsOverviewSection.jsx` | 7 | `--color-outline-variant` · `--color-primary` · `--color-relationship-container` | take |
| `specs/Login/Modals/LoginNotificationsModal/LoginNotificationsModal.scss` | 7 | 5 names | take |
| `specs/Toolkit/Pre-Session/Elements/CallOffForm/Reason/Reason.stories.jsx` | 7 | `--color-danger` · `--color-on-surface` · `--color-secondary-text` | take |
| `specs/Toolkit/Pre-Session/Elements/CallOffForm/SupervisorSelectionDropdown/SupervisorSelectionDropdown.stories.jsx` | 7 | `--color-danger` · `--color-on-surface` · `--color-secondary-text` | take |
| `specs/Toolkit/Pre-Session/Elements/NewFormDateInput.stories.jsx` | 7 | 6 names | take |
| `specs/Toolkit/Pre-Session/Modals/ConfirmSessionAvailability/SessionDetailsNA.stories.jsx` | 7 | 5 names | take |
| `specs/Toolkit/Pre-Session/Modals/ConfirmSessionAvailability/SessionDetailsOneTimeSession.stories.jsx` | 7 | 5 names | take |
| `specs/Toolkit/Pre-Session/Modals/ConfirmSessionAvailability/SessionDetailsRecurringSession.stories.jsx` | 7 | 5 names | take |
| `specs/Toolkit/Pre-Session/Pages/CallOffs.stories.jsx` | 7 | 5 names | take |
| `specs/Toolkit/Pre-Session/Pages/ConfirmSessionAvailabilityWithModals.stories.jsx` | 7 | 4 names | take |
| `specs/Toolkit/Pre-Session/Pages/CreateNewSessionWithModals.stories.jsx` | 7 | 4 names | take |
| `specs/Toolkit/Pre-Session/Pages/DeleteSessionWithModals.stories.jsx` | 7 | 4 names | take |
| `specs/Toolkit/Pre-Session/Pages/EditSessionWithModals.stories.jsx` | 7 | 4 names | take |
| `specs/Toolkit/Pre-Session/Pages/FillInWithModals.stories.jsx` | 7 | 4 names | take |
| `specs/Training/Lessons/Elements/Toast/Toast.scss` | 7 | 7 names | take |
| `specs/Training/Onboarding/Cards/OnboardingModuleCard/OnboardingModuleCard.scss` | 7 | 5 names | take |
| `specs/Universal/Universal.stories.jsx` | 7 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container` | take |
| `images-and-icons/UserAvatar` | 6 | 5 names | take |
| `layout-and-structure/Carousel` | 6 | 5 names | take |
| `prototypes/home-redesign/src/components/Dashboard.jsx` | 6 | 6 names | take |
| `prototypes/in-session-ux/InSessionPage.jsx` | 6 | 4 names | take |
| `prototypes/research-assistant-chat/src/components/EngagementChart.tsx` | 6 | 6 names | take |
| `prototypes/research-assistant-chat/src/index.css` | 6 | 4 names | take |
| `specs/Admin/Group/Tables/GroupsTable/GroupsTable.jsx` | 6 | 5 names | take |
| `specs/Admin/Tutor/Elements/BadgeClaimedPill/BadgeClaimedPill.scss` | 6 | 6 names | take |
| `specs/Admin/Tutor/Sections/TutorToolUsageSection/TutorToolUsageSection.stories.jsx` | 6 | `--color-on-surface` · `--color-surface-container` | take |
| `specs/Home/Cards/BadgeCard/BadgeCard.scss` | 6 | `--color-on-surface-variant` · `--color-surface-container-lowest` · `--elevation-light-1` | take |
| `specs/Home/Cards/ResourceCard/ResourceCard.scss` | 6 | 5 names | take |
| `specs/Home/Cards/TrainingProgressCard/TrainingProgressCard.scss` | 6 | 4 names | take |
| `specs/Home/Elements/ButtonContainer/ButtonContainer.scss` | 6 | 5 names | take |
| `specs/Login/Elements/InstitutionForm/InstitutionForm.jsx` | 6 | `--color-on-surface` · `--color-on-surface-variant` · `--color-primary` | take |
| `specs/Toolkit/In-Session/Elements/EngagementListItems.jsx` | 6 | `--color-on-primary` · `--color-on-surface-variant` · `--color-primary` | take |
| `specs/Toolkit/In-Session/Elements/RoomNumbering/RoomNumbering.stories.jsx` | 6 | 4 names | take |
| `specs/Toolkit/In-Session/Modals/StartingZoomSession.stories.jsx` | 6 | 4 names | take |
| `specs/Toolkit/Pre-Session/Cards/OverviewCard.stories.jsx` | 6 | `--color-on-surface` · `--color-surface-container-lowest` · `--color-surface-variant` | take |
| `specs/Training/Lessons/Elements/RatingSingle/RatingSingle.scss` | 6 | 5 names | take |
| `specs/Training/Lessons/Pages/LessonsOverviewPage/LessonsOverviewPage.scss` | 6 | 4 names | take |
| `specs/Training/Onboarding/Modals/ModuleCompletionModal/ModuleCompletionModal.scss` | 6 | 4 names | take |
| `_internal/SessionAvailabilitySnackbar` | 5 | `--color-on-surface` · `--color-success` · `--color-surface` | take: internal composite; verify in the stories that render it |
| `forms-and-inputs/choiceItem` | 5 | 4 names | take |
| `layout-and-structure/MediaObject` | 5 | 4 names | take |
| `navigation/Breadcrumb` | 5 | `--color-on-surface-variant` · `--color-primary-text` | take |
| `prototypes/monthly-report/src/MonthlyReportContent.jsx` | 5 | 5 names | take |
| `prototypes/monthly-report/src/MonthlyReportPage.jsx` | 5 | 5 names | take |
| `specs/Home/Cards/DataVisualization/DataVisualizationTrainingProgress.jsx` | 5 | 5 names | take |
| `specs/Home/Elements/ResourceType/ResourceType.stories.jsx` | 5 | `--color-on-surface-variant` | take |
| `specs/Home/Pages/TutorHomePageSkillsOverviewDifferentLayout/TutorHomePageSkillsOverviewDifferentLayout.scss` | 5 | `--color-outline-variant` · `--color-surface-container-low` · `--color-surface-container-lowest` | take |
| `specs/Profile/Modals/UnsavedChanges.stories.jsx` | 5 | 4 names | take |
| `specs/Profile/Sections/BackgroundAndMatching.stories.jsx` | 5 | `--color-on-surface` · `--color-primary` · `--color-surface-container-low` | take |
| `specs/Profile/Sections/Status.stories.jsx` | 5 | `--color-on-surface` · `--color-primary` · `--color-surface-container-low` | take |
| `specs/Toolkit/In-Session/Cards/SessionInfoCard.stories.jsx` | 5 | `--color-on-surface` · `--color-on-surface-variant` · `--color-primary` | take |
| `specs/Toolkit/Pre-Session/Cards/DeleteModalSessionCard.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Cards/SessionInfoCard.stories.jsx` | 5 | `--color-on-surface` · `--color-on-surface-variant` · `--color-primary` | take |
| `specs/Toolkit/Pre-Session/Elements/DaysDropdown.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Elements/SchoolDropdown.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Elements/TeacherDropdown.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/Call-Offs/AutoApproveConfirmation.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/Call-Offs/AutoExcuseConfirmation.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/Call-Offs/CallOffConfirmation.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/CreateNewSession/UnsavedWarning.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/DeleteSession/DuringSpecificDayPeriod.stories.jsx` | 5 | `--color-on-surface-variant` · `--color-primary` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/DeleteSession/OneSessionNA.stories.jsx` | 5 | `--color-on-surface-variant` · `--color-primary` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/DeleteSession/RecurringNA.stories.jsx` | 5 | `--color-on-surface-variant` · `--color-primary` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/EditSession/AttendeeEdit.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/EditSession/UnsavedWarning.stories.jsx` | 5 | 4 names | take |
| `specs/Toolkit/Pre-Session/Modals/SessionDetailsAllUser/OneTimeAttendeesCompleted.stories.jsx` | 5 | 4 names | take |
| `specs/Training/Onboarding/Cards/OnboardingAlertCard/OnboardingAlertCard.scss` | 5 | `--color-on-primary-container` · `--color-on-surface-variant` · `--color-primary-border` | take |
| `specs/Training/Onboarding/Tables/OnboardingModulesTable/OnboardingModulesTable.jsx` | 5 | 5 names | take |
| `_internal/training` | 4 | `--color-primary` · `--color-primary-text` | take: internal composite; verify in the stories that render it |
| `forms-and-inputs/ChoiceGroup` | 4 | `--color-danger` · `--color-on-surface` | take |
| `prototypes/in-session-ux/index.css` | 4 | `--color-on-surface` · `--color-outline-variant` · `--color-surface-container-lowest` | take |
| `prototypes/research-assistant-chat/src/ResearchAssistantChat.css` | 4 | `--color-outline-variant` · `--color-surface-container-highest` | take |
| `specs/Admin/Session/Sections/SessionOverviewSection/SessionOverviewSection.jsx` | 4 | `--color-relationship-container` · `--color-success-container` · `--color-surface-container-highest` | take |
| `specs/Admin/Student/Modals/StudentModal/StudentModal.jsx` | 4 | `--color-outline-variant` · `--color-secondary` · `--color-secondary-text` | take |
| `specs/Admin/Tutor/Elements/TutorChartsElement/TutorChartsElement.scss` | 4 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Admin/Tutor/Pages/TutorStatusWarningsPage/TutorStatusWarningsPage.scss` | 4 | 4 names | take |
| `specs/Admin/Tutor/Tables/TutorsStatusAndWarningsTable/TutorsStatusAndWarningsTable.scss` | 4 | 4 names | take |
| `specs/Admin/Tutor/Tables/TutorsTrainingProgressTable/TutorsTrainingProgressTable.jsx` | 4 | 4 names | take |
| `specs/Home/Elements/CertifiedTutorBadge/CertifiedTutorBadge.stories.jsx` | 4 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container-lowest` | take |
| `specs/Login/Elements/shared/login-field.scss` | 4 | 4 names | take |
| `specs/Profile/Elements/ClearanceStatus.stories.jsx` | 4 | 4 names | take |
| `specs/Profile/Elements/UpdateProfileToast.stories.jsx` | 4 | `--color-on-surface` · `--color-on-surface-variant` · `--color-primary-text` | take |
| `specs/Profile/Sections/BasicInformation.stories.jsx` | 4 | `--color-on-surface` · `--color-primary` · `--color-surface-container-low` | take |
| `specs/Toolkit/In-Session/Elements/ReviewAssignmentsToast.stories.jsx` | 4 | `--color-on-surface` | take |
| `specs/Toolkit/In-Session/Elements/badges/EngagementBadges.stories.jsx` | 4 | `--color-surface-container` · `--color-surface-container-low` · `--color-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/CallOffForm/SupervisorDecisionRationaleTextInput/SupervisorDecisionRationale.stories.jsx` | 4 | `--color-danger` · `--color-secondary-text` | take |
| `specs/Toolkit/Pre-Session/Elements/CallOffForm/TextInputAdditionalDetails/AdditionalDetails.stories.jsx` | 4 | `--color-danger` · `--color-secondary-text` | take |
| `specs/Toolkit/Pre-Session/Modals/ConfirmSessionAvailability/AttendeesOneTimeSession.stories.jsx` | 4 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/ConfirmSessionAvailability/AttendeesRecurringSession.stories.jsx` | 4 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/EditSession/ReconfirmTutorAvailability.stories.jsx` | 4 | 4 names | take |
| `specs/Toolkit/Pre-Session/Tables/NavHorizontal.stories.jsx` | 4 | 4 names | take |
| `specs/Training/Lessons/Cards/AlertForSupervisors/AlertForSupervisors.scss` | 4 | 4 names | take |
| `specs/Training/Lessons/Elements/TrainingLessonStatusSelect/TrainingLessonStatusSelect.scss` | 4 | 4 names | take |
| `specs/Training/Lessons/Sections/LessonOverviewSection/LessonOverviewSection.scss` | 4 | `--color-on-surface` · `--color-outline-variant` · `--color-surface-container-low` | take |
| `specs/Training/Lessons/Tables/LessonsTable/LessonsTable.jsx` | 4 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Training/Onboarding/Elements/ContentBlurb/ContentBlurb.scss` | 4 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Training/Onboarding/Pages/OnboardingInnerPage/OnboardingInnerPage.scss` | 4 | 4 names | take |
| `specs/Training/Onboarding/Pages/OnboardingOverviewPage/OnboardingOverviewPage.scss` | 4 | 4 names | take |
| `specs/Universal/Sections/TopBar/TopBar.stories.jsx` | 4 | `--color-on-surface-variant` · `--color-surface-container` | take |
| `prototypes/home-redesign/src/demo.css` | 3 | `--color-on-surface` · `--color-surface-container` | take |
| `prototypes/home-redesign/src/index.css` | 3 | `--color-on-surface` · `--color-outline-variant` · `--color-surface-container` | take |
| `prototypes/in-session-ux/InSessionContent.jsx` | 3 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-highest` | take |
| `prototypes/in-session-ux/ReflectionAssistant/ReflectionAssistantChat.jsx` | 3 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/components/FakeTools.tsx` | 3 | `--color-primary` · `--color-surface-container` | take |
| `prototypes/research-assistant-chat/src/components/StrategyHeatmap.tsx` | 3 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container` | take |
| `prototypes/research-assistant-chat/src/components/TrainingProgressContent.tsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Session/Modals/SessionModal/SessionModal.scss` | 3 | `--color-on-surface` · `--color-on-surface-variant` · `--color-outline-variant` | take |
| `specs/Admin/Session/Pages/SessionAdminPage/SessionAdminPage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Student/Pages/StudentAdminPage/StudentAdminPage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Cards/TutorDataCard/TutorDataCard.scss` | 3 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-lowest` | take |
| `specs/Admin/Tutor/Modals/DeleteTutorModal/DeleteTutorModal.scss` | 3 | `--color-on-surface` · `--color-surface-container` | take |
| `specs/Admin/Tutor/Pages/TutorPerformancePage/TutorPerformancePage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Pages/TutorStatusWarningsPage/TutorStatusWarningsPage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Pages/TutorToolUsagePage/TutorToolUsagePage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.jsx` | 3 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Sections/TutorPerformanceSection/TutorPerformanceSection.stories.jsx` | 3 | `--color-surface-container` | take |
| `specs/Admin/Tutor/Sections/TutorToolUsageSection/TutorToolUsageSection.scss` | 3 | `--color-outline` · `--color-outline-variant` | take |
| `specs/Home/Elements/CardBadges/CardBadges.scss` | 3 | `--color-danger-text` · `--color-secondary-text` · `--color-success-text` | take |
| `specs/Home/Pages/TutorHomePageSkillsOverview/TutorHomePageSkillsOverview.scss` | 3 | `--color-surface-container-low` | take |
| `specs/Home/Pages/TutorHomePageSkillsProgress/TutorHomePageSkillsProgress.scss` | 3 | `--color-surface-container-low` | take |
| `specs/Login/Pages/SignInPortal/SignInPortal.jsx` | 3 | `--color-on-surface` · `--color-primary` · `--color-surface-container-low` | take |
| `specs/SpecOverview.jsx` | 3 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-container` | take |
| `specs/Toolkit/In-Session/Elements/EngagementDropdown.stories.jsx` | 3 | `--color-surface-container-low` · `--color-surface-variant` | take |
| `specs/Toolkit/In-Session/Elements/EngagementListItems.stories.jsx` | 3 | `--color-surface-container-low` · `--color-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Cards/ConfirmSessionAttendanceAlert.stories.jsx` | 3 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/TimeframeFilter.stories.jsx` | 3 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Training/Onboarding/Elements/StatusIndicators/StatusIndicators.scss` | 3 | `--color-danger` · `--color-success` · `--color-warning-text` | take |
| `specs/Training/Onboarding/Modals/StrategyContentPromptModal/StrategyContentPromptModal.scss` | 3 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-low` | take |
| `specs/Training/Onboarding/Tables/OnboardingModulesTable/OnboardingModulesTable.scss` | 3 | `--color-on-surface-variant` · `--color-outline-variant` · `--color-surface-variant` | take |
| `specs/Universal/Cards/OverviewCard/OverviewCard.stories.jsx` | 3 | `--color-surface` | take |
| `specs/Universal/Pages/PageLayout/PageLayout.stories.jsx` | 3 | `--color-on-surface-variant` | take |
| `forms-and-inputs/CloseButton` | 2 | `--color-inverse-surface` · `--color-primary` | held: Button refresh (Cynthia) |
| `layout-and-structure/Card` | 2 | `--color-on-surface-variant` · `--color-surface-variant` | take |
| `layout-and-structure/Footer` | 2 | `--color-on-surface` | take |
| `prototypes/live-app/src/App.scss` | 2 | `--color-on-surface-variant` · `--color-surface-container` | take |
| `prototypes/starter/src/App.css` | 2 | `--color-on-surface` · `--color-surface-container-high` | take |
| `specs/Admin/Group/Pages/GroupInfoPage/GroupInfoPage.jsx` | 2 | `--color-on-surface` | take |
| `specs/Admin/Group/Tables/GroupTrainingProgressTable/GroupTrainingProgressTable.scss` | 2 | `--color-on-surface-variant` | take |
| `specs/Admin/Session/Sections/SessionOverviewSection/SessionOverviewSection.stories.jsx` | 2 | `--color-surface-container` | take |
| `specs/Admin/Tutor/Cards/TutorDataCard/TutorDataCard.jsx` | 2 | `--color-primary-container` · `--color-surface-container-highest` | take |
| `specs/Admin/Tutor/Cards/TutorDataCard/TutorDataCard.stories.jsx` | 2 | `--color-surface-container` | take |
| `specs/Admin/Tutor/Elements/ProgressRing/ProgressRing.jsx` | 2 | `--color-surface-variant` · `--color-warning-container` | take |
| `specs/Admin/Tutor/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.scss` | 2 | `--color-primary-text` · `--color-secondary-text` | take |
| `specs/Home/Cards/MetricsCard/MetricsCard.jsx` | 2 | `--color-primary` · `--color-surface-container` | take |
| `specs/Login/Cards/LoginPortal/LoginPortal.stories.jsx` | 2 | `--color-surface-variant` | take |
| `specs/Login/Elements/AuthButtons/AuthButtons.stories.jsx` | 2 | `--color-outline-variant` · `--color-surface-container-high` | take |
| `specs/Login/Elements/InstitutionSelection/InstitutionSelection.jsx` | 2 | `--color-outline-variant` · `--color-surface-container-high` | take |
| `specs/Login/Elements/LoginButtons/LoginButtons.jsx` | 2 | `--color-disabled-opacity` | take |
| `specs/Login/Modals/LoginNotificationsModal/LoginNotificationsModal.stories.jsx` | 2 | `--color-surface-variant` | take |
| `specs/Profile/Elements/UploadProfilePic.stories.jsx` | 2 | `--color-on-surface` | take |
| `specs/Toolkit/In-Session/Elements/SortingOptions.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/In-Session/Elements/badges/RoomBadge.jsx` | 2 | `--color-danger-text` · `--color-secondary-text` | take |
| `specs/Toolkit/In-Session/Elements/badges/StudentTag.jsx` | 2 | `--color-danger` · `--color-success` | take |
| `specs/Toolkit/Pre-Session/Elements/CallOffForm/ToggleOrganism/ToggleOrganism.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/DeleteSessionRadioSelection.stories.jsx` | 2 | `--color-on-surface` · `--color-primary` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/CallOffTypeFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/CapacityFilter/CapacityFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/CompletionFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/DaysFilter/DaysFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/SessionStatusFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/SiteFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/TutorFilter/TutorFilter.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/SortingOptions.stories.jsx` | 2 | `--color-on-surface` · `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Modals/CreateNewSession/Filled.stories.jsx` | 2 | `--color-on-surface-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/CreateNewSession/Forming.stories.jsx` | 2 | `--color-on-surface-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/EditSession/Forming.stories.jsx` | 2 | `--color-on-surface-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Modals/EditSession/SessionType.stories.jsx` | 2 | `--color-on-surface-variant` · `--color-surface-container-high` | take |
| `specs/Toolkit/Pre-Session/Pages/ConfirmSessionAvailability.stories.jsx` | 2 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Pages/CreateNewSession.stories.jsx` | 2 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Pages/DeleteSession.stories.jsx` | 2 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Pages/EditSession.stories.jsx` | 2 | `--color-on-surface` | take |
| `specs/Training/Lessons/Cards/AlertForSupervisors/AlertForSupervisors.stories.jsx` | 2 | `--color-surface` | take |
| `specs/Training/Lessons/Elements/AiIndicator/AiIndicator.stories.jsx` | 2 | `--color-surface` · `--color-surface-container` | take |
| `specs/Training/Lessons/Pages/LessonsDetailPage/LessonsDetailPage.stories.jsx` | 2 | `--color-outline-variant` · `--color-surface-container` | take |
| `specs/Training/Lessons/Tables/LessonsTable/LessonsTable.stories.jsx` | 2 | `--color-primary` · `--color-surface` | take |
| `specs/Training/Onboarding/Elements/ContentBlurb/ContentBlurb.stories.jsx` | 2 | `--color-surface` | take |
| `specs/Training/Onboarding/Elements/CtaButtons/CtaButtons.stories.jsx` | 2 | `--color-surface` | take |
| `specs/Training/Onboarding/Elements/StatusIndicators/StatusIndicators.stories.jsx` | 2 | `--color-surface` | take |
| `specs/Training/Onboarding/Elements/StrategyBadge/StrategyBadge.scss` | 2 | `--color-on-surface-variant` | take |
| `specs/Training/Onboarding/Elements/StrategyBadge/StrategyBadge.stories.jsx` | 2 | `--color-surface` | take |
| `specs/Universal/Sections/Footer/Footer.jsx` | 2 | `--color-on-surface` | take |
| `specs/Universal/Sections/Footer/Footer.stories.jsx` | 2 | `--color-surface` | take |
| `_internal/LoadingGif` | 1 | `--color-primary` | take: internal composite; verify in the stories that render it |
| `_internal/layout` | 1 | `--color-surface` | take: internal composite; verify in the stories that render it |
| `prototypes/research-assistant-chat/src/ResearchAssistantChat.tsx` | 1 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/components/AssistantMessageContent.tsx` | 1 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/components/ChatHeader.tsx` | 1 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/components/FloatingChatBubble.tsx` | 1 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/utils.ts` | 1 | `--color-primary` | take |
| `prototypes/research-assistant-chat/src/views/ResearchChatView.tsx` | 1 | `--color-surface` | take |
| `specs/Admin/Admin.stories.jsx` | 1 | `--color-surface-container` | take |
| `specs/Admin/Group/Pages/GroupTrainingProgressPage/GroupTrainingProgressPage.jsx` | 1 | `--color-on-surface` | take |
| `specs/Admin/Session/Pages/SessionAdminPage/SessionAdminPage.scss` | 1 | `--color-outline-variant` | take |
| `specs/Admin/Student/Tables/StudentsTable/StudentsTable.scss` | 1 | `--color-info-text` | take |
| `specs/Admin/Tutor/Elements/AdminDateRangeFilter/AdminDateRangeFilter.scss` | 1 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Elements/CardTitleHeader/CardTitleHeader.scss` | 1 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Elements/ProgressRing/ProgressRing.scss` | 1 | `--color-on-surface` | take |
| `specs/Admin/Tutor/Modals/TutorModal/TutorModal.jsx` | 1 | `--color-on-surface-variant` | take |
| `specs/Admin/Tutor/Pages/TutorPerformancePage/TutorPerformancePage.scss` | 1 | `--color-outline-variant` | take |
| `specs/Home/Cards/BadgeCard/BadgeCard.stories.jsx` | 1 | `--color-surface-container-high` | take |
| `specs/Home/Cards/RecommendedLessons/RecommendedLessons.stories.jsx` | 1 | `--color-surface-container-high` | take |
| `specs/Home/Elements/ResourceType/ResourceType.scss` | 1 | `--color-primary` | take |
| `specs/Login/Elements/LoginFooter/LoginFooter.jsx` | 1 | `--color-surface-container` | take |
| `specs/Login/Elements/shared/login-or-divider.scss` | 1 | `--color-on-surface` | take |
| `specs/Login/Pages/LoginPage/LoginPage.jsx` | 1 | `--color-surface-container-low` | take |
| `specs/Profile/Elements/TooltipAdditionalEmail.stories.jsx` | 1 | `--color-primary` | take |
| `specs/Profile/Elements/TooltipBackgroundMatching.stories.jsx` | 1 | `--color-primary` | take |
| `specs/Profile/Pages/TutorProfilePage/TutorProfilePage.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/In-Session/Elements/CTAGoalRelatedButtons.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/In-Session/Elements/CTASignUpRelated.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/In-Session/Elements/RequestTutor/RequestTutorOffCanvas.stories.jsx` | 1 | `--color-surface-container-lowest` | take |
| `specs/Toolkit/In-Session/Elements/badges/StudentTags.stories.jsx` | 1 | `--color-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/CTASupervisorViewButtons.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/CTATutorViewButtons.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/EditingAttendanceRosterItems.stories.jsx` | 1 | `--color-surface-container-highest` | take |
| `specs/Toolkit/Pre-Session/Elements/Filters/FilterSelect.scss` | 1 | `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/NewFormTimeInput.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/PopupModalAttendanceRoster.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/SessionActionsButton.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/SessionAvailabilitySnackbar.stories.jsx` | 1 | `--color-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/SessionManagementSnackbar.stories.jsx` | 1 | `--color-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Elements/Steppers.stories.jsx` | 1 | `--color-surface-container-lowest` | take |
| `specs/Toolkit/Pre-Session/Elements/SteppersMaxTutorLeadTutor.stories.jsx` | 1 | `--color-surface-container-lowest` | take |
| `specs/Toolkit/Pre-Session/Elements/SupervisorCalloffsButton.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/SupervisorSignUpMGMTButton.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Elements/badges/CallOffLateness.stories.jsx` | 1 | `--color-on-surface-variant` | take |
| `specs/Toolkit/Pre-Session/Pages/AllSessions.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Pages/FillIn.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Toolkit/Pre-Session/Pages/SignUps.stories.jsx` | 1 | `--color-on-surface` | take |
| `specs/Training/Lessons/Elements/AiIndicator/AiIndicator.scss` | 1 | `--color-primary` | take |
| `specs/Training/Lessons/Sections/LessonListSection/LessonListSection.jsx` | 1 | `--color-on-surface-variant` | take |
| `specs/Training/Onboarding/Cards/OnboardingAlertCard/OnboardingAlertCard.stories.jsx` | 1 | `--color-primary` | take |
| `specs/Training/Onboarding/Modals/ModuleCompletionModal/ModuleCompletionModal.stories.jsx` | 1 | `--color-primary` | take |
| `specs/Training/Onboarding/OnboardingSpec.jsx` | 1 | `--color-surface-container-low` | take |
| `specs/Training/Onboarding/Pages/OnboardingInnerPage/OnboardingInnerPage.jsx` | 1 | `--color-on-surface-variant` | take |
| `specs/Universal/Sections/Sidebar/Sidebar.stories.jsx` | 1 | `--surface-sunken` | take |
<!-- /gen:LEGACY-COMPONENTS -->
