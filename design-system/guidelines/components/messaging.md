---
summary: SectionMessage, Flag or Modal — choosing by how long the message lives and whether it blocks
---

<!-- Tier: 2 | Load when: choosing a component from the messaging group -->

# Messaging — which component to reach for

Seven components: `SectionMessage`, `Flag`, `Modal`, `Banner`, `InlineMessage`,
`EmptyState` and `Spotlight`. Generated facts are in
`design-system/src/components/messaging/index.md`. The choice
between `SectionMessage`, `Flag` and `Modal` is not about severity — all three carry the
same semantic palette — it is about how long the message lives and whether the
user can keep working.

## The choice

| The message… | Reach for | Because |
|---|---|---|
| is a prominent notice at the top of the whole page | `Banner` | full width, no dismiss, three appearances (warning, danger, announcement) |
| belongs to the page and stays until resolved | `SectionMessage` | renders in the flow, dismissible by default |
| confirms something and should fade | `Flag` | auto-hides after 5000ms by default |
| must be answered before anything else | `Modal` | takes focus, blocks the page behind a backdrop |
| is extra detail behind an icon, not shown by default | `InlineMessage` | opens a Popup on demand, so it never pushes layout |
| is about one form field | none of these | the field's own error state |
| is a view that failed to load, or one the person may not open | `EmptyState` | the view's own slot, with Try again or who can help |
| is a failed background action, such as a sync | `Flag` (error) | stays until closed, with Try again |
| is a rejected form submit | `SectionMessage` (danger), with each field's own error | a danger summary at the form top points to the fields |

That last row is the one that matters most. `TextField`, `TextArea`, `FileUpload`
and `DateTimePicker` all take `isInvalid` plus `errorMessage`,
which renders the message directly beneath the control with a matching icon. A
`SectionMessage` alone at the top of a form makes the user hunt for which field is wrong.

## What each one actually does

**`SectionMessage`** is dismissible by default — `dismissible` defaults to `true`, so
every message grows a close button unless you say otherwise. Dismissal is held in
the component's own state and the render returns `null` on it, so a dismissed
message stays dismissed until it is remounted. Six `appearance` values: `primary`,
`secondary`, `success`, `danger`, `warning`, `info`.

**`Flag`** is fully controlled through `show` and `onDismiss`. `appearance` is
`normal`, `information`, `warning`, `error` or `success`; it alone decides the kind: `normal` is the default flag (with ×), every other value is bold (no ×). The dismiss rule is on the Flag page. `delay`
is 8000ms and `autohide` is on for the calm appearances, and autohide only applies
while `delay` is above zero. `title` is required; the description and `actions`
are optional. `FlagGroup` positions a stack.

**`Modal`** is the only one that interrupts. `keyboard` and `backdrop` both
default to `true`, so Escape and an outside click close it. Its width system is
fixed — `width` (default 340) sets `width`, `minWidth` and `maxWidth` to one
value — so a modal never adapts to its content. Long content is handled by
`height`: a Hug modal (the default) scrolls its body once the content passes the
cap, and `height="fill"` holds the full height. `renderAs="inline"` returns the chrome as an ordinary block
with no backdrop, no focus trap and no Escape: it exists for docs and spec
pages, never for a live dialog.

## Announcement, and why it is easy to overdo

`SectionMessage` renders `role="alert"`. An `error` or `warning` `Flag` renders
`role="alert"` with `aria-live="assertive"` and `aria-atomic="true"`; every other
`Flag` appearance is `role="status"` with `aria-live="polite"` and waits its turn.
Interrupting is right for something that just went wrong and heavy-handed for
ambient information — a count, a timestamp, a "3 sessions this week" line is
better as
ordinary page text.

Live regions announce *changes*. A message present in the first paint may not be
announced at all, so anything rendered on mount has to read correctly as plain
content too.

Every close control in the group has a hard-coded label: `Dismiss message` on
`SectionMessage`, `Dismiss flag` on `Flag`, `Close modal` on `Modal`. None of them can be
renamed, so several dismissible messages on one screen expose several
identically named buttons. `CloseButton`, the shared 24×24 dismiss control that
`SectionMessage` and `Flag` use, takes `what` for a "Dismiss {what}" name; each
of the two passes its own fixed label instead.

## Related

- `design-system/src/components/messaging/index.md` — generated facts and coverage
- `design-system/guidelines/components/forms-and-inputs.md` — where validation messages belong
- `design-system/guidelines/components/overlays-and-layering.md` — non-blocking overlays
