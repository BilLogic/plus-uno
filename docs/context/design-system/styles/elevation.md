<!-- Tier: 2 -->

# Elevation Tokens

Elevation creates visual hierarchy through shadows. PLUS uses a five-step
Material-Design-3 ladder generated from Figma — token names and values are
owned by `design-system/src/tokens/_elevation.scss`, and the Figma-to-CSS
mapping by `design-system/docs/foundations/token-mapping.md`.

## Elevation levels

| Token | Figma level | Usage |
|-------|-------------|-------|
| `--elevation-light-1` | Elevation Light/1 | Subtle lift — resting surfaces, badge cards |
| `--elevation-light-2` | Elevation Light/2 | Cards, dropdowns |
| `--elevation-light-3` | Elevation Light/3 | Popovers, toasts |
| `--elevation-light-4` | Elevation Light/4 | Modals |
| `--elevation-light-5` | Elevation Light/5 | Dialogs |

There is no `none` token — a flat element sets no `box-shadow` at all.

## Shadow values

```css
--elevation-light-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
--elevation-light-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
--elevation-light-3: 0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
--elevation-light-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
--elevation-light-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
```

## Usage

```css
.my-card {
  box-shadow: var(--elevation-light-2);
}

.my-modal {
  box-shadow: var(--elevation-light-4);
}

.my-toast {
  box-shadow: var(--elevation-light-3);
}
```

`Pattern/Surface` exposes the whole ladder — read
`design-system/src/patterns/Surface/Surface.scss` before hand-rolling a
raised surface.

## Rules

1. **Use sparingly** — elevation should create meaningful hierarchy.
2. **Match to context** — higher levels for overlays that sit above more content.
3. **Never hardcode shadows** — always use an elevation token. A fallback
   value inside `var(--elevation-light-1, …)` is legacy, not a pattern to copy.
