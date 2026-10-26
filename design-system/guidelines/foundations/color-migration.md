---
summary: How to move one component from the legacy color tokens onto the --ds- tokens, end to end
---

<!-- Tier: 2 -->

# Color migration

This guide moves one component from the legacy color tokens (`--color-*`,
`--surface-*` colors, `--elevation-light-*`) onto the `--ds-*` tokens. The
legacy names keep working while the sweep runs, so you can migrate one
component at a time and ship it alone. The list at the end says which
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
- **Meta text takes `--ds-text-subtlest`.** Atlassian describes that token as
  "tertiary text, such as meta-data, breadcrumbs". PLUS darkened it a half
  step (neutral 750) so it keeps 4.5:1 on hovered and selected rows, which is
  why it is safe for text.

**State layers map by what the element is, not by step.** `-state-08`, `-12`
and `-16` were translucent washes. The new set has opaque named steps:

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
container and its state layers, secondary text with the secondary container,
on-surface text with every surface, inverse text with the inverse surface.

Moving one side alone pairs a new color with an old one nobody chose. When
only the brand text was moved, it sat on the legacy 16% primary selection at
4.44:1, under the 4.5:1 floor. `check:color-system` refuses an alias sheet
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
| Sidebar item | hovered `background.neutral.subtle.hovered`; selected `background.selected` + `text.selected` + a 2px leading bar in `border.selected` |
| Sidebar peek (floating, below 1024) | `elevation.surface.overlay` + `elevation.shadow.overlay` |
| Surface (the inner box) | `elevation.surface`, no border; the docked sidebar ends in `color.border` |
| Section | no fill; `color.border` divider when needed |
| Card, at rest | `elevation.surface.raised` + `elevation.shadow.raised`, no border |
| Card, clickable | hovered `elevation.surface.raised.hovered` + `elevation.shadow.overlay`; pressed `elevation.surface.raised.pressed` + `elevation.shadow.raised` |
| Well inside a card | `elevation.surface.container` |
| Table and Tree | grid lines `color.border`; head rule `color.border.bold`; row hovered `background.neutral.subtle.hovered`; row selected `background.selected` + 2px bar in `border.selected`; sticky cells `utility.elevation.surface.current`; sticky edge `elevation.shadow.overflow` while scrolled |
| Tile | rest `background.neutral.subtle`; hovered `background.neutral.subtle.hovered`; selected `background.selected` + `border.selected` |
| Popover: menu, popup, flag | `elevation.surface.overlay` + `elevation.shadow.overlay` |
| Tooltip | `background.neutral.bold` + `text.inverse` |
| Toast | `elevation.surface.overlay` + `elevation.shadow.overlay` + `icon.<role>` |
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
take `--ds-text-subtlest`, the token Atlassian names for breadcrumbs (§ Reading
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
42 components, 588 legacy uses. Generated by `npm run generate:legacy-color-list`; edit the components or `HOLDS` in that script, not this table.

| Component | Uses | Legacy names | Status |
|---|---:|---|---|
| `images-and-icons/Tile` | 39 | 31 names | take |
| `labels/Count` | 34 | 27 names | take |
| `forms-and-inputs/RichTextEditor` | 33 | 17 names | take |
| `navigation/Pagination` | 32 | 11 names | take |
| `layout-and-structure/Accordion` | 31 | 8 names | take |
| `navigation/NavPills` | 31 | 12 names | take |
| `forms-and-inputs/Switch` | 28 | 11 names | take |
| `labels/Status` | 26 | 22 names | take |
| `layout-and-structure/ListGroup` | 26 | 20 names | take |
| `forms-and-inputs/FileUpload` | 23 | 9 names | take |
| `layout-and-structure/Carousel` | 19 | 13 names | take |
| `navigation/Scrollspy` | 19 | 11 names | take |
| `forms-and-inputs/Range` | 18 | 7 names | take |
| `layout-and-structure/Collapse` | 16 | 8 names | take |
| `loading/Progress` | 15 | 13 names | take |
| `forms-and-inputs/Button` | 14 | 9 names | held: Button refresh (Cynthia) |
| `forms-and-inputs/CloseButton` | 14 | 12 names | held: Button refresh (Cynthia) |
| `loading/Spinner` | 14 | 4 names | take |
| `forms-and-inputs/Rating` | 13 | 7 names | take |
| `_internal/Navbar` | 11 | 8 names | take: internal composite; verify in the stories that render it |
| `forms-and-inputs/ButtonGroup` | 11 | `--color-on-surface` | held: Button refresh (Cynthia) |
| `labels/AiLabel` | 10 | 9 names | take |
| `layout-and-structure/Divider` | 10 | `--color-on-surface` · `--color-outline` · `--color-outline-variant` | take |
| `layout-and-structure/ScrollBar` | 10 | 4 names | take |
| `_internal/SessionManagementSnackbar` | 9 | 7 names | take: internal composite; verify in the stories that render it |
| `_internal/UserAvatar` | 9 | 8 names | take: internal composite; verify in the stories that render it |
| `messaging/Alert` | 9 | 5 names | take |
| `forms-and-inputs/ChoiceGrid` | 8 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-low` | take |
| `_internal/Table` | 6 | `--color-on-surface` · `--color-outline-variant` | take: internal composite; verify in the stories that render it |
| `forms-and-inputs/choiceItem` | 6 | 5 names | take |
| `labels/Badge` | 6 | 5 names | take |
| `layout-and-structure/MediaObject` | 6 | 5 names | take |
| `_internal/SessionAvailabilitySnackbar` | 5 | `--color-on-surface` · `--color-success` · `--color-surface` | take: internal composite; verify in the stories that render it |
| `navigation/Breadcrumb` | 5 | `--color-on-surface-variant` · `--color-primary-text` | take |
| `_internal/training` | 4 | `--color-primary` · `--color-primary-text` | take: internal composite; verify in the stories that render it |
| `forms-and-inputs/ChoiceGroup` | 4 | `--color-danger` · `--color-on-surface` | take |
| `layout-and-structure/Jumbotron` | 4 | `--color-on-surface` · `--color-on-surface-variant` · `--color-surface-container-low` | take |
| `layout-and-structure/Card` | 3 | `--color-on-surface-variant` · `--color-surface-variant` · `--surface-raised-shadow` | take |
| `loading/Skeleton` | 3 | `--color-outline-variant` · `--color-surface-container` · `--color-surface-container-lowest` | take |
| `_internal/Footer` | 2 | `--color-on-surface` | take: internal composite; verify in the stories that render it |
| `_internal/LoadingGif` | 1 | `--color-primary` | take: internal composite; verify in the stories that render it |
| `_internal/layout` | 1 | `--color-surface` | take: internal composite; verify in the stories that render it |
<!-- /gen:LEGACY-COMPONENTS -->
