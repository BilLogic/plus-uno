# Design Tokens Reference

Token definitions are in:
- `packages/plus-ds/src/tokens/_colors.scss`
- `packages/plus-ds/src/tokens/_spacing_semantics.scss`
- `packages/plus-ds/src/tokens/_fonts.scss`
- `packages/plus-ds/src/tokens/_elevation.scss`
- `packages/plus-ds/src/tokens/_layout.scss`
- `packages/plus-ds/src/tokens/_primitives.scss` (primitives only)
- Source JSON: `packages/plus-ds/src/tokens/source/*.json`

**CRITICAL: Never hardcode values. Always use PLUS token variables.**

## Color Tokens

Core pattern:
- `--color-{role}`
- `--color-{role}-text`
- `--color-on-{role}`
- `--color-{role}-container`
- `--color-{role}-state-08|12|16`

Common roles:
- Primary, Secondary, Tertiary
- Success, Warning, Danger, Info
- SMART domains: Social-Emotional, Mastering Content, Advocacy, Relationship, Technology Tools
- Surface roles: `--color-surface*`, `--color-outline*`

## Spacing Tokens

Use semantic layers:
- Element: `--size-element-*`
- Card: `--size-card-*`
- Section: `--size-section-*`
- Modal: `--size-modal-*`
- Table: `--size-table-*`
- Surface: `--size-surface-*`, `--size-surface-container-*`

Use primitives (`--size-spacing-*`, `--size-border-*`) only to define semantics, not in feature code.

## Typography Tokens

Families and weights:
- `--font-family-header`
- `--font-family-body`
- `--font-family-code`
- `--font-weight-*`

Scale examples:
- Display: `--font-size-display*`
- Headline/title: `--font-size-h1` ... `--font-size-h6`
- Body: `--font-size-body1` ... `--font-size-body3`

## Other Tokens

Elevation:
- `--elevation-light-1` ... `--elevation-light-5`

Layout/breakpoints:
- `--breakpoint-md-min`, `--breakpoint-lg-min`, `--breakpoint-xl-min`, etc.

Radius and border sizes:
- Semantic radius/border tokens per context
- Primitive fallback: `--size-border-radius-*`, `--size-border-stroke-*`

## Token Usage Examples

### Correct Usage ✅

```scss
.page-card {
  background-color: var(--color-surface-container-lowest);
  color: var(--color-on-surface);
  padding: var(--size-card-pad-y-lg) var(--size-card-pad-x-lg);
  border-radius: var(--size-card-radius-sm);
  box-shadow: var(--elevation-light-1);
}

.cta-button {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}
```

### Incorrect Usage ❌

```scss
.page-card {
  background-color: #fff;
  color: #1c1b1f;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

## Practical Rules

1. Choose semantic token layer first (element/card/section/modal/table).
2. Do not mix unrelated spacing layers in one component unless intentionally composing contexts.
3. Prefer state-layer tokens for hover/active/focus backgrounds.
4. Keep token naming in sync with generated files when syncing from Figma.
