<!-- Load for: setting up imports, resolving import paths, barrel exports, alias usage -->

# Import Conventions

Use repository-established imports:

- Public package usage:
  - `import '@/styles/main.scss'`
  - `import Button from '@/components/Button'`

- Internal source usage (inside repo):
  - Alias `@` maps to `design-system/src` in Storybook and DS Vite config.
  - Example: `import Alert from '@/components/Alert'`

- Export entry points:
  - `design-system/src/index.js`
  - `design-system/src/components/index.js`
  - `design-system/src/forms/index.js`

- Do not import from ad hoc legacy paths unless file history requires it.
- Prefer existing index exports over deep relative traversals.
