---
summary: Alert, Toast or Modal — choosing by how long the message lives and whether it blocks
---

<!-- Tier: 2 | Load when: choosing a component from the messaging group -->

# Messaging — which component to reach for

Three components: `Alert`, `Toast`, `Modal`. Generated facts are in
`design-system/src/components/messaging/index.md`. The choice between them is
not about severity — all three carry the same semantic palette — it is about how
long the message lives and whether the user can keep working.

## The choice

| The message… | Reach for | Because |
|---|---|---|
| belongs to the page and stays until resolved | `Alert` | renders in the flow, dismissible by default |
| confirms something and should fade | `Toast` | auto-hides after 5000ms by default |
| must be answered before anything else | `Modal` | takes focus, blocks the page behind a backdrop |
| is about one form field | none of these | the field's own error state |

That last row is the one that matters most. `Input`, `NumberInput`, `FileUpload`
and `DateAndTimePicker` all take `validation="invalid"` plus `validationMessage`,
which renders the message directly beneath the control with a matching icon. An
`Alert` at the top of a form makes the user hunt for which field is wrong.
`Textarea` is the exception in the other direction: it has a `state="error"`
style but no message slot, so the caller renders the message.

## What each one actually does

**`Alert`** is dismissible by default — `dismissible` defaults to `true`, so
every alert grows a close button unless you say otherwise. Dismissal is held in
the component's own state and the render returns `null` on it, so a dismissed
alert stays dismissed until it is remounted. Six `style` values: `primary`,
`secondary`, `success`, `danger`, `warning`, `info`.

**`Toast`** is fully controlled through `show` and `onClose`. `delay` is 5000ms
and `autohide` is on, and autohide only applies while `delay` is above zero.
`title` and `children` are both required. `ToastContainer` positions a stack;
it maps the legacy `top-right`-style positions onto the current ones.

**`Modal`** is the only one that interrupts. `keyboard` and `backdrop` both
default to `true`, so Escape and an outside click close it. Its width system is
fixed — `width` (default 340) sets `width`, `minWidth` and `maxWidth` to one
value — so a modal never adapts to its content; `type="scrollable"` is how long
content is handled. `renderAs="inline"` returns the chrome as an ordinary block
with no backdrop, no focus trap and no Escape: it exists for docs and spec
pages, never for a live dialog.

## Announcement, and why it is easy to overdo

`Alert` renders `role="alert"` and `Toast` renders `role="alert"` with
`aria-live="assertive"` and `aria-atomic="true"`. Both interrupt a screen reader.
That is right for something that just went wrong and heavy-handed for ambient
information — a count, a timestamp, a "3 sessions this week" line is better as
ordinary page text.

Live regions announce *changes*. A message present in the first paint may not be
announced at all, so anything rendered on mount has to read correctly as plain
content too.

Every close control in the group has a hard-coded label: `Close alert` on
`Alert`, `Close` on `Toast`, `Close modal` on `Modal`. None of them can be
renamed, so several dismissible messages on one screen expose several
identically named buttons.

## Related

- `design-system/src/components/messaging/index.md` — generated facts and coverage
- `design-system/guidelines/components/forms-and-inputs.md` — where validation messages belong
- `design-system/guidelines/components/overlays.md` — non-blocking overlays
