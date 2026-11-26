---
review_agents:
  - compound-engineering:review:kieran-typescript-reviewer
  - compound-engineering:review:security-sentinel
  - compound-engineering:review:architecture-strategist
  - compound-engineering:review:code-simplicity-reviewer
---

# Review context

A design-agent harness: a Cloudflare Worker Slack bot (`agents/uno-bot/`, TypeScript), a markdown prompt harness baked into the Worker bundle by `agents/uno-bot/scripts/bundle-harness.mjs`, and a React/Vite design system (`design-system/`). No Rails, no migrations; the Supabase blueprint is read-only from the Worker.

Review priorities: the proposal-confirmation gate (nothing irreversible without ✅), prompt-injection resistance, the free-tier Cloudflare subrequest budget (~50/request), and consistency between the harness docs and what the code does.
