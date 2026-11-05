---
summary: Token ladder (ADR-038) — old name to new name, every token across all four tiers
---

<!-- Tier: 2 -->
# Token tiers name map (ADR-038)

Generated from `scripts/lib/tokens/plan.mjs`'s `TOKEN_LADDER` by `npm run generate:design-tokens` — never hand-edit.

One plan, four tiers, most general to most specific: **primitives** (`--space-*` / `--radius-*` / `--stroke-*` / `--size-*`, unchanged — still Figma-sourced, `generate-all-tokens.js`) -> **semantics** -> **patterns** -> **components**, plus **layers** as its own non-spacing z-index family. Figma collection names: `spacing / primitives`, `spacing / semantics`, `spacing / patterns`, `spacing / components`, `layers`.

Every `New` name below is declared by the generator in `design-system/src/tokens/ladder/_semantics.scss`, `_patterns.scss`, `_components.scss` or `_layers.scss`, with its own value. The `Old` name is retired: its declaration is gone and nothing reads it. A row where `Old` and `New` are identical is not a rename — it is a token already correctly named for its tier (listed so this is every token, not just the ones that moved); those rows are excluded from the generated SCSS and Figma payload.

Scope calls recorded in `plan.mjs`'s own header comment, repeated here:
- `--focus-ring-radius` has no existing source; seeded at `--radius-sm` as a first pass.
- The Icon/Indicator/Row/Media size-role vocabulary in `generate-all-tokens.js`'s `SIZE_ROLES` is not folded into Semantics' Size group yet — only `Control` was missing, so only `--control-*` was added.
- The legacy spec-page grid (`--breakpoint-*`, `--col-*`, `--layout-grid-gap`) is out of this ladder; `_layout.scss` already calls it legacy.
- `color / foundations` -> `color / semantics` and `opacity` -> `color / opacity` are Figma-collection renames only; no code name changes.

## Semantics

