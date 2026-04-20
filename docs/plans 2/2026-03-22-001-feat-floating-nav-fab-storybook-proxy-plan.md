---
title: "feat: Floating navigation FAB + Storybook proxy on same port"
type: feat
status: active
date: 2026-03-22
---

# Floating Navigation FAB + Storybook Proxy

## Overview

Replace the current "Market" back button with a speed-dial FAB at bottom-left that expands on hover to show Storybook and Marketplace navigation. Also proxy Storybook through Vite so both run on port 3000.

## Problem

- The current `BackToMarket` button is a plain text button at bottom-right — easy to miss and single-purpose
- Storybook runs on a separate port (6006) — developers must remember to run it and navigate to a different URL
- No quick way to jump between Marketplace and Storybook from within prototypes

## Proposed Solution

### Part 1: Vite Proxy for Storybook

Add `server.proxy` to `vite.config.js` to forward `/storybook/*` to `localhost:6006`:

```js
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/storybook': {
      target: 'http://localhost:6006',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/storybook/, '')
    }
  }
}
```

- Dev only — requires `npm run storybook` running in parallel
- Remove the `StorybookInfo` placeholder route from `App.jsx`
- Update `.claude/launch.json` to start both servers

### Part 2: Floating Navigation FAB

**Component**: `NavFab` — replaces `BackToMarket` in `src/App.jsx`

**Behavior**:
1. **Collapsed** (default): 48px circular button at bottom-left with a compass/navigation icon
2. **Expanded** (on hover/focus): Two additional circular buttons animate upward with staggered spring animation
   - Top button: Storybook icon (`fa-solid fa-book-open`) → navigates to `/storybook`
   - Middle button: Marketplace icon (`fa-solid fa-store`) → navigates to `/`
3. Each expanded button wrapped in DS `Tooltip` (`placement="right"`) showing "Storybook" / "Marketplace"
4. **Hidden** on marketplace routes (`/`, `/market`, `/prototypes`)

**Design tokens** (following CompactReflectionBar pattern):
- Main FAB: `--color-primary` bg, `--color-on-primary` icon, 48px circle
- Action buttons: `--color-surface-container-high` bg, `--color-on-surface` icon, 40px circle
- Shadow: DS elevation token or `0 4px 16px rgba(0,0,0,0.12)`
- Radius: `--size-border-radius-radius-300` (full circle)
- Gap between buttons: `--size-element-gap-md` (10px)

**Animation** (framer-motion — already a dependency):
- Expand: `AnimatePresence` with staggered `motion.button` children
- Scale: `whileHover={{ scale: 1.08 }}`, `whileTap={{ scale: 0.95 }}`
- Enter: slide up + fade in with 50ms stagger between buttons
- Exit: reverse

**Accessibility**:
- Main FAB: `aria-label="Navigation menu"`, `aria-expanded={isOpen}`
- Action buttons: `aria-label="Open Storybook"` / `aria-label="Open Marketplace"`
- Keyboard: `Enter`/`Space` toggles expansion, `Tab` navigates between items, `Escape` collapses
- `role="menu"` on the expanded container, `role="menuitem"` on each action button

**DS components used**:
- `Tooltip` from `@/components/Tooltip` (for hover labels)
- `framer-motion` (for animations — already in vendor bundle)
- DS color tokens, spacing tokens, radius tokens (no hardcoded values)

**Not using DS Button** — a circular icon-only FAB is not a standard Button variant. The CompactReflectionBar precedent uses custom `motion.button` elements with DS tokens. This is the correct pattern for FABs.

## Files

| File | Action | Description |
|------|--------|-------------|
| `src/components/NavFab/NavFab.jsx` | Create | FAB component with expand/collapse |
| `src/components/NavFab/NavFab.scss` | Create | Styles using DS tokens |
| `src/App.jsx` | Modify | Replace `BackToMarket` with `NavFab`, remove `/storybook` info route |
| `src/App.scss` | Modify | Remove `.back-to-market` class |
| `vite.config.js` | Modify | Add `server.proxy` for Storybook |
| `.claude/launch.json` | Modify | Add note about running both servers |

## Acceptance Criteria

- [ ] FAB appears at bottom-left on all pages except `/`, `/market`, `/prototypes`
- [ ] Hover/focus expands to show Storybook + Marketplace buttons with tooltips
- [ ] Clicking Storybook button navigates to `/storybook` (proxied to port 6006)
- [ ] Clicking Marketplace button navigates to `/`
- [ ] Keyboard accessible: Tab, Enter/Space, Escape
- [ ] Uses DS Tooltip component for hover labels
- [ ] Uses framer-motion for animations (not CSS transitions)
- [ ] All visual values from DS tokens (no hardcoded colors/spacing)
- [ ] `/storybook` proxies to Storybook dev server when running
- [ ] FAB uses `aria-expanded`, `role="menu"`, `role="menuitem"`

## Alternative Considered

**Embedding Storybook as iframe**: Rejected — path conflicts with Vite app assets, requires `base` URL rewriting in Storybook config, poor UX (nested scroll, URL doesn't update). Proxy is simpler and gives a native browsing experience.

## Sources

- CompactReflectionBar pattern: `playground/in-session-ux/ReflectionAssistant/CompactReflectionBar.jsx`
- DS Tooltip: `design-system/src/components/Tooltip/Tooltip.jsx`
- PageLayout floatingContent slot: `design-system/src/specs/Universal/Pages/PageLayout/PageLayout.jsx:29`
- Current BackToMarket: `src/App.jsx:10-25`, `src/App.scss:1-6`
