---
title: "Marketplace + Storybook Navigation Architecture"
category: agent-infrastructure
date: 2026-03-22
tags:
  - marketplace
  - storybook
  - navigation
  - fab
  - routing
  - vite-proxy
  - iframe
  - concurrently
module: app-shell
symptom: "Need unified navigation between Marketplace, Storybook, and all prototype listings on a single port"
root_cause: "Multiple iterations needed to find the right architecture — proxy, direct links, and iframe each have tradeoffs"
---

# Marketplace + Storybook Navigation Architecture

## Problem

The plus-uno workspace has two main surfaces (Marketplace + Storybook) and 25 prototype listings. Users needed seamless navigation between all of them. Multiple approaches were tried before landing on the right architecture.

## Approaches Tried and Why They Failed

### 1. Vite Proxy (`/storybook` → `localhost:6006`)
**What**: Proxy `/storybook/*` requests to Storybook's dev server.
**Failed because**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which don't go through the `/storybook` prefix proxy. Also causes `ECONNREFUSED` terminal spam when Storybook starts slower than Vite.

### 2. Direct Port Links (`localhost:6006`)
**What**: FAB links directly to Storybook's port.
**Failed because**: Different origins mean navigation opens new tabs or loses context. User wanted unified experience.

### 3. Shell Backgrounding (`npm run storybook & vite`)
**What**: Use `&` in npm scripts to run both.
**Failed because**: macOS sandbox causes `getcwd: cannot access parent directories: Operation not permitted` errors.

## Working Solution

### Architecture
```
localhost:4100/           → Marketplace (Vite SPA)
localhost:4100/storybook  → Storybook (iframe embedding localhost:4200)
localhost:4100/{id}       → Prototype by 4-digit numeric ID
localhost:4200            → Storybook (internal, not user-facing)
```

### Key Components

**1. `concurrently` for parallel dev servers**
```json
"dev": "concurrently --names market,storybook --prefix-colors blue,magenta \"vite --port 4100\" \"npm run storybook\""
```
- Proper process management (no shell `&` backgrounding)
- Color-coded terminal output
- Both servers start/stop together

**2. Iframe embedding for Storybook**
```jsx
// src/App.jsx
function StorybookEmbed() {
  return <iframe src="http://localhost:4200" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', border: 'none' }} />;
}
<Route path="/storybook" element={<StorybookEmbed />} />
```
- Full-screen iframe gives native Storybook UX
- URL bar shows `localhost:4100/storybook` (unified)
- No asset path issues (Storybook runs on its own origin internally)

**3. NavFab for navigation**
- Tonal primary button (`--color-primary-container` / `#61b5cf`)
- Bottom-right, hover-to-expand, items appear above trigger (`column-reverse`)
- Marketplace FAB: React component (`src/components/NavFab/`)
- Storybook FAB: Injected via `manager-head.html` with matching hardcoded colors
- `width: fit-content !important` needed to override `#root > * { width: 100% }`

**4. Dynamic prototype routing**
```jsx
// Map 4-digit IDs to HomeRedesign shell sub-routes
const HOME_SHELL_ROUTES = {
  '1001': '/home',        // Redesigned Homepage
  '1002': '/admin',       // Tutor Admin
  '1003': '/sessions',    // Sessions
  ...
};

<Route path="/:prototypeId/*" element={<PrototypeRouter />} />
```
- Every marketplace listing accessible at `/{4-digit-id}`
- Embedded prototypes route to correct sub-page
- Standalone prototypes show info page with run command
- Invalid IDs redirect to marketplace

### Port Assignment
| Port | Service | Accessed via |
|------|---------|-------------|
| 4100 | Vite (Marketplace + Router) | `localhost:4100/*` |
| 4200 | Storybook (internal) | `localhost:4100/storybook` (iframe) |

Uncommon ports (4100/4200) chosen to avoid conflicts with common dev servers (3000, 5173, 8080).

## Gotchas Discovered

1. **Storybook proxy doesn't work under subpath** — assets at `/sb-manager/` bypass the proxy
2. **`position: fixed` width bug** — `#root > * { width: 100% }` stretches fixed elements; need `width: fit-content !important`
3. **DS Tooltip hide delay** — 400ms delay causes lag on FAB mouse leave; removed Tooltip from trigger
4. **`--color-primary-state-08` is 8% opacity** — too transparent for elevated FAB; use `--color-primary-container` (solid) instead
5. **Storybook FAB needs hardcoded colors** — manager-head.html doesn't have DS CSS vars; use exact computed values (`#61b5cf`, `#001e2e`)
6. **FA CDN matters** — `cdnjs.cloudflare.com` has wrong path for FA 7; use `cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0`
7. **`concurrently` over shell `&`** — macOS sandbox breaks shell backgrounding in npm scripts

## Prevention & Best Practices

- **Proxy Storybook? Use iframe instead.** Storybook's asset loading is incompatible with subpath proxying.
- **Always use `concurrently`** for parallel npm scripts on macOS — never use `&`.
- **Match FAB colors exactly** between React and injected HTML by inspecting computed values, not guessing token names.
- **Use uncommon ports** (4100+) to avoid conflicts.
- **4-digit numeric IDs** for prototype listings — not slugs, not names.

## Files Created/Modified

| File | Change |
|------|--------|
| `src/components/NavFab/NavFab.jsx` | Created — speed-dial FAB component |
| `src/components/NavFab/NavFab.scss` | Created — tonal primary styling |
| `src/App.jsx` | Dynamic `/:prototypeId/*` routing, StorybookEmbed, removed BackToMarket |
| `src/pages/PrototypeMarket/prototypes-data.js` | All IDs → 4-digit numbers, all localPaths → `/{id}` |
| `src/pages/PrototypeMarket/PrototypeMarket.jsx` | Added Creator filter |
| `src/pages/PrototypeMarket/PrototypeCard.scss` | Card layout fixes (min-height, margin-top auto) |
| `src/pages/PrototypeMarket/PrototypeMarket.scss` | Empty state icon fix |
| `.storybook/manager-head.html` | FAB injection for Storybook, FA CDN fix |
| `.storybook/main.js` | esbuildOptions → rolldownOptions for Vite 8 |
| `vite.config.js` | Port 4100, rolldownOptions, proxy removed |
| `package.json` | concurrently, Vite 8, plugin-react 6, port updates |
| `.claude/launch.json` | Unified "dev" config |