| Group | Old | New | Note |
|---|---|---|---|
| Pad | `--element-pad-x-xs` | `--pad-x-xs` |  |
| Pad | `--element-pad-x-sm` | `--pad-x-sm` |  |
| Pad | `--element-pad-x-md` | `--pad-x-md` |  |
| Pad | *(new)* | `--pad-x-lg` | new step; matches the old --size-element-pad-x-lg (16px) |
| Pad | `--element-pad-y-sm` | `--pad-y-sm` |  |
| Pad | `--element-pad-y-md` | `--pad-y-md` |  |
| Pad | *(new)* | `--pad-y-lg` | new step; matches the old --size-element-pad-y-lg (8px) |
| Stack | `--element-stack-sm` | `--stack-sm` |  |
| Stack | `--element-stack-md` | `--stack-md` |  |
| Stack | `--element-stack-lg` | `--stack-lg` |  |
| Inline | `--element-inline-sm` | `--inline-sm` |  |
| Inline | `--element-inline-md` | `--inline-md` |  |
| Inline | `--element-inline-lg` | `--inline-lg` |  |
| Radius | `--element-radius-sm` | `--radius-sm` |  |
| Radius | `--element-radius-md` | `--radius-md` |  |
| Radius | `--element-radius-lg` | `--radius-lg` |  |
| Radius | `--element-radius-full` | `--radius-full` | Figma Radius/full; the code name is the --radius-full primitive, so no second declaration |
| Radius | `--element-radius-item-sm` | `--radius-h24` | control height 24; 24÷4 = 6 |
| Radius | `--element-radius-item-md` | `--radius-h32` | control height 32; 32÷4 = 8 |
| Radius | *(new)* | `--radius-h40` | new step; control height 40; 40÷4 = 10 |
| Border | `--border-default` | `--border-default` (reclassified, unchanged) |  |
| Border | `--border-selected` | `--border-selected` (reclassified, unchanged) |  |
| Border | `--border-focused` | `--border-focused` (reclassified, unchanged) |  |
| Focus | `--size-element-stroke-lg` | `--focus-ring-width` | matches the outline width repeated across Tag, DateTag, Suggestion and Tabs; reads the 2px stroke primitive |
| Focus | `--size-element-stroke-lg` | `--focus-ring-offset` | defined for a caller whose ring offset genuinely needs to move independently of its width; every current caller reads --focus-ring-width for both |
| Focus | *(new)* | `--focus-ring-radius` | first pass, no existing source; a family PR refines it |
| Grid | `--layout-gutter` | `--grid-gutter` |  |
| Grid | `--layout-columns` | `--grid-columns` |  |
| Grid | `--layout-width-column` | `--grid-width-column` |  |
| Grid | `--layout-width-column-screen` | `--grid-width-column-screen` |  |
| Screen | `--layout-width-screen` | `--screen-width` |  |
| Screen | `--layout-min-width-screen` | `--screen-min-width` |  |
| Screen | `--layout-max-width-screen` | `--screen-max-width` |  |
| Screen | `--layout-pad-x-screen` | `--screen-pad-x` |  |
| Content | `--layout-max-width-content` | `--content-max-width` |  |
| Content | `--layout-max-width-reading` | `--content-max-width-reading` |  |
| Content | `--layout-min-width-content` | `--content-min-width` |  |
| Content | `--layout-width-content` | `--content-width` |  |
| Size | `--icon-sm` | `--icon-sm` (reclassified, unchanged) |  |
| Size | `--icon-md` | `--icon-md` (reclassified, unchanged) |  |
| Size | `--icon-lg` | `--icon-lg` (reclassified, unchanged) |  |
| Size | `--image-xxs` | `--image-xxs` (reclassified, unchanged) |  |
| Size | `--image-xs` | `--image-xs` (reclassified, unchanged) |  |
| Size | `--image-sm` | `--image-sm` (reclassified, unchanged) |  |
| Size | `--image-md` | `--image-md` (reclassified, unchanged) |  |
| Size | `--image-lg` | `--image-lg` (reclassified, unchanged) |  |
| Size | `--image-xl` | `--image-xl` (reclassified, unchanged) |  |
| Size | `--item-height-sm` | `--item-height-sm` (reclassified, unchanged) |  |
| Size | `--item-height-md` | `--item-height-md` (reclassified, unchanged) |  |
| Size | `--label-height-sm` | `--label-height-sm` (reclassified, unchanged) |  |
| Size | `--label-height-md` | `--label-height-md` (reclassified, unchanged) |  |
| Size | `--label-max-width` | `--label-max-width` (reclassified, unchanged) |  |
| Size | `--row-height-sm` | `--row-height-sm` (reclassified, unchanged) |  |
| Size | `--row-height-md` | `--row-height-md` (reclassified, unchanged) |  |
| Size | `--row-height-lg` | `--row-height-lg` (reclassified, unchanged) |  |
| Size | `--field-width-xs` | `--field-width-xs` (reclassified, unchanged) |  |
| Size | `--field-width-sm` | `--field-width-sm` (reclassified, unchanged) |  |
| Size | `--field-width-md` | `--field-width-md` (reclassified, unchanged) |  |
| Size | `--field-width-lg` | `--field-width-lg` (reclassified, unchanged) |  |
| Size | `--field-width-xl` | `--field-width-xl` (reclassified, unchanged) |  |
| Size | `--field-min-height-sm` | `--field-min-height-sm` (reclassified, unchanged) |  |
| Size | `--field-min-height-lg` | `--field-min-height-lg` (reclassified, unchanged) |  |
| Size | `--size-control-sm` | `--control-sm` | new role; Control was missing from the Icon/Image/Item/Label/Row/Field set |
| Size | `--size-control-md` | `--control-md` |  |
| Size | `--size-control-lg` | `--control-lg` |  |

## Patterns

