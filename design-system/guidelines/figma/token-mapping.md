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
| Primary / Primary 500 | `var(--color-primary)` | Main brand color |
| Primary Container | `var(--color-primary-container)` | Prefer over `-state-08` for elevated surfaces |
| On Primary | `var(--color-on-primary)` | Text/icons on primary backgrounds |
| Secondary | `var(--color-secondary)` | |
| Danger / Error | `var(--color-danger)` | |
| Success | `var(--color-success)` | |
| Warning | `var(--color-warning)` | |
| Info | `var(--color-info)` | |
| Surface | `var(--color-surface)` | Base surface |
| On Surface | `var(--color-on-surface)` | Primary text color |
| On Surface Variant | `var(--color-on-surface-variant)` | Secondary text |
| Outline | `var(--color-outline)` | Borders, dividers |
| Outline Variant | `var(--color-outline-variant)` | Subtle borders |
| Focus / Focus Ring | `var(--color-focus-ring)` | Every focus indicator on a neutral ground |
| Focus / Focus Ring Inverse | `var(--color-focus-ring-inverse)` | Focus indicator on a colored or dark ground; aliases surface |
| Element/opacity-disabled | `var(--color-disabled-opacity)` | 0.38 on the whole disabled control. Figma files it in size / semantics as 38, because it reads an opacity variable as a percentage |
| Surface roles/surface-default | `var(--color-surface-default)` | The page; aliases `--surface-default` |
| Surface roles/surface-sunken | `var(--color-surface-sunken)` | The ground behind grouped things; aliases `--surface-sunken` |
| Surface roles/surface-raised | `var(--color-surface-raised)` | A card: flat at rest; a clickable card pairs it with `--surface-raised-shadow` on hover or drag |
| Surface roles/surface-overlay | `var(--color-surface-overlay)` | Floating layers without a scrim (pair with `--surface-overlay-shadow`) and modals (with `--elevation-light-4`) |

### SMART Competency Colors
| Figma | PLUS CSS Token |
|-------|----------------|
| Mastering Content | `var(--color-mastering-content)` |
| Relationship | `var(--color-relationship)` |
| Social Emotional | `var(--color-social-emotional)` |
| Advocacy | `var(--color-advocacy)` |
| Technology Tools | `var(--color-technology-tools)` |

### State Opacity Convention
Tokens ending in `-state-08`, `-state-12`, `-state-16` are 8%, 12%, 16% opacity variants. Use `-container` tokens instead for elevated or filled surfaces.

### Label Border Convention
`<Hue>/<Hue> Border Subtle` is the hue at 45%, the border of an outlined label (Tag, date Status), and maps to `var(--color-<hue>-border-subtle)`. It is not `<Hue> Border`, the 3:1 role that maps to `var(--color-<hue>-border)`. Success, Warning, Danger, Tertiary and the five SMART hues have one.

## Typography Tokens

| Figma Text Style | PLUS CSS Token |
|-----------------|----------------|
| Display 1 | `var(--font-size-display1)`, `var(--font-weight-display)`, `var(--font-line-height-display1)` |
| Display 2 | `var(--font-size-display2)` |
| Display 3 | `var(--font-size-display3)` |
| Display 4 | `var(--font-size-display4)` |
| Headline (H1–H3) | `var(--font-size-h1)`, `var(--font-weight-headline)`, `var(--font-family-headline)` — Headline has no single size token; use the H-scale |
| Title | `var(--font-weight-title)`, `var(--font-weight-semibold-2)` — Title has no dedicated size token; pair with an H-scale size |
| H1–H6 | `var(--font-size-h1)` through `var(--font-size-h6)` |
| Body 1 | `var(--font-size-body1)`, `var(--font-weight-body1-regular)` |
| Body 2 | `var(--font-size-body2)` |
| Body 3 | `var(--font-size-body3)` |
| Code | `var(--font-size-code)`, `var(--font-family-code)` |
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
| Weight/regular | `var(--type-weight-regular)` |
| Weight/medium | `var(--type-weight-medium)` |
| Weight/semibold | `var(--type-weight-semibold)` |

The `Heading/*`, `Body/*` and `Metric/*` styles are the type scale: each binds its family, size, line height and weight to the `typography` collection, and each CSS token is the matching `font` shorthand (`font: var(--heading-large)`). A button or tab label is `Body/default` with `Weight/medium`. The rows above them are the older styles, which sit under `Legacy/` in Figma where their folder collided (`Legacy/Body/B1/…`), kept until every use moves.

### Text that carries no style

Two kinds of text node carry no text style, and each binds its type variables directly so a token change still reaches it:

- **A weighted label or run** (a button or Tab group label at `Weight/medium`, a semibold run inside body text): a weight change drops a node's text style, so the node binds `Font size/0875`, `Line height/125`, `Family/body` and the `Weight/*` it needs. Create no medium or semibold style for it.
- **A code sample in docs**: `Code` has no Figma style, so the sample is Source Code Pro bound to `Font size/0875` and `Line height/125`.

## Spacing Tokens

