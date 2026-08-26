---
summary: Tooltip or Popover — hover description versus click-triggered content
---

<!-- Tier: 2 | Load when: choosing a component from the overlays group -->

# Overlays — which component to reach for

Two components: `Tooltip` and `Popover`. Generated facts are in
`design-system/src/components/overlays/index.md`. Both float content beside a
trigger and both are built on the same positioning layer; the difference is what
opens them and what you can put inside.

## The choice

**`Tooltip`** — a short label on a control whose purpose is not obvious. Default
trigger is `['hover', 'focus']`, showing after 250ms and hiding 400ms after you
leave. Nothing inside it can be reached: moving the pointer toward it leaves the
trigger and it hides. Four placements.

**`Popover`** — content the user opens deliberately. Default trigger is
`'click'`, it has a `title` header and a body, thirteen placements, and unlike
`Tooltip` it has an `onToggle` callback for controlled use. Reach for it when
the overlay holds a link, a button, a short definition with formatting.

Neither is the right home for something the user must read to finish a task. An
overlay is hidden until asked for, absent on touch in `Tooltip`'s case, and gone
the moment attention moves. Content that must be read belongs on the page, or in
a `Modal` when it must be answered.

## Both share the same trigger rule

The trigger must be a single element that accepts a ref. A function component
that does not forward its ref will fail to position. `Popover` softens this by
wrapping a non-element trigger in a focusable span; `Tooltip` does not, and its
controlled branch clones the child with a ref directly.

## What to know before shipping either

**A tooltip describes; it does not name.** The overlay renders `role="tooltip"`
and the positioning layer adds `aria-describedby` to the trigger. A description
is not an accessible name, so an icon-only `Button` still needs its own
`aria-label` — the tooltip is the second sentence, not the first.

**A popover also announces as a tooltip.** The underlying popover carries
`role="tooltip"` too, and nothing puts `aria-expanded` on the trigger. So a
click-triggered popover reads as a description of its trigger rather than as a
disclosure. Keep its content short and make sure the trigger's own label says
what opening it will do.

**Neither closes on Escape**, and neither moves focus into itself. That is
survivable for `Tooltip`, which holds nothing reachable. For `Popover` it means
anything interactive inside is reached by tabbing forward from the trigger, and
the overlay stays open while you are in it — usable, but not the disclosure
pattern a screen-reader user expects.

**Controlled `Tooltip` is a different code path.** Once `show` is defined, the
component takes a branch that ignores `trigger`, `delayShow` and `delayHide`
entirely.

## Related

- `design-system/src/components/overlays/index.md` — generated facts and coverage
- `design-system/guidelines/components/messaging.md` — when the message should block
- `design-system/guidelines/composition/surfaces.md` — surfaces and elevation
