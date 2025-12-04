# Pattern: Modals & Feedback

**Context**: Overlays and notifications for user interaction.
**Layer**: 4 (Overlay)

## 1. Design Pattern (Intent)
**Vocabulary**:
*   **Modal**: A dialog box that blocks interaction with the rest of the page.
*   **Toast**: A temporary notification message.
*   **Alert**: A static feedback message.
*   **Popover/Tooltip**: Contextual help attached to an element.

**Usage Rules**:
*   **Modal**: Use for critical actions (e.g., "Delete", "Edit") or complex forms.
*   **Toast**: Use for non-critical updates (e.g., "Saved successfully").
*   **Alert**: Use for persistent errors or warnings.

## 2. Component API (Implementation)

### Dialogs
```javascript
// Modal
PlusInterface.createModal({
    title: "Confirm Action",
    body: "Are you sure?",
    primaryAction: { text: "Yes", onClick: () => {} },
    secondaryAction: { text: "Cancel", onClick: () => {} }
});
```

### Feedback
```javascript
// Alert
PlusInterface.createAlert({
    message: "Something happened.",
    type: "warning", // success, info, warning, error
    dismissible: true
});

// Toast
PlusInterface.createToast({
    message: "Updates saved.",
    duration: 3000
});

// Spinner
PlusInterface.createSpinner({
    size: "md", // sm, md, lg
    color: "primary"
});

// LoadingGif
PlusInterface.createLoadingGif({
    src: "assets/loading.gif"
});
```

### Contextual
```javascript
// Tooltip
PlusInterface.createTooltip({
    target: "#btn-id",
    text: "Help text",
    placement: "top"
});

// Popover
PlusInterface.createPopover({
    target: "#btn-id",
    title: "Info",
    content: "More details here.",
    placement: "right"
});
```

### Navigation Helpers
```javascript
// Breadcrumb
PlusInterface.createBreadcrumb({
    items: [
        { text: "Home", href: "/" },
        { text: "Page", active: true }
    ]
});

// DatePicker
PlusInterface.createDatePicker({
    label: "Select Date",
    onChange: (date) => {}
});
```

## 2. Design Tokens (Modals Layer)

### Spacing (Padding)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-modal-pad-sm)` | 10px | Compact modals / alerts |
| `var(--size-modal-pad-md)` | 16px | Standard modals (Default) |
| `var(--size-modal-pad-lg)` | 40px | Spacious / Content-rich |

### Radius
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-modal-radius-sm)` | 4px | Alerts / Tooltips |
| `var(--size-modal-radius-md)` | 6px | Standard modals (Default) |
| `var(--size-modal-radius-lg)` | 12px | Large dialogs |

### Elevation
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--elevation-light-3)` | Shadow 3 | Standard Modal |
| `var(--elevation-light-5)` | Shadow 5 | High priority Modal |
