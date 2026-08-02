# Bryan's Starter Prototype

A blank prototypes project scaffolded with the PLUS design system.

- **Location**: `prototypes/starter/`
- **Port**: 3020 (default)

## Run locally

From the **project root**:

```bash
npx vite --config prototypes/starter/vite.config.js
```

Or from this folder:

```bash
npx vite
```

Then open **http://localhost:3020/** in your browser.

## Design System Access

All design system components are available via the `@` alias:

```jsx
import { Button, Modal, Badge, Alert } from '@/components';
import { PageLayout } from '@/specs/Universal/Pages';
```

Design tokens are available as CSS variables (`--color-primary`, `--size-section-gap-lg`, etc.).

## Creating New Prototypes

To start a new prototype, duplicate this `starter` folder and rename it:

```
prototypes/
├── starter/          ← this template
├── my-new-prototype/ ← copy starter, rename, and start building
└── ...
```

Update the `<title>` in `index.html` and the port in `vite.config.js` for each new project.
