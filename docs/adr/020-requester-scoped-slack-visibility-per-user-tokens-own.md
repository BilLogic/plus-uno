---
embodiment: ide
summary: Requester-scoped Slack visibility — per-user tokens, own DMs readable in own bot DM (2026-07-16)
status: active
verified: 2026-08-24 (#171)
---

# ADR-020: Requester-scoped Slack visibility — per-user tokens, own DMs readable in own bot DM (2026-07-16)

**Decision.** Each user can connect their own Slack history at `/oauth/slack/start`; tokens are stored per Slack user id (`slack_oauth_token:user:{U…}`, identity taken from `authed_user.id` at consent). When a connected user asks uno-bot something **in their own DM with the bot**, `slack_search` runs on THEIR token and passes through their full personal visibility — their DMs, group DMs, private channels. Outside their bot DM, or for users who haven't connected, the legacy single-token + hard firewall behavior stands unchanged (public + allowlisted private only; DMs always dropped). The legacy workspace slot is bootstrapped by the first-ever consent and never overwritten by later ones.

**Why.** (Bill, 2026-07-16, "full own-visibility"): the bot should be able to reason over conversations the requester participates in. Slack's token model enforces the participation requirement by physics — a user token can only see its owner's conversations — so per-requester tokens are the only mechanism that grants DM access without over-granting. The own-DM surface gate keeps DM-derived content out of shared spaces structurally; AGENT.md adds the matching discretion rule (requester-own results answer that requester in that DM only). Equivalent trust model to the requester pasting their own conversation; team should be told other participants' messages become bot-readable to their counterpart's requests.

**Consequences.** mcp-oauth gains identity-keyed token slots (+ keyed refresh); oauth/slack extracts and shape-validates `authed_user.id`; `getSlackAccessTokenFor(env, userId)` prefers the requester's own token; slack_search takes SlackContext, gates own-visibility on the D-channel surface, reports `visibility` and a consent-link `note`; AGENT.md + tool description updated. Follow-up (todo 019): extend `slack_thread_read` to the requester's token for reading their own DM threads by permalink.
