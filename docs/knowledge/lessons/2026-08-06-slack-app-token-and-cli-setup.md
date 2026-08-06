<!-- Tier: 2 -->
---
domain: integration
type: lesson
confidence: high
created: 2026-08-06
tags: [slack, oauth, scopes, slack-cli, bot-design, security]
---

## [2026-08-06] Slack bot design: which token reads what, and how to wire the CLI

Written while narrowing uno-bot's bot-token search scopes. Two halves: the
token rule (portable to any bot) and the CLI setup (portable to any app).

---

### Part 1 — The token rule

**If the correct answer depends on who is asking, it must not run on a bot token.**

A bot token has one identity and one view, shared by every request. Slack answers
"what is the app a member of?", never "who wants to know?". Your code sees the
requester; the token does not. That is the textbook **confused deputy** — a
privileged component acting for a less-privileged caller using its own authority.

A user token carries a person. Slack answers "what can this human see?" and
enforces it server-side. Wrong-audience results are never returned, so the
boundary does not depend on your filter code being correct.

**Search is the sharp case.** Most bot reads are anchored — an event handler reads
the channel the event came from, which the user was already in. Search has no
anchor: it sweeps everything the token reaches, unrelated to the requester.

Two Slack-specific traps:

- **Bot membership is not intended audience.** The bot is a member of every DM
  anyone has with it. `search:read.im` on a bot token = one index over every
  private conversation every employee has had with the app, surfaceable anywhere.
- **Invitation becomes privilege grant.** `search:read.private` turns "invite the
  bot to a private channel" into "grant workspace-wide read of it". A channel
  member escalates with no admin involved, and any env-var allowlist is repealed.

**Recommended split — bot tokens write, user tokens read broadly:**

| Capability | Token |
|---|---|
| Post, reply, react, upload, set topic | bot |
| Read the conversation an event came from | bot |
| Slash commands, mentions, Home tab | bot |
| Search across conversations | **user** |
| Broad history reads not tied to an event | **user** |
| Reading DMs / private channels for retrieval | **user** |
| Admin actions | separate admin token, never the bot |

**Corollary — "user token" must mean the *requesting* user's token.** A single
shared user token is the same confused deputy in different clothes: it sees
everything its owner sees and answers for people who cannot. Per-user OAuth is
what makes the rule real.

**Verify the grant, not the manifest.** The manifest is a *request*; the install
is the *grant*. They drift. uno-bot's manifest dropped three bot search scopes in
commit `43ca43a1`, and the live token still carried all three weeks later,
because a manifest edit does not change an existing install. Build a debug
endpoint that reports the live token's scopes and check that, not the YAML.

Related: Slack has already removed `search:read.mpim` from the bot menu — it is
no longer grantable to a bot at all. A token can still carry it from an older
install. Slack agrees with this rule; their UI enforces part of it.

**When a bot token must do a read, deny by default.** Positively test each result
against an explicit allowlist. Do not test for "is this private?" — if the field
is absent the test reads as "not private" and the filter fails open while still
looking alive.

---

### Part 2 — Wiring a web-created app to the Slack CLI

The CLI only manages apps it knows about. An app created at api.slack.com is
invisible to it until linked, and `slack manifest info` returns
`installation_required` before that.

**Multiple workspaces coexist.** `slack login` adds an auth, it does not replace
one. Select per command with `--team <TEAM_ID>`; `slack auth list` shows all.

Steps, from a directory that is a Slack project (needs `.slack/hooks.json`):

```bash
# 1. Authenticate to the workspace (repeat per workspace; they stack)
slack login --no-prompt          # prints /slackauthticket <ticket>
# paste that slash command in any channel of the TARGET workspace,
# approve the modal, then:
slack login --challenge <code> --ticket <ticket>

# 2. Make the directory a Slack project, if it is not one
mkdir -p .slack && printf '{"hooks":{}}' > .slack/hooks.json

# 3. Link the existing app — INTERACTIVE, needs a real TTY
slack app link --environment deployed --team <TEAM_ID>
#   prompts for the App ID (e.g. A0APS0L8HJR)

# 4. Now these work
slack app list --team <TEAM_ID>
slack manifest info --team <TEAM_ID> --app <APP_ID>
```

**Gotchas paid for in full:**

- `slack app link` cannot be scripted. Piped stdin fails with
  `The input device is not a TTY`; wrapping in `script -q /dev/null` gives it a
  pty but it still hangs on the prompt. Run it by hand.
- Hand-writing `.slack/apps.json` does **not** substitute for linking —
  `slack app list` still reports "no apps".
- Do **not** run `slack install` to escape `installation_required` unless the
  manifest source is deliberately remote. With a local/project manifest source it
  can overwrite the live app config with whatever is in the directory.
- Set `"manifest": {"source": "remote"}` in `.slack/config.json` when the app is
  managed in the web UI and the CLI should only read it.
- The CLI's config tokens live in `~/.slack/credentials.json`.

**What the CLI is and is not good for here.** It reads the *requested* manifest.
For the *granted* scopes — the thing that actually matters — a debug endpoint
hitting `auth.test` against the live token is more direct and needs no linking.

### ⚠️ PKCE permanently disables manifest-API writes

If `oauth_config.pkce_enabled` is ever set true, **`apps.manifest.update` and
`apps.manifest.validate` stop working for that app, permanently.** Verified on
uno-bot (2026-08-06):