| Group | Old | New | Note |
|---|---|---|---|
| Frame | `--layout-height-topbar` | `--frame-topbar-height` |  |
| Frame | `--layout-width-sidebar` | `--frame-sidebar-width` |  |
| Frame | `--layout-sidebar-width` | `--frame-sidebar-width-nav` | fixed SideNav width (164), distinct from the responsive sidebar above |
| Page | `--page-pad` | `--page-pad` (reclassified, unchanged) |  |
| Page | *(new)* | `--page-pad-x-compact` |  |
| Page | *(new)* | `--page-pad-x-default` |  |
| Page | *(new)* | `--page-pad-x-spacious` |  |
| Page | *(new)* | `--page-pad-y-compact` |  |
| Page | *(new)* | `--page-pad-y-default` |  |
| Page | *(new)* | `--page-pad-y-spacious` |  |
| Page | `--page-stack-sm` | `--page-stack-sm` (reclassified, unchanged) |  |
| Page | `--page-stack-md` | `--page-stack-md` (reclassified, unchanged) |  |
| Page | `--page-stack-lg` | `--page-stack-lg` (reclassified, unchanged) |  |
| Page | `--page-radius` | `--page-radius` (reclassified, unchanged) |  |
| Panel | *(new)* | `--panel-min-width` | the narrowest the splitter allows (320) |
| Panel | *(new)* | `--panel-width-default` | the width a Panel opens at (400) |
| Panel | *(new)* | `--panel-max-width` | the widest the splitter allows (640) |
| Section | *(new)* | `--section-pad-x-compact` |  |
| Section | *(new)* | `--section-pad-x-default` |  |
| Section | *(new)* | `--section-pad-x-spacious` |  |
| Section | *(new)* | `--section-pad-y-compact` |  |
| Section | *(new)* | `--section-pad-y-default` |  |
| Section | *(new)* | `--section-pad-y-spacious` |  |
| Section | `--section-stack-sm` | `--section-stack-sm` (reclassified, unchanged) |  |
| Section | `--section-stack-md` | `--section-stack-md` (reclassified, unchanged) |  |
| Section | `--section-stack-lg` | `--section-stack-lg` (reclassified, unchanged) |  |
| Section | `--section-min-width-main` | `--section-min-width-main` (reclassified, unchanged) |  |
| Section | `--section-min-width-side` | `--section-min-width-side` (reclassified, unchanged) |  |
| Card | *(new)* | `--card-pad-compact` |  |
| Card | *(new)* | `--card-pad-default` |  |
| Card | *(new)* | `--card-pad-spacious` |  |
| Card | `--card-stack-sm` | `--card-stack-sm` (reclassified, unchanged) |  |
| Card | `--card-stack-md` | `--card-stack-md` (reclassified, unchanged) |  |
| Card | `--card-stack-lg` | `--card-stack-lg` (reclassified, unchanged) |  |
| Card | `--card-inline-sm` | `--card-inline-sm` (reclassified, unchanged) |  |
| Card | `--card-inline-md` | `--card-inline-md` (reclassified, unchanged) |  |
| Card | `--card-inline-lg` | `--card-inline-lg` (reclassified, unchanged) |  |
| Card | `--card-min-width-sm` | `--card-min-width-sm` (reclassified, unchanged) |  |
| Card | `--card-min-width-md` | `--card-min-width-md` (reclassified, unchanged) |  |
| Card | `--card-min-width-lg` | `--card-min-width-lg` (reclassified, unchanged) |  |
| Card | `--card-radius` | `--card-radius` (reclassified, unchanged) |  |
| Card | `--card-radius-sm` | `--card-radius-sm` (reclassified, unchanged) |  |
| Card | `--card-max-height-sm` | `--card-max-height-sm` (reclassified, unchanged) |  |
| Card | `--card-max-height-md` | `--card-max-height-md` (reclassified, unchanged) |  |
| Card | `--card-max-height-lg` | `--card-max-height-lg` (reclassified, unchanged) |  |
| Table | `--table-pad-x-cell` | `--table-pad-x-cell` (reclassified, unchanged) |  |
| Table | `--table-pad-y-cell` | `--table-pad-y-cell` (reclassified, unchanged) |  |
| Table | `--table-indent` | `--table-indent` (reclassified, unchanged) |  |
| Table | `--table-radius` | `--table-radius` (reclassified, unchanged) |  |
| Table | `--table-stack` | `--table-stack` (reclassified, unchanged) |  |
| Table | `--table-pad-x-footer` | `--table-pad-x-footer` (reclassified, unchanged) |  |
| Table | `--table-min-width-title` | `--table-min-width-title` (reclassified, unchanged) |  |
| Blanket | `--overlay-pad-x` | `--blanket-pad-x` |  |
| Blanket | `--overlay-pad-y` | `--blanket-pad-y` |  |
| Blanket | `--overlay-scrim` | `--blanket-fill` | the Blanket's own fill color; the old declaration's value, written directly so this file carries no old-language word |
| Blanket | `--layout-max-height-modal` | `--blanket-max-height-modal` | a calc() of the pad above: code only, no Figma variable |
| Modal | `--modal-pad` | `--modal-pad` (reclassified, unchanged) |  |
| Modal | *(new)* | `--modal-pad-x-compact` |  |
| Modal | *(new)* | `--modal-pad-x-default` |  |
| Modal | *(new)* | `--modal-pad-x-spacious` |  |
| Modal | *(new)* | `--modal-pad-y-compact` |  |
| Modal | *(new)* | `--modal-pad-y-default` |  |
| Modal | *(new)* | `--modal-pad-y-spacious` |  |
| Modal | `--modal-stack-sm` | `--modal-stack-sm` (reclassified, unchanged) |  |
| Modal | `--modal-stack-md` | `--modal-stack-md` (reclassified, unchanged) |  |
| Modal | `--modal-stack-lg` | `--modal-stack-lg` (reclassified, unchanged) |  |
| Modal | `--modal-inline-sm` | `--modal-inline-sm` (reclassified, unchanged) |  |
| Modal | `--modal-inline-md` | `--modal-inline-md` (reclassified, unchanged) |  |
| Modal | `--modal-inline-lg` | `--modal-inline-lg` (reclassified, unchanged) |  |
| Modal | `--modal-radius` | `--modal-radius` (reclassified, unchanged) |  |
| Modal | `--layout-width-modal-sm` | `--modal-width-sm` | lifted out of spacing / layout, beside the pattern’s pad/stack tokens |
| Modal | `--layout-width-modal-md` | `--modal-width-md` |  |
| Modal | `--layout-width-modal-lg` | `--modal-width-lg` |  |
| Popover | `--popover-pad` | `--popover-pad` (reclassified, unchanged) |  |
| Popover | `--popover-width-sm` | `--popover-width-sm` (reclassified, unchanged) |  |
| Popover | `--popover-width-md` | `--popover-width-md` (reclassified, unchanged) |  |
| Popover | `--popover-width-lg` | `--popover-width-lg` (reclassified, unchanged) |  |
| Popover | `--popover-width-flag` | `--popover-width-flag` (reclassified, unchanged) |  |
| Popover | `--popover-stack-flag` | `--popover-stack-flag` (reclassified, unchanged) |  |
| Popover | `--popover-radius` | `--popover-radius` (reclassified, unchanged) |  |
| Popover | `--popover-pad-menu` | `--popover-pad-menu` (reclassified, unchanged) |  |
| Popover | `--popover-min-width-menu` | `--popover-min-width-menu` (reclassified, unchanged) |  |
| Popover | `--popover-max-width-menu` | `--popover-max-width-menu` (reclassified, unchanged) |  |
| Popover | `--popover-max-height-menu` | `--popover-max-height-menu` (reclassified, unchanged) |  |
| Popover | `--popover-radius-menu-sm` | `--popover-radius-menu-sm` (reclassified, unchanged) |  |
| Popover | `--popover-radius-menu-md` | `--popover-radius-menu-md` (reclassified, unchanged) |  |
| Popover | `--popover-pad-y-tooltip` | `--popover-pad-y-tooltip` (reclassified, unchanged) |  |
| Popover | `--popover-max-width-tooltip` | `--popover-max-width-tooltip` (reclassified, unchanged) |  |
| Popover | `--popover-radius-tooltip` | `--popover-radius-tooltip` (reclassified, unchanged) |  |
| Popover | `--popover-gap-screen` | `--popover-gap-screen` (reclassified, unchanged) |  |
| Popover | `--popover-offset` | `--popover-offset` (reclassified, unchanged) |  |
| Drawer | `--drawer-pad` | `--drawer-pad` (reclassified, unchanged) |  |
| Drawer | `--drawer-stack-sm` | `--drawer-stack-sm` (reclassified, unchanged) |  |
| Drawer | `--drawer-stack-md` | `--drawer-stack-md` (reclassified, unchanged) |  |
| Drawer | `--drawer-stack-lg` | `--drawer-stack-lg` (reclassified, unchanged) |  |
| Drawer | `--drawer-inline-sm` | `--drawer-inline-sm` (reclassified, unchanged) |  |
| Drawer | `--drawer-inline-md` | `--drawer-inline-md` (reclassified, unchanged) |  |
| Drawer | `--drawer-inline-lg` | `--drawer-inline-lg` (reclassified, unchanged) |  |
| Drawer | `--layout-width-drawer-sm` | `--drawer-width-sm` |  |
| Drawer | `--layout-width-drawer-md` | `--drawer-width-md` |  |
| Drawer | `--layout-width-drawer-lg` | `--drawer-width-lg` |  |
| Focused page | `--focused-page-pad-x` | `--focused-page-pad-x` (reclassified, unchanged) |  |
| Focused page | `--focused-page-pad-y` | `--focused-page-pad-y` (reclassified, unchanged) |  |
| Focused page | `--focused-page-stack-sm` | `--focused-page-stack-sm` (reclassified, unchanged) |  |
| Focused page | `--focused-page-stack-md` | `--focused-page-stack-md` (reclassified, unchanged) |  |
| Focused page | `--focused-page-stack-lg` | `--focused-page-stack-lg` (reclassified, unchanged) |  |
| Focused page | `--focused-page-inline-sm` | `--focused-page-inline-sm` (reclassified, unchanged) |  |
| Focused page | `--focused-page-inline-md` | `--focused-page-inline-md` (reclassified, unchanged) |  |

