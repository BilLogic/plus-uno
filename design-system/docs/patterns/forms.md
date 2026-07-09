<!-- Tier: 2 | Load when: composing form UIs | Route: design-system/docs/discovery.md → patterns/forms.md -->
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
| Text | `Input` | `@/forms` |
| Multi-line | `Textarea` | `@/forms` |
| Pick one | `Select`, `Radio` | `@/forms` |
| Pick many | `Checkbox`, `SelectMultiple` | `@/forms` |
| Toggle | `Switch` | `@/forms` |
| Date/time | `DatePicker`, `DateAndTimePicker` | `@/forms` |
| Grouped field | `InputGroup` | `@/forms` |
| Submit / cancel | `Button` | `@/components` |
| Section container | `Card` | `@/components` |

See `design-system/agent-views/forms/index.md` for the full form element index.

## Standard structure

```jsx
import { Card, Button } from '@/components';
import { Input, Select, Checkbox } from '@/forms';

function ExampleForm() {
  return (
    <Card title="Session intake" paddingSize="md" gapSize="md">
      <div
        className="d-flex flex-column"
        style={{ gap: 'var(--size-element-gap-md)' }}
      >
        <Input id="name" label="Student name" required value={name} onChange={...} />
        <Select label="Program" options={programs} value={program} onChange={...} />
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
- Import form elements from `@/forms`, actions from `@/components`
- Field stack uses `flex-column` + `--size-element-gap-md`

### Incorrect

- Raw `<form><input /></form>` with Bootstrap classes only
- Mixed hardcoded px gaps and token gaps in the same form
- `Button variant="primary"` (Bootstrap) instead of PLUS `style` / `fill`
- Product-specific wizard steps or IA — out of scope for this pattern doc

## Related component docs

- `design-system/agent-views/forms/Input.md`
- `design-system/agent-views/components/Button/Button.md`
- `design-system/agent-views/components/Modal/Modal.md`
- `design-system/agent-views/components/Card/Card.md`

## Rules

- Agent does not decide which fields belong on a form — implement designer-provided fields only
- Verify each control exists in `design-system/agent-views/forms/index.md` before use
- Read each field's `.stories.jsx` for validation and size variants
