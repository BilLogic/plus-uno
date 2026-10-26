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
- `--color-{role}-state-08/12/16` - State layers for hover/active states
- `--color-{role}-border-subtle` - The role at 45%: the pale border of an outlined label (Tag, date Status). Figma names it `{Role}/{Role} Border Subtle`, beside the 3:1 `{Role} Border` role, which is `--color-{role}-border`. Success, Warning, Danger, Tertiary and the five SMART hues have one; Info aliases Tertiary's, and Primary and Secondary have none, because no label uses them.

**`-state-NN` is the role at 8/12/16%.** Each overlay is its role's solid at
that alpha, matching the `State-layers` variables in Figma. The one exception is
shadow: `--color-shadow-state-08/12/16` are black washes with no solid shadow
role beside them. Still read the overlay token rather than computing it from
the base, and if a wash ever stops matching its base, check the Figma variable
before you choose a side. `design-system/tests/tokens-node.test.js` fails on
any new divergence.

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

## State Layers

An interaction state lays its role's state layer over the resting fill, and the
step names the state:

| State | Layer |
|-------|-------|
| Hover | `-state-08` |
| Pressed | `-state-12` |
| Selected, dragged | `-state-16` |
| Focus | none: the focus ring shows it |

```css
.my-element:hover {
  background-color: var(--color-primary-state-08);
}

.my-element:active {
  background-color: var(--color-primary-state-12);
}

.my-element.is-selected {
  background-color: var(--color-primary-state-16);
}

.my-element:focus-visible {
  outline: var(--size-element-stroke-lg) solid var(--color-focus-ring);
  outline-offset: var(--size-element-stroke-lg);
}
```

On a solid fill, such as a filled button or a checked box, the layer is
`--color-shadow-state-NN` over the fill. The fill stays, so its label, check or
dot stays readable.

## Rules

1. **Use `-text` variants for text** - Always use `--color-{role}-text` for text content
2. **Use state layers for interaction** - Hover 08, pressed 12, selected or dragged 16, from the table above; focus is the focus ring, never a fill
3. **Use `-container` for backgrounds** - Container tokens for subtle background fills
4. **Info equals Tertiary** - Info colors are aliases to Tertiary tokens

### Exception: selection in dense lists

A selected row in a dense list or a table, such as a menu item, a listbox
option or a table row, rests on `--color-primary-state-08`, against the 16 in
the table above. Selection repeats down a column of rows, and 16 would outweigh
the content. Navigation keeps 16: a selected Sidebar item is
`--color-primary-state-16`, because it marks where the person is.

### Exception: the Sidebar's selected icon

A selected SidebarTab draws its icon in `--color-primary`, the same color as its
label, not in the darker `--color-primary-icon` role that intent glyphs
take elsewhere. Navigation reads the icon and label as one mark.

### Exception: tonal fills

The tonal Button, the tonal Dropdown toggle, and the UserAvatar's initial and
counter rest on their role's `-state-08`, against rule 3. The tonal look is
that wash: a Container is a different, heavier color. Their hover and press lay
`--color-shadow-state-08` and `-12` over it.

### Exception: the Field hover border

A Field's hover border is `--color-inverse-primary`, not `--color-primary-border`.
The border role is the focus ring's color, so a hover border in it would read
as focus. The hover border is a hint, not an indicator: focus is the 2px focus
ring.

### Exception: gray team avatars

A gray Tag of type `team` fills its avatar with
`--color-technology-tools-state-08` at rest, against rule 3 and the intent of
rule 2. The Figma set binds that variable on every team variant: an 08 wash is
paler than any Container, so a gray team never reads as a person's neutral
disc. The avatar is never interactive, so no hover layer stacks on it.

## Data-viz color

