---
summary: How PLUS form elements compose inside surfaces
---

<!-- Tier: 2 | Load when: composing form UIs | Route: design-system/guidelines/overview.md → patterns/forms.md -->
# Forms — Composition Pattern

How PLUS **form elements compose** inside surfaces. Not product UX, IA, or field order decisions — those come from design/PRD.

## Semantic purpose

Group labeled inputs, selection controls, and actions into a coherent data-entry block using DS form components and element-level tokens.

## When to use this pattern

- Modal or Card contains more than one field
- Standalone form section inside `PageLayout` content
- Prototype needs validated field spacing without inventing layout

## Building blocks

| Role | Component | Import |
|------|-----------|--------|
| Text | `Input` | `@/components` |
| Multi-line | `Textarea` | `@/components` |
| Pick one | `Select`, `Radio` | `@/components` |
| Pick many | `Checkbox`, `SelectMultiple` | `@/components` |
| Toggle | `Switch` | `@/components` |
| Date/time | `DatePicker`, `DateAndTimePicker` | `@/components` |
| Grouped field | `InputGroup` | `@/components` |
| Submit / cancel | `Button` | `@/components` |
| Section container | `Card` | `@/components` |

See `design-system/agent-views/components/index.md` for the full component index — form elements moved into `components/forms-and-inputs/` in the 2026-07 reorg.

## Standard structure

```jsx
import { Card, Button, Input, Select, Checkbox } from '@/components';

function ExampleForm() {
  return (
    <Card title="Session intake" paddingSize="md" gapSize="md">
      <div
        className="d-flex flex-column"
        style={{ gap: 'var(--size-element-gap-md)' }}
      >
        <Input id="name" label="Student name" required value={name} onChange={...} />
        {/* Select has no `label` prop — it forwards `id` to the trigger and
            nothing else, so the label has to be wired from outside. */}
        <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-sm)' }}>
          <label htmlFor="program">Program</label>
          <Select id="program" options={programs} value={program} onChange={...} />
        </div>
        <Checkbox label="Send reminder" checked={remind} onChange={...} />
      </div>
      <div
        className="d-flex justify-content-end"
        style={{ gap: 'var(--size-element-gap-md)', marginTop: 'var(--size-card-gap-md)' }}
      >
        <Button text="Cancel" style="secondary" fill="tonal" onClick={onCancel} />
        <Button text="Save" style="primary" fill="filled" type="submit" onClick={onSave} />
      </div>
    </Card>
  );
}
```

## Spacing rules (tokens)

| Gap | Token | Apply between |
|-----|-------|----------------|
| Fields in one group | `--size-element-gap-md` | Stacked `Input` / `Select` |
| Label to section | `--size-card-gap-md` | Field group → button row |
| Card internal | `--size-card-pad-x-md`, `--size-card-pad-y-md` | Via `Card` `paddingSize` |

Never hardcode `padding: 16px` between fields.

## Modal form variant

```jsx
<Modal show={show} onClose={onClose} title="Quick add" width={480} showBottomButtons={false}>
  <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
    <Input id="title" label="Title" value={title} onChange={...} />
    <Input id="note" label="Note" value={note} onChange={...} />
  </div>
</Modal>
```

Footer actions: either extra `Button` row in `children`, or `primaryButton` / `secondaryButton` on `Modal`.

## Correct vs incorrect

### Correct

- One `Input` per label; validation via `validation` + `validationMessage`
- Cancel left, primary right in button row
- Import form elements and actions from `@/components` (forms live in `design-system/src/components/forms-and-inputs/`, re-exported via `components/index.js`)
- Field stack uses `flex-column` + `--size-element-gap-md`

### Incorrect

- Raw `<form><input /></form>` with Bootstrap classes only
- Mixed hardcoded px gaps and token gaps in the same form
- `Button variant="primary"` (Bootstrap) instead of PLUS `style` / `fill`
- Product-specific wizard steps or IA — out of scope for this pattern doc

## Field-level conventions

- Single-column layout — never a multi-column form.
- Inline validation appears below the field, on blur.
- Required fields carry a red asterisk (`*`) next to the label.
- The submit button is bottom-right, primary variant; cancel and other secondary actions bottom-left.

## Related component docs

- `design-system/agent-views/components/index.md` — confirm `Input`, `Button`, `Modal`, `Card` exist
- their Storybook MDX and `*.stories.jsx` — props, variants, usage
- `surfaces.md` — the modal this form sits in when it is an overlay

## Rules

- Agent does not decide which fields belong on a form — implement designer-provided fields only
- Verify each control exists in `design-system/agent-views/components/index.md` before use
- Read each field's `.stories.jsx` for validation and size variants
