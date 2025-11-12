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
import { PlusInterface } from "./components/general_interface.js";
import { PlusSmartComponents } from "./components/plus_smart_components.js";
```

### Component Creation
```javascript
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

// SMART Status Icon
const statusIcon = PlusSmartComponents.createStatusIcon("complete");
```

## Available Components

### PlusInterface
- `createButton()` - Create buttons with various styles and fills
- `createCheckbox()` - Create checkboxes
- `createCheckboxGroup()` - Create checkbox groups
- `createTabPanel()` - Create tab panels
- `createAlert()` - Create alert messages
- `createToast()` - Create toast notifications

### PlusSmartComponents
- `createStatusIcon()` - Create status icons
- `createContentStatusTag()` - Create content status tags
- `createSuperCompPillDiv()` - Create competency area pills
- `getColorClassForCompetencyArea()` - Get color class for competency area

## Reference

- **Component Documentation**: `docs/COMPONENTS.md`
- **Token Reference**: `../guidelines/token-reference.md`
- **Terminology**: `../guidelines/terminology.md`
- **Coding Standards**: `../guidelines/coding-standards.md`

