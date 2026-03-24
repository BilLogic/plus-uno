# Template Selection Guide

## Starter Template

Use the starter template in `playground/starter/` as the base for all new prototypes.

### Steps

1. **Copy** the `playground/starter/` directory to `playground/{your-project-name}/`
2. **Rename** the project in `package.json` — update the `name` field
3. **Update** `vite.config.js` — change the `server.port` to an unused port (check existing configs to avoid collisions; starter defaults to 3020)
4. **Update** `index.html` — change the `<title>` to match your prototype
5. **Add** a dev script to the root `package.json`: `"dev:{project-name}": "vite --config playground/{project-name}/vite.config.js"`

### What the Starter Includes

| File | Purpose |
|------|---------|
| `index.html` | Entry HTML with DS stylesheet |
| `src/App.jsx` | Root component with DS import examples |
| `src/main.jsx` | React 19 entry point |
| `vite.config.js` | Aliases (`@` → design-system/src), SCSS config, ESM-safe `__dirname` |

### Alias Configuration

The starter's `vite.config.js` sets up these aliases:

- `@` → `../../design-system/src` (DS components and tokens)
- `@tutors.plus/design-system` → `../../design-system/src/index.js` (package-style import)
- `react` / `react-dom` → shared `node_modules` (avoids duplicate React instances)

### Port Allocation

Pick an unused port. Existing prototypes use ports in the 3000-3025 range. Check `playground/*/vite.config.js` for current allocations before choosing.
