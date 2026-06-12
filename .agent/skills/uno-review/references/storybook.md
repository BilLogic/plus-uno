# Storybook Guidelines

See also: [`storybook-component-docs.md`](storybook-component-docs.md) for the designer-facing guide to how `Components/*` and `Forms/*` entries are organized in the Storybook sidebar and within each docs page.

## Property Categorization
To ensure a consistent and developer-friendly experience in Storybook, all component arguments (`argTypes`) must be categorized using the `table: { category: '...' }` property.

Use the following standard categories:

### 1. Design
Properties that affect the visual style or theme of the component, but do not necessarily change the content.
*   **Examples**: `style`, `variant`, `size`, `color`, `theme`.

### 2. Content
Properties that define the actual data or content displayed within the component.
*   **Examples**: `title`, `text`, `label`, `image`, `children`.

### 3. Behavior
Properties that control the interaction or functional state of the component.
*   **Examples**: `dismissable`, `loading`, `disabled`, `open`, `expanded`.

### 4. Development
Technical properties used primarily for implementation details or developer overrides. These are often less relevant to designers.
*   **Examples**: `id`, `className`, `testId`, `ref`, callback functions (`onDismiss`, `onClick`).

## Interactive Playground Policy

The docs-bottom `Interactive` section should be a **curated playground**, not a full prop inspector.

Its primary audience is designers reviewing how a component changes across a few meaningful inputs. Developers can still use the story source, docs table, and story file for the full API surface.

### What to keep visible

Keep controls that create an immediate, obvious change in the inline preview and help someone understand the design system quickly.

Good fits:

- core content such as `text`, `title`, `label`, `placeholder`
- major design axes such as `style`, `fill`, `variant`, `size`
- important behavior states such as `disabled`, `loading`, `required`, `selected`
- simple layout toggles when they materially change the preview

### What to hide or demote

Hide or demote props that are mainly implementation details, escape hatches, or engineering hooks.

Usually hide from the main docs playground:

- `id`, `className`, `name`, `testId`
- callback props such as `onClick`, `onChange`, `onDismiss`
- polymorphic or low-level DOM props such as `as`, `ref`, `target`, `type`
- controlled-state wiring that is hard to understand in a docs table

`Development` props may still appear in source code or story files, but they should usually not be visible in the primary docs-facing controls.

### Prefer presets over raw data editing

Avoid exposing raw object, array, JSX, or JSON-style controls when a simpler preset would explain the component better.

Prefer:

- preset selectors such as `simple`, `with icons`, `with divider`
- count or mode controls such as `itemCount`, `stepCount`, `layoutPreset`
- bounded `select`, `radio`, and `boolean` controls

Avoid when possible:

- editable `items` arrays
- editable React nodes
- deeply nested option trees
- open-ended controls that create broken or invalid states

### Interactive section test

Before leaving a control visible in docs, ask:

1. Does changing this control produce an obvious difference in the preview?
2. Is that difference useful to a designer reviewing the system?
3. Can the docs page demonstrate it well without extra product context?
4. Is the same concept already taught better by the curated examples above?

If the answer is mostly no, the control should usually be hidden, simplified, or replaced with a preset.

## Example Configuration

```javascript
argTypes: {
    // Design
    style: {
        control: 'select',
        options: ['primary', 'secondary'],
        table: { category: 'Design' }
    },
    
    // Content
    title: {
        control: 'text',
        table: { category: 'Content' }
    },
    
    // Behavior
    dismissable: {
        control: 'boolean',
        table: { category: 'Behavior' }
    },
    
    // Development
    className: {
        control: 'text',
        table: { category: 'Development' }
    }
}
```
