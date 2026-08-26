---
embodiment: ide
summary: Slack app config only ever widens — narrowing a scope costs a full uninstall, and PKCE forecloses scripted manifest writes (2026-08-06)
status: active
verified: 2026-08-26 (#172)
---

# ADR-024: Slack app configuration is a one-way door (2026-08-06)

**Decision.** Treat uno-bot's Slack app configuration as append-only. Ask for the
narrowest scope set that works at first install, because the only way to take one
back is to uninstall the app from the workspace and install it fresh. Manage the
manifest by hand in app settings and keep `agents/uno-bot/slack-app-manifest-commands.yaml`
as documented intent to diff against, because `oauth_config.pkce_enabled` is on and
that permanently disables the manifest write API. Verify what an app can do against
the **live token** — a grant is a third state no manifest tool can see.

**Why.** Both halves were measured on uno-bot on 2026-08-06 while narrowing the
bot token's search scopes, after three attempts that each assumed otherwise.

*Scopes.* App config governs what is **requested at consent**; an existing
installation keeps the grant it was already given. Removing two scopes took the
manifest from 38 to 36 while the live token stayed at 39, and a reinstall changed
nothing — the `xoxb-` string is stable across reinstalls, so there is no reissue to
carry a narrower set. The clincher: `search:read.mpim` is no longer offered to bots
by Slack at all, and the install still held it from an older grant. Inside app
settings the same trap repeats in miniature — a scope row's **Required** checkbox
makes a scope optional, not absent; only the trash icon removes it.

*PKCE.* Once `pkce_enabled` is true, `apps.manifest.update` and
`apps.manifest.validate` fail for that app forever. `apps.manifest.export` omits the
field, and `apps.manifest.validate` then rejects Slack's own export with
`cannot_disable_once_enabled`; sending the field explicitly fails identically, and
`slack manifest sync` fails because it validates first. The web manifest editor
still saves the identical YAML, so manifest edits are possible — they just cannot be
scripted.

The trade-off is real in both directions: config-as-code buys reviewable diffs and
CI drift detection, and PKCE buys a safer OAuth flow; we hold PKCE and give up the
write path, keeping `slack manifest info` / `slack manifest diff` as a read-only
drift report. On scopes, the trade is up-front conservatism against the cost of
narrowing later — and the cost of narrowing later is the whole install.

**Consequences.** The narrowing was performed: uninstall then fresh install dropped
the bot token from 39 scopes to 36, with `search:read.im`, `search:read.mpim` and
`search:read.private` gone — verified against the live token. A fresh install (unlike
a reinstall) mints a new `xoxb-`, so `SLACK_BOT_TOKEN` had to be replaced everywhere
it is stored. Every stored user token was revoked, and stale keys had to be deleted
by hand: in `agents/uno-bot/src/oauth/mcp-oauth.ts` the shared default key
(`slack_oauth_token`) is written only when empty, so re-consenting leaves a dead
value in place, and `agents/uno-bot/src/tools/slack-search.ts` takes the first viable
candidate without falling through — a revoked stored token makes search hard-error
rather than degrade to public-only.

The order that works, for anyone doing this again:

1. Uninstall, then install fresh.
2. Replace the bot token in the secret store immediately — the bot is mute until this lands.
3. Delete every stored user-token key, the per-user keys and the shared default both.
4. Have users re-consent.
5. Re-invite the bot to the channels it belonged to.
6. Verify against the live token.

Related: ADR-020 sets the requester-scoped visibility model this scope floor serves —
user tokens carry a person and answer "what can this human see?", so broad reads
belong on them and the bot rung stays a public-channel floor. The rule underneath
both: **if the correct answer depends on who is asking, the read runs on the asker's
token.** A bot token has one identity and one view shared by every request, and
search is the sharp case because it has no anchoring event to scope it.

— uno, Aug 2026 (recorded from the 2026-08-06 scope-narrowing lesson; the measurements are that session's)
