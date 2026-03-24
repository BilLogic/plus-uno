---
title: "React Router v6 descendant Routes prefix-stripping and the contentKey pattern"
category: ui-bugs
date: 2026-03-23
tags: [react-router, routing, marketplace, prototype-shell, home-redesign]
modules: [src/App.jsx, playground/home-redesign/src/App.jsx]
severity: high
---

## Problem

Marketplace prototype cards (e.g. `/1008` → Monthly Reports) were all showing the homepage instead of their intended content. The home-redesign shell app has its own `<Routes>` with paths like `/monthly-reports`, `/admin`, etc. When embedded inside the main app's `<Route path="/monthly-reports/*">`, none of the shell's internal routes matched.

## Root Cause

**React Router v6 strips the parent route prefix from descendant `<Routes>`.** When a component is rendered inside `<Route path="/monthly-reports/*">`, any `<Routes>` inside that component sees the *remainder* after stripping `/monthly-reports` — which is just `/`. So the shell's `<Route path="monthly-reports">` never matches; only `<Route index>` fires, rendering `HomeContent` (the dashboard) for every prototype.

Key behaviors discovered:
- `MemoryRouter` nested inside `BrowserRouter` causes silent crashes in React 19 (empty root, no console errors)
- `Navigate` redirects from `/:prototypeId` to named paths work, but the destination route must exist at the top level
- Descendant `<Routes>` always matches relative to the parent route's matched prefix

## Solution

**Two-part fix:**

### 1. Top-level shell routes + redirect dispatcher (`src/App.jsx`)

```jsx
// Named shell paths defined BEFORE /:prototypeId (static > dynamic in RR6 ranking)
<Route path="/monthly-reports/*" element={<HomeRedesignApp contentKey="monthly-reports" />} />
<Route path="/admin/*" element={<HomeRedesignApp contentKey="admin" />} />
// ... etc for all shell paths

// Numeric IDs redirect to named paths
<Route path="/:prototypeId/*" element={<PrototypeRouterOrRedirect />} />
```

`PrototypeRouterOrRedirect` checks if the ID maps to a shell route and issues `<Navigate to={homeRoute} replace />`.

### 2. `contentKey` prop pattern (`playground/home-redesign/src/App.jsx`)

```jsx
const CONTENT_MAP = {
  'monthly-reports': MonthlyReportsListContent,
  'admin': TutorAdminContent,
  // ...
};

function App({ contentKey }) {
  const IndexContent = (contentKey && CONTENT_MAP[contentKey]) || HomeContent;
  return (
    <Routes>
      <Route element={<ShellLayout />}>
        <Route index element={<IndexContent />} />
        {/* Named routes still work for standalone/internal nav */}
        <Route path="monthly-reports" element={<MonthlyReportsListContent />} />
        ...
      </Route>
    </Routes>
  );
}
```

The `contentKey` prop tells the shell which content component to render at the `index` route — solving the prefix-stripping problem without fighting the framework.

## Prevention

- **Never nest Router providers** (MemoryRouter inside BrowserRouter) — React 19 fails silently
- When embedding a sub-app with its own `<Routes>`, always pass a `contentKey` or `initialView` prop — don't rely on URL matching across the boundary
- Use `<Navigate>` for ID-to-path redirects, with destination routes defined at the top level
- React Router v6 ranks static segments over dynamic — `/monthly-reports/*` always beats `/:prototypeId/*`
