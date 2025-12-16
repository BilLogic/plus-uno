# Foundation: Project Map

**Context**: File structure and import paths.
**Layer**: Foundation

## 1. File Structure
```
plus-vibe-coding-starting-kit/
├── src/                    # SOURCE OF TRUTH (React App)
│   ├── components/         # Reusable React Components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   └── index.js
│   ├── pages/              # Page Layouts
│   │   ├── Home.jsx
│   │   └── ...
│   ├── css/                # Global Styles & Tokens
│   ├── App.jsx             # Root Component
│   └── main.jsx            # Entry Point
├── design-system/          # LEGACY (Reference Only)
│   ├── components/         # Old Vanilla JS Components
│   └── specs/              # Old Specs
├── develop/                # Documentation (You are here)
│   ├── workflows/          # Role-based guides
│   ├── patterns/           # Semantic Layer Packs
│   ├── foundations/        # Global Tokens
│   └── reference/          # Master Indices
└── index.html              # Main Entry Point
```

## 2. Standard Imports

### React Components
**ALWAYS** import from `src/components`.

```javascript
import { Button, Card } from '@/components'; // Alias configured in vite.config.js
// OR
import { Button } from '../components';
```

### CSS
**Imported in `src/main.jsx`**:
```javascript
import './css/main.scss';
```
