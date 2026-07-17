---
status: pending
priority: p3
issue_id: 017
tags: [code-review, agent-native, quality]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (assistant panel + App Home diff)
---

# Hoist the user-visible capability story into one module the agent can also see

## Problem
The capability pitch now lives in three hand-written copies: HOME_VIEW (home.ts), WELCOME (assistant.ts), and AGENT.md § "I do". The 2026-07-16 review fixed the two live divergences (handoff-target list; "anything waits for ✅" vs the ungated-Slack-writes carve-out) and de-duplicated the four starter prompts (home.ts now imports SUGGESTED_PROMPTS), but the prose bullets remain copies and the agent cannot introspect what its own Home tab / welcome message says.

## Proposed solution
`src/slack/capabilities.ts` exporting the capability bullets + handoff-target list, consumed by home.ts and assistant.ts; add a short "user-visible surfaces" note to AGENT.md so the model knows the Home tab / welcome / chips exist and what they claim. Also consider `buildHomeView(env)` deriving the repo button URL from `env.GITHUB_REPO` instead of the hardcoded literal.

## Acceptance
- [ ] One source for capability copy; agent prompt mentions the surfaces; no hardcoded repo URL; tsc clean
