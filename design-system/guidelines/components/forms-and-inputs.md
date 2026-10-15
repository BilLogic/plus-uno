---
summary: Which input to use, sorted by the shape of the answer, plus the id, validation and required rules that apply across the group
---

<!-- Tier: 2 | Load when: choosing a component from the forms-and-inputs group -->

# Forms and inputs — which input to use

Generated facts (props, defaults, coverage) are in
`design-system/src/components/forms-and-inputs/index.md`. How the fields sit
together on a surface is `design-system/guidelines/composition/forms.md`; this
file is about picking one.

## Which input to use

Sort by the shape of the answer. Every name in the right-hand column is
importable from `@/components` today.

| The answer is | Reach for |
|---|---|
| free text, one line | `Input` |
| free text, several lines | `Textarea`, sized with `rows` |
| one pick, 2–5 options worth showing | `MultipleChoice type="radio"` |
| one pick from a longer list | `Select`, with `searchable` past about 8 options |
| several picks, few options | `MultipleChoice type="checkbox"` |
| several picks from a longer, fixed list | `Select mode="multi"` |
| several picks, or values the user adds | `Select mode="multi" creatable` |
| a pick through a hierarchy | `Cascader` for one path · `TreeSelect multiple` for many |
| a rating on a scale | `Scale` for a numbered scale with end labels · `Rating` for stars |
| the same choice for several questions | `ChoiceGrid` |
| an action run from a button | `Dropdown` — a button, not a field |

Where the group is heading: one `ChoiceGroup` (with `type` and `orientation`)
replaces `MultipleChoice` and `Scale`, and `TagInput` takes the "values the user
adds" row once it accepts typing. Until each lands, use the names in the table.

The rest of the group answers narrower shapes: `NumberInput` for a number with
steppers, `RichTextEditor` for formatted prose, `InputGroup` for a field with
text, an icon or a button welded to it, `Range` for a number in a continuous
range, `Switch` for a setting that applies immediately, `Checkbox` for one
independent yes/no saved with the form, `DateAndTimePicker` for a date or time,
`FileUpload` for a file.

### Dropdown is an action menu

The recurring mistake is `Dropdown` where `Select` was meant. `Dropdown` fires
per-item handlers and stores nothing; `Select` holds the value, shows it in the
trigger, and supports multi-select and search. If the trigger should still read
"Sort by" after the user chooses, you have picked the wrong one.

### A group is the group component's job

Reach for the group component before mapping `Checkbox` or `Radio` over an
array. `MultipleChoice` takes an `options` array, owns the value and renders a
`fieldset` with a `legend` when given one; `ChoiceGrid` builds the
rows-by-columns matrix and labels every cell with `aria-labelledby` pointing at
both its row and its column; `Scale` renders the low and high end labels
alongside the options.

### Names that look importable and are not the answer

- `RadioButtonGroup` is the file; the export is `Scale`.
- `SelectMultiple` is legacy — `Select mode="multi"` covers it.
- `OptionList` renders an inline list that its caller positions by hand; it is
  a part, not a field.
- `TagInput` shows and removes tags. It has no text entry, so it cannot take a
  new value from the user.
- `DatePicker` is a bare date control with no `label`, no `required`, no
  `validation`, and no rest props, so nothing can name it. Reach for
  `DateAndTimePicker`, which has `label`, `required`, `validation` with
  `validationMessage`, `minDate` / `maxDate`, and `showDate={false}` when only a
  time is wanted.

## Rules that apply across the group

**One id, label and control.** Every field that renders its own label derives
its id through `useFieldId`: the caller's `id` when given, a generated one
otherwise, handed to both the label's `htmlFor` and the control. Pass `id` when
something else on the page must reference the control; leave it off and the
label still names the field. `Select` and `DatePicker` render no label, so this
rule does not reach them.

**Validation is wired on four fields.** `validation="invalid"` with
`validationMessage` — on `Input`, `NumberInput`, `FileUpload` and
`DateAndTimePicker` — sets `aria-invalid` and points `aria-describedby` at the
message, appending to any `aria-describedby` the caller passed. `Textarea` has
no message slot: its `state="error"` is styling, so the caller renders the
message and passes `aria-invalid` and `aria-describedby`, which reach the
`textarea` through its rest props. Either way the error belongs on the field,
not in an `Alert` at the top of the form — see
`design-system/guidelines/components/messaging.md`.

**`required` means three different things.** On `Input`, `NumberInput`,
`FileUpload`, `DateAndTimePicker`, `Rating`, `TagInput` and `Scale` it draws an
asterisk marked `aria-label="required"` and stops there, so enforce it yourself.
`Checkbox` forwards it to the native input. `Select` announces it through a
visually hidden "Required" description on the trigger.

## Where the group is weakest

`Select` is the most used component here, and it is not a native `select`. The
trigger is a `div` with `role="button"` and `aria-expanded`, and nothing names
it: `label htmlFor` cannot point at a `div`, and `aria-label` passed to `Select`
does not reach the trigger. Single mode lists plain buttons with no listbox
role; multi mode lists `role="option"` rows that the arrow keys reach and no key
selects. It renders no form control, so `name` never produces a submitted
value — read from `onChange`, which hands you the value rather than an event.

The menu-backed fields that do carry a full ARIA pattern are `Cascader`
(`combobox` → `listbox` → `option`), `TreeSelect` (`combobox` → `tree` →
`treeitem`) and `DatePicker`'s trigger (`combobox` → `dialog`). Where the list
is short enough, `MultipleChoice` beats all of them: every option is a native
radio or checkbox.

## Related

- `design-system/src/components/forms-and-inputs/index.md` — generated facts and coverage
- `design-system/guidelines/composition/forms.md` — how fields compose on a surface
- `design-system/guidelines/foundations/accessibility.md` — the WCAG bar
