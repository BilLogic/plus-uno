---
summary: A chart's foundations other than color come from the same component tokens as the rest of the design system
---

<!-- Tier: 2 -->

# Data visualization

Chart color has rules of its own (the Storybook Color page,
[`Colors.mdx`](../../src/styles/Colors.mdx) § Data-viz color). For every other foundation — spacing, radius, elevation,
stroke, type, layers, motion — there is no chart-specific exception: a chart
takes the same component tokens the rest of the design system does. This page
names which token does which job, and why, for `design-system/src/dataviz/`
(theme, helpers, 42 charts, stories, MDX).

## Chart container

The chart container is a Card: its surface and its padding, not a chart-drawn
box. `chartTheme.js`'s `chart.spacing` reads `--card-pad` — the
density this component already rendered at — not a literal `16`. Highcharts'
`chart.spacing` is a layout number, not a CSS property, so it can't take a
`var()` string directly; `chartTheme.js` resolves the token to a pixel number
once, at module load, via `getComputedStyle`, so a ladder change still reaches
the chart without a code edit. The chart itself draws no padding of its own
beyond that.

## Tooltip

The tooltip is a floating layer: the Popup template's surface
(`--ds-surface-overlay`), overlay shadow (`--ds-shadow-overlay`), radius
(`--popup-radius`) and padding (`--popup-pad`), plus the shared
`--layer-popup` z-index. `useHTML` alone only moves the tooltip's TEXT into a
foreignObject — the box Highcharts draws around it is always its own SVG
`<path>`, and `background`/`border-radius`/`box-shadow` are no-ops there, so
styling `.highcharts-tooltip` (that path's `<g>`) never painted anything.
`chartTheme.js` also sets `tooltip.outside: true`, which moves the whole
tooltip into `.highcharts-tooltip-container` — a real `<div>` — and turns the
SVG box fully transparent (`backgroundColor: 'transparent'`, `borderWidth: 0`,
`shadow: false`) so the container's CSS surface (`chartTheme.css`) is the only
thing a reader sees. Every chart that sets its own `tooltip` block spreads
`chartTheme.tooltip` so it inherits this; `foundations.test.js` fails a chart
that doesn't.

## Sorting

Category charts with no inherent axis order sort categories from most to least by default (`sort = true`), with `sort={false}` as the opt-out for ordinal, temporal or profile axes (such as grades A–E, weekdays or radar spokes). Sorting and sequential toning are two separate, explicit steps in `design-system/src/dataviz/palette.js`:

- **Step 1 — sort:** `mostToLeast(items, value = (d) => d.y)` returns a new, stable array ordered from biggest to smallest. When categories and series live in separate arrays, `sortCategories({ categories, series, value = (d) => d.y })` reorders both (pass `value: (d) => d` for plain numeric data) and returns `{ categories, series, order }` so callers can reorder parallel arrays (such as icons or colors) with `order`.
- **Step 2 — optionally tone by rank:** `toneByRank(items, hue, value = (d) => d.y)` ranks items by `value` while keeping their input order and sets `color` on each item from `sequentialTone(rank, items.length, hue)`, placing the darkest ramp step (`--chart-<hue>-boldest`) on the largest value (rank `0`) and spreading `items.length` items across the ramp down to `subtler`.

A single series uses one color, `--chart-brand` (`BRAND`), so the chart never implies multiple categories where there is only one measure.

## Mark radius

Bars and columns round only the value end — the one end a bar is allowed to
round without distorting the length comparison it exists to support; rounding
both ends, or a radius bigger than a couple of pixels, reads as "this bar is
shorter than it is." `--chart-bar-radius` (`chartTheme.css`, aliasing
`--space-0125`, ~2px) is the one component-tier token for it, applied via
Highcharts' `borderRadius: { radius, where: 'end' }` — `where: 'end'` is what
keeps a stacked column from rounding every segment, only the stack's outer
end. Pies, donuts and areas take no radius at all.

## Strokes

Gridlines, axis lines, series lines, chart-only separators (e.g. the gap
between stacked bar segments) and markers take one of two component-tier
tokens, declared in `chartTheme.css`, aliasing the same stroke-width
primitives `--focus-ring-width` reads:

- `--chart-line-width` (2px) — a series line, a box-plot whisker, a marker
  ring, a stacked-segment separator.
- `--chart-grid-width` (1px) — a gridline or an axis line.

Like `chart.spacing`, these feed Highcharts options that render as SVG
presentation attributes rather than CSS properties, so `chartTheme.js`
resolves each to a number once and exports it (`CHART_LINE_WIDTH_NUMBER`,
`CHART_GRID_WIDTH_NUMBER`) for a chart to use directly. A `0` (removing a
default Highcharts border or line entirely) needs no token — it draws nothing.

## Type and numbers

Every text slot in a chart — title, subtitle, caption, axis labels and titles,
legend items, data labels, tooltips and empty-data notices — takes the Google Sans Flex
body family (`--type-family-body`) and the current text tokens
(`--type-size-075`, `--type-weight-medium`, and so on) — never a
`'12px'` literal, never a token `var()` paired with a literal fallback
value, and never a system-font fallback or a monospace
font. Titles, axis titles, labels and emphasized values all use medium
(`--type-weight-medium`, 500), with tabular figures on emphasized values.
Nothing renders at 600, 700 or 300, and data-label text outlines stay off.

Number slots (axis tick labels, data labels, tooltips, legend items and
emphasized values) set tabular figures (`tabular-nums`) so columns of numbers
and live readouts align digit for digit. Inside a tooltip, text stays in
`--ds-text` while only the leading dot swatch (`●`) takes the series color. A
chart's title comes from the surrounding Section or Card header, not from Highcharts'
own `title` option (every chart sets `title: { text: null }`).

## States

Interactive states are declared once in the shared theme:

- **Hover:** a hovered mark shifts to its `-hovered` chart token (such as
  `--chart-categorical-1-hovered` or `--chart-brand-hovered`) on
  `appearance.fast`.
- **Inactive series:** while one series is hovered, the other series fade to
  `--ds-opacity-disabled` on `appearance.fast`.
- **Selected:** a selected mark takes `--ds-background-selected` with a 1px
  (`--chart-grid-width`) `--ds-border-selected` outline, never `--chart-brand`.

## Motion

Charts follow the same spring physics and choreography as the rest of the design system:

- **Entrance:** charts grow to their value on the default spatial spring (`spatial.default`). Charts inside a `ChartMotionArea expressive` take the expressive spring instead; the page's `data-motion="expressive"` attribute does not reach Highcharts, which animates in JavaScript.
- **State changes:** hover and inactive series transitions fade on `appearance.fast`.
- **Reduced motion:** reduced motion makes every entrance a fade (`appearance.fast`), even inside a `ChartMotionArea expressive`.
- **One orchestrated moment per area:** charts in one area arrive 20 ms apart within half a second (500 ms cap); a standalone chart enters with no delay.
- **No replay:** a chart animates on its first render only; nothing replays on redraw, resize or data update, and micro-charts such as a sparkline opt out of entrance motion altogether.

## Token checks

`foundations.test.js` and `chartText.test.js` hold `design-system/src/dataviz/`
to the tier tokens and enforce a hard ban (with a self-test) against eased
curves, animation millisecond literals and removed animation props, `<b>` or
`bold` or numeric font weights and weights other than 500,
series-color text, pixel offsets, control radii on non-controls, and number
slots without tabular figures; `design-system/tests/dataviz-tokens.test.js`
does the same for color.
