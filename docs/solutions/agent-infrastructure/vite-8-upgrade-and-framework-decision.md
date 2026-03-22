---
title: "Vite 8 Upgrade and Framework Decision"
category: agent-infrastructure
date: 2026-03-22
tags:
  - vite
  - rolldown
  - next-js
  - framework-decision
module: build-tooling
symptom: "Should plus-one migrate to Next.js for production features?"
root_cause: "plus-one is a prototype builder, not a production app — Vite is the right tool"
---

# Vite 8 Upgrade and Framework Decision

## Problem

Considered migrating plus-one from Vite to Next.js for production features (auth, API routes, SSR, server components). Initial analysis incorrectly assessed plus-one as needing production capabilities.

## Decision

**Stay on Vite. Upgrade to Vite 8 (Rolldown-powered).**

plus-one is a **prototype builder and design system workspace**, not the production tutoring platform. Production concerns (auth, API routes, SSR, AI server-side calls) belong in a future separate app that consumes this design system.

### Why not Next.js

- No auth needed (internal team only)
- No API routes needed (mock data for prototypes)
- No SSR needed (no public SEO pages)
- No server-side AI calls needed (prototypes mock these)
- No 500-concurrent-user scaling needed

### When Next.js makes sense

If/when the team builds the **production PLUS platform**, it should be a separate Next.js app in a monorepo that consumes the shared design system. The hybrid approach:
- `apps/playground/` — Vite (fast prototyping, stays)
- `apps/platform/` — Next.js (production app, new)
- `packages/design-system/` — shared

### Vite 8 upgrade results

| Metric | Vite 6.4 | Vite 8.0 |
|--------|----------|----------|
| Dev startup | ~1.5s | 749ms |
| Prod build | ~5s | 1.96s |
| Bundler | esbuild (dev) + Rollup (prod) | Rolldown (both) |

### Migration notes

- `rollupOptions` → `rolldownOptions` (compat layer exists but deprecated)
- `manualChunks` function form deprecated → migrate to `codeSplitting` when stable
- `@vitejs/plugin-react` v6 uses Oxc instead of Babel
- Storybook 10 supports Vite 8 natively

## Prevention & Best Practices

- Before evaluating framework migrations, clarify what the project IS vs what the production app will be
- Design system workspaces and prototype builders have different needs than production apps
- Document framework decisions with rationale so future sessions don't re-litigate

## Files Modified

| File | Change |
|------|--------|
| `package.json` | vite ^8.0.1, @vitejs/plugin-react ^6.0.1 |
| `vite.config.js` | rollupOptions → rolldownOptions |
| `design-system/vite.config.js` | rollupOptions → rolldownOptions |
| `docs/foundations/tech-stack.md` | Version updated |
| `.agent/AGENT.md` | Version updated |
