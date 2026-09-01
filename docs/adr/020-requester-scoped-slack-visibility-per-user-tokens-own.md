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

## Slack Canvas extension (2026-09-01)

**Decision.** uno-bot may read a Slack Canvas with its workspace bot token only when a user has shared that Canvas into the Slack conversation the request came from. A share is a Canvas permalink in a user message or a Canvas file attached to a user message in that same thread or DM. The Worker derives an exact file-id allowlist from the current message and that conversation's history; `source_read` rejects a Canvas outside the allowlist before calling Slack. Bot-authored links, model-supplied tool arguments, and links from another conversation grant no access.

**Why.** The bot token's workspace visibility is broader than the conversational authority behind a request. Treating the user's act of sharing as a conversation-scoped capability lets the bot read the intended Canvas without turning general bot access into ambient retrieval authority. This follows ADR-020's existing rule: the credential establishes technical reach, while the originating Slack surface establishes where that reach may be exercised.

**Consequences.** Conversation history stores Canvas file ids, never Canvas content. `source_read` uses the bot token only after the target id matches the originating conversation's allowlist. A Canvas shared in one thread, channel, or DM must be shared again before another conversation can read it. If the relevant message has fallen outside the available conversation history, access fails closed and the user shares the Canvas again.
