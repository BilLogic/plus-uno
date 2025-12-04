# Foundation: Project Map

**Context**: File structure and import paths.
**Layer**: Foundation

## 1. File Structure
```
plus-vibe-coding-starting-kit/
├── design-system/
│   ├── components/         # Source of Truth for Components (Flat List)
│   │   ├── index.js        # Main Export File
│   │   ├── Button/         # Component Folder
│   │   ├── Card/           # Component Folder
│   │   └── ...
│   ├── specs/              # Page Specifications & Templates
│   │   ├── Admin/
│   │   ├── Home/
│   │   └── ...
│   ├── styles/             # Source of Truth for Tokens
│   │   ├── colors.md
│   │   └── layout.md
│   └── assets/             # Images and Icons
├── develop/                # Documentation (You are here)
│   ├── workflows/          # Role-based guides
│   ├── patterns/           # Semantic Layer Packs
│   ├── foundations/        # Global Tokens
│   └── reference/          # Master Indices
├── playground/             # Prototyping Area
│   ├── templates/          # Standard Templates
│   └── {your-name}/        # Your Sandbox
└── index.html              # Main Entry Point
```

## 2. Standard Imports

### JavaScript
**ALWAYS** use the relative path to `design-system/components/index.js`.

| From Location | Import Path |
| :--- | :--- |
| `playground/{name}/` | `../../design-system/components/index.js` |
| `playground/templates/{pillar}/` | `../../../design-system/components/index.js` |
| `src/js/` | `../design-system/components/index.js` |
| Root `index.html` | `./design-system/components/index.js` |

**Example**:
```javascript
import { PlusInterface } from "../../design-system/components/index.js";
```

### CSS
**ALWAYS** include in `<head>`:
```html
<link rel="stylesheet" href="dist/css/main.css">
<!-- OR relative path -->
<link rel="stylesheet" href="../../dist/css/main.css">
```
