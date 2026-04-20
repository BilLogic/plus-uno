# Bryan's Starter Prototype

A blank playground project scaffolded with the PLUS design system.

- **Location**: `playground/starter/`
- **Port**: 3020 (default)

## Run locally

From the **project root**:

```bash
npx vite --config playground/starter/vite.config.js
```

Or from this folder:

```bash
npx vite
```

Then open **http://localhost:3020/** in your browser.

## Design System Access

All design system components are available via the `@` alias:

```jsx
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import PageLayout from '@/components/PageLayout';
```

Design tokens are available as CSS variables (`--color-primary`, `--size-section-gap-lg`, etc.).

## Creating New Prototypes

To start a new prototype, duplicate this `starter` folder and rename it:

```
playground/
├── starter/          ← this template
├── my-new-prototype/ ← copy starter, rename, and start building
└── ...
```

Update the `<title>` in `index.html` and the port in `vite.config.js` for each new project.
