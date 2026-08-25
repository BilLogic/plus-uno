---
summary: The PLUS Design System uses a fluid 12-column grid that adapts to the container width
---

<!-- Tier: 2 -->

# Grid

The PLUS Design System uses a **fluid 12-column grid** that adapts to the container width.
Source of truth: `design-system/src/tokens/_layout.scss`.

## Breakpoints

| Token | Value |
|:---|:---|
| `--breakpoint-md-min` | 768px |
| `--breakpoint-lg-min` | 1024px |
| `--breakpoint-xl-min` | 1440px |
| `--breakpoint-xxl-min` | 1920px |

## App shell tokens

| Token | Value | Description |
|:---|:---|:---|
| `--layout-sidebar-width` | 164px | SideNav fixed width (Large and up) |
| `--layout-grid-gap` | 8px | Content-grid gutter; the `--col-*` spans assume it |
| `--size-surface-pad-x` | 32px | Content surface horizontal padding |
| `--size-surface-container-pad-x` | `--size-spacing-medium-space-300` | Outer layout horizontal padding |

## Column spans

Columns are declared per breakpoint as `--col-1` … `--col-12`, not computed at
use site. Read the value; do not re-derive it.

| Column | Medium (768px) | Large (1024px) | X-Large (1440px) |
|:---|---:|---:|---:|
| `--col-1` | 48.67px | 55px | 89.67px |
| `--col-4` | 218.67px | 244px | 382.67px |
| `--col-6` | 332px | 370px | 578px |
| `--col-12` | 672px | 748px | 1164px |

```css
/* correct — read the declared span */
width: var(--col-6);

/* incorrect — there is no --layout-col-1-width, and hand-derived
   calc() drifts from _layout.scss the first time a value changes */
width: calc((100% - (11 * 8px)) / 12);
```

## Grid rules

1. **Container context** — column tokens are relative to their parent container's width, not the viewport.
2. **Sidebar visibility** — at Medium the sidebar is hidden and content gets full width.
3. **Gap handling** — use `gap: var(--layout-grid-gap)`; never a literal `8px`.

## Related

- `../composition/layout.md` — the page skeletons this grid carries
- `spacing.md` — padding and gap scales inside a surface
