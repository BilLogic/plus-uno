---
summary: Token ladder (ADR-038) — every token across all four tiers, by group
---

<!-- Tier: 2 -->
# Token tiers (ADR-038)

Generated from `scripts/lib/tokens/plan.mjs`'s `TOKEN_LADDER` by `npm run generate:design-tokens` — never hand-edit.

One plan, four tiers, most general to most specific: **primitives** (`--space-*` / `--radius-*` / `--stroke-*` / `--size-*`, Figma-sourced, `generate-all-tokens.js`) -> **semantics** -> **patterns** -> **components**, plus **layers** as its own z-index family. Figma collection names: `spacing / primitives`, `spacing / semantics`, `spacing / patterns`, `spacing / components`, `layers`.

Every token below is declared by the generator in `design-system/src/tokens/ladder/_semantics.scss`, `_patterns.scss`, `_components.scss` or `_layers.scss`, with its own value, except a row marked *declared elsewhere*, whose name its own source file already declares.

## Semantics

| Group | Token | Note |
|---|---|---|
| Pad | `--pad-x-xs` |  |
| Pad | `--pad-x-sm` |  |
| Pad | `--pad-x-md` |  |
| Pad | `--pad-x-lg` | new step, 16px |
| Pad | `--pad-y-sm` |  |
| Pad | `--pad-y-md` |  |
| Pad | `--pad-y-lg` | new step, 8px |
| Stack | `--stack-sm` |  |
| Stack | `--stack-md` |  |
| Stack | `--stack-lg` |  |
| Inline | `--inline-sm` |  |
| Inline | `--inline-md` |  |
| Inline | `--inline-lg` |  |
| Radius | `--radius-sm` |  |
| Radius | `--radius-md` |  |
| Radius | `--radius-lg` |  |
| Radius | `--radius-xl` |  |
| Radius | `--radius-xxl` |  |
| Radius | `--radius-full` | Figma Radius/full; the code name is the --radius-full primitive, so no second declaration |
| Radius / Control | `--radius-control-sm` | pairs with --control-sm; height 24, 24÷4 = 6 |
| Radius / Control | `--radius-control-md` | pairs with --control-md; height 32, 32÷4 = 8 |
| Radius / Control | `--radius-control-lg` | pairs with --control-lg; height 40, 40÷4 = 10 |
| Border | `--border-default` (declared elsewhere) |  |
| Border | `--border-selected` (declared elsewhere) |  |
| Border | `--border-focused` (declared elsewhere) |  |
| Focus | `--focus-ring-width` | matches the outline width repeated across Tag, DateTag, Suggestion and Tabs; reads the 2px stroke primitive |
| Focus | `--focus-ring-offset` | defined for a caller whose ring offset genuinely needs to move independently of its width; every current caller reads --focus-ring-width for both |
| Grid | `--grid-gutter` |  |
| Grid | `--grid-columns` |  |
| Grid | `--grid-width-column` |  |
| Grid | `--grid-width-column-screen` |  |
| Screen | `--screen-width` |  |
| Screen | `--screen-min-width` |  |
| Screen | `--screen-max-width` |  |
| Screen | `--screen-pad-x` |  |
| Content | `--content-max-width` |  |
| Content | `--content-max-width-reading` |  |
| Content | `--content-min-width` |  |
| Content | `--content-width` |  |
| Size | `--icon-sm` (declared elsewhere) |  |
| Size | `--icon-md` (declared elsewhere) |  |
| Size | `--icon-lg` (declared elsewhere) |  |
| Size | `--image-xxs` (declared elsewhere) |  |
| Size | `--image-xs` (declared elsewhere) |  |
| Size | `--image-sm` (declared elsewhere) |  |
| Size | `--image-md` (declared elsewhere) |  |
| Size | `--image-lg` (declared elsewhere) |  |
| Size | `--image-xl` (declared elsewhere) |  |
| Size | `--item-height-sm` (declared elsewhere) |  |
| Size | `--item-height-md` (declared elsewhere) |  |
| Size | `--label-height-sm` (declared elsewhere) |  |
| Size | `--label-height-md` (declared elsewhere) |  |
| Size | `--label-max-width` (declared elsewhere) |  |
| Size | `--row-height-sm` (declared elsewhere) |  |
| Size | `--row-height-md` (declared elsewhere) |  |
| Size | `--row-height-lg` (declared elsewhere) |  |
| Size | `--field-width-xs` (declared elsewhere) |  |
| Size | `--field-width-sm` (declared elsewhere) |  |
| Size | `--field-width-md` (declared elsewhere) |  |
| Size | `--field-width-lg` (declared elsewhere) |  |
| Size | `--field-width-xl` (declared elsewhere) |  |
| Size | `--field-min-height-sm` (declared elsewhere) |  |
| Size | `--field-min-height-lg` (declared elsewhere) |  |
| Size | `--control-sm` | new role; Control was missing from the Icon/Image/Item/Label/Row/Field set |
| Size | `--control-md` |  |
| Size | `--control-lg` |  |

