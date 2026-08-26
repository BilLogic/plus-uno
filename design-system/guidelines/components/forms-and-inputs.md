---
summary: Twenty-three input components sorted by the shape of the answer, plus the id and validation rules that apply across all of them
---

<!-- Tier: 2 | Load when: choosing a component from the forms-and-inputs group -->

# Forms and inputs — which component to reach for

Twenty-three components, the largest group in the system. Generated facts are in
`design-system/src/components/forms-and-inputs/index.md`. How the fields sit
together on a surface is `design-system/guidelines/composition/forms.md`; this
file is about picking one.

Sort by the shape of the answer.

## Free text

| The answer is | Reach for |
|---|---|
| one short string | `Input` |
| several lines of prose | `Textarea` |
| formatted prose | `RichTextEditor` |
| a number, with steppers | `NumberInput` |
| a set of short labels the user adds | `TagInput` |
| a field with something welded to it | `InputGroup` |

`InputGroup` is the composition case: `InputGroup.Text`, `.Icon`, `.Button`,
`.Dropdown`, `.Checkbox` and `.Radio` attach to the field, and the wrapper takes
up to two leading and two trailing visuals.

## A value from a list

| The list is | Reach for |
|---|---|
| short enough to show entirely | `MultipleChoice` |
| long, or needs search | `Select` |
| long, multi-select only | `SelectMultiple` |
| shown inside a popup surface | `OptionList` |
| a parent-child tree | `TreeSelect` |
| drilled through column by column | `Cascader` |
| a list of *actions*, not values | `Dropdown` |

The recurring mistake is `Dropdown` where `Select` was meant. `Dropdown` fires
per-item handlers and stores nothing; `Select` holds the value, shows it in the
trigger, and supports multi-select and search. If the trigger should still read
"Sort by" after the user chooses, you have picked the wrong one.

`TreeSelect` is worth knowing for a different reason: it is the only component in
the group with a full ARIA widget — its trigger carries `role="combobox"`,
`aria-haspopup="tree"` and `aria-expanded`, and its nodes carry `role="treeitem"`
with `aria-expanded` and `aria-selected`. `Select` does not.

## Direct selection

| The answer is | Reach for |
|---|---|
| one independent yes/no, saved with the form | `Checkbox` |
| a setting that applies immediately | `Switch` |
| one option from a group | `Radio`, or `MultipleChoice type="radio"` |
| several options from a group | `MultipleChoice type="checkbox"` |
| one answer per row, across shared columns | `ChoiceGrid` |
| a point on a labelled scale | `RadioButtonGroup` |
| a number in a continuous range | `Range` |
| one to five stars, or a thumbs-up | `Rating` |

Prefer the group components over hand-rolling: `MultipleChoice` takes an
`options` array and owns the value, `ChoiceGrid` builds the rows-by-columns
matrix and labels every cell with `aria-labelledby` pointing at both its row and
its column, and `RadioButtonGroup` renders the low/high end labels alongside the
scale.

## Dates and files

`DatePicker` is a bare date control — no `label`, no `required`, no `validation`.
`DateAndTimePicker` is the fuller field: `label`, `required`, `validation` plus
`validationMessage`, `minDate` / `maxDate`, separate date and time values, and
`showDate={false}` when only a time is wanted. `FileUpload` takes
`acceptedFormats` and has the same validation pair.

## Two rules that apply across the group

**Always pass `id`.** `Input`, `Textarea`, `NumberInput` and `FileUpload` all
render their label with `htmlFor={id || name}` while giving the control only
`id`. Passing `name` alone therefore points the label at an element that does not
exist — a silent break, with no warning. `Checkbox` and `Radio` use `id || name`
on the control and are safe either way; `Switch` falls back to a generated id and
is always safe.

**Validation styling is not validation semantics.** `validation="invalid"` plus
`validationMessage` — available on `Input`, `NumberInput`, `FileUpload` and
`DateAndTimePicker` — adds a class and renders the message with an `aria-hidden`
icon. It sets no `aria-invalid` and does not link the message to the control.
Pass `aria-invalid` and `aria-describedby` yourself; unknown props are spread
onto the underlying control on all four.

Two consequences worth stating plainly. First, the error belongs on the field,
not in an `Alert` at the top of the form — see
`design-system/guidelines/components/messaging.md`. Second, `Textarea` has no
message slot at all: its `state="error"` is styling only, so the caller renders
and links the message.

**`required` is usually decorative.** On `Input`, `NumberInput`, `FileUpload`,
`Rating`, `TagInput` and `RadioButtonGroup` it draws an asterisk marked
`aria-label="required"` and stops there. `Checkbox` is the exception: it
forwards `required` to the input.

## Where the group is weakest

`Select` is the most used component in this group, and it is not a native
`select`: the trigger is a `div` with `role="button"`, the options are buttons,
and there is no `aria-expanded`, no listbox role and no arrow-key navigation. It
renders no form control either, so `name` never produces a submitted value —
read from `onChange`, which hands you the value directly rather than an event.
Its `required`, `onFocus` and `onBlur` props are declared and then never used.

Where the list is short enough, `MultipleChoice` is the better answer: every
option is a native radio or checkbox.

## Related

- `design-system/src/components/forms-and-inputs/index.md` — generated facts and coverage
- `design-system/guidelines/composition/forms.md` — how fields compose on a surface
- `design-system/guidelines/foundations/accessibility.md` — the WCAG bar
