---
summary: For quick machine lookups, agents may read token-registry.json (read-only); use this doc for the authoritative tables, extended cases, and notes
---

<!-- Load when: Figma ↔ CSS token mapping | Route: design-system/guidelines/overview.md → foundations/token-mapping.md -->

# Figma Token Mapping Reference

> **This file is the SOURCE OF TRUTH for token mappings.** `design-system/figma/token-registry.json` is generated from the tables below via `npm run generate:token-registry`, and every `var(--*)` is validated against `design-system/src/tokens/*.scss`. Edit the tables here — never hand-edit the JSON. If you reference a token that does not exist in SCSS, the generator reports it and `npm run check:token-registry` fails.

For quick machine lookups, agents may read `token-registry.json` (read-only); use this doc for the authoritative tables, extended cases, and notes.

Use this reference when encoding PLUS token conventions into Figma via `create_design_system_rules`, or when translating Figma design context output to PLUS CSS tokens.

## Color Tokens

| Figma Variable / Style | PLUS CSS Token | Notes |
|------------------------|----------------|-------|
| background.brand.bold | `var(--ds-background-brand-bold)` | Every `color / semantics` variable maps this way: the CSS name is the variable path with dots as dashes, under `--ds-` |
| Focus / Focus Ring | `var(--ds-border-focused)` | Every focus indicator on a neutral ground |
| Focus / Focus Ring Inverse | `var(--ds-border-focused-inverse)` | Focus indicator on a colored or dark ground; aliases surface |
| Element/opacity-disabled | `var(--ds-opacity-disabled)` | 0.38 on the whole disabled control. Figma files it in size / semantics as 38, because it reads an opacity variable as a percentage |

## Typography Tokens

| Figma Text Style | PLUS CSS Token |
|-----------------|----------------|
| Heading/xxlarge | `var(--heading-xxlarge)` |
| Heading/xlarge | `var(--heading-xlarge)` |
| Heading/large | `var(--heading-large)` |
| Heading/medium | `var(--heading-medium)` |
| Heading/small | `var(--heading-small)` |
| Heading/xsmall | `var(--heading-xsmall)` |
| Heading/xxsmall | `var(--heading-xxsmall)` |
| Body/large | `var(--body-large)` |
| Body/default | `var(--body-default)` |
| Body/small | `var(--body-small)` |
| Metric/large | `var(--metric-large)` |
| Metric/medium | `var(--metric-medium)` |
| Metric/small | `var(--metric-small)` |
| Family/heading | `var(--type-family-heading)` |
| Family/body | `var(--type-family-body)` |
| Family/heading-serif | `var(--type-family-heading-serif)` |
| Family/code | `var(--type-family-code)` |
| Family/brand-heading | `var(--type-family-brand-heading)` |
| Family/brand-body | `var(--type-family-brand-body)` |
| Weight/regular | `var(--type-weight-regular)` |
| Weight/medium | `var(--type-weight-medium)` |
| Weight/semibold | `var(--type-weight-semibold)` |
| Letter spacing/none | `var(--type-tracking-none)` |
| Letter spacing/tight | `var(--type-tracking-tight)` |
| Letter spacing/tighter | `var(--type-tracking-tighter)` |

A variable bound to letter spacing renders in pixels in Figma, so `Heading/xxlarge`, `xlarge` and `large` hold their tracking as an explicit percent (-2%, -1%, -1%) on the style, and the `Letter spacing/*` variables (-1, -2) read as percent of font size. The token generator matches a style's percent to the variable of the same value.

The `Heading/*`, `Body/*` and `Metric/*` styles are the type scale: each binds its family, size, line height and weight to the `typography` collection, and each CSS token is the matching `font` shorthand (`font: var(--heading-large)`). A button or tab label is `Body/default` with `Weight/medium`.

### Text that carries no style

Two kinds of text node carry no text style, and each binds its type variables directly so a token change still reaches it:

- **A weighted label or run** (a button or Tab group label at `Weight/medium`, a semibold run inside body text): a weight change drops a node's text style, so the node binds `Font size/0875`, `Line height/125`, `Family/body` and the `Weight/*` it needs. Create no medium or semibold style for it.
- **A code sample in docs**: `Code` has no Figma style, so the sample is Noto Sans Mono (`Family/code`) bound to `Font size/0875` and `Line height/125`.

## Spacing Tokens

| Figma Spacing Context | PLUS CSS Token Pattern |
|----------------------|----------------------|
| Card padding | `var(--card-pad-{compact\|default\|spacious})` |
| Card gap | `var(--card-stack-{sm\|md\|lg})`, `var(--card-inline-{sm\|md\|lg})` |
| Card radius | `var(--card-radius)`, `var(--card-radius-sm)` |
| Element padding | `var(--pad-x-{xs\|sm\|md\|lg})`, `var(--pad-y-{sm\|md\|lg})` (ADR-038) |
| Element gap | `var(--stack-{sm\|md\|lg})`, `var(--inline-{sm\|md\|lg})`; the 10px step reads `var(--space-0625)` |
| Element radius | `var(--radius-{sm\|md\|lg\|full})` |
| Modal padding | `var(--modal-pad-{x\|y}-{compact\|default\|spacious})` |
| Section padding | `var(--section-pad-{x\|y}-{compact\|default\|spacious})` |
| Page padding | `var(--page-pad-{x\|y}-{compact\|default\|spacious})` |
| Table cell | `var(--table-pad-x-cell)` 8 · `var(--table-pad-y-cell)` 4 |
| Size roles | `var(--icon-md)`, `var(--control-md)`, `var(--row-height-md)`, `var(--image-sm)`: Icon sm · md · lg 12 · 16 · 24, Control sm · md · lg 24 · 32 · 40, Row sm · md · lg 32 · 40 · 48, Image xxs … xl 16 · 20 · 24 · 32 · 40 · 48 |

