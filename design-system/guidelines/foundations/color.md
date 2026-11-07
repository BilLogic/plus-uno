---
summary: The PLUS Design System follows Material Design 3 color guidance
---

<!-- Tier: 2 -->

# Color Tokens

The PLUS Design System follows Material Design 3 color guidance.

## Color Token Naming Convention

Each color role has multiple variants:
- `--color-{role}` - Main color (for borders/backgrounds)
- `--color-{role}-text` - Text-safe version (use for text content)
- `--color-on-{role}` - Content color on filled backgrounds
- `--color-{role}-container` - Container/background version
- `--color-{role}-border-subtle` - The role at 45%: the pale border of an outlined label (Tag, date Status). Figma names it `{Role}/{Role} Border Subtle`, beside the 3:1 `{Role} Border` role, which is `--color-{role}-border`. Success, Warning, Danger, Tertiary and the five SMART hues have one; Info aliases Tertiary's, and Primary and Secondary have none, because no label uses them.

## Accent Colors

| Role | Main Token | Text Token | Usage |
|------|------------|------------|-------|
| **Primary** | `--color-primary` | `--color-primary-text` | Primary actions, focus states |
| **Secondary** | `--color-secondary` | `--color-secondary-text` | Secondary actions |
| **Tertiary** | `--color-tertiary` | `--color-tertiary-text` | Accents, highlights |
| **Success** | `--color-success` | `--color-success-text` | Success states, confirmations |
| **Warning** | `--color-warning` | `--color-warning-text` | Warning states, cautions |
| **Danger** | `--color-danger` | `--color-danger-text` | Error states, destructive actions |
| **Info** | `--color-info` | `--color-info-text` | Informational (aliases to Tertiary) |

