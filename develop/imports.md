# Component Import Paths Reference

This guide provides the correct import paths for PLUS design system components based on where your prototype is located.

## Overview

When importing PLUS design system components, you must use the correct relative path based on your prototype's location. **Incorrect import paths cause component imports to fail.**

## Base Import Statement

All component imports use this base structure:

```javascript
import { PlusInterface, PlusSmartComponents } from "{relative-path}/design-system/components/index.js";
```

The `{relative-path}` changes based on where your prototype file is located.

## Import Paths by Location

### From `playground/templates/{pillar}/` Directory

If your prototype is in `playground/templates/login/`, `playground/templates/admin/`, etc.:

```javascript
import { PlusInterface, PlusSmartComponents } from "../../../design-system/components/index.js";
```

**Example locations:**
- `playground/templates/login/login.js`
- `playground/templates/admin/tutor-admin.js`
- `playground/templates/home/dashboard.js`

**Path breakdown:**
- `../` - Go up to `templates/`
- `../` - Go up to `playground/`
- `../` - Go up to project root
- `design-system/components/index.js` - Path to components

### From `playground/{name}/` Directory

If your prototype is in `playground/victor/`, `playground/bill/`, etc.:

```javascript
import { PlusInterface, PlusSmartComponents } from "../../design-system/components/index.js";
```

**Example locations:**
- `playground/victor/my-prototype/script.js`
- `playground/bill/test/script.js`

**Path breakdown:**
- `../` - Go up to `playground/`
- `../` - Go up to project root
- `design-system/components/index.js` - Path to components

### From Root `index.html` or `src/js/`

If your JavaScript is in the root or `src/js/`:

```javascript
// From root index.html
import { PlusInterface, PlusSmartComponents } from "./design-system/components/index.js";

// From src/js/main.js
import { PlusInterface, PlusSmartComponents } from "../../design-system/components/index.js";
```

## Quick Reference Table

| Prototype Location | Import Path |
|-------------------|-------------|
| `playground/templates/{pillar}/*.js` | `"../../../design-system/components/index.js"` |
| `playground/{name}/*.js` | `"../../design-system/components/index.js"` |
| `playground/{name}/{prototype}/*.js` | `"../../../design-system/components/index.js"` |
| `src/js/*.js` | `"../../design-system/components/index.js"` |
| Root `index.html` (inline script) | `"./design-system/components/index.js"` |

## HTML Script Tag Setup

### Using ES6 Modules

**ALWAYS include `type="module"`** in your script tag:

```html
<script type="module" src="login.js"></script>
```

### Inline Scripts

If using inline scripts in HTML:

```html
<script type="module">
    import { PlusInterface, PlusSmartComponents } from "../../design-system/components/index.js";
    
    // Your code here
</script>
```

## Common Import Patterns

### Importing Specific Components

You can import specific components if needed:

```javascript
import { createButton, createAlert } from "../../design-system/components/index.js";
```

### Using PlusInterface

```javascript
import { PlusInterface } from "../../design-system/components/index.js";

const button = PlusInterface.createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled"
});
```

## Verifying Import Paths

### Method 1: Count Directory Levels

1. Count how many directories deep your file is from the project root
2. Use that many `../` to go up to the root
3. Add `design-system/components/index.js`

**Example:**
- File: `playground/templates/login/login.js`
- Levels: 3 (`templates/` → `login/` → `playground/`)
- Path: `../../../design-system/components/index.js`

### Method 2: Visual Path

Visualize the path from your file to the component:

```
playground/
  └── templates/
      └── login/
          └── login.js  ← Your file
              └── ../  ← Go up to templates/
                  └── ../  ← Go up to playground/
                      └── ../  ← Go up to project root
                          └── design-system/
                              └── components/
                                  └── index.js  ← Target file
```

## Common Issues and Solutions

### Issue: "Cannot find module" Error

**Problem**: Import path is incorrect.

**Solution**:
- Count directory levels and verify path
- Check that path uses correct number of `../`
- Ensure `type="module"` is in script tag
- Verify file exists at `design-system/components/index.js`

### Issue: Import Works in One Location but Not Another

**Problem**: Relative paths change based on file location.

**Solution**:
- Use the correct path for each file location
- Don't copy-paste paths between different directory levels
- Reference this guide for correct paths

## See Also

- [Development Standards](standards.md) - Coding standards and best practices
- [Components Overview](../design-system/components/overview.md) - Component documentation

