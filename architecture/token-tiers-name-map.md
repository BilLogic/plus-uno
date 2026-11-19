---
summary: Token ladder (ADR-038) — every token across all four tiers, by group
---

<!-- Tier: 2 -->
# Token tiers (ADR-038)

Generated from `scripts/lib/tokens/plan.mjs`'s `TOKEN_LADDER` by `npm run generate:design-tokens` — never hand-edit.

One plan, four tiers, most general to most specific: **primitives** (`--space-*` / `--radius-*` / `--stroke-*` / `--size-*`, Figma-sourced, `generate-all-tokens.js`) -> **semantics** -> **templates** -> **components**, plus **layers** as its own z-index family. Figma collection names: `spacing / primitives`, `spacing / semantics`, `spacing / templates`, `spacing / components`, `layers`.

Every token below is declared by the generator in `design-system/src/tokens/ladder/_semantics.scss`, `_templates.scss`, `_components.scss` or `_layers.scss`, with its own value, except a row marked *declared elsewhere*, whose name its own source file already declares.

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
| Stack | `--stack-xl` |  |
| Stack | `--stack-2xl` |  |
| Stack | `--stack-3xl` |  |
| Inline | `--inline-sm` |  |
| Inline | `--inline-md` |  |
| Inline | `--inline-lg` |  |
| Inline | `--inline-xl` |  |
| Inline | `--inline-2xl` |  |
| Inline | `--inline-3xl` |  |
| Radius | `--radius-sm` |  |
| Radius | `--radius-md` |  |
| Radius | `--radius-lg` |  |
| Radius | `--radius-xl` |  |
| Radius | `--radius-xxl` |  |
| Radius | `--radius-full` | Figma Radius/full; the code name is the --radius-full primitive, so no second declaration |
| Radius / Control | `--radius-control-sm` | pairs with --control-sm; height 24, 24÷4 = 6 |
| Radius / Control | `--radius-control-md` | pairs with --control-md; height 32, 32÷4 = 8 |
| Radius / Control | `--radius-control-lg` | pairs with --control-lg; height 40, 40÷4 = 10 |
| Border | `--border-width-default` (declared elsewhere) |  |
| Border | `--border-width-selected` (declared elsewhere) |  |
| Border | `--border-width-focused` (declared elsewhere) |  |
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
| Content | `--content-prose-stack` |  |
| Content | `--content-list-indent` |  |
| Size | `--icon-sm` (declared elsewhere) |  |
| Size | `--icon-md` (declared elsewhere) |  |
| Size | `--icon-lg` (declared elsewhere) |  |
| Size | `--image-xxs` (declared elsewhere) |  |
| Size | `--image-xs` (declared elsewhere) |  |
| Size | `--image-sm` (declared elsewhere) |  |
| Size | `--image-md` (declared elsewhere) |  |
| Size | `--image-lg` (declared elsewhere) |  |
| Size | `--image-xl` (declared elsewhere) |  |
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
| Size | `--control-xl` |  |

## Templates

