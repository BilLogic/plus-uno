---
summary: Progress (Progress bar), Skeleton or Spinner — showing work in flight
---

<!-- Tier: 2 | Load when: choosing a component from the loading group -->

# Loading — which component to reach for

Three components: `Progress`, which Storybook and Figma title Progress bar after
Atlassian, `Skeleton` and `Spinner`. Generated facts are in
`design-system/src/components/loading/index.md`.

## The choice

| You want to show | Reach for |
|---|---|
| how far along a known quantity is | `Progress` |
| the shape of content that is still loading | `Skeleton` |
| that something is happening, length unknown | `Spinner` |

`Progress` is determinate only. It takes `value`, `min` (0) and `max` (100),
clamps the percentage, and renders `role="progressbar"` with `aria-valuenow`,
`aria-valuemin` and `aria-valuemax`. There is no indeterminate mode; that case is
`Spinner`.

`Spinner` has five animation variants — `border` and `grow` come from the
underlying spinner, while `growing`, `rotating` and `stacking` are rendered as
blocks in a div. `size` accepts only `sm`. It defaults to `role="status"` and
supplies its own "Loading" text, either as an `aria-label` on the custom
variants or as visually hidden text on the others.

`Skeleton`'s rules — composed to the real content's dimensions, with
`aria-busy` on the loading region — are on its docs page and in
`design-system/guidelines/composition/surfaces.md`.

## Two traps worth knowing

**`Progress`'s `style` is not validated.** It is declared as
`PropTypes.string`, not an enum, and becomes the class
`plus-progress-bar-<style>`. Six of those classes exist in the stylesheet:
`primary`, `secondary`, `success`, `danger`, `warning`, `info`. Anything else
silently renders an unstyled bar with no warning.

**Two `Progress` props only work in combination with another.** `animated` is
applied only when `striped` is also true, and `showLabel` only prints the
percentage when `label` is not given — `label` wins.

## Announcing change

`Progress` updates its `aria-valuenow` on every render, which assistive
technology polls rather than announces. If a change genuinely needs to
interrupt, that is `Toast` — see
`design-system/guidelines/components/messaging.md`.

## Related

- `design-system/src/components/loading/index.md` — generated facts and coverage
- `design-system/guidelines/components/labels.md` — labeling state
- `design-system/guidelines/components/messaging.md` — messages that need to be read
