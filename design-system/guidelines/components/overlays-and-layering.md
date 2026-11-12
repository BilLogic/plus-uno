---
summary: Tooltip or Popup — hover description versus click-triggered content, and where every popup opens
---

<!-- Tier: 2 | Load when: choosing a component from the overlays-and-layering group, or placing any popup -->

# Overlays and layering — which component to reach for

Two components: `Tooltip` and `Popup`. Generated facts are in
`design-system/src/components/overlays-and-layering/index.md`. Both float
content beside a trigger; the difference is what opens them and what you can
put inside.

## The choice

**`Tooltip`** — a short description of something visible: an icon-only button,
a truncated cell, an abbreviation. It shows on hover and focus, holds nothing
reachable, and is never a focus stop.

**`Popup`** — content the user opens deliberately: a definition, a preview, a
short list. `triggerType` defaults to `click`; it takes an optional `title`
over the body, and a click away or Escape closes it. Opened by a click or a key,
it moves focus inside and returns it to the trigger on close. Its body is text
or a short list; a form goes in a `Modal`.

Content the user must read to finish a task belongs on the page, or in a
`Modal` when it must be answered. An overlay is an aside.

## Where a popup opens

One placement rule holds for `Popup`, `Tooltip`, `DropdownMenu`, `PopupSelect`
and every field's option list (`Select`, `TagInput`, `TreeSelect`, `Cascader`,
the date pickers):

- **Offset:** `--popover-offset` (4px) from the trigger's edge.
- **Side:** the popup aligns to the trigger's side of the bar it sits in:
  `bottom-start` for a trigger at the start of a toolbar or row, `bottom-end`
  for one at the end, so a menu never hangs off the far edge.
- **Width:** a field's popup is at least the field's width and grows with its
  content to 320px; `Cascader` columns and the calendar grow past it.
- **Flip:** with no room below, it opens above at the same offset, and it stays
  `--popover-gap-screen` (8px) inside the screen's edges.

Field popups place through one module,
`design-system/src/components/forms-and-inputs/_internal/anchorPlacement.js`;
the Popup placement stories in Forms and inputs show the rule.

## Clipped text gets a tooltip

Text that truncates — a table cell, a tab label, a tag — shows its full value in
a `Tooltip` on hover and focus. `Tooltip`'s `trigger` takes an empty list to
turn it off, so a caller can attach it only while the text is clipped.

## A tooltip describes; it does not name

`Tooltip` renders `role="tooltip"` and adds `aria-describedby` to its trigger. A
description is not an accessible name, so an icon-only button still needs its
own `label`; the tooltip is the second sentence, not the first. The reason a
control is disabled is visible text, not a tooltip — the disabled-state rule is
`design-system/guidelines/composition/form-behavior.md` § Unavailable actions and fields.

## Dialogs and what layers over them

A dialog (`Modal`) never opens another dialog — one dialog at a time. A
follow-up decision raised inside one, such as a destructive confirmation,
replaces the dialog's content in place rather than opening a second dialog.

A `Popup`, a `DropdownMenu`, a `Tooltip`, and a field's own option list still
float above an open dialog: opened from inside a modal, they mount in the
modal's layer and stay inside its focus trap. A `Flag` always renders on top of
everything, dialog included. Opening a dialog closes a floating sidebar.

## Related

- `design-system/src/components/overlays-and-layering/index.md` — generated facts and coverage
- `design-system/guidelines/components/messaging.md` — when the message should block
- `design-system/guidelines/composition/surfaces.md` — surfaces and elevation
