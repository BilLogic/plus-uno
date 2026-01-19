# Pattern: Elements

**Context**: Fundamental building blocks (Buttons, Inputs, Badges, Toggles).
**Layer**: 1 (Lowest)

## 1. Design Pattern (Intent)
**Vocabulary**:
*   **Action**: A trigger for an event (Button, Link).
*   **Input**: A field for user data entry (Text, Checkbox, Radio).
*   **Indicator**: A visual status or tag (Badge, Chip, Progress).
*   **Divider**: A visual separator.

**Usage Rules**:
*   **Buttons**: Use `primary` for main actions, `secondary` for alternatives.
*   **Inputs**: Always include a label. Use `error` state for validation.
*   **Badges**: Use for status (e.g., "Active", "Pending").
*   **Chips**: Use for filters or selections.

## 2. Component API (Implementation)

### Actions
```javascript
// Button
PlusInterface.createButton({
    text: "Label",
    style: "primary", // primary, secondary, tertiary, error, success
    fill: "filled",   // filled, outline, text
    size: "default",  // small, default, large
    icon: "fas fa-plus", // optional
    onClick: (e) => {}
});
```

### Inputs
```javascript
// Input (Text)
PlusInterface.createInput({
    label: "Username",
    placeholder: "Enter username",
    type: "text",     // text, password, email
    state: "default", // default, error, disabled
    helperText: "Must be unique",
    onChange: (e) => {}
});

// Checkbox
PlusInterface.createCheckbox({
    label: "Subscribe",
    checked: false,
    onChange: (e) => {}
});

// Radio
PlusInterface.createRadio({
    name: "gender",
    label: "Male",
    value: "male",
    checked: false,
    onChange: (e) => {}
});

// Switch
PlusInterface.createSwitch({
    label: "Notifications",
    checked: true,
    onChange: (e) => {}
});

// Select
PlusInterface.createSelect({
    label: "Role",
    options: [{ value: "admin", text: "Admin" }],
    value: "admin",
    onChange: (e) => {}
});
```

### Indicators
```javascript
// Badge
PlusInterface.createBadge({

### `createUserAvatar(config)`
User profile image.
*   `src`: Image URL.
*   `size`: 'sm', 'md', 'lg'.

### `createDivider(config)`
Visual separator.
*   `variant`: 'horizontal' or 'vertical'.

## 2. Design Tokens (Elements Layer)

### Spacing
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-element-pad-x-sm)` | 8px | Horizontal padding (Small) |
| `var(--size-element-pad-x-md)` | 10px | Horizontal padding (Default) |
| `var(--size-element-pad-x-lg)` | 16px | Horizontal padding (Large) |
| `var(--size-element-pad-y-sm)` | 4px | Vertical padding (Small) |
| `var(--size-element-pad-y-md)` | 6px | Vertical padding (Default) |
| `var(--size-element-pad-y-lg)` | 8px | Vertical padding (Large) |

### Gaps
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-element-gap-xs)` | 4px | **Label-to-Input ONLY** |
| `var(--size-element-gap-sm)` | 8px | Body text / Icon spacing |
| `var(--size-element-gap-md)` | 10px | Title text spacing |

### Radius
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-element-radius-sm)` | 2px | Small elements |
| `var(--size-element-radius-md)` | 4px | Default elements |
| `var(--size-element-radius-lg)` | 8px | Large elements |
| `var(--size-element-radius-full)` | 999px | Badges, Chips, Switches (pill shape) |