- `apps.manifest.export` omits `pkce_enabled` from its output.
- `apps.manifest.validate` then rejects that same exported manifest with
  `cannot_disable_once_enabled` at `/oauth_config/pkce_enabled` — Slack's own
  export fails Slack's own validator.
- Sending `pkce_enabled: true` explicitly fails identically. So does adding
  `_metadata.major_version`. There is no payload that passes.
- `slack manifest sync` therefore fails too, since it validates before updating.

Consequences for bot design:

- **Enabling PKCE is a one-way door for config-as-code.** After it, all manifest
  changes are UI-only. Decide up front whether scripted manifest management
  matters more than PKCE on the OAuth flow.
- **The web manifest editor still works.** Only the API path is broken: pasting
  the identical YAML into the App Manifest page saves without complaint
  (verified 2026-08-06). Whatever the editor posts to does not run the same
  validation, so "manifest edits are impossible" is too strong — the correct
  claim is that they cannot be *scripted*.
- The CLI remains useful read-only: `slack manifest info` and `slack manifest diff`
  both work and give a precise, machine-readable drift report against the repo.
- Keep the repo YAML as documented intent and diff against it in CI; just do not
  expect to push from it.

### ⚠️ Removing a scope does NOT revoke it from an existing install

Verified end to end on uno-bot (2026-08-06), after three failed attempts that
each assumed otherwise:

| surface | before | after removal + reinstall |
|---|---|---|
| app config / manifest | 38 bot scopes | **36** — the two scopes gone |
| live installed token | 39 | **39 — unchanged** |

App config governs what is **requested at consent**. An existing installation
keeps the grant it was already given. Reinstalling re-consents against the
current config but does **not subtract** what was previously granted, and the
bot token string does not change across a reinstall, so there is no reissue to
carry a narrower set.

The clincher: `search:read.mpim` is no longer offered to bots by Slack at all,
yet the install still holds it from an older grant.

Two traps inside the app-settings UI that cost time here:

- Each scope row has a **Required Yes/No checkbox** *and* a **🗑 trash icon**.
  Unchecking Required makes the scope **optional**, not absent — Slack's own
  copy says optional-status changes "apply immediately … as long as the scopes
  are already approved", i.e. it stays granted. Only the trash icon removes it.
- The manifest editor writes through `apps.manifest.validate`, so for a PKCE app
  it silently refuses. Use the scope table, not the manifest view.

**The only way to actually revoke: uninstall the app from the workspace, then
install fresh.** That is expensive and rarely worth it — uninstalling
invalidates *every* token for the app in that workspace, including stored user
(`xoxp-`) tokens, so every per-user OAuth consent must be redone.

Design consequence, and the real lesson: **treat scope grants as one-way.** Be
conservative at first install, because narrowing later costs a full reinstall
cycle for every user. An over-granted scope is not something you can quietly
clean up afterwards.

### The uninstall was performed — what it actually cost

Done on uno-bot the same day. It works, and the price is exactly as predicted.

**What worked.** The bot token dropped from 39 scopes to **36**, with
`search:read.im`, `search:read.mpim`, and `search:read.private` all gone,
verified against the live token. Nothing short of this moved it.

**A fresh install DOES issue a new bot token.** Worth stating plainly, because a
*reinstall* does not — the `xoxb-` string is stable across reinstalls, which is
what makes reinstall useless for narrowing. Uninstall + install is a different
operation and mints a new token, so `SLACK_BOT_TOKEN` must be updated wherever
it is stored.

**What broke, and did not self-heal:**

- Every stored user token was revoked. `auth.test` returns `token_revoked`.
- **Stale tokens must be deleted from storage by hand.** In `mcp-oauth.ts` the
  shared/default key (`slack_oauth_token`) is only written when it is *empty*,
  so re-consenting does not overwrite a dead value. It sits there, still sorting
  ahead of the bot rung, poisoning every request.
- **The credential chain has no fallthrough.** `slack-search.ts` picks the first
  viable candidate and a failed pass returns `ok:false` — it does not retry the
  next credential. So a revoked stored token means search **hard-errors** rather
  than degrading to public-only. Deleting the dead keys restores graceful
  degradation; that is the difference between "search is narrower" and "search
  is down".

Runbook for anyone doing this again, in order:

1. Uninstall, then install fresh.
2. Update the bot token in the secret store immediately — the bot is mute until
   this lands.
3. Delete every stored user-token key (both the per-user keys and the shared
   default). Do not assume re-consent overwrites them.
4. Have users re-consent.
5. Re-invite the bot to channels it was a member of.
6. Verify against the **live token**, not the manifest.

Workflow that does work for a PKCE app: `slack manifest diff` to see drift →
make the change by hand in app settings → reinstall → verify against the *live
token*, not the manifest.

---

### Applied to uno-bot (state at time of writing)

- Per-user OAuth **is** implemented: `slackSearchCredentials()` in
  `src/slack/search-credential.ts` returns an ordered chain
  `own → legacy → bot`, and `own` is the requester's consented token.
- The residual gap is the **`legacy` middle rung** — a single shared workspace
  token used for any requester who has not consented, and the fallback the
  chain lands on most of the time today.
- The `bot` rung is the floor and should reach public channels only. That is
  what the scope narrowing is for.
- ADR-020's surface gate governs when `own` visibility may activate at all.
