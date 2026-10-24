---
summary: PLUS lays pages on two 12-column grids with gutter 16 — the screen grid on the Overlay layer for modals and overlays, the content grid inside the surface and the only grid a page frame carries
---

<!-- Tier: 2 -->

# Grid

PLUS has **two grids**, both 12 columns (`--layout-columns`) with gutter 16
(`--layout-gutter`):

- **The screen grid** spans the screen and lives on the Overlay layer only.
  Modals and overlays size from it.
- **The content grid** sits inside the surface. Page content aligns to it, and
  it is the only grid a page frame carries.

Source of truth: the `spacing / layout` collection in Figma, generated into
`design-system/src/tokens/_frame_layers.scss`. Its modes are Medium (768px) ·
Large (1024px) · X-Large (1440px); values below are listed in that order.

## Breakpoints

| Token | Value |
|:---|:---|
| `--breakpoint-md-min` | 768px |
| `--breakpoint-lg-min` | 1024px |
| `--breakpoint-xl-min` | 1440px |
| `--breakpoint-xxl-min` | 1920px |

PLUS is desktop only: design and build at 768px and up. A frame changes
breakpoint by switching its `spacing / layout` mode, never by hand-editing its
grid.

## The screen grid

Twelve columns across the screen, inside the screen pad, **centered and capped
at 1232**. It ignores the sidebar, so an overlay sits in the same place whether
the sidebar is docked or closed.

The screen grid belongs to the **Overlay layer**: in a design file it is set on
that layer, so it shows when the overlay shows and hides with it. A page frame
carries the content grid alone. Code draws no grid at all; the Modal reads the
screen-grid tokens below to size itself.

| Token | Value | Description |
|:---|:---|:---|
| `--layout-width-screen` | 768 · 1024 · 1440 | The screen each mode is worked at |
| `--layout-pad-x-screen` | 24 · 24 · 32 | Screen pad, the container pad plus the surface pad |
| `--layout-width-column-screen` | 45.33 · 66.67 · 88 | One screen-grid column |

The grid is `clamp(720, screen − 2 × 24, 1232)` wide: 720 · 976 · 1232 at the
three modes. From 1440 the pad is 32, but there the grid is already at its cap
with either pad, so the width depends on the screen alone. Past a 1280 screen
the grid stops growing and centers.

## The content grid

Twelve columns inside the surface, after the sidebar and the surface pad have
taken their share. Page content (cards, tables, forms, charts) aligns to it.

| Token | Value | Description |
|:---|:---|:---|
| `--layout-width-content` | 720 · 744 · 1144 | Content width at each mode's screen |
| `--layout-width-column` | 45.33 · 47.33 · 80.67 | One content-grid column |
| `--layout-max-width-content` / `--layout-max-width-reading` | 1232 / 864 | Content cap, centered past it; the reading cap for long-form text |
| `--layout-min-width-content` | 720 | Content minimum; the surface scrolls sideways under it |

At X-Large the content width is
`1440 − 240 sidebar, from the screen edge − 8 container pad − 2 × 24 surface pad` = 1144.
At Medium the sidebar is closed, so the surface starts at the container pad and
content holds its 720 minimum.

```css
/* correct — the content grid from its tokens */
display: grid;
grid-template-columns: repeat(var(--layout-columns), minmax(0, 1fr));
gap: var(--layout-gutter);

/* a child spans whole columns */
grid-column: span 4;
```

The per-mode widths step at each breakpoint rather than follow the screen.
Code that needs the exact width at any screen lays out on the grid itself, as
above, instead of reading `--layout-width-column`.

## Modal widths

A modal spans **6 · 8 · 10 screen-grid columns**, plus the gutters between them,
plus its own pad of 16 (`--modal-pad`) on each side:

`width = n × --layout-width-column-screen + (n − 1) × --layout-gutter + 2 × --modal-pad`

| Width | Columns | Medium | Large | X-Large | Token |
|:---|---:|---:|---:|---:|:---|
| `sm` | 6 | 384 | 512 | 640 | `--layout-width-modal-sm` |
| `md` | 8 | 507 | 677 | 848 | `--layout-width-modal-md` |
| `lg` | 10 | 629 | 843 | 1056 | `--layout-width-modal-lg` |

The tokens are rounded to a whole pixel. `Modal.scss` works the same formula
out continuously from the screen width, so a modal grows with the screen
between breakpoints, stops growing past a 1280 screen, never shrinks below its
Medium width and ignores the sidebar. The frame and layer token test pins the
formula to `--layout-width-column-screen` at 768, 1024 and 1440.

Pass `width="sm" | "md" | "lg"` to `<Modal>`; a fixed pixel width ignores the
screen grid. The modal itself, its overlay and its pads: the Modal component
docs.

## App shell tokens

The frame `SurfaceContainer` draws, from the same file:

| Token | Value | Description |
|:---|:---|:---|
| `--layout-height-topbar` | 32 | Topbar height, with no vertical padding; it pads 8 on the left so the toggle sits at (8, 8) |
| `--layout-width-sidebar` | 240 | Sidebar width; docked from Large, closed below |
| `--layout-pad-left-container` | 8 · 0 · 0 | Left pad of the sidebar-and-surface row: 8 while the sidebar is closed, 0 once it docks |
| `--surface-container-pad` / `--surface-container-stack` | 8 / 8 | Frame pad and the stack between topbar and row |
| `--surface-pad` | 16 · 16 · 24 | Surface pad, the content grid's margin |

## Ownership layering

- The **page template** owns width (`Screen/width-screen`) and the `spacing / layout` mode.
- `Pattern/Surface container` (`SurfaceContainer` in code) fills it: the topbar row, then the row with the sidebar and `Pattern/Surface`. The surface carries the content grid and the Content slot.
- The **sidebar** docks by `Sidebar/sidebar-docked` (false · true · true); behavior below Large is in `../composition/layout.md` § The frame.
- The **Overlay layer** sits above the frame and carries the screen grid; the
  grid shows and hides with the overlay.

## The legacy spec-page grid

`--layout-grid-gap` (8) and `--col-1` … `--col-12` in `_layout.scss` are an
older grid: 12 columns with an 8 gutter on a 672 · 748 · 1164 content width.
Only the spec pages under `design-system/src/specs/` read them. New work uses
the screen and content grid tokens above.

## Related

- `../composition/layout.md` — the page skeletons the content grid carries
- `spacing.md` — padding and gap scales inside a surface
- `../figma/component-alignment.md` — placing library instances against these grids
