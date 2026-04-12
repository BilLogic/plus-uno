---
domain: ui-patterns
type: lesson
confidence: high
created: 2026-04-11
tags: [react-router, vite, marketplace, toolkit-ia]
---

## [2026-03-23] React Router v6 descendant routes strip parent prefix

- **Pattern**: Marketplace prototype cards (e.g. `/1008` for Monthly Reports) all showed the homepage instead of intended content. The home-redesign shell has its own `<Routes>` with paths like `/monthly-reports`. When embedded inside `<Route path="/monthly-reports/*">`, descendant `<Routes>` sees only the remainder after stripping the prefix -- which is just `/`. So only `<Route index>` fires, always rendering HomeContent. Also discovered: `MemoryRouter` nested inside `BrowserRouter` causes silent crashes in React 19 (empty root, no console errors).
- **Fix**: Two-part solution: (1) Define named shell paths at the top level (`/monthly-reports/*`, `/admin/*`, etc.) before `/:prototypeId/*` (React Router v6 ranks static segments over dynamic). (2) Pass a `contentKey` prop to the shell app so it knows which content component to render at the `index` route, solving the prefix-stripping problem without fighting the framework. Never nest Router providers.
- **Source**: _archive/solutions/ui-bugs/2026-03-23-react-router-v6-descendant-routes-prefix-stripping.md

## [2026-03-22] Vite over Next.js for prototype builders

- **Pattern**: Considered migrating plus-uno from Vite to Next.js for production features (auth, API routes, SSR, server components). Initial analysis incorrectly assessed plus-uno as needing production capabilities.
- **Fix**: Stayed on Vite, upgraded to Vite 8 (Rolldown-powered). plus-uno is a prototype builder and design system workspace, not the production tutoring platform. No auth, no API routes, no SSR, no server-side AI calls needed. When the team builds the production PLUS platform, it should be a separate Next.js app in a monorepo that consumes the shared design system. Vite 8 results: dev startup 749ms (was ~1.5s), prod build 1.96s (was ~5s). Migration notes: `rollupOptions` becomes `rolldownOptions`, `@vitejs/plugin-react` v6 uses Oxc instead of Babel.
- **Source**: _archive/solutions/agent-infrastructure/vite-8-upgrade-and-framework-decision.md

## [2026-03-22] Marketplace architecture: full-page grid with dynamic routing

- **Pattern**: The workspace needed a way to navigate between 25 prototypes, Storybook, and various tools. Multiple approaches failed: proxy lost assets, direct port links lost context, shell backgrounding broke on macOS sandbox.
- **Fix**: Built full-page marketplace with grid + list view toggle, search, stage/pillar/creator filters. Every prototype accessible at `/{4-digit-id}`. Embedded prototypes (home-redesign shell) route to correct sub-page via contentKey pattern. Standalone prototypes show info page with run command. Invalid IDs redirect to marketplace. NavFab at bottom-right provides navigation between marketplace and Storybook (tonal primary style, hover-to-expand, tooltips on left).
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## [2026-03-17] Toolkit IA direction: sidebar tree with spawned sub-tabs

- **Pattern**: Toolkit section had a monolithic Sessions page combining session management, student tracking, attendance, engagement, and reflection. Tutors could not keep multiple sessions open, access a cross-session student roster, or review past reflections. Sidebar was flat and static with 3+ parallel maps requiring code changes for every navigation update.
- **Fix**: Designed three accordion-style categories (Sessions, Students, Reflections) with spawned dismissible sub-items. Key decisions: sub-tabs auto-clear on browser session end (sessionStorage), max depth = 2, real URLs (`/sessions/:id`), overflow with `...` indicator, accordion headers are dual-purpose (text navigates, chevron toggles). Includes declarative route manifest replacing 3 parallel maps, `useSubTabs` hook with sessionStorage backing, and `SubTabContext` provider.
- **Source**: _archive/ideation/2026-03-17-toolkit-ia-revision-ideation.md
