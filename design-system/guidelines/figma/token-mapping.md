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
| Surface roles/surface-raised | `var(--color-surface-raised)` | A card that lifts; pair with `--surface-raised-shadow` |
| Surface roles/surface-overlay | `var(--color-surface-overlay)` | Popovers and toasts; pair with `--surface-overlay-shadow` |

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

## Elevation Tokens

| Figma Elevation Level | PLUS CSS Token |
|----------------------|----------------|
| Elevation Light/1 (subtle) | `var(--elevation-light-1)` |
| Elevation Light/2 (cards, dropdowns) | `var(--elevation-light-2)` |
| Elevation Light/3 (popovers, toasts) | `var(--elevation-light-3)` |
| Elevation Light/4 (modals) | `var(--elevation-light-4)` |
| Elevation Light/5 (dialogs) | `var(--elevation-light-5)` |

## Layout Tokens

| Figma Variable | PLUS CSS Token | Notes |
|----------------|----------------|-------|
| Min Heights/listbox | `var(--layout-min-height-listbox)` | 140 at every breakpoint. Code does not apply it: a list is as tall as its rows, so a short list has no empty band |
| Max Heights/listbox | `var(--layout-max-height-listbox)` | 300 at every breakpoint, about eight rows; the body scrolls past it |
| Min Heights/card-body | `var(--layout-min-height-card-body)` | 20 / 30 / 40 at MD / LG / XL |
| Min Heights/modal-body | `var(--layout-min-height-modal-body)` | 40 / 50 / 60 at MD / LG / XL |
| — (code only) | `var(--layout-z-index-overlay)` | 1070, the layer floating listboxes and menus draw on: above a modal, level with popovers. Figma has no z-index |
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
