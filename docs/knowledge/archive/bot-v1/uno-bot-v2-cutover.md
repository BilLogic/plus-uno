> **CLOSED 2026-07-08.** Cutover confirmed by evidence — outcome recorded in **ADR-014**
> (`docs/knowledge/decisions.md`); eval rounds 1–3 ran through Slack against the Worker.
> One follow-up remains for a Slack-app admin: retire the v1 Pipedream workflow (out of the
> serving path either way). Note: the "#figma-sync" channel named below is actually `#uno-bot`
> (`C0ARJ2A3A69`) — see `docs/conventions/slack.md`. Kept as a historical checklist.

# uno-bot v2 → #figma-sync cutover checklist

Replace the v1 bot (Pipedream) with v2 (Cloudflare Worker) in **#figma-sync**, as a
single bot named **"PLUS UNO Bot"**. This is a Slack-app / config task — **no code
changes are required**; the Worker is deployed and reads everything from `main`.

---

## Where things stand before cutover

| Piece | Today |
|-------|-------|
| **v2 Worker** | Deployed (`name = uno-bot`). Listens at `POST /slack/events`. Currently wired to the **staging** Slack app (display name **"uno-bot-staging"**), living in the **uno-bot sandbox** channel. |
| **Skills + AGENTS.md** | Fetched from **`main`** (`SKILLS_BASE_URL`). ✅ production-independent. |
| **GitHub Actions** (codegen → PR → result message) | Use the `SLACK_BOT_TOKEN` repo secret = the **production "PLUS UNO Bot"** app's token. |
| **v1 (Pipedream)** | Still live in **#figma-sync**; receives Slack events from the **production "PLUS UNO Bot"** app's Event Subscriptions. |
| **Polling cron** (`figma-library-poll.yml`) | Creates the Notion PRD + posts the notification. **Unchanged** — both v1 and v2 depend on it. Leave it on. |

So there are **two Slack apps**: the **staging** app (Worker) and the **production "PLUS UNO Bot"** app (Actions + v1). The cutover collapses these to **one**.

> **The golden rule:** v1 and v2 must **not** both receive events at the same time, or you get double replies and **double implements → double PRs**. The swap is atomic.

---

## Pick ONE path

### Path A — Consolidate on the existing "PLUS UNO Bot" app *(recommended)*
Best if you can access the production app's credentials. No rename, and it's already in #figma-sync.

1. **Point the Worker at the production app** (Cloudflare):
   ```
   cd uno-bot
   npx wrangler secret put SLACK_BOT_TOKEN        # paste production app's xoxb-… token
   npx wrangler secret put SLACK_SIGNING_SECRET   # production app's Signing Secret
   npx wrangler deploy
   ```
2. **Repoint the production app's events to the Worker** — this is the atomic swap (moves events Pipedream → Worker):
   `api.slack.com/apps` → **PLUS UNO Bot** → **Event Subscriptions** → **Request URL** =
   `https://uno-bot.<your-cloudflare-subdomain>.workers.dev/slack/events`
   (Confirm the URL by hitting `GET /health` on it, or `npx wrangler deployments list`.)
   - Subscribe to bot events: **`app_mention`**, **`message.channels`**, **`message.groups`** (+ `message.im` if you want DMs).
3. **Scopes** (OAuth & Permissions → Bot Token Scopes): `chat:write`, `reactions:write`, `channels:history`, `groups:history`, `app_mentions:read` (+ `users:read` for name lookups). **Reinstall** the app if you changed scopes.
4. **Confirm it's in #figma-sync** (it was, for v1).
5. **Disable v1's Pipedream** workflow.
6. The Actions' `SLACK_BOT_TOKEN` secret already = this app's token. ✅ Nothing to change.
7. *(Optional)* Retire the staging app / remove it from the sandbox channel.

### Path B — Promote the staging app to "PLUS UNO Bot"
Best if you can't access the production app's credentials or want to keep the staging app you configured. The Worker needs **no secret change** (it already uses this app).

1. **Rename the staging app** (`api.slack.com/apps` → the staging app):
   - **Basic Information → Display Information → App name** = `PLUS UNO Bot`
   - **App Home → Your App's Presence → Edit** → Display Name + Default username = `PLUS UNO Bot`
2. **Invite it to #figma-sync**: `/invite @PLUS UNO Bot`
3. **Make the Actions post as this app** — set the repo's `SLACK_BOT_TOKEN` secret to the **staging** app's token (so the Action result message matches the conversation bot).
4. **Disable v1's Pipedream** workflow.
5. **Retire the OLD production "PLUS UNO Bot" app** so two apps don't share the name. Tip: rename the old one to `PLUS UNO Bot (v1 — retired)` first to avoid confusion, then uninstall it.

---

## Verify (either path)

In **#figma-sync** (or a private channel first if you can):
- **@mention the bot** → it replies in character (uno-qa). One bot identity, named "PLUS UNO Bot".
- **Component implement:** reply `implement <Component>` under a poll PRD notification → proposal (shows the PRD) → ✅ → draft PR + **per-phase result message**, all from the *same* bot.
- **Prototype implement:** paste a single Figma frame link + "build a prototype" → proposal (with screenshot) → ✅ → `playground/{slug}/` PR.
- **No double-acting:** confirm v1 does **not** also reply or open a second PR.
- Spot-check `create_prd`, `find_experts`, "summarize this thread".

---

## Rollback (if something's wrong)

The swap is one setting, so rollback is fast:
1. Repoint the app's **Event Subscriptions → Request URL** back to the **Pipedream** endpoint.
2. **Re-enable** the Pipedream workflow.
3. The Worker stays deployed; it simply stops receiving events. No data loss.

---

## Notes

- **No code/redeploy needed for the cutover itself** (unless you change Worker secrets in Path A — `wrangler secret put` applies live, but `wrangler deploy` afterward is harmless and recommended).
- Keep the **polling cron** on — it produces the PRD that component-implement now requires.
- After cutover, `feat/uno-bot-v2-sandbox` is no longer needed at runtime (skills + Actions all read from `main`). Keep it until you're confident, then it can be deleted.
- The Event Subscriptions URL change is what actually "turns off v1" (events stop flowing to Pipedream). Disabling the Pipedream workflow is belt-and-suspenders.
