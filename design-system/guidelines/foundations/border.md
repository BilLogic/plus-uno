---
summary: Border widths, the focus ring, and how they pair with color tokens
---

<!-- Tier: 2 -->

# Border

A border is a width token paired with a color token. Choose them as a pair.

## Widths

- `--border-default` (1): every standard border and divider, in `color/border/default`, or `color/border/input` for a field.
- `--border-selected` (2): the chosen option in a group, in `color/border/selected`, on every side.
- `--border-focused` (2): the focus ring, in `--ds-border-focused` (`--ds-border-focused-inverse` on a dark surface).

## Focus ring

- A ring, never a fill: 2 wide, 2 away from the control, radius = the control's radius + 2.
- Buttons round 6 (4 compact), so their rings are 8 and 6. Every other control rounds to its height ÷ 4.
- Containers draw no ring of their own.

## Rules

- **State and emphasis use the whole shape.** Show a selected, active or flagged row, card, banner, quote or nav item with its fill, text, icon or weight, or with a border or ring on every side. A colored stripe on one edge (a left or leading bar) is not part of this system.
- A card has no border: its edge comes from elevation. A divider is a border, not a component, and space comes first.
- The docked sidebar has one 1 divider on the edge facing the Page.
- Use the selected width only for selection. Selection never rests on color alone.
- A border that is the only cue for a control's edge reaches 3:1 against its surround.
