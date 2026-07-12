---
status: pending
priority: p3
issue_id: 009
tags: [code-review, architecture]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Slim events.ts (974 lines): extract modules + 4 mechanical helpers

## Scope (all behavior-preserving)
1. Extract slack/vision.ts (601-738), slack/proposal-render.ts (formatProposal/renderParamsForHumans/buildImplementDesignProposal), slack/delivery.ts (capText/postTextVerified).
2. recordExchange() helper for the 6 duplicated appendHistory pairs.
3. conversationsReplies → call slackGet (api.ts:170-193 reimplements it).
4. Single CONFIRM_PHRASES/CANCEL_PHRASES source; derive the events.ts fast-path AND anthropic-client.ts routing regex from it (they already disagree: lgtm/ship-it vs nope).
5. Reaction-job enqueue failure should post the same visible warning message-jobs get (events.ts:151-160) — silent drop of a ✅ otherwise.
6. Move executeSlackReact out of run-agent.ts to tools/; SlackContext to types.

## Acceptance
- [ ] tsc clean; no behavior change; events.ts under ~500 lines.

## Work log — 2026-07-12
DONE (behavioral / de-duplication):
- Item 3: conversationsReplies now delegates to slackGet.
- Item 4: CONFIRM_PHRASES/CANCEL_PHRASES centralized in agent/loop-shared.ts; both
  the events.ts fast-path (bareResolution) and anthropic-client routing
  (looksLikeResolution) derive from the one vocabulary — the lgtm/nope divergence is gone.
- Item 5: reaction-job enqueue failure now posts the same visible warning message
  jobs get (was a silent ✅/❌ drop).
- Item 6 (partial): executeSlackReact moved out of run-agent.ts into agent/loop-shared.ts.

DEFERRED (pure reorganization, no behavior change — not worth the churn/risk on the
970-line file right now):
- Item 1: extracting slack/vision.ts, slack/proposal-render.ts, slack/delivery.ts.
- Item 2: recordExchange() helper for the 6 appendHistory pairs.
- Item 6 (remainder): moving SlackContext from tools/dispatcher.ts to types.ts.
Left as a follow-up; reopen if events.ts grows further.
