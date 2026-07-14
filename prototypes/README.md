# Prototypes

Production on `main` hosts **two** surfaces:

| Surface | URL | Code |
|---------|-----|------|
| **Live app** (Storybook specs replica) | `/home` (alias `/app`) | `live-app/` |
| **Full Demo Walkthrough** | `/demo/*` (entry `/demo/demo.html` → `/demo/home`) | `home-redesign/` (demo build) |

Content modules still used by the demo: `in-session-ux/`, `research-assistant-chat/`, `monthly-report/`.

Also kept for workflow (not production routes): `starter/`, `templates/`, `storybook-ai-agent-llm-api/`.

## Local

```bash
npm run dev:live-app   # Storybook-spec product shell
npm run dev:demo       # Recording walkthrough (routes under /demo when built)
npm run dev:vite       # Root SPA → /home mounts live-app
```

## Ritual

Experiments stay on feature branches + Deploy Previews → Notion. Accepted UI folds into Specs + `live-app` routes; recording flows stay in the demo build.
