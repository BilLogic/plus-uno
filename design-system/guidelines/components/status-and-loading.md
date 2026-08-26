---
summary: Badge, Progress or Spinner — labelling state versus showing work in flight
---

<!-- Tier: 2 | Load when: choosing a component from the status-and-loading group -->

# Status and loading — which component to reach for

Three components: `Badge`, `Progress`, `Spinner`. Generated facts are in
`design-system/src/components/status-and-loading/index.md`.

## The choice

| You want to show | Reach for |
|---|---|
| what state a thing is in, as a label | `Badge` |
| how far along a known quantity is | `Progress` |
| that something is happening, length unknown | `Spinner` |

`Badge` is the second most used component in the repo after `Button`, almost
always as a status chip in a table row or a card header. It is read-only by
design: no `onClick`, and no button semantics on the badge itself, because the
only interactive part is the X that `dismissible` adds — nesting one control
inside another is invalid ARIA, and the source says so.

`Progress` is determinate only. It takes `value`, `min` (0) and `max` (100),
clamps the percentage, and renders `role="progressbar"` with `aria-valuenow`,
`aria-valuemin` and `aria-valuemax`. There is no indeterminate mode; that case is
`Spinner`.

`Spinner` has five animation variants — `border` and `grow` come from the
underlying spinner, while `growing`, `rotating` and `stacking` are rendered as
blocks in a div. `size` accepts only `sm`. It defaults to `role="status"` and
supplies its own "Loading" text, either as an `aria-label` on the custom
variants or as visually hidden text on the others.

## Three traps worth knowing

**`Badge`'s `size` is a type scale, not a physical size.** It selects `h1`–`h6`
or `b1`–`b3` (default `b2`), so `size="h1"` is a badge with heading-sized text,
not a bigger pill. And its `style` list has eleven values — no `default`, unlike
`Button` — five of which are SMART curriculum domains that carry no severity
meaning.

**`Progress`'s `style` is not validated.** It is declared as
`PropTypes.string`, not an enum, and becomes the class
`plus-progress-bar-<style>`. Six of those classes exist in the stylesheet:
`primary`, `secondary`, `success`, `danger`, `warning`, `info`. Anything else
silently renders an unstyled bar with no warning.

**Two `Progress` props only work in combination with another.** `animated` is
applied only when `striped` is also true, and `showLabel` only prints the
percentage when `label` is not given — `label` wins.

## Announcing change

`Badge`'s `counter` is a plain span with no live region, so a number that changes
while the page is open is not announced. `Progress` updates its `aria-valuenow`
on every render, which assistive technology polls rather than announces. If a
change genuinely needs to interrupt, that is `Toast` — see
`design-system/guidelines/components/messaging.md`.

Colour is never the whole message: `Badge`'s style only changes the palette, so
the text has to say what the badge means, per
`design-system/guidelines/foundations/accessibility.md`.

## Related

- `design-system/src/components/status-and-loading/index.md` — generated facts and coverage
- `design-system/guidelines/components/messaging.md` — messages that need to be read
