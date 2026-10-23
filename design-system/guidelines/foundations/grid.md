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

The frame `SurfaceContainer` draws, from `design-system/src/tokens/_frame_layers.scss`
(values per Medium · Large · X-Large):

| Token | Value | Description |
|:---|:---|:---|
| `--layout-height-topbar` | 32 | Topbar height; the topbar has no padding of its own |
| `--layout-width-sidebar` | 240 | Sidebar width; docked from Large, closed below |
| `--layout-pad-left-container` | 8 · 0 · 0 | Left pad of the sidebar-and-surface row: 8 while the sidebar is closed, 0 once it docks |
| `--surface-container-pad` / `--surface-container-stack` | 8 / 8 | Frame pad and the stack between topbar and row |
| `--surface-pad` | 16 · 16 · 24 | Surface pad, the content grid's margin |
| `--layout-columns` / `--layout-gutter` | 12 / 16 | The content grid |
| `--layout-width-column` / `--layout-width-content` | derived | One column and the content width at the mode's minimum screen |
| `--layout-max-width-content` / `--layout-max-width-reading` | 1232 / 864 | Content cap; centered past it |
| `--layout-min-width-content` | 720 | Content minimum; the surface scrolls sideways under it |

The older `--layout-sidebar-width`, `--layout-grid-gap` and `--col-*` below sit
beside these while uses move.

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

## Desktop only

MD 768 / LG 1024 / XL 1440 are the designed breakpoints, defined as **modes** on
the Figma `size / layout` variable collection and as `--breakpoint-*-min` in
`design-system/src/tokens/_layout.scss`. Design and build at 768px and up.

## The two grids (Figma)

Both are single mode-adaptive Figma styles, with values bound to `size / layout`
variables — switch the frame's mode rather than hand-editing or detaching.

| Style | Columns | Gutter | Margin / offset | Carried by |
|:---|:---|:---|:---|:---|
| `Grid/Viewport (adaptive)` | 12 | 12 / 16 / 16 | 16 / 32 / 32 | full-page frames without the shell |
| Content grid | 12 (`Grid/columns`) | 16 (`Grid/gutter`) | inside `Surface/pad` | `Pattern/Surface` Content frame — the content grid |

Content width at the mode minimums is 720 / 744 / 1144 (`--layout-width-content`) —
at X-Large that is `1440 − 8 container pad − 240 sidebar − 2 × 24 surface pad`.
The older `Columns/col-1…12` = `--col-*` spans assume the old 8px gutter.

## Ownership layering

- The **page template** owns width (`Screen/width-screen`) and the `spacing / layout` mode.
- `Pattern/Surface container` (`SurfaceContainer` in code) fills it: the topbar row, then the row with the sidebar and `Pattern/Surface`. The surface carries the 12-column grid and the Content slot.
- The **sidebar** docks by `Layout/sidebar-docked` (false · true · true); behavior below Large is in `../composition/layout.md` § The frame.

## Grid rules

1. **Container context** — column tokens are relative to their parent container's width, not the viewport.
2. **Gap handling** — use `gap: var(--layout-grid-gap)` so the gutter tracks `_layout.scss`.

## Related

- `../composition/layout.md` — the page skeletons this grid carries
- `spacing.md` — padding and gap scales inside a surface
- `../figma/component-alignment.md` — placing library instances against these grids
