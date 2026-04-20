---
title: "Demo frame CSS overflow — shell content pushed off-viewport by sidebar"
category: ui-bugs
date: 2026-03-23
tags: [css, layout, flexbox, overflow, demo-frame, PageLayout, shell]
modules: [src/index.css, design-system/src/components/PageLayout/PageLayout.jsx]
severity: medium
---

## Problem

When viewing prototypes inside the home-redesign shell (e.g. `/monthly-reports`, `/admin`), the main content area was pushed off the left edge of the viewport. DOM inspection showed `left: -85.5px` on the content header — the sidebar was overlapping instead of sharing space.

## Root Cause

Two compounding issues:

1. **Demo frame width mismatch**: `index.css` set `--demo-frame-width: 1200px` but the shell's internal layout assumed 1280px (sidebar 184px + content ~1000px + padding). The 80px shortfall caused content to overflow the frame's `overflow-x: hidden`.

2. **PageLayout missing overflow constraints**: The component version of PageLayout (`design-system/src/components/PageLayout/PageLayout.jsx`) was missing overflow properties that the spec version already had:
   - `.plus-page-content-wrapper` used `overflowY: 'auto'` but no `overflow-x` handling
   - `.plus-page-main` had no overflow at all — children could expand unbounded
   - Both used `flex: '1 0 0'` (no shrink) instead of `flex: '1 1 0'`

## Solution

### Fix 1: Demo frame width (`src/index.css`)
```css
:root {
  --demo-frame-width: 1280px;  /* was 1200px — must match shell's assumed layout */
  --demo-frame-height: 800px;
}
```

### Fix 2: PageLayout overflow (`PageLayout.jsx`)
```jsx
// Content wrapper: allow shrinking + contain overflow
<div className="plus-page-content-wrapper" style={{
  flex: '1 1 0',      // was '1 0 0' — now shrinks
  minHeight: 0,       // added — flex shrink needs this
  overflow: 'hidden',  // was 'overflowY: auto' — now clips both axes
  // ... rest unchanged
}}>
  <main className="plus-page-main" style={{
    flex: '1 1 0',      // was just flex: 1
    minHeight: 0,       // added
    overflow: 'auto',   // added — scrollable content area
    display: 'flex',    // added
    flexDirection: 'column',
    position: 'relative',
    // ... rest unchanged
  }}>
```

Key properties:
- `flex: '1 1 0'` + `minHeight: 0` on both wrapper and main — allows flex items to shrink below content size
- `overflow: 'hidden'` on wrapper — prevents content from expanding beyond flex allocation
- `overflow: 'auto'` on main — enables scrolling within the bounded area

## Prevention

- Demo frame dimensions (`--demo-frame-width`) must match the shell's assumed total width (sidebar + content + gaps)
- Any flex child that contains scrollable content needs `min-height: 0` and `min-width: 0` — without these, flex items default to `min-content` sizing and ignore `flex-shrink`
- When the spec version of a component differs from the component version, sync overflow/layout properties
