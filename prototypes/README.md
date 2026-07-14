# Prototypes

Production on `main` hosts **two** surfaces (same `home-redesign` codebase, two entry builds):

| Surface | URL (do not rename) | How to run |
|---------|---------------------|------------|
| **Live app** | `/home` (alias `/app`) | `npm run dev:app` |
| **Full Demo Walkthrough** | `/demo/demo.html` (id `1028`) | `npm run dev:demo` · build: `npm run build:demo` |

Content modules folded into that shell (not standalone Netlify routes):

- `in-session-ux/` — sessions + reflection
- `research-assistant-chat/` — research terminal / tutor admin
- `monthly-report/` — monthly reports list + detail

Also kept on `main` for workflow (not production routes):

- `starter/` · `templates/` — scaffolds for branch experiments
- `storybook-ai-agent-llm-api/` — Storybook helper

## Ritual

| Stage | Code | Hosting |
|-------|------|---------|
| Experiment | Feature branch · `prototypes/{slug}/` | Deploy Preview / standalone Netlify → Notion |
| Accepted | Specs in Storybook + wire into `home-redesign/` | Production live app / demo |
| On `main` | Only the two surfaces above | `plus-uno.netlify.app` |

Captures → Notion (or local `captures/`, gitignored). Do not merge one-off experiment folders onto `main`.

## Guidance

- Agent workflow: `AGENTS.md`
- Deploy: `skills/uno-publish/references/deployment-guide.md`