| Figma Spacing Context | PLUS CSS Token Pattern |
|----------------------|----------------------|
| Card padding | `var(--size-card-pad-{x\|y}-{sm\|md\|lg})` |
| Card gap | `var(--size-card-gap-{sm\|md\|lg})` |
| Card radius | `var(--size-card-radius-{sm\|md\|full})` |
| Element padding | `var(--size-element-pad-{x\|y}-{sm\|md\|lg})`, plus `var(--size-element-pad-x-xs)` (4) |
| Element gap | `var(--size-element-gap-{xs\|sm\|md\|lg})` |
| Element radius | `var(--size-element-radius-{sm\|md\|lg\|full})` |
| Modal padding | `var(--size-modal-pad-{x\|y}-{sm\|md\|lg})` |
| Section padding | `var(--size-section-pad-{x\|y}-{sm\|md\|lg})` |
| Surface padding | `var(--size-surface-pad-{x\|y})` |
| Table cell | `var(--size-table-cell-{x\|y\|gap})` |

### Scale Tokens

The spacing / primitives and spacing / foundations collections (Foundations holds the Size, Element and Border folders), beside the old `--size-*` tokens until every use moves. Each Figma variable's code syntax is its CSS name.

| Figma Variable | PLUS CSS Token | Notes |
|----------------|----------------|-------|
| spacing / primitives `Space/space-*`, `Radius/radius-*`, `Stroke/stroke-*`, `Size/size-*` | `var(--space-025)`, `var(--radius-050)`, `var(--stroke-1)`, `var(--size-200)` | Named by rem × 100 (`space-025` is 4). Hidden in Figma; semantic tokens point at them |
| Foundations `Element/pad-x-{xs\|sm\|md}`, `pad-y-{sm\|md}` | `var(--element-pad-x-sm)` | 4 · 8 · 12 and 2 · 6. The old `--size-element-pad-y-sm` is 4; the new one is 2 |
| Foundations `Element/stack-*`, `inline-*` | `var(--element-stack-md)`, `var(--element-inline-sm)` | 4 · 8 · 12 |
| Foundations `Element/radius-{sm\|md\|lg}`, `radius-item-{sm\|md}`, `radius-full` | `var(--element-radius-item-md)` | 2 · 4 · 8, items 6 · 8 |
| Foundations `Size/Height/*`, `Width/*` | `var(--height-200)`, `var(--width-1400)` | Common scales, named by rem × 100 |
| Foundations `Size/Item/height-{sm\|md}` | `var(--item-height-md)` | 24 · 32; there is no 40 Item |
| Foundations `Size/Row/height-{sm\|md\|lg}` | `var(--row-height-md)` | 32 · 40 · 48 |
| Foundations `Size/Label/*`, `Field/*` | `var(--label-height-md)`, `var(--field-width-md)` | Label 16 · 20, max 160; Field widths 80 … 480, min heights 80 · 120 |
| Foundations `Size/Icon/*`, `Image/*` | `var(--icon-md)`, `var(--image-sm)` | Icon 12 · 16 · 24; Image 16 … 48 |
| Foundations `Border/default`, `selected`, `focused` | `var(--border-default)` | 1 · 2 · 2 |

## Elevation Tokens

| Figma Elevation Level | PLUS CSS Token |
|----------------------|----------------|
| Elevation Light/1 (subtle) | `var(--elevation-light-1)` |
| Elevation Light/2 (clickable cards on hover or drag) | `var(--elevation-light-2)` |
| Elevation Light/3 (menus, popovers, tooltips, toasts, listboxes) | `var(--elevation-light-3)` |
| Elevation Light/4 (modals) | `var(--elevation-light-4)` |
| Elevation Light/5 (dialogs) | `var(--elevation-light-5)` |

## Layout Tokens

| Figma Variable | PLUS CSS Token | Notes |
|----------------|----------------|-------|
| Min Heights/listbox | `var(--layout-min-height-listbox)` | 140 at every breakpoint. Code does not apply it: a list is as tall as its rows, so a short list has no empty band |
| Max Heights/listbox | `var(--layout-max-height-listbox)` | 300 at every breakpoint, about eight rows; the body scrolls past it |
| Min Heights/card-body | `var(--layout-min-height-card-body)` | 20 / 30 / 40 at MD / LG / XL |
| Min Heights/modal-body | `var(--layout-min-height-modal-body)` | 40 / 50 / 60 at MD / LG / XL |
| — (code only) | `var(--layout-z-index-card)` … `var(--layout-z-index-tooltip)` | Atlassian's layers: card 100, navigation 200, dialog 300, popup 400, scrim 500, modal 510, flag 600, spotlight 700, tooltip 800. A popup opened from a field inside a modal mounts in the modal's overlay and takes its layer. Figma has no z-index |
| — (code only) | `var(--layout-max-width-listbox)` | 320, the widest a popup from a field or button grows. A popup with columns (Cascader, the calendar) is exempt |
| — (code only) | `var(--layout-control-checkbox)` · `var(--layout-control-radio)` | 18 and 12, the checkbox box and radio dot; a description or reveal under the label indents by one plus the label gap |
| — (code only) | `var(--layout-calendar-day-sm)` · `var(--layout-calendar-day-md)` · `var(--layout-calendar-day-lg)` · `var(--layout-calendar-nav)` | 28 / 36 / 44 calendar days by picker size, and the 32 month buttons |
| — (code only) | `var(--layout-width-join-row)` | 520, the Home Join button with the session Select beside it |

## Rules for create_design_system_rules

When encoding rules via `create_design_system_rules`, include these conventions:

1. **Never hardcode** — all visual values must map to the tokens above
2. **Container over state** — use `-container` tokens for filled surfaces, not `-state-08`
3. **Semantic context** — choose token by context (card → `--size-card-*`, element → `--size-element-*`)
4. **Font Awesome Free only** — `fa-solid`, `fa-regular`, `fa-brands`. No Pro icons
5. **React-Bootstrap base** — components extend Bootstrap 5.3, not alternative frameworks
