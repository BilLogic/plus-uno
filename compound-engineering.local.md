---
review_agents:
  - compound-engineering:review:kieran-typescript-reviewer
  - compound-engineering:review:security-sentinel
  - compound-engineering:review:architecture-strategist
  - compound-engineering:review:code-simplicity-reviewer
---

# Review context

This repo is a design-agent harness: a Cloudflare Worker Slack bot (`agents/uno-bot/` — TypeScript, no framework), a markdown prompt-assembly harness (`AGENTS.md`, `agents/uno-bot/AGENT.md`, `skills/*/bot.md` + `skills/*/references/method.md`, `docs/conventions/*.md` — fetched from GitHub Raw at runtime by `src/agent/skills.ts`), and a React/Vite design system (`design-system/`). There is no Rails and no database migrations; the Supabase blueprint is read-only from the Worker.

Review priorities: correctness and safety of the proposal-confirmation gate (nothing irreversible without ✅), prompt-injection resistance, the free-tier Cloudflare subrequest budget (~50/request), dead code left behind by the v1→v2 thin-router migration, and consistency between the harness docs and what the code actually does.
