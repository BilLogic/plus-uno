---
status: pending
priority: p2
issue_id: 002
tags: [code-review, security]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# email_send has no authorized-sender or recipient-domain restriction

## Problem
Any workspace member can ask the bot to email arbitrary external recipients from the org mailbox and self-confirm the ✅ (the gate checks requester identity, not authorization). Combined with prompt-injectable content composing bodies/recipients, this is an exfiltration channel. preflight.ts:157 and tools/send-email.ts validate address format only.

## Proposed solutions
1. (Recommended) `EMAIL_AUTHORIZED_USERS` (Slack IDs) + `EMAIL_ALLOWED_DOMAINS` vars; enforce in executeSendEmail before dispatch; clear ❌ message otherwise. Effort: Small.
2. Route all external email through a human: bot drafts, never sends. Effort: Small, removes the capability.

## Acceptance
- [ ] Non-allowlisted requester or non-allowlisted recipient domain → proposal rejected at execution with a plain explanation.
- [ ] AGENT.md / uno-publish bot face note the restriction.
