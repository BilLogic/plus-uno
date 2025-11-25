# PLUS Design System - Components

This folder contains documentation for the PLUS component library.

## Documentation

### `docs/COMPONENTS.md`
Complete component library documentation including:
- Component architecture and structure
- Component APIs and usage
- Code examples
- Component patterns

## Component Code Location

Component implementation code is located in:
- **JavaScript Components**: `design-system/components/local/`
- **CSS Components**: `design-system/components/` (component-based structure with `molecules/` and `atoms/` folders)

## Using Components

### Import Pattern
```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/local/index.js";
```

### Component Creation
```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/local/index.js";

// Button
const button = PlusInterface.createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default"
});

// Checkbox
const checkbox = PlusInterface.createCheckbox({
    label: "Option",
    name: "option",
    value: "value",
    id: "option-id"
});

// Alert
const alert = PlusInterface.createAlert({
    style: "primary",
    text: "Alert message",
    dismissable: true
});

// SMART Status Icon
const statusIcon = PlusSmartComponents.createStatusIcon("complete");
```

## Available Components

### PlusInterface
- `createButton()` - Create buttons with various styles and fills
- `createCheckbox()` - Create checkboxes
- `createCheckboxGroup()` - Create checkbox groups
- `createRadio()` - Create radio buttons
- `createSwitch()` - Create toggle switches
- `createAlert()` - Create alert messages
- `createBadge()` - Create badges
- `createChip()` - Create chips
- `createBreadcrumb()` - Create breadcrumbs
- `createDivider()` - Create dividers
- `createDropdown()` - Create dropdown menus
- `createCard()` - Create cards
- `createModal()` - Create modals
- `createNavigation()` - Create navigation components
- `createTextarea()` - Create textareas
- `createSelect()` - Create select dropdowns
- `createDatePicker()` - Create date pickers

### PlusSmartComponents
- `createStatusIcon()` - Create status icons
- `createContentStatusTag()` - Create content status tags
- `createSuperCompPillDiv()` - Create competency area pills

## Reference

- **Component Documentation**: `docs/COMPONENTS.md`
- **Token Reference**: `../guidelines/token-reference.md`
- **Terminology**: `../guidelines/terminology.md`
- **Coding Standards**: `../guidelines/coding-standards.md`

