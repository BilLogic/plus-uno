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
| one pick, fewer than 5 options | `ChoiceGroup` (`type="radio"`, the default) |
| one pick, 5–15 options | `Select` |
| one pick, more than 15 options | `Select searchable` |
| several picks, fewer than 5 options | `ChoiceGroup type="checkbox"` |
| several picks from a longer, fixed list | `Select mode="multi"` |
| several picks, or values the user adds | `TagInput` |
| a pick through a hierarchy | `Cascader` for one leaf along one path · `TreeSelect` to see the tree, pick a parent, or pick several — see below |
| a rating on a scale | `ChoiceGroup orientation="inline"` with `leadingText` and `trailingText` for a numbered scale · `Rating` for stars |
| the same choice for several questions | `ChoiceGrid` |
| an action run from a button | `Dropdown` — a button, not a field |

The rest of the group answers narrower shapes: `NumberInput` for a number with
steppers, `RichTextEditor` for formatted prose, `InputGroup` for a field with
text, an icon or a button welded to it, `Range` for a number in a continuous
range, `Switch` for a setting that applies immediately, `Checkbox` for one
independent yes/no saved with the form, `DateAndTimePicker` for a date or time,
`FileUpload` for a file.

### A default, or every option in view

The counts above are a starting point; two things move them. When there is a
good default, a `Select` suits even a short list: it shows the default and
keeps the alternatives quiet. When people must compare every option to answer,
or no default stands out, keep the options in view with `ChoiceGroup`, even
past 5. Several picks go through checkboxes in view (`ChoiceGroup
type="checkbox"`) or `Select mode="multi"`, which keeps the picks visible as
tags in the field; never through a single-pick `Select`.

### Cascader or TreeSelect

Both take the same `options` tree, nested through `children`. They differ in
what the user sees and what they can pick.

- **`Cascader`** when the answer is one leaf, reached along a single path where
  each level narrows the next — school, then grade, then class. Its `value` is
  the path, an array from root to leaf; one column opens per level, and picking
  a leaf commits and closes. It cannot pick a parent or more than one node.
- **`TreeSelect`** when people need to see the hierarchy as a whole, pick a
  parent node itself, or pick several items. Single mode commits any node,
  parent or leaf; `multiple` adds checkboxes, and a fully checked parent stands
  in for its children in the field.

If the user should never stop part-way down, it is a `Cascader`. If stopping at
a parent is a valid answer, or the answer is a set, it is a `TreeSelect`.

### Dropdown is an action menu

The recurring mistake is `Dropdown` where `Select` was meant. `Dropdown` fires
per-item handlers and stores nothing; `Select` holds the value, shows it in the
trigger, and supports multi-select and search. If the trigger should still read
"Sort by" after the user chooses, you have picked the wrong one.

### A group is the group component's job

Reach for the group component before mapping `Checkbox` or `Radio` over an
array. `ChoiceGroup` takes an `options` array, owns the value and renders a
`fieldset` named by its `legend`, stacked or inline, with scale ends, an
"Other" answer, per-option descriptions, the `card` appearance and one group
`error`; `ChoiceGrid` builds the rows-by-columns matrix from the same Checkbox
and Radio and labels every cell with `aria-labelledby` pointing at both its row
and its column.

### Names that look importable and are not the answer

- The option list under a field (`Listbox`) and its row (`OptionRow`) are
  internal parts in `forms-and-inputs/_internal/`, not fields. Select and
  TagInput build on them; for several values from a known list, use
  `Select mode="multi"`.
- `TagInput` is the field for a set of tags the user picks or adds, as in
  Notion's multi-select: typing filters its options, and a Create row adds a
  new value with a random Tag colour, reported through `onCreate`. Its
  `options` are required and owned by the caller.
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

**Validation is wired on five fields.** `validation="invalid"` with
`validationMessage` — on `Input`, `NumberInput`, `FileUpload`,
`DateAndTimePicker` and `TagInput` — sets `aria-invalid` and points `aria-describedby` at the
message, appending to any `aria-describedby` the caller passed. `Textarea` has
no message slot: its `state="error"` is styling, so the caller renders the
message and passes `aria-invalid` and `aria-describedby`, which reach the
`textarea` through its rest props. Either way the error belongs on the field,
not in an `Alert` at the top of the form — see
`design-system/guidelines/components/messaging.md`.

**`required` means three different things.** On `Input`, `NumberInput`,
`FileUpload`, `DateAndTimePicker`, `Rating` and `TagInput` it draws an
asterisk marked `aria-label="required"` and stops there, so enforce it yourself.
`Checkbox` forwards it to the native input. `ChoiceGroup` marks its legend and,
for radios, sets `aria-required` on the group and `required` on every radio; a
checkbox group cannot be enforced natively, so check it yourself. `Select`
announces it through a visually hidden "Required" description on the trigger.

**Popup placement.** Every popup that opens from a field or button follows one
rule: `Select`, `TagInput`, `TreeSelect`, `Cascader`, `DatePicker`,
`DateAndTimePicker` and the `Dropdown` menu.

- **Gap:** `--size-element-gap-xs` (4px) between the trigger's edge and the
  popup surface, as a token, with Bootstrap's spacer margin reset to zero.
  The shared `Listbox` holds it as `ANCHOR_GAP`; anything placed in CSS uses
  `calc(100% + var(--size-element-gap-xs))`.
- **Alignment:** the popup's left edge sits on the trigger's left edge. Near
  the viewport's right edge it right-aligns instead.
- **Width:** at least the trigger's width and at most 320px. A popup with
  columns (`Cascader`, the calendar) grows past 320px.
- **Flip:** with no room below, the popup opens above, keeping the same gap.
- **Arrowed exception:** a `Popover` or `Tooltip` with an arrow keeps its 8px
  gap, because the arrow fills it. They sit outside this family.

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
is short enough, `ChoiceGroup` beats all of them: every option is a native
radio or checkbox.

## Related

- `design-system/src/components/forms-and-inputs/index.md` — generated facts and coverage
- `design-system/guidelines/composition/forms.md` — how fields compose on a surface
- `design-system/guidelines/composition/form-behaviour.md` — when to validate, errors on submit, required, read-only, unsaved changes
- `design-system/guidelines/foundations/accessibility.md` — the WCAG bar
