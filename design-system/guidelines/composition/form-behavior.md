---
summary: How a PLUS form behaves — when it validates, how errors surface on submit, required fields, disabled vs read-only, unsaved changes, dependent fields, and subtle vs standard fields
---

<!-- Tier: 2 | Load when: building or reviewing a form that validates, submits, or edits saved values -->

# Form behavior

What a form does over time: when it checks a value, what happens on submit,
and what a field shows when the person cannot change it. Where the fields sit
is `forms.md` beside this file; which component to pick is
`../components/forms-and-inputs.md`.

The components render states; the form decides when to enter them. `TextField`,
`TextArea`, `FileUpload` and `DateTimePicker` take `isInvalid` and
`errorMessage` and point the control at the message, but none of them
knows when to check. The caller owns timing, and this page is the timing.

## When to validate

Check a field **when it loses focus**. Once a submit has failed, check every
field **as the person types**, so each error clears the moment it is fixed.

Checking on every keystroke from the start flags a value the person is still
writing: a ten-character minimum turns red on the first letter.

```jsx
const [error, setError] = useState(null);
const [submitFailed, setSubmitFailed] = useState(false);

<TextField
  id="feedback"
  label="What feels inaccurate?"
  isRequired
  value={text}
  onChange={(e) => {
    setText(e.target.value);
    if (submitFailed) setError(check(e.target.value));
  }}
  onBlur={() => setError(check(text))}
  isInvalid={Boolean(error)}
  errorMessage={error}
/>
```

## Submitting with errors

The submit button stays enabled. When a submit fails:

1. Run every check, and show each error on its own field.
2. Put an **error summary** at the top of the form: a `SectionMessage` with
   `appearance="danger"`, `dismissible={false}`, a title such as "Fix 2 fields to
   continue", and one link per error that moves focus to that field's `id`.
3. Move focus to the **first invalid field**, and scroll it into view.

The summary is a table of contents for the errors, and each field still
carries its own message — `../components/messaging.md` explains why a
`SectionMessage` alone makes the person hunt. Focus does the announcing, so the
errors need no live region.

A submit the server rejects follows the same rule: the danger `SectionMessage`
at the top of the form says what was refused, and each field the server names
shows its own error. A failure the person did not cause, such as the request
never arriving, is a danger `SectionMessage` with a Try again action, and the
fields keep their values. A background failure outside the form is an error
`Flag` that stays until closed, with Try again. A view that fails to load is an
`EmptyState` with Try again, not a message above the form.

While the submit is in flight, put `loading` on the submit `Button` and leave
the fields as they are.

## Required fields

Pass `required` to draw the asterisk, and put one legend line above the first
field: "Required fields are marked with an asterisk (*)." A form marks what is
required and leaves every other field unmarked, with no "(optional)" labels.

For a group of choices, mark the group: pass `isRequired` to `RadioGroup` or a
`Fieldset`, which puts the asterisk on its `legend`, and keep `isRequired` off
each `Checkbox` and `Radio` in it.
`isRequired`/`required` draws the mark and nothing more on most fields, so the
form's own check still enforces it.

## Unavailable actions and fields

An action stays enabled and explains on press what is missing. A field or
option disables only for a prerequisite the person can fix on the same screen. Content people must read is read-only, and what a role can never use is
hidden.

| The control is | Do this | The person can |
|---|---|---|
| an action that is not ready (a required field is empty) | leave it enabled; on press, focus the first problem and say what is missing | press it and learn what to do |
| an action that is sending | `isLoading` on the `Button`, the one time a button disables | wait; the label stays |
| a field or option waiting on a same-screen prerequisite (its parent is empty) | `disabled`, with the reason as visible caption or description text | read why, then fix the parent |
| a value this person may see but not change | read-only | focus it, read it, copy it |
| a feature this role can never use | hidden | nothing; there is nothing to explain |

Say why in text where the cause is: the field's caption ("Choose a school
first") or the option's description line. When the unavailable thing blocks the
main action, or several items are unavailable at once, put a warning
`SectionMessage` above them that says how to turn it on. Never put the reason
in a tooltip on a disabled control: a disabled control takes no hover or focus,
so a tooltip there is unreachable, and touch has no hover at all.

A disabled control leaves the tab order, with no `aria-disabled` stand-in that
keeps it focusable. Menu items and select options are not tab stops, so they
keep their arrow-key navigation. A self-evident case needs no reason: Back on
step one. A locked area, such as the Sidebar Toolkit during onboarding, is
disabled and visible, never hidden.

A permission split — an admin edits a profile, a tutor views it — is read-only.
After a submit that fails on permission, the form turns read-only and says
why in a `SectionMessage`, keeping the values readable.

The prop is spelled per component: `isReadOnly` on `TextField`, `TextArea`,
`Checkbox`, `Radio`, `Toggle`, `RadioGroup` and `ChoiceGrid`; `readonly` on
`Select` and `DateTimePicker`. `Select` treats
`readonly` as disabled today. A read-only choice keeps its focus and contrast
and ignores clicks and keys; put radios in a `RadioGroup`, since ARIA lets the
radio group announce read-only and not a lone radio.

## Unsaved changes

A form is **dirty** when its values differ from the values it loaded. Typing a
change and then undoing it leaves the form clean.

When the person leaves a dirty form — navigates away or closes its modal —
show the unsaved-changes modal: "Exit without saving" as a default
`Button`, "Save & Exit" as the primary one. Three specs already draw
it: `Profile/Modals/UnsavedChanges`, and `UnsavedWarning` under
`Toolkit/Pre-Session/Modals/CreateNewSession` and `.../EditSession`. Reuse
their wording.

**Reset** returns every field to its loaded value and clears every error and
the failed-submit flag. Offer it where a person edits many saved values at
once, such as a settings or profile page; in a modal, Cancel is the reset.

## Dependent fields

When one field's options or limits come from another — an institution, then
its access code; a start time, then an end time:

- The child is `disabled` until the parent has a value, with a caption under
  it naming the parent: "Pick an institution first." The caption stays at
  full contrast, since it is the reason.
- The child clears when the parent changes.
- While the child's options load, it stays disabled and the caption says so.
- A rule between two fields (end after start) is re-checked on the child when
  the parent changes, and the error shows on the child.

## Subtle vs standard fields

**Standard** is the default, and every form with a submit button uses it.

**Subtle** is for a record the person mostly reads and occasionally fixes one
value on, such as a profile page or a table cell. A subtle field reads as text
at rest, shows its border on hover, and while editing looks the same as a
standard field. A single-line field or select saves on blur and Enter, and Esc
reverts. A textarea shows Save and Cancel and stays open when it loses focus.
A failed save keeps the field open in its invalid state, with the server's
message under it. One surface uses one look.

TextField and TextArea take `appearance="subtle"` and save through `onSave`;
a subtle `type="number"` field takes the look only, so its caller saves on
blur. Select and the other pickers have no subtle look yet, so a surface that
needs one of them stays standard throughout.

## Related

- `forms.md` — how the fields compose on a surface
- `../components/forms-and-inputs.md` — which component to reach for
- `../components/messaging.md` — field errors vs a `SectionMessage`
- `../../src/styles/Accessibility.mdx` — the WCAG bar
