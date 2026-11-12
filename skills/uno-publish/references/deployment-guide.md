---
embodiment: ide
summary: PLUS Uno production (plus-uno.netlify.app) ships
---

<!-- Load for: helping a designer deploy a prototype to Netlify -->

# Deployment Guide

PLUS Uno production (`plus-uno.netlify.app`) ships **Storybook** at `/storybook/` (site landing).

The old Vibe app (`/home`, `/app`) and Full Demo Walkthrough (`/demo`) are on the `archive/legacy-ds` branch; their URLs redirect to Storybook.

Individual experiments are **not** added to `main` as numeric routes. They ship as preview URLs and are cataloged in Notion.

## Stage 1 — Experiment on a branch (multiple URLs OK)

One designer can run several experiments at once:

| Option | URL shape | Best when |
|--------|-----------|-----------|
| **PR Deploy Preview** | `https://deploy-preview-{PR#}--plus-uno.netlify.app/{path}` | Review with the team |
| **Branch deploy** | `https://{branch}--plus-uno.netlify.app/{path}` | Long-lived branch without a PR |
| **Standalone Netlify site** | `https://{name}.netlify.app` | Isolated experiment; own Vite build |

Steps:

1. Work under `prototypes/{slug}/` on a feature branch (do not merge experiment-only apps to `main`).
2. Deploy via one of the options above.
3. Create/update a [Notion Marketplace](https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f) row → set **Deployment URL** to that preview.
4. Captures → Notion file/cover (preferred) or local `prototypes/{slug}/captures/` (gitignored).

## Stage 2 — Accepted → Storybook

1. Lift what it proves into the design system (a component, pattern or template) with its Storybook docs.
2. Update Notion **Deployment URL** to the Storybook deep link.
3. Remove the branch-only experiment folder from the PR when merging.

## Optional: standalone Netlify site

```bash
cd prototypes/{project}
npx vite build
npx netlify deploy --prod --dir dist   # designer-run; agents guide only
```

## Production build (`main`)

`npm run build:all` → the Storybook static build, the only thing `main` builds. Landing redirects `/` → `/storybook/`.