### Scale Tokens

The spacing / primitives and spacing / foundations collections (Foundations holds the Size, Element and Border folders). Each Figma variable's code syntax is its CSS name.

| Figma Variable | PLUS CSS Token | Notes |
|----------------|----------------|-------|
| spacing / primitives `Space/space-*`, `Radius/radius-*`, `Stroke/stroke-*`, `Size/size-*` | `var(--space-025)`, `var(--radius-050)`, `var(--stroke-1)`, `var(--size-200)` | Named by rem × 100 (`space-025` is 4). Hidden in Figma; semantic tokens point at them |
| Foundations `Element/pad-x-{xs\|sm\|md}`, `pad-y-{sm\|md}` | `var(--pad-x-sm)` | 4 · 8 · 12 · 16 and 2 · 6 · 8 |
| Foundations `Element/stack-*`, `inline-*` | `var(--stack-md)`, `var(--inline-sm)` | 4 · 8 · 12 |
| Foundations `Element/radius-{sm\|md\|lg}`, `radius-item-{sm\|md}`, `radius-full` | `var(--radius-h32)` | 2 · 4 · 8, items 6 · 8 |
| Foundations `Size/Height/*`, `Width/*` | `var(--height-200)`, `var(--width-1400)` | Common scales, named by rem × 100 |
| Foundations `Size/Item/height-{sm\|md}` | `var(--item-height-md)` | 24 · 32; there is no 40 Item |
| Foundations `Size/Row/height-{sm\|md\|lg}` | `var(--row-height-md)` | 32 · 40 · 48 |
| Foundations `Size/Label/*`, `Field/*` | `var(--label-height-md)`, `var(--field-width-md)` | Label 16 · 20, max 160; Field widths 80 … 480, min heights 80 · 120 |
| Foundations `Size/Icon/*`, `Image/*` | `var(--icon-md)`, `var(--image-sm)` | Icon 12 · 16 · 24; Image 16 … 48 |
| Foundations `Border/default`, `selected`, `focused` | `var(--border-default)` | 1 · 2 · 2 |

## Elevation Tokens

| Figma Elevation | PLUS CSS Token |
|----------------------|----------------|
| Raised surface (cards) | `var(--ds-surface-raised)` |
| Raised shadow (cards; a clickable card lifts to the overlay shadow on hover or drag) | `var(--ds-shadow-raised)` |
| Overlay surface (Popups, menus, listboxes, Flags, the floating Sidebar and Panel; the Modal too) | `var(--ds-surface-overlay)` |
| Overlay shadow (Popups, menus, listboxes, Flags, the floating Sidebar and Panel; the Tooltip takes none) | `var(--ds-shadow-overlay)` |
| Blocking shadow (the Modal on its Backdrop, only) | `var(--ds-shadow-blocking)` |

## Layout Tokens

| Figma Variable | PLUS CSS Token | Notes |
|----------------|----------------|-------|
| Min Heights/listbox | `var(--listbox-min-height)` | 140 at every breakpoint. Code does not apply it: a list is as tall as its rows, so a short list has no empty band |
| Max Heights/listbox | `var(--listbox-max-height)` | 300 at every breakpoint, about eight rows; the body scrolls past it |
| — (code only) | `var(--layer-card)` … `var(--layer-tooltip)` | PLUS layers: card 100, navigation 200, dialog 300, popup 400, scrim 500, modal 510, flag 600, spotlight 700, tooltip 800. A popup opened from a field inside a modal mounts in the modal's overlay and takes its layer. Figma has no z-index |
| — (code only) | `var(--listbox-max-width)` | 320, the widest a popup from a field or button grows. A popup with columns (Cascader, the calendar) is exempt |
| — (code only) | `var(--checkbox-control-size)` · `var(--radio-control-size)` | 18 and 12, the checkbox box and radio dot; a description or reveal under the label indents by one plus the label gap |
| — (code only) | `var(--calendar-day-sm)` · `var(--calendar-day-md)` · `var(--calendar-day-lg)` · `var(--calendar-nav-size)` | 28 / 36 / 44 calendar days by picker size, and the 32 month buttons |
| — (code only) | `var(--join-row-width)` | 520, the Home Join button with the session Select beside it |

## Rules for create_design_system_rules

When encoding rules via `create_design_system_rules`, include these conventions:

1. **Never hardcode** — all visual values must map to the tokens above
2. **Color by role** — `--ds-background-*` for fills, `--ds-surface-*` for grounds, `--ds-text-*`, `--ds-icon-*` and `--ds-border-*` for the rest
3. **Semantic context** — choose token by context (card → `--card-*`, element → the semantics `--pad-*`, `--stack-*`, `--inline-*`, `--radius-*`)
4. **Font Awesome Free only** — `fa-solid`, `fa-regular`, `fa-brands`. No Pro icons
5. **PLUS components first** — interactive behavior on Base UI, styled on `--ds-*` tokens; no other UI framework
