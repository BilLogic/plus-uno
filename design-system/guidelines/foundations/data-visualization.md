---
summary: A chart's foundations other than color come from the same component tokens as the rest of the design system
---

<!-- Tier: 2 -->

# Data visualization

Atlassian publishes chart guidance for color only (see [Color → Data-viz
color](color.md)). For every other foundation — spacing, radius, elevation,
stroke, type, layers, motion — there is no chart-specific exception: a chart
takes the same component tokens the rest of the design system does. This page
names which token does which job, and why, for `design-system/src/dataviz/`
(theme, helpers, 42 charts, stories, MDX).

## Chart container

The chart container is a Card: its surface and its padding, not a chart-drawn
box. `chartTheme.js`'s `chart.spacing` reads `--card-pad-compact` — the
density this component already rendered at — not a literal `16`. Highcharts'
`chart.spacing` is a layout number, not a CSS property, so it can't take a
`var()` string directly; `chartTheme.js` resolves the token to a pixel number
once, at module load, via `getComputedStyle`, so a ladder change still reaches
the chart without a code edit. The chart itself draws no padding of its own
beyond that.

## Tooltip

The tooltip is a floating layer: the Popup pattern's surface
(`--ds-surface-overlay`), overlay shadow (`--ds-shadow-overlay`), radius
(`--popover-radius`) and padding (`--popover-pad`), plus the shared
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

## Mark radius

Bars and columns round only the value end — the one end a bar is allowed to
round without distorting the length comparison it exists to support; rounding
both ends, or a radius bigger than a couple of pixels, reads as "this bar is
shorter than it is." `--chart-bar-radius` (`chartTheme.css`, aliasing
`--radius-0125`, ~2px) is the one component-tier token for it, applied via
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

## Type

Tick labels, legends, tooltips and data labels take the current text tokens
(`--font-size-body3`, `--font-weight-semibold-1`, and so on) — never a
`'12px'` literal, and never a token `var()` paired with a literal fallback
value. A chart's title comes from the surrounding Section or Card header, not from Highcharts'
own `title` option (every chart sets `title: { text: null }`).

## Motion

Series entrance and hover transitions take the motion tokens in
`design-system/src/tokens/ladder/_motion.scss`
(`--motion-duration-short/medium/long`). `prefers-reduced-motion` is handled
once, globally, at `:root` — every duration token collapses to `0ms` under it
— so a chart that reads the token needs no reduced-motion branch of its own. A
chart's `animationDuration`-style prop should default to
`CHART_ANIMATION_DURATION_MS` (exported from `chartTheme.js`), not a literal
`900`/`1000`/`1200`; a prop still lets a caller opt into a different value.

## Token checks

`foundations.test.js` holds `design-system/src/dataviz/` to the tier tokens,
alongside the token-fallback and literal-property checks above;
`design-system/tests/dataviz-tokens.test.js` does the same for color.
