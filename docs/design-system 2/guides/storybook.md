# Storybook Guidelines

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
