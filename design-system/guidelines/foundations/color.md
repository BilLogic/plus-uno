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
