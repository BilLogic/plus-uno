<!-- Load for: quick reference on naming, import patterns, token usage patterns -->

# Conventions Quick Reference

## Token Usage Pattern
- Correct: `var(--color-primary)`, `var(--size-card-pad-x-md)`, `var(--font-size-body1)`, `var(--elevation-light-2)`
- Incorrect: `#3B82F6`, `16px`, `0 2px 4px rgba(0,0,0,0.1)` in feature code.

## Real Token Examples

**Spacing (semantic):**
- `var(--size-element-pad-x-lg)` — horizontal padding on an interactive element
- `var(--size-card-pad-x-md)` — horizontal padding inside a card
- `var(--size-section-gap-lg)` — gap between items in a section
- `var(--size-modal-radius-lg)` — border radius on a modal
- `var(--size-surface-pad-x)` — horizontal padding on a surface container

**Color:**
- `var(--color-primary)`, `var(--color-on-primary)` — primary action and its contrast text
- `var(--color-surface)`, `var(--color-on-surface)` — default surface and text
- `var(--color-surface-container)` — contained surface background
- `var(--color-danger)`, `var(--color-success)`, `var(--color-warning)` — semantic status
- `var(--color-primary-state-08)` — state layer at 8% opacity for hover/focus

**Typography:**
- `var(--font-family-header)`, `var(--font-family-body)`, `var(--font-family-code)`
- `var(--font-size-h1)`, `var(--font-size-body1)`, `var(--font-size-body2)`
- `var(--font-weight-semibold-1)`, `var(--font-weight-bold)`
- `var(--font-line-height-h1)`, `var(--font-line-height-body2)`

**Elevation:**
- `var(--elevation-light-1)` through `var(--elevation-light-5)` — progressive shadow depth

**Layout breakpoints:**
- `var(--breakpoint-md-min)`, `var(--breakpoint-lg-min)`, `var(--breakpoint-xl-min)`

## Maintenance Rule
- If token naming/values change via sync, update docs and references that depend on those names.