Charts take the `--ds-chart-*` tokens, generated with the rest of the `--ds-`
set (ADR-035), and follow Atlassian's
[data-visualization color guidance](https://atlassian.design/foundations/color/data-visualization-color)
where PLUS does not say otherwise below. In code, never name a chart color by
hand: `design-system/src/dataviz/palette.js` (exported as `chartPalette` from
`@/components`) says which token does which job, and the Highcharts theme in
`chartTheme.js` applies it. Every color does one job.

| Job | What it encodes | Use |
|---|---|---|
| One series | the data, with nothing to tell apart | `--ds-chart-brand` (`chartPalette.BRAND`); de-emphasized comparison or reference line `--ds-chart-neutral` |
| Categorical | which series | `--ds-chart-categorical-1` to `-6`, in order (`chartPalette.CATEGORICAL`) |
| Sequential | how much | one hue's ramp, `chartPalette.sequentialRamp(hue)` |
| Diverging | which side of a baseline | two hues around a gray midpoint, `chartPalette.divergingRamp(low, high)` |
| Status | on track, at risk, off track | `--ds-chart-success`, `-warning`, `-danger`, `-information`, `-discovery`, each with `-bold` (`chartPalette.STATUS`) |
| SMART subject | which subject | `--ds-chart-smart-<subject>` (`chartPalette.SMART`) |

Chart chrome wears text and border tokens, never a chart color: titles and
legends `--ds-text`, tick labels `--ds-text-subtle`, grid lines and axes
`--ds-border`, the tooltip `--ds-surface-overlay`, a track `--ds-background-neutral`.

### Categorical order

Assign series in this order, never skipping a slot. Past six, fold the
smallest into "Other" (Atlassian's limit is five or six); 7 and 8 exist for
overflow only, as darker reprises of 1 and 4. The theme wraps back to slot 1
after 8, which repeats a color: group the series before it gets there.

| Slot | Hue | Light | Dark |
|---:|---|---|---|
| 1 | blue | 600 | 600 |
| 2 | yellow | 500 | 500 |
| 3 | magenta | 800 | 700 |
| 4 | orange | 500 | 500 |
| 5 | purple | 600 | 500 |
| 6 | lime | 500 | 500 |
| 7 | blue | 800 | 700 |
| 8 | orange | 800 | 700 |

Neighbors stay apart under protan and deutan simulation (deltaE ≥ 8) and for
full color vision (deltaE ≥ 15), in both plans, light and dark. The order
leaves out red, which reads as danger, green, which reads as success, and teal,
which reads as the brand. Slot 2 is the same yellow as `--ds-chart-warning`,
as Atlassian's slot 4 is its warning orange: a chart uses either categorical or
status colors, never both.

### Sequential and diverging ramps

Atlassian publishes no sequential or diverging guidance, so PLUS builds both
from its chart tokens.

- **Sequential** runs `--ds-background-accent-<hue>-subtler`, then
  `--ds-chart-<hue>-bold`, `-bolder` and `-boldest`. Each step sits further
  from the surface than the last, so **the strongest tone is the biggest
  value**: darker in light mode, lighter in dark.
- **Diverging** runs one hue's three chart emphases down to
  `--ds-background-accent-gray-subtler` at the midpoint, then the other hue's
  back up. The default pair is orange and blue. Never pair red with green.
- **Sort categories from most to least** (`chartPalette.mostToLeast`), and an
  ordinal set (grades, stages, tiers) takes one hue's ramp, the strongest tone
  on the biggest value.
- A color axis interpolates, so the heatmap and the treemap resolve the ramp's
  tokens in the current mode (`chartPalette.rampStops`) and again when it
  changes.

### Status

Use the status tokens only when a value means a status. The `-bold` step is the
more extreme level of the same status: highest priority on
`--ds-chart-danger-bold`, high on `--ds-chart-danger`. PLUS success is green and
warning is yellow, where Atlassian's are lime and orange, so they match the
`--ds-*-success` and `-warning` roles. Status colors are hard to tell apart with
a color-vision deficiency, so a status always carries an icon, a label or a
signed value too.

### SMART subjects

Each subject charts in its accent hue at the emphasis that keeps neighbors in
S-M-A-R-T order apart: social-emotional orange (bold), mastering content teal
(boldest), advocacy lime (bold), relationship magenta (boldest), technology
tools brown (bold). Five subjects is near the categorical limit, so label them
directly or keep the legend beside the chart.

### Accessibility, light and dark

- Every chart color keeps 3:1 against `--ds-surface`, `--ds-surface-raised` and
  `--ds-surface-overlay`, and 4.5:1 in increased contrast.
- Chart colors do not reach 3:1 against each other: separate adjacent marks
  with a gap or a `--ds-border-inverse` edge. `chartTheme.css` points
  Highcharts' own separators at that token.
- Put text beside a mark, not on it. Where a label must sit on a fill (a
  heatmap cell, a stacked segment), `chartPalette.inkFor` picks `--ds-text` or
  `--ds-text-inverse`, whichever reads.
- Never rely on color alone: keep a legend for two or more series, label lines
  directly where order is not under your control, and give status a label.
- Each token has its own value in light, dark and both increased-contrast
  modes; a chart reads the token and does no mapping of its own.

`check:color-system` holds the categorical order, the SMART order, the 3:1
floor and the ramps; `design-system/tests/dataviz-tokens.test.js` fails on any
legacy `--color-*` name or color literal under `design-system/src/dataviz/`.

**Do:**
- One color by default, and more only to tell categories apart.
- Five or six categories at most; group the rest.
- Separate adjacent chart colors.
- Text next to the data, in a text token.
- A second cue beside every color: a label, a shape, a dash or a pattern.

**Don't:**
- Add a color that carries no meaning.
- Mix categorical and status colors in one chart.
- Put text on a chart color without checking the ink.
- Build a ramp from two unrelated hues, or a rainbow.