## Patterns

| Group | Token | Note |
|---|---|---|
| Frame | `--frame-topbar-height` |  |
| Frame | `--frame-sidebar-width` |  |
| Frame | `--frame-sidebar-width-nav` | fixed SideNav width (164), distinct from the responsive sidebar above |
| Frame | `--frame-sidebar-pad` | the Sidebar pads 12 on every side |
| Frame | `--frame-sidebar-row-gap` | two Sidebar rows sit 2 apart |
| Frame | `--frame-sidebar-group-gap` | two Sidebar groups sit 16 apart |
| Frame | `--frame-sidebar-row-radius` | the rounding of a Sidebar row (6) |
| Page | `--page-pad` (declared elsewhere) |  |
| Page | `--page-pad-x-compact` |  |
| Page | `--page-pad-x-default` |  |
| Page | `--page-pad-x-spacious` |  |
| Page | `--page-pad-y-compact` |  |
| Page | `--page-pad-y-default` |  |
| Page | `--page-pad-y-spacious` |  |
| Page | `--page-stack-sm` (declared elsewhere) |  |
| Page | `--page-stack-md` (declared elsewhere) |  |
| Page | `--page-stack-lg` (declared elsewhere) |  |
| Panel | `--panel-min-width` | the narrowest the splitter allows (320) |
| Panel | `--panel-width-default` | the width a Panel opens at (400) |
| Panel | `--panel-max-width` | the widest the splitter allows (640) |
| Section | `--section-pad-x-compact` |  |
| Section | `--section-pad-x-default` |  |
| Section | `--section-pad-x-spacious` |  |
| Section | `--section-pad-y-compact` |  |
| Section | `--section-pad-y-default` |  |
| Section | `--section-pad-y-spacious` |  |
| Section | `--section-radius` | the rounding of a Section with a fill |
| Section | `--section-stack-sm` (declared elsewhere) |  |
| Section | `--section-stack-md` (declared elsewhere) |  |
| Section | `--section-stack-lg` (declared elsewhere) |  |
| Section | `--section-min-width-main` (declared elsewhere) |  |
| Section | `--section-min-width-side` (declared elsewhere) |  |
| Card | `--card-pad-compact` |  |
| Card | `--card-pad-default` |  |
| Card | `--card-pad-spacious` |  |
| Card | `--card-stack-sm` (declared elsewhere) |  |
| Card | `--card-stack-md` (declared elsewhere) |  |
| Card | `--card-stack-lg` (declared elsewhere) |  |
| Card | `--card-inline-sm` (declared elsewhere) |  |
| Card | `--card-inline-md` (declared elsewhere) |  |
| Card | `--card-inline-lg` (declared elsewhere) |  |
| Card | `--card-min-width-sm` (declared elsewhere) |  |
| Card | `--card-min-width-md` (declared elsewhere) |  |
| Card | `--card-min-width-lg` (declared elsewhere) |  |
| Card | `--card-radius` |  |
| Card | `--card-radius-compact` |  |
| Card | `--card-max-height-sm` (declared elsewhere) |  |
| Card | `--card-max-height-md` (declared elsewhere) |  |
| Card | `--card-max-height-lg` (declared elsewhere) |  |
| Table | `--table-pad-x-cell` (declared elsewhere) |  |
| Table | `--table-pad-y-cell` (declared elsewhere) |  |
| Table | `--table-indent` (declared elsewhere) |  |
| Table | `--table-radius` |  |
| Table | `--table-stack` (declared elsewhere) |  |
| Table | `--table-pad-x-footer` (declared elsewhere) |  |
| Table | `--table-min-width-title` (declared elsewhere) |  |
| Blanket | `--blanket-pad-x` |  |
| Blanket | `--blanket-pad-y` |  |
| Blanket | `--blanket-fill` | the Blanket's own fill color; the old declaration's value, written directly so this file carries no old-language word |
| Blanket | `--blanket-max-height-modal` | a calc() of the pad above: code only, no Figma variable |
| Modal | `--modal-pad` (declared elsewhere) |  |
| Modal | `--modal-pad-x-compact` |  |
| Modal | `--modal-pad-x-default` |  |
| Modal | `--modal-pad-x-spacious` |  |
| Modal | `--modal-pad-y-compact` |  |
| Modal | `--modal-pad-y-default` |  |
| Modal | `--modal-pad-y-spacious` |  |
| Modal | `--modal-stack-sm` (declared elsewhere) |  |
| Modal | `--modal-stack-md` (declared elsewhere) |  |
| Modal | `--modal-stack-lg` (declared elsewhere) |  |
| Modal | `--modal-inline-sm` (declared elsewhere) |  |
| Modal | `--modal-inline-md` (declared elsewhere) |  |
| Modal | `--modal-inline-lg` (declared elsewhere) |  |
| Modal | `--modal-radius` |  |
| Modal | `--modal-width-sm` | lifted out of spacing / layout, beside the pattern’s pad/stack tokens |
| Modal | `--modal-width-md` |  |
| Modal | `--modal-width-lg` |  |
| Page | `--page-border-width` |  |
| Table | `--table-overflow-reach` |  |
| Modal | `--modal-body-min-height` |  |
| Popover | `--popover-pad` (declared elsewhere) |  |
| Popover | `--popover-width-sm` (declared elsewhere) |  |
| Popover | `--popover-width-md` (declared elsewhere) |  |
| Popover | `--popover-width-lg` (declared elsewhere) |  |
| Popover | `--popover-width-flag` (declared elsewhere) |  |
| Popover | `--popover-stack-flag` (declared elsewhere) |  |
| Popover | `--popup-radius` |  |
| Popover | `--popover-pad-menu` (declared elsewhere) |  |
| Popover | `--popover-min-width-menu` (declared elsewhere) |  |
| Popover | `--popover-max-width-menu` (declared elsewhere) |  |
| Popover | `--popover-max-height-menu` (declared elsewhere) |  |
| Popover | `--popover-pad-y-tooltip` (declared elsewhere) |  |
| Popover | `--popover-max-width-tooltip` (declared elsewhere) |  |
| Popover | `--popover-gap-screen` (declared elsewhere) |  |
| Popover | `--popover-offset` (declared elsewhere) |  |
| Focused page | `--focused-page-pad-x` (declared elsewhere) |  |
| Focused page | `--focused-page-pad-y` (declared elsewhere) |  |
| Focused page | `--focused-page-stack-sm` (declared elsewhere) |  |
| Focused page | `--focused-page-stack-md` (declared elsewhere) |  |
| Focused page | `--focused-page-stack-lg` (declared elsewhere) |  |
| Focused page | `--focused-page-inline-sm` (declared elsewhere) |  |
| Focused page | `--focused-page-inline-md` (declared elsewhere) |  |