| Group | Token | Note |
|---|---|---|
| Frame | `--frame-topbar-height` |  |
| Frame | `--frame-sidebar-width` |  |
| Frame | `--frame-sidebar-pad` | the Sidebar pads 12 on every side |
| Frame | `--frame-sidebar-row-gap` | two Sidebar rows sit 2 apart |
| Frame | `--frame-sidebar-group-gap` | two Sidebar groups sit 16 apart |
| Frame | `--frame-sidebar-row-radius` | the rounding of a Sidebar row (8) |
| Page | `--page-pad` (declared elsewhere) |  |
| Page | `--page-stack-sm` (declared elsewhere) |  |
| Page | `--page-stack-md` (declared elsewhere) |  |
| Page | `--page-stack-lg` (declared elsewhere) |  |
| Panel | `--panel-min-width` | the narrowest the splitter allows (320) |
| Panel | `--panel-width-default` | the width a Panel opens at (400) |
| Panel | `--panel-max-width` | the widest the splitter allows (640) |
| Panel | `--panel-pad` |  |
| Panel | `--panel-pad-y` |  |
| Panel | `--panel-subheader-pad-y` |  |
| Panel | `--panel-inline-sm` |  |
| Panel | `--panel-inline-md` |  |
| Panel | `--panel-inline-lg` |  |
| Section | `--section-stack-sm` (declared elsewhere) |  |
| Section | `--section-stack-md` (declared elsewhere) |  |
| Section | `--section-stack-lg` (declared elsewhere) |  |
| Section | `--section-min-width-main` (declared elsewhere) |  |
| Section | `--section-min-width-side` (declared elsewhere) |  |
| Section | `--section-toolbar-min-width` |  |
| Section | `--section-toolbar-count-min-width` |  |
| Card | `--card-pad` |  |
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
| Card | `--card-max-height-sm` (declared elsewhere) |  |
| Card | `--card-max-height-md` (declared elsewhere) |  |
| Card | `--card-max-height-lg` (declared elsewhere) |  |
| Card | `--card-surface-sunken` |  |
| Card | `--card-surface-default` |  |
| Card | `--card-surface-raised` |  |
| Card | `--card-surface-raised-hovered` |  |
| Card | `--card-surface-raised-pressed` |  |
| Card | `--card-surface-overlay` |  |
| Card | `--card-border-default` |  |
| Card | `--card-border-width` |  |
| Card | `--card-shadow-raised` |  |
| Card | `--card-shadow-overlay` |  |
| Card | `--card-text` |  |
| Card | `--card-text-subtle` |  |
| Card | `--card-title-font-lg` |  |
| Card | `--card-description-font` |  |
| Table | `--table-pad-x-cell` (declared elsewhere) |  |
| Table | `--table-pad-y-cell` (declared elsewhere) |  |
| Table | `--table-indent` (declared elsewhere) |  |
| Table | `--table-radius` |  |
| Table | `--table-pad-x-footer` (declared elsewhere) |  |
| Table | `--table-inline` |  |
| Table | `--table-footer-height` |  |
| Table | `--table-min-width-title` (declared elsewhere) |  |
| Table | `--table-empty-surface` |  |
| Table | `--table-empty-radius` |  |
| Blanket | `--blanket-pad-x` |  |
| Blanket | `--blanket-pad-y` |  |
| Blanket | `--blanket-max-height-modal` | a calc() of the pad above: code only, no Figma variable |
| Modal | `--modal-pad-x-default` |  |
| Modal | `--modal-pad-x-spacious` |  |
| Modal | `--modal-stack-sm` (declared elsewhere) |  |
| Modal | `--modal-stack-md` (declared elsewhere) |  |
| Modal | `--modal-stack-lg` (declared elsewhere) |  |
| Modal | `--modal-inline-sm` (declared elsewhere) |  |
| Modal | `--modal-inline-md` (declared elsewhere) |  |
| Modal | `--modal-inline-lg` (declared elsewhere) |  |
| Modal | `--modal-radius` |  |
| Modal | `--modal-width-4-col` | 4 screen-grid columns plus 2 × 16 modal pad at 768 · 1024 · 1440 |
| Modal | `--modal-width-6-col` | lifted out of spacing / layout, beside the template’s pad/stack tokens |
| Modal | `--modal-width-8-col` |  |
| Modal | `--modal-width-10-col` |  |
| Page | `--page-border-width` |  |
| Table | `--table-overflow-reach` |  |
| Modal | `--modal-body-min-height` |  |
| Modal | `--modal-shadow` |  |
| Popup | `--popup-pad` (declared elsewhere) |  |
| Popup | `--popup-width-sm` (declared elsewhere) |  |
| Popup | `--popup-width-md` (declared elsewhere) |  |
| Popup | `--popup-width-lg` (declared elsewhere) |  |
| Popup | `--flag-width` (declared elsewhere) |  |
| Popup | `--flag-stack` (declared elsewhere) |  |
| Popup | `--popup-radius` |  |
| Popup | `--popup-width-3-col` | 3 · 4 screen-grid columns plus 2 × 16 popup pad at 768 · 1024 · 1440 |
| Popup | `--popup-width-4-col` |  |
| Popup | `--dropdown-menu-pad` (declared elsewhere) |  |
| Popup | `--dropdown-menu-min-width` (declared elsewhere) |  |
| Popup | `--dropdown-menu-max-width` (declared elsewhere) |  |
| Popup | `--dropdown-menu-max-height` (declared elsewhere) |  |
| Popup | `--tooltip-pad-y` (declared elsewhere) |  |
| Popup | `--tooltip-max-width` (declared elsewhere) |  |
| Popup | `--popup-gap-screen` (declared elsewhere) |  |
| Popup | `--popup-offset` (declared elsewhere) |  |
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
| Button | `--button-radius-spacious` | 48-high footer button; pairs with --control-xl |
| Dialog | `--dialog-pad-x-default` |  |
| Dialog | `--dialog-pad-x-spacious` |  |
| Dialog | `--dialog-stack-sm` |  |
| Dialog | `--dialog-stack-md` |  |
| Dialog | `--dialog-stack-lg` |  |
| Dialog | `--dialog-inline-sm` |  |
| Dialog | `--dialog-inline-md` |  |
| Dialog | `--dialog-inline-lg` |  |
| Dialog | `--dialog-radius` |  |
| Dialog | `--dialog-body-min-height` |  |
| Dialog | `--dialog-shadow` |  |
| Calendar | `--calendar-day-sm` |  |
| Calendar | `--calendar-day-md` |  |
| Calendar | `--calendar-day-lg` |  |
| Progress indicator | `--progress-indicator-dot-size-8` | ProgressIndicator size 8 |
| Progress indicator | `--progress-indicator-dot-size-12` | ProgressIndicator size 12 |
| Checkbox | `--checkbox-control-size` |  |
| Choice tile | `--choice-tile-width` |  |
| File item | `--file-item-height` |  |
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
| Setting row | `--setting-row-pad-y` |  |
| Setting row | `--setting-row-end-min-height` |  |
| Setting row | `--setting-row-select-min-width` |  |
| Listbox | `--listbox-max-width` |  |
| Listbox | `--listbox-min-height` |  |
| Listbox | `--listbox-max-height` |  |
| Join row | `--join-row-width` |  |
| Option menu | `--option-menu-width` |  |
| Checklist | `--checklist-action-width` | 128px; 96px remains for the ProgressBar when a 32px dismiss IconButton takes the end |
| Checklist | `--checklist-action-min-width` | 120px floor |
| Option row | `--option-row-indent-step` |  |
| Option row | `--option-row-control-gap` |  |
| Option row | `--option-row-dot-size` |  |
| Count tag | `--count-tag-dot-size` |  |
| Count tag | `--count-tag-ring-width` |  |
| Date time picker | `--date-time-picker-section-gap` |  |
| Field | `--field-gap` |  |
| Radio group | `--radio-group-inline-gap` |  |
| Rating | `--rating-gap` |  |
| Rich text editor | `--rich-text-editor-max-width` |  |
| AI message | `--ai-message-caret-width` |  |
| AI message | `--ai-message-dot-size` |  |
| Tag | `--tag-dot-size` |  |
| Tag | `--tag-pad-x-end-compact` |  |
| Tag | `--tag-gap-compact` |  |
| Tag | `--tag-pad-x-end` |  |
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
| Carousel | `--carousel-slide-max-width` |  |
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
| Spotlight | `--spotlight-screen-pad` |  |
| Spotlight | `--spotlight-pad` |  |
| Spotlight | `--spotlight-gap` |  |
| Spotlight | `--spotlight-footer-stack` |  |
| Menu group | `--menu-group-min-width` |  |
| Popup | `--popup-min-width` |  |
| Popup | `--popup-max-width` |  |
| Popup | `--popup-clip-reach` |  |
| AI chat | `--ai-chat-width` |  |
| Prompt input | `--prompt-input-min-height` |  |
| Inbox | `--inbox-width` | 360px |
| Table | `--table-cell-max-width` |  |
| Table | `--table-message-gap` |  |
| Page header | `--page-header-stack` |  |
| Page header | `--page-header-gap` |  |
| Comment | `--comment-pad` |  |
| Comment | `--comment-gap` |  |
| Comment | `--comment-replies-stack` |  |
| Comment | `--comment-replies-indent` |  |
| Progress tracker | `--progress-tracker-connector-width` |  |
| Progress tracker | `--progress-tracker-dot-size` |  |
| Avatar | `--avatar-size-96` |  |
| Avatar | `--avatar-size-128` |  |
| Spinner | `--spinner-size-sm` |  |
| Spinner | `--spinner-size-md` |  |
| Spinner | `--spinner-size-lg` |  |
| Progress bar | `--progress-bar-height` |  |
| Progress ring | `--progress-ring-stroke` |  |

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