## Components

| Group | Old | New | Note |
|---|---|---|---|
| Button | `--element-radius-item-sm` | `--button-radius-default` | 32-high control, radius 6 |
| Button | `--element-radius-md` | `--button-radius-compact` | 24-high control, radius 4 |
| Calendar | `--layout-calendar-day-sm` | `--calendar-day-sm` |  |
| Calendar | `--layout-calendar-day-md` | `--calendar-day-md` |  |
| Calendar | `--layout-calendar-day-lg` | `--calendar-day-lg` |  |
| Calendar | `--layout-calendar-nav` | `--calendar-nav-size` |  |
| Checkbox | `--layout-control-checkbox` | `--checkbox-control-size` |  |
| Radio | `--layout-control-radio` | `--radio-control-size` |  |
| Radio | *(new)* | `--radio-control-size-10` | RadioGroup size 10 |
| Radio | *(new)* | `--radio-control-size-14` | RadioGroup size 14 |
| Choice grid | *(new)* | `--choice-grid-control-size-10` | ChoiceGrid size 12 |
| Choice grid | *(new)* | `--choice-grid-control-size-12` | ChoiceGrid size 14 and 16 |
| Range | *(new)* | `--range-dot-size-8` | Range size 8 |
| Range | *(new)* | `--range-dot-size-12` | Range size 12 |
| Range | *(new)* | `--range-dot-size-16` | Range size 16 |
| Range | *(new)* | `--range-dot-size-default` | Range with no size |
| Range | *(new)* | `--range-track-height-4` | Range size 8, and the default |
| Range | *(new)* | `--range-track-height-6` | Range size 12 |
| Range | *(new)* | `--range-track-height-8` | Range size 16 |
| Toggle | *(new)* | `--toggle-track-height-16` | Toggle size 16 |
| Toggle | *(new)* | `--toggle-track-height-20` | Toggle size 20 |
| Toggle | *(new)* | `--toggle-track-width-16` | Toggle size 16 |
| Toggle | *(new)* | `--toggle-track-width-20` | Toggle size 20 |
| Toggle | *(new)* | `--toggle-pad` | both sizes |
| Listbox | `--layout-max-width-listbox` | `--listbox-max-width` |  |
| Listbox | `--layout-min-height-listbox` | `--listbox-min-height` |  |
| Listbox | `--layout-max-height-listbox` | `--listbox-max-height` |  |
| Join row | `--layout-width-join-row` | `--join-row-width` |  |
| Option menu | `--layout-width-option-menu` | `--option-menu-width` |  |
| Tile | `--tile-radius-sm` | `--tile-radius-sm` (reclassified, unchanged) |  |
| Tile | `--tile-radius-lg` | `--tile-radius-lg` (reclassified, unchanged) |  |
| Spinner | *(new)* | `--spinner-size-sm` | matches the old --size-spinner-sm (16px) |
| Spinner | *(new)* | `--spinner-size-md` | matches the old --size-spinner-md (24px) |
| Spinner | *(new)* | `--spinner-size-lg` | matches the old --size-spinner-lg (48px) |
| Progress bar | *(new)* | `--progress-bar-height` | matches the old --size-progressbar-height (8px) |