**Warning is the one intent whose edge and glyph differ from its fill.** The yellow `--color-warning` (#9f8205) is a ground, and it measures 2.87:1 on the darkest surface. So:

- An icon takes `--color-warning-icon` and an edge takes `--color-warning-border`. Both are #715c00, which measures 6.50:1 on white and 5.02:1 on `--color-surface-container-highest`.
- A label on a filled warning takes `--color-on-warning`, the dark container ink #231b00, at 4.62:1. White on the yellow is 3.70:1.
- Do: `border-color: var(--color-warning-border)`. Don't: `border-color: var(--color-warning)`.

`info` is an alias of `tertiary` on purpose, so the two render the same teal.

## SMART Framework Colors

| Competency | Token Prefix | Theme |
|------------|--------------|-------|
| Social-Emotional | `--color-social-emotional` | Gold/Yellow |
| Mastering Content | `--color-mastering-content` | Purple |
| Advocacy | `--color-advocacy` | Green |
| Relationship | `--color-relationship` | Pink/Magenta |
| Technology Tools | `--color-technology-tools` | Blue |

On the new tokens, an illustration body takes `--ds-background-smart-<subject>-subtle`, the mid step between the chip fill and the bold fill.

```jsx
<Badge style="social-emotional">Social-Emotional</Badge>
<Badge style="mastering-content">Mastering Content</Badge>
```

## Surface Colors

| Token | Usage |
|-------|-------|
| `--color-surface` | Main surface background |
| `--color-on-surface` | Text on surface |
| `--color-surface-container` | Container backgrounds |
| `--color-outline` | Borders and dividers |
| `--color-outline-variant` | Subtle borders |

The gray container fills (`--color-surface-container-*`) are for recessed or
nested regions only: a sidebar column, a well inside a card. A surface lifts by
shadow, not by a different gray. A raised card or an overlay keeps the page's
own fill and takes its role's shadow, as the surface roles in
`design-system/src/tokens/_elevation.scss` and `elevation.md` set out.

## Interaction states

An interaction state is a named token, not a computed one. Hover, pressed and
selected each have their own step on the fill they sit on: a row, menu item or
sidebar item takes `--ds-background-neutral-subtle-hovered` and `-pressed`, a
selected one `--ds-background-selected` with its own `-hovered` and `-pressed`,
and a role's bold fill takes that role's `-bold-hovered` and `-bold-pressed`
(`--ds-background-brand-bold-hovered`). Where the base fill cannot change, such
as an avatar or an image, lay `--ds-interaction-hovered` or `-pressed` over it.
Focus is never a fill: a 2px ring on `--ds-border-focused` shows it, and its radius is the control's radius plus 2.

```css
.my-element:hover {
  background-color: var(--ds-background-neutral-subtle-hovered);
}

.my-element:active {
  background-color: var(--ds-background-neutral-subtle-pressed);
}

.my-element.is-selected {
  background-color: var(--ds-background-selected);
}

.my-element:focus-visible {
  outline: var(--border-focused) solid var(--ds-border-focused);
  outline-offset: var(--stroke-2);
}
```

## Modes

Light and dark, each with an increased contrast version, make four modes; `auto` follows `prefers-color-scheme` and `prefers-contrast`. The page sets `data-color-mode` (`light`, `dark`, `auto`) and `data-contrast-mode` (`no-preference`, `more`, `auto`). Tokens map per theme: never map your own values. Dark is not light inverted: raised and overlay surfaces get lighter as they rise.

## Roles

Pick the role by meaning: neutral, brand, information, success, warning, danger, discovery, accent (no meaning), inverse (on a bold ground), input (form fields). Danger, warning, success, information and discovery come in default, subtler, subtle and bold. On a bold fill text and icons take the inverse tokens; a bold warning fill takes `--ds-text-warning-inverse`.

## Disabled, links, selected and AI

- Disabled is a color, not an opacity: `--ds-text-disabled`, `--ds-background-disabled`, `--ds-border-disabled`. The opacity token is for images only.
- A link takes `--ds-link`, underlined at rest in running text. The link color has a pressed step and no hovered step. Never use brand, selected or focused colors for a link.
- Selected is the blue `--ds-background-selected` with `--ds-text-selected` and `--ds-icon-selected`, paired with a second cue such as a check or a border.
- AI is the discovery role (purple): "AI recommended" and Suggestion take discovery.

## Rules

1. **Use `-text` variants for text** - Always use `--color-{role}-text` for text content
2. **Use the named state tokens for interaction** - Hovered, pressed and selected steps, from the section above; focus is the focus ring, never a fill
3. **Use `-container` for backgrounds** - Container tokens for subtle background fills
4. **Info equals Tertiary** - Info colors are aliases to Tertiary tokens

### Exception: the Sidebar's selected icon

A selected SidebarTab draws its icon in `--color-primary`, the same color as its
label, not in the darker `--color-primary-icon` role that intent glyphs
take elsewhere. Navigation reads the icon and label as one mark.

### Exception: the Field hover border

A Field's hover border is `--color-inverse-primary`, not `--color-primary-border`.
The border role is the focus ring's color, so a hover border in it would read
as focus. The hover border is a hint, not an indicator: focus is the 2px focus
ring.

## Data-viz color

A chart color does exactly one of four jobs, and each job has one token
family. In code, never name a chart color by hand:
`design-system/src/dataviz/palette.js` (exported as `chartPalette` from
`@/components`) says which token does which job, and the Highcharts theme in
`chartTheme.js` applies it.

Color is the one foundation Atlassian's chart guidance covers; a chart takes
every other foundation — spacing, radius, elevation, stroke, type, layers,
motion — from the same component tokens as the rest of the design system.
See [Data visualization](data-visualization.md).

| Job | What it encodes | Use |
|---|---|---|
| Identity | which series | `--ds-chart-categorical-1` through `-6` in order (`chartPalette.CATEGORICAL`), or `--ds-chart-smart-<subject>` for the five SMART subjects (`chartPalette.SMART`) |
| Magnitude | how much | one hue's sequential ramp, `chartPalette.sequentialRamp(hue)` |
| Polarity | which side of a baseline | two hues' diverging ramp around a gray midpoint, `chartPalette.divergingRamp(low, high)` |
| State | on track, at risk, off track | `--ds-chart-success`, `-warning`, `-danger`, `-information`, `-discovery`, each with a `-bold` variant for the more extreme level of the same state (`chartPalette.STATUS`) |

A single-series chart is not slot 1 of categorical: it takes `--ds-chart-brand`
(`chartPalette.BRAND`), with a de-emphasized comparison or reference line on
`--ds-chart-neutral`. Slot 1 of categorical is tuned to the same hue as the
brand chart color for exactly this reason — a one-series chart and the first
series of a many-series chart read as the same color.

### Categorical order

Assign series in this order, never skipping a slot:

| Slot | Hue | Light | Dark | Light, increased contrast | Dark, increased contrast |
|---:|---|---|---|---|---|
| 1 (brand) | lagoon | 600 | 500 | 850 | 300 |
| 2 | orange | 800 | 700 | 1000 | 500 |
| 3 | blue | 500 | 500 | 800 | 300 |
| 4 | magenta | 800 | 700 | 1000 | 500 |
| 5 | lime | 500 | 400 | 800 | 250 |
| 6 | purple | 700 | 700 | 900 | 500 |
| 7 | orange | 500 | 500 | 800 | 300 |
| 8 | blue | 800 | 700 | 1000 | 500 |

Three rules produced this order, and all three hold at once:

- **Brand leads.** Slot 1 is lagoon, the brand chart color's own hue, so a
  one-series chart and the first series of a six-series chart look like the
  same chart.
- **Neighbors alternate light and dark steps.** Slot 2 (orange-800, dark) sits
  next to slot 1 (lagoon-600, lighter) and slot 3 (blue-500, lighter again);
  the sequence keeps alternating through slot 6. This is what makes the order
  read correctly in grayscale and for a color-blind viewer: two adjacent
  series that happened to land on the same lightness would look identical
  once hue drops out.
- **Hues spread across the wheel.** No two adjacent slots share a hue family
  or sit next to each other on the wheel (lagoon, orange, blue, magenta, lime,
  purple is six stops spread wide, not six analogous neighbors).

Three hues are never used, each for a reading reason, not a vision one:
**yellow** reads as warning, **red** reads as danger, **teal** sits too close
to the brand hue. Two hues double as state colors — **lime** and
**purple-500** overlap `success` and `discovery` — so a chart uses categorical
colors or state colors, never both in the same chart.

Slots 7 and 8 are reprises of 2 (orange) and 3 (blue), for overflow past the
six-series limit only; group the smallest categories into "Other" before a
chart needs them (see Do/Don't below). The sequence wraps back to slot 1 after
8, repeating a color, so an eight-series chart is already past the point
where it should have grouped.

Dark mode mostly steps one lighter than light mode: lagoon (1) 600 → 500,
orange (2) 800 → 700, magenta (4) 800 → 700, lime (5) 500 → 400, blue (8)
800 → 700 — carried in the generated token, not guessed per-chart. Three
slots hold their light step instead:

- **Blue (3) and orange (7) hold at 500** — there is no softer step without
  losing their place in the lightness alternation.
- **Purple (6) keeps its light step** (700 → 700, unchanged) rather than
  stepping down — stepping down to 600 crowded both of its dark-mode
  neighbors.

This table holds for both Plan A (the plan the repo builds) and Plan B: the
categorical mapping is by family and step, not by hex, so it is the same for
every plan. `check:color-system` checks the generated tokens for both.

### Separators

A separator — a gap, or the `--ds-border-inverse` line `chartTheme.css` draws
between adjacent marks — marks **where marks touch**: an adjacent pair in a
stacked bar, a histogram bin boundary, a waterfall step. The lightness
alternation above marks **which series is which**. The two solve different
reading problems and neither substitutes for the other: a viewer who cannot
tell two near-touching hues apart at the seam needs the separator even when
lightness alternation is intact; a viewer who cannot distinguish hue at all
needs the lightness alternation even where two series never touch. Keep both.

### Sequential and diverging ramps

Both ramps are built from the chart tokens.

- **Sequential** runs `--ds-background-accent-<hue>-subtler`, then
  `--ds-chart-<hue>-bold`, `-bolder` and `-boldest`. Each step sits further
  from the surface than the last, so **the strongest tone is the biggest
  value**: darker in light mode, lighter in dark.
- **Diverging** runs one hue's three chart emphases down to
  `--ds-background-accent-gray-subtler` at the midpoint, then the other hue's
  back up — the midpoint always sits nearer the surface than either arm's
  first step. The default pair is orange and blue. Never pair red with green.
- **Sort categories from most to least** (`chartPalette.mostToLeast`), and an
  ordinal set (grades, stages, tiers) takes one hue's ramp, the strongest tone
  on the biggest value.
- A color axis interpolates, so the heatmap and the treemap resolve the ramp's
  tokens in the current mode (`chartPalette.rampStops`) and again when it
  changes.

### State

Use the state tokens only when a value means a state. The `-bold` step is the
more extreme level of the same state: highest priority on
`--ds-chart-danger-bold`, high on `--ds-chart-danger`. State colors are hard to
tell apart with a color-vision deficiency, so a state always carries an icon,
a label or a signed value too — never color alone.

### SMART subjects

Each subject charts in its accent hue at the emphasis that keeps neighbors in
S-M-A-R-T order apart: social-emotional orange (bold), mastering content teal
(boldest), advocacy lime (bold), relationship magenta (boldest), technology
tools brown (bold). Five subjects is near the categorical limit, so label them
directly or keep the legend beside the chart.

### Defaults, limits and text

- **One color by default.** A single-series chart takes `--ds-chart-brand`,
  never `--ds-chart-categorical-1` cycling into a second color later — the
  series identity does not change just because a second series got added.
- **Five or six series, then "Other."** Past the limit, group the smallest
  categories rather than reaching into the slot-7/8 overflow reprises.
- **No text on a chart color.** A label sits beside its mark, never inside or
  on top of it, so there is never a foreground/background pair that has to
  clear a contrast ratio. Where a label must sit on a fill anyway (a heatmap
  cell, a stacked segment), `chartPalette.inkFor` picks `--ds-text` or
  `--ds-text-inverse`, whichever reads.
- **Never color alone.** A shape, a pattern, a direct label, or a backing data
  table carries the same information the color carries, for every series and
  every state.

### Hover

A hovered mark takes its own `-hovered` token (`--ds-chart-categorical-1-hovered`
and so on — every chart token has one). To emphasize one series against the
rest of the chart, fade the others with `--ds-opacity-disabled` rather than
picking a one-off opacity value.

### Chrome

Chart chrome — axis labels, gridlines, the tooltip, threshold lines — wears
text and border tokens, never a chart color. `design-system/src/dataviz/palette.js`'s
`CHROME` object is the canonical job-to-token mapping (axis and grid lines,
the title and legend text, the tooltip surface, a track fill, a separator
line, a threshold mark): read it there rather than copying token names into
this doc, since the mapping can move.

### Spacing and type

Spacing and type inside a chart — label size, legend gaps, padding around a
plot area — come from the same ladder and type-token sets as every other
component. A chart never carries a literal pixel value of its own.

### The checks

`check:color-system` enforces every rule above, by name:

- **`chart color vision`** — every pair of neighbors in a chart sequence stays
  apart: deltaE ≥ 15 under full color vision, deltaE ≥ 8 under protan and
  deutan simulation.
- **`chart contrast`** — every chart color keeps 3:1 against every surface a
  chart can sit on (`--ds-surface`, `--ds-surface-raised`,
  `--ds-surface-overlay`), and 4.5:1 in increased contrast.
- **`chart lightness alternation`** — neighbors in the categorical order
  differ by at least 0.08 OKLCH lightness, and the direction flips from mark
  to mark (lighter, darker, lighter, ...).
- **`chart ramps`** — a sequential ramp moves monotonically away from the
  surface, step over step; a diverging ramp's midpoint sits nearer the surface
  than either arm's first step.

`design-system/tests/dataviz-tokens.test.js` fails on any legacy `--color-*`
name or color literal under `design-system/src/dataviz/`.

**Do:**
- One color by default, and more only to tell categories apart.
- Five or six categories at most; group the rest.
- Keep both a separator and the lightness alternation — they cover different readers.
- Text next to the data, in a text token.
- A second cue beside every color: a label, a shape, a dash or a pattern.

**Don't:**
- Add a color that carries no meaning.
- Mix categorical and state colors in one chart.
- Put text on a chart color without checking the ink.
- Build a ramp from two unrelated hues, or a rainbow.