## Components

| Group | Token | Note |
|---|---|---|
| Button | `--button-radius-default` | nests in a 40-high field: its radius 10 minus the 4 slot inset = 6 |
| Button | `--button-radius-compact` | nests in a 32-high field: its radius 8 minus the 4 slot inset = 4 |
| Calendar | `--calendar-day-sm` |  |
| Calendar | `--calendar-day-md` |  |
| Calendar | `--calendar-day-lg` |  |
| Calendar | `--calendar-nav-size` |  |
| Progress indicator | `--progress-indicator-dot-size-8` | ProgressIndicator size 8 |
| Progress indicator | `--progress-indicator-dot-size-12` | ProgressIndicator size 12 |
| Checkbox | `--checkbox-control-size` |  |
| Radio | `--radio-control-size` |  |
| Radio | `--radio-control-size-10` | RadioGroup size 10 |
| Radio | `--radio-control-size-14` | RadioGroup size 14 |
| Choice grid | `--choice-grid-control-size-10` | ChoiceGrid size 12 |
| Choice grid | `--choice-grid-control-size-12` | ChoiceGrid size 14 and 16 |
| Range | `--range-dot-size-8` | Range size 8 |
| Range | `--range-dot-size-12` | Range size 12 |
| Range | `--range-dot-size-16` | Range size 16 |
| Range | `--range-dot-size-default` | Range with no size |
| Range | `--range-track-height-4` | Range size 8, and the default |
| Range | `--range-track-height-6` | Range size 12 |
| Range | `--range-track-height-8` | Range size 16 |
| Toggle | `--toggle-track-height-16` | Toggle size 16 |
| Toggle | `--toggle-track-height-20` | Toggle size 20 |
| Toggle | `--toggle-track-width-16` | Toggle size 16 |
| Toggle | `--toggle-track-width-20` | Toggle size 20 |
| Toggle | `--toggle-pad` | both sizes |
| Listbox | `--listbox-max-width` |  |
| Listbox | `--listbox-min-height` |  |
| Listbox | `--listbox-max-height` |  |
| Join row | `--join-row-width` |  |
| Option menu | `--option-menu-width` |  |
| Button | `--button-vertical-size` |  |
| Option row | `--option-row-indent-step` |  |
| Option row | `--option-row-control-gap` |  |
| Option row | `--option-row-dot-size` |  |
| Count tag | `--count-tag-dot-size` |  |
| Tag | `--tag-dot-size` |  |
| Tag | `--tag-pad-end-compact` |  |
| Tag | `--tag-gap-compact` |  |
| Tag | `--tag-pad-end` |  |
| Tag | `--tag-gap` |  |
| Carousel | `--carousel-control-offset` |  |
| Carousel | `--carousel-control-pad` |  |
| Carousel | `--carousel-control-size` |  |
| Carousel | `--carousel-slide-min-height-compact` |  |
| Carousel | `--carousel-slide-min-height` |  |
| Carousel | `--carousel-slide-min-height-spacious` |  |
| Carousel | `--carousel-indicator-width-compact` |  |
| Carousel | `--carousel-indicator-width` |  |
| Carousel | `--carousel-indicator-height-compact` |  |
| Carousel | `--carousel-indicator-height` |  |
| Carousel | `--carousel-indicator-height-spacious` |  |
| Scroll bar | `--scroll-bar-size` |  |
| Scroll bar | `--scroll-bar-max-height` |  |
| Skeleton | `--skeleton-height` |  |
| Skeleton | `--skeleton-circle-size` |  |
| Skeleton | `--skeleton-text-height` |  |
| Skeleton | `--skeleton-status-width` |  |
| Skeleton | `--skeleton-status-width-spacious` |  |
| Skeleton | `--skeleton-tag-width` |  |
| Skeleton | `--skeleton-tag-width-person` |  |
| Skeleton | `--skeleton-tag-width-narrow` |  |
| Skeleton | `--skeleton-tag-width-widest` |  |
| Flag | `--flag-min-height` |  |
| Flag | `--flag-pad` |  |
| Flag | `--flag-offset` |  |
| Flag | `--flag-radius-timer` |  |
| Flag | `--flag-timer-height` |  |
| Spotlight | `--spotlight-width` |  |
| Spotlight | `--spotlight-media-height` |  |
| Menu group | `--menu-group-min-width` |  |
| Menu group | `--menu-group-pad-x` |  |
| Menu group | `--menu-group-gap` |  |
| Menu group | `--menu-group-item-pad-y` |  |
| Popup | `--popup-min-width` |  |
| Popup | `--popup-max-width` |  |
| Popup | `--popup-clip-reach` |  |
| AI chat | `--ai-chat-width` |  |
| Popup | `--popup-pad` |  |
| Table | `--table-cell-max-width` |  |
| Avatar | `--avatar-size-96` |  |
| Avatar | `--avatar-size-128` |  |
| Spinner | `--spinner-size-sm` |  |
| Spinner | `--spinner-size-md` |  |
| Spinner | `--spinner-size-lg` |  |
| Progress bar | `--progress-bar-height` |  |

## Layers

| Group | Token | Note |
|---|---|---|
| Layer | `--layer-card` |  |
| Layer | `--layer-navigation` |  |
| Layer | `--layer-dialog` |  |
| Layer | `--layer-popup` |  |
| Layer | `--layer-blanket` | the Blanket's z-index; the old declaration's value, written directly so this file carries no old-language word |
| Layer | `--layer-modal` |  |
| Layer | `--layer-flag` |  |
| Layer | `--layer-spotlight` |  |
| Layer | `--layer-tooltip` |  |