## Layers

| Group | Old | New | Note |
|---|---|---|---|
| Layer | `--layout-z-index-card` | `--layer-card` |  |
| Layer | `--layout-z-index-navigation` | `--layer-navigation` |  |
| Layer | `--layout-z-index-dialog` | `--layer-dialog` |  |
| Layer | `--layout-z-index-popup` | `--layer-popup` |  |
| Layer | `--layout-z-index-scrim` | `--layer-blanket` | the Blanket's z-index; the old declaration's value, written directly so this file carries no old-language word |
| Layer | `--layout-z-index-modal` | `--layer-modal` |  |
| Layer | `--layout-z-index-flag` | `--layer-flag` |  |
| Layer | `--layout-z-index-spotlight` | `--layer-spotlight` |  |
| Layer | `--layout-z-index-tooltip` | `--layer-tooltip` |  |

## Retired with no ladder row

| Old | Now reads |
|---|---|
| `--size-element-pad-x-lg` | `--pad-x-lg` |
| `--size-element-pad-x-md` | `--pad-x-md` |
| `--size-element-pad-x-sm` | `--pad-x-sm` |
| `--size-element-pad-x-xs` | `--pad-x-xs` |
| `--size-element-pad-y-lg` | `--pad-y-lg` |
| `--size-element-pad-y-md` | `--pad-y-md` |
| `--size-element-pad-y-sm` | `--space-025` |
| `--size-element-gap-xs` | `--stack-sm` |
| `--size-element-gap-sm` | `--stack-md` |
| `--size-element-gap-md` | `--space-0625` |
| `--size-element-gap-lg` | `--stack-lg` |
| `--size-element-radius-sm` | `--radius-md` |
| `--size-element-radius-md` | `--radius-md` |
| `--size-element-radius-lg` | `--radius-lg` |
| `--size-element-radius-full` | `--radius-full` |
| `--size-element-stroke-sm` | `--stroke-1` |
| `--size-element-stroke-md` | `--size-border-stroke-stroke-150` |
| `--size-element-stroke-lg` | `--stroke-2` |
| `--size-element-stroke-xl` | `--size-border-stroke-stroke-300` |
| `--size-element-border` | `--border-default` |
| `--element-radius-full` | `--radius-full` |
| `--element-pad-default` | `--pad-x-md` |
| `--element-pad-compact` | `--pad-x-sm` |
| `--element-gap-default` | `--stack-md` |
| `--element-gap-compact` | `--stack-sm` |
| `--element-radius-default` | `--radius-md` |
| `--element-radius-compact` | `--radius-sm` |
| `--card-pad-sm` | `--card-pad-compact` |
| `--card-pad-md` | `--card-pad-default` |
| `--card-pad-lg` | `--card-pad-spacious` |

