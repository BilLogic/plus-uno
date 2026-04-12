<!-- Load when: encoding design system rules, verifying token mapping, create_design_system_rules -->

# Figma Token Mapping Reference

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

## Typography Tokens

| Figma Text Style | PLUS CSS Token |
|-----------------|----------------|
| Display 1 | `var(--font-size-display1)`, `var(--font-weight-display)`, `var(--font-line-height-display1)` |
| Display 2 | `var(--font-size-display2)` |
| Display 3 | `var(--font-size-display3)` |
| Display 4 | `var(--font-size-display4)` |
| Headline | `var(--font-size-headline)`, `var(--font-weight-headline)` |
| Title | `var(--font-size-title)`, `var(--font-weight-title)` |
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
| Element padding | `var(--size-element-pad-{x\|y}-{sm\|md\|lg})` |
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

## Rules for create_design_system_rules

When encoding rules via `create_design_system_rules`, include these conventions:

1. **Never hardcode** — all visual values must map to the tokens above
2. **Container over state** — use `-container` tokens for filled surfaces, not `-state-08`
3. **Semantic context** — choose token by context (card → `--size-card-*`, element → `--size-element-*`)
4. **Font Awesome Free only** — `fa-solid`, `fa-regular`, `fa-brands`. No Pro icons
5. **React-Bootstrap base** — components extend Bootstrap 5.3, not alternative frameworks
