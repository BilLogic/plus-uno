---
summary: How a PLUS form behaves — when it validates, how errors surface on submit, required fields, disabled vs read-only, unsaved changes, dependent fields, and subtle vs standard fields
---

<!-- Tier: 2 | Load when: building or reviewing a form that validates, submits, or edits saved values -->

# Form behaviour

What a form does over time: when it checks a value, what happens on submit,
and what a field shows when the person cannot change it. Where the fields sit
is `forms.md` beside this file; which component to pick is
`../components/forms-and-inputs.md`.

The components render states; the form decides when to enter them. `Input`,
`NumberInput`, `FileUpload` and `DateAndTimePicker` take `validation` and
`validationMessage` and point the control at the message, but none of them
knows when to check. The caller owns timing, and this page is the timing.

## When to validate

Check a field **when it loses focus**. Once a submit has failed, check every
field **as the person types**, so each error clears the moment it is fixed.

Checking on every keystroke from the start flags a value the person is still
writing: a ten-character minimum turns red on the first letter.

```jsx
const [error, setError] = useState(null);
const [submitFailed, setSubmitFailed] = useState(false);

<Input
  id="feedback"
  label="What feels inaccurate?"
  required
  value={text}
  onChange={(e) => {
    setText(e.target.value);
    if (submitFailed) setError(check(e.target.value));
  }}
  onBlur={() => setError(check(text))}
  validation={error ? 'invalid' : 'none'}
  validationMessage={error}
/>
```

## Submitting with errors

The submit button stays enabled. When a submit fails:

1. Run every check, and show each error on its own field.
2. Put an **error summary** at the top of the form: an `Alert` with
   `style="danger"`, `dismissible={false}`, a title such as "Fix 2 fields to
   continue", and one link per error that moves focus to that field's `id`.
3. Move focus to the **first invalid field**, and scroll it into view.

The summary is a table of contents for the errors, and each field still
carries its own message — `../components/messaging.md` explains why an `Alert`
alone makes the person hunt. Focus does the announcing, so the errors need no
live region.

While the submit is in flight, put `loading` on the submit `Button` and leave
the fields as they are.

## Required fields

Pass `required` to draw the asterisk, and put one legend line above the first
field: "Required fields are marked with an asterisk (*)." A form marks what is
required and leaves every other field unmarked, with no "(optional)" labels.

For a group of choices, mark the group: pass `required` to `ChoiceGroup`, which
puts the asterisk on its `legend`, and keep `required` off each `Checkbox` and
`Radio`.
`required` draws the mark and nothing more on most fields, so the form's own
check still enforces it.

## Disabled vs read-only

| The field is | Use | The person can |
|---|---|---|
| unavailable right now (its parent is empty, a feature is off) | `disabled` | skip it; it leaves the tab order |
| a real value this person may see but not change | read-only | focus it, read it, copy it |

A permission split — an admin edits a profile, a tutor views it — is read-only.
After a submit that fails on permission, the form turns read-only and says
why in an `Alert`, keeping the values readable.

The prop is spelled per component: `readOnly` on `Input`, `Textarea`,
`Checkbox`, `Radio`, `Switch`, `ChoiceGroup` and `ChoiceGrid`; `readonly` on
`Select`, `NumberInput`, `InputGroup` and `DateAndTimePicker`. `Select` treats
`readonly` as disabled today. A read-only choice keeps its focus and contrast
and ignores clicks and keys; put radios in a `ChoiceGroup`, since ARIA lets the
radio group announce read-only and not a lone radio.

## Unsaved changes

A form is **dirty** when its values differ from the values it loaded. Typing a
change and then undoing it leaves the form clean.

When the person leaves a dirty form — navigates away or closes its modal —
show the unsaved-changes modal: "Exit without saving" as a secondary tonal
`Button`, "Save & Exit" as the primary filled one. Three specs already draw
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
  it naming the parent: "Pick an institution first."
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

Input, Textarea and NumberInput take a `subtle` prop. Input and Textarea save
through `onSave`; NumberInput takes the look only, so its caller saves on
blur. Select and the other pickers have no subtle look yet, so a surface that
needs one of them stays standard throughout.

## Forms still to move

These spec and prototype files validate or submit a form and predate this
page. Each moves to the timing above; `MonthlyReportContent.jsx` checks its
feedback field on every keystroke.

- `design-system/src/specs/Home/Modals/UserFeedbackModal/UserFeedbackModal.jsx` and `.stories.jsx`
- `design-system/src/specs/Home/Sections/HomepageJumbotron/HomepageJumbotron.jsx` and `.stories.jsx`
- `design-system/src/specs/Login/Elements/AccessCodeForm/AccessCodeForm.jsx`
- `design-system/src/specs/Login/Sections/LoginForm/LoginForm.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Pages/FormFeedback/FormFeedback.stories.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Pages/ReflectionFlow/ReflectionFlow.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Sections/FormFeedbackForm/FormFeedbackForm.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Sections/SessionInfoForm/SessionInfoForm.jsx`
- `design-system/src/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar.jsx`
- `design-system/src/specs/Toolkit/Pre-Session/Elements/NewFormDateInput.stories.jsx`
- `design-system/src/specs/Toolkit/Pre-Session/Elements/NewFormTimeInput.stories.jsx`
- `design-system/src/specs/Training/Onboarding/Modals/StrategyContentPromptModal/StrategyContentPromptModal.jsx` and `.stories.jsx`
- `design-system/src/specs/Training/Onboarding/Pages/OnboardingInnerPage/OnboardingInnerPage.jsx`
- `prototypes/home-redesign/src/components/Dashboard.jsx`
- `prototypes/monthly-report/src/MonthlyReportContent.jsx`

## Related

- `forms.md` — how the fields compose on a surface
- `../components/forms-and-inputs.md` — which component to reach for
- `../components/messaging.md` — field errors vs an `Alert`
- `../foundations/accessibility.md` — the WCAG bar
