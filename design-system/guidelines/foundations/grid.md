---
summary: PLUS lays pages on two 12-column grids with gutter 16 — the screen grid on the Blanket layer for modals and drawers, the content grid inside the Page and the only grid a page frame carries
---

<!-- Tier: 2 -->

# Grid

PLUS has **two grids**, both 12 columns (`--grid-columns`) with gutter 16
(`--grid-gutter`):

- **The screen grid** spans the screen and lives on the Blanket layer only.
  Modals and drawers size from it.
- **The content grid** sits inside the Page. Page content aligns to it, and
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
at 1232**. It ignores the sidebar, so a modal sits in the same place whether
the sidebar is docked or closed.

The screen grid belongs to the **Blanket layer**: in a design file it is set on
that layer, so it shows when the Blanket shows and hides with it. A page frame
carries the content grid alone. Code draws no grid at all; the Modal reads the
screen-grid tokens below to size itself.

| Token | Value | Description |
|:---|:---|:---|
| `--screen-width` | 768 · 1024 · 1440 | The screen each mode is worked at |
| `--screen-pad-x` | 24 · 24 · 32 | Screen pad, a rule of its own so a Modal or Drawer keeps its width when the Page pad changes |
| `--grid-width-column-screen` | 45.33 · 66.67 · 88 | One screen-grid column |

The grid is `clamp(720, screen − 2 × 24, 1232)` wide: 720 · 976 · 1232 at the
three modes. From 1440 the pad is 32, but there the grid is already at its cap
with either pad, so the width depends on the screen alone. Past a 1280 screen
the grid stops growing and centers.

## The content grid

Twelve columns inside the Page, after the sidebar and the Page pad have
taken their share. Page content (cards, tables, forms, charts) aligns to it.

| Token | Value | Description |
|:---|:---|:---|
| `--content-width` | 720 · 736 · 1152 | Content width at each mode's screen |
| `--grid-width-column` | 45.33 · 46.67 · 81.33 | One content-grid column |
| `--content-max-width` / `--content-max-width-reading` | 1232 / 864 | Content cap, centered past it; the reading cap for long-form text |
| `--content-min-width` | 720 | Content minimum; the Page scrolls sideways under it |

At X-Large the content width is
`1440 − 240 sidebar, from the screen edge − 2 × 24 Page pad` = 1152.
The Frame has no seams, so only a docked Panel takes another share:
content = Frame width − Sidebar (240 if docked) − Panel (if docked) − 48, never under 720.
With the 400 Panel and the Sidebar docked that needs a 1408 Frame; with the Sidebar
collapsed, 1168. A Section with a detail region keeps its 7 + 5 split from 960 of content.
At Medium the sidebar is closed, so the Page starts at the window edge and content is `768 − 2 × 24` = 720,
exactly its minimum. The cap of 1232 binds from a 1520 screen with the sidebar docked.

```css
/* correct — the content grid from its tokens */
display: grid;
grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
gap: var(--grid-gutter);

/* a child spans whole columns */
grid-column: span 4;
```

The per-mode widths step at each breakpoint rather than follow the screen.
Code that needs the exact width at any screen lays out on the grid itself, as
above, instead of reading `--grid-width-column`.

## Modal widths

A modal spans **6 · 8 · 10 screen-grid columns**, plus the gutters between them,
plus its own pad of 16 (`--modal-pad-x-default`) on each side:

`width = n × --grid-width-column-screen + (n − 1) × --grid-gutter + 2 × --modal-pad-x-default`

| Width | Columns | Medium | Large | X-Large | Token |
|:---|---:|---:|---:|---:|:---|
| `6-col` | 6 | 384 | 512 | 640 | `--modal-width-sm` |
| `8-col` | 8 | 507 | 677 | 848 | `--modal-width-md` |
| `10-col` | 10 | 629 | 843 | 1056 | `--modal-width-lg` |

The tokens are rounded to a whole pixel. `Modal.scss` works the same formula
out continuously from the screen width, so a modal grows with the screen
between breakpoints, stops growing past a 1280 screen, never shrinks below its
Medium width and ignores the sidebar. The frame and layer token test pins the
formula to `--grid-width-column-screen` at 768, 1024 and 1440.

Pass `width="6-col" | "8-col" | "10-col"` to `<Modal>`; a fixed pixel width ignores the
screen grid. The modal itself, its Blanket and its pads: the Modal component
docs.

## Frame tokens

The `Frame` pattern draws, from the same file:

| Token | Value | Description |
|:---|:---|:---|
| `--frame-topbar-height` | 32 | Height of the focused page's top row |
| `--frame-sidebar-width` | 240 | Sidebar width; docked from Large, closed below |
| `--page-pad` | 24 | Page pad at every width, the content grid's margin |
| `--page-radius` | 8 | Page corner radius |
| `--panel-min-width` / `--panel-width-default` / `--panel-max-width` | 320 / 400 / 640 | The Panel's width range and the width it opens at |

The Frame has no pad and no stack: the Page runs to the window edges and meets
the sidebar at a hairline.

## Ownership layering

- The **template** owns width (`Screen/width-screen`) and the `spacing / layout` mode.
- `Pattern/Frame` fills it: the Sidebar beside `Pattern/Page`. The Page carries the content grid and the Content slot.
- The **sidebar** docks by `Sidebar/sidebar-docked` (false · true · true); behavior below Large is in `../composition/layout.md` § The frame.
- The **Blanket** sits above the frame and carries the screen grid; the
  grid shows and hides with the Blanket.

## Size roles

One size scale, used through five roles: Control (`--item-height-sm`, `-md`: 24, 32), Row (32, 40, 48), Label (16, 20), Media (16 to 48) and Field (widths 80 to 480, minimum heights 80 and 120). Buttons and tabs are 32 (24 compact); fields and menu rows are 40 (32 compact). The pixel leads and the token is the binding.

## Related

- `../composition/layout.md` — the page skeletons the content grid carries
- `spacing.md` — padding and gap scales inside a surface
- `../figma/component-alignment.md` — placing library instances against these grids
