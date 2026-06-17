# UNO Bot v2 — Manual Setup Guide

> Step-by-step of everything Bryan (or whoever wires the cutover) needs to do *outside* this repo to get the new bot running. This is the companion doc to [pipedream-snippets.md](pipedream-snippets.md) — the snippets are the code, this is the operational checklist.

## TL;DR — what you need, in priority order

| | What | Likely already done? | Time estimate |
|---|------|----------------------|---------------|
| 1 | **GitHub Personal Access Token** with `repo` + `gist` scopes | ✅ likely (current bot uses one) — may need `gist` scope added | 5 min |
| 2 | **Anthropic API key** (org-managed per §4.6 when available) | ✅ likely — but team migration to org key is its own task | Pending Bill |
| 3 | **Slack Bot Token + Bot User ID** | ✅ likely — current bot already exists; may need new OAuth scopes | 5-10 min |
| 4 | **Push `bot-skills/` to GitHub main** (or a branch for testing) | ❌ NEW — we've been editing locally | 2 min |
| 5 | **Pipedream project + workflow** (the actual snippet wiring) | ❌ NEW — current bot is a separate single-prompt workflow | 1-2 hours |
| 6 | **Slack channel IDs** for `BOT_LISTENING_CHANNELS` | ✅ `#figma-sync` exists | 2 min |
| 7 | **Google Sheet + Apps Script webhook** for `METRICS_WEBHOOK_URL` | ❌ NEW (and optional for v1, but recommended) | 20 min |
| 8 | **Decide cutover strategy** (sandbox first, then swap) | ❌ NEW | discussed below |
| 9 | **Run regression test** against 2-3 past PRs | ❌ NEW | 30-60 min |

**Total new-work estimated effort: ~3-4 hours** spread across the cutover. Most of it is Pipedream wiring + verification, not procurement.

---

## 1. API Keys & Secrets

### Anthropic API key

**What it is:** Authenticates Claude API calls from Pipedream code steps + the GitHub Action.

**Status:** the current bot already uses one. The migration's only change is the §4.6 org-key swap when Bill approves it.

**Where to get it (if new):** [console.anthropic.com](https://console.anthropic.com/) → API Keys → Create Key. Use a workspace-scoped key (per Anthropic's Feb 2026 workspace-isolation change — workspace-scoped keys benefit from prompt caching better than account-wide keys).

**Where it goes:**
- Pipedream Environment Variable: `ANTHROPIC_API_KEY`
- GitHub Actions Secret: `ANTHROPIC_API_KEY` (existing — verify it's still set)

**Scope/permissions:** Standard API key — no special scopes. Workspace-scoped recommended.

**Cost watch:** v1 estimated burn ≈ $5-20/week depending on usage. Track via Anthropic console + the §4.10 metrics scaffolding.

---

### GitHub Personal Access Token

**What it is:** Used by Pipedream to dispatch the GitHub Action AND to create Gists for long bot responses.

**Status:** current bot likely has one for `repository_dispatch`. **May need a scope upgrade if `gist` isn't already included.**

**Where to get it (if new or scope upgrade):**

1. [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token → **Fine-grained** (preferred) or Classic
2. Required scopes:
   - **`repo`** (full repo access for `repository_dispatch` + reading repo contents)
   - **`gist`** (create Gists for long critique/assist outputs)
3. Expiration: 90 days is safe; longer if you don't want to rotate often.

**Where it goes:**
- Pipedream Environment Variable: `GITHUB_PAT`
- GitHub Actions Secret: `GITHUB_TOKEN` (auto-provided by Actions for the dispatch target — no manual setup needed)

**Verify before pasting:** test the token with:
```bash
curl -H "Authorization: token $GITHUB_PAT" https://api.github.com/repos/BilLogic/plus-uno
```
Should return repo metadata, not a 401.

---

### Slack Bot Token + Bot User ID

**What it is:**
- `SLACK_BOT_TOKEN` — OAuth token for the bot (`xoxb-...`), used to post messages, add reactions, fetch user info.
- `SLACK_BOT_USER_ID` — the bot's Slack user ID (e.g. `U07XXXXXXXX`). Used by the filter step to detect @-mentions.

**Status:** current bot exists in Slack. **May need new OAuth scopes for v2.**

**Required Slack OAuth scopes for v2:**

| Scope | Why |
|-------|-----|
| `chat:write` | Post threaded replies |
| `chat:write.public` | Post to channels the bot isn't a member of (if needed; usually safer to require channel membership) |
| `reactions:write` | Add ⚙️/✅/ℹ️/❌ reactions |
| `app_mentions:read` | Receive `@uno-bot` mentions in any channel |
| `channels:history` | Read messages in `#figma-sync` (and any other listening channel) for the keyword filter |
| `groups:history` | Same, but for private channels |
| `im:history` | Same, but for DMs (optional) |
| `users:read` | Look up user display name from user ID (optional but nice for personalization) |

**Where to manage scopes:** [api.slack.com/apps](https://api.slack.com/apps) → select the UNO Bot app → **OAuth & Permissions** → Bot Token Scopes. After adding scopes, re-install the app to your workspace to get a refreshed token.

**Where to get `SLACK_BOT_USER_ID`:**

Option A — Slack web UI: open the bot's profile in Slack, the user ID shows in the URL.

Option B — API call:
```bash
curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" https://slack.com/api/auth.test
```
Returns JSON with `"user_id": "U07XXXXXXXX"`.

**Where they go:**
- Pipedream Environment Variables: `SLACK_BOT_TOKEN` and `SLACK_BOT_USER_ID`
- GitHub Actions Secret: `SLACK_BOT_TOKEN` (already exists — used by `figma-implement.yml` for reactions, lines 47-53 and 172-198)

---

### Notion API key (optional in v1)

**What it is:** Used by `scripts/implement-figma-changes.js` to look up Notion PRDs and by (future) `uno-critique` Notion-artifact fetching.

**Status:** already set up for the existing bot — verify it's still wired in both Pipedream and GitHub Actions secrets.

**Where it goes:**
- Pipedream Environment Variable: `NOTION_API_KEY` (optional in v1)
- GitHub Actions Secret: `NOTION_API_KEY` + `NOTION_DATABASE_ID` (existing)

---

### Figma API token (not needed in v1 bot)

**What it is:** Used by `scripts/poll-figma-library.js` and `implement-figma-changes.js` to fetch Figma data.

**Status:** already wired in GitHub Actions secrets — `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY`.

**For the bot side:** v1 critique stubs Figma fetching (asks designer to paste a screenshot). No Figma API token needed in Pipedream env vars for v1.

---

## 2. Slack App Setup

### 2.1 Verify the existing UNO Bot app

Go to [api.slack.com/apps](https://api.slack.com/apps) → find the existing UNO Bot app. Check:

- [ ] **Event Subscriptions** — verify it's listening to `message.channels` (and optionally `app_mention`) and the Request URL points to today's Pipedream workflow (or will point to the new one after cutover).
- [ ] **OAuth & Permissions → Bot Token Scopes** — all 5-8 scopes from §1 above are present.
- [ ] **App Home → Show Tabs** — Messages Tab enabled if you want DM support.

### 2.2 (Optional) Update bot display name + avatar

Sprint 2 territory — if you want a refreshed bot identity per the §4.4 personality work, do it here. **Basic Information → Display Information**. Keep the same Slack app though — re-installing creates a new bot user with a new user ID and breaks everyone's existing reactions/threads.

### 2.3 Invite the bot to channels

In Slack:
- `/invite @uno-bot` in `#figma-sync`
- Same for any other channel in `BOT_LISTENING_CHANNELS`

---

## 3. Push `bot-skills/` to GitHub

The Pipedream workers fetch SKILL.md files from GitHub at runtime. They need to exist on the branch the bot points at.

**Steps:**

```bash
cd plus-uno  # or whatever the local checkout path is
git status   # confirm bot-skills/ shows as untracked

# Optionally: make a branch for sandbox testing first
git checkout -b feat/uno-bot-v2-sandbox

git add bot-skills/
git add scripts/implement-figma-changes.js  # the modified script (sub-task C)
git status

git commit -m "feat(uno-bot): add bot-skills directory + skill-loader; migrate implement script

- bot-skills/uno-implement/SKILL.md (migrated capability)
- bot-skills/uno-critique/SKILL.md (new, Week 3)
- bot-skills/uno-assist/SKILL.md (new, Week 4)
- bot-skills/lib/skill-loader.js (Node module)
- bot-skills/AGENTS.md (shared system prompt with carefully crafted voice)
- bot-skills/pipedream-workflow.md (architecture sketch)
- bot-skills/pipedream-snippets.md (paste-ready Pipedream code)
- bot-skills/setup-guide.md (this guide)
- scripts/implement-figma-changes.js: replace inline prompt with skill-loader call"

git push -u origin feat/uno-bot-v2-sandbox  # OR main, depending on cutover strategy
```

**Verify the GitHub Raw URL resolves:**

```bash
curl https://raw.githubusercontent.com/BilLogic/plus-uno/feat/uno-bot-v2-sandbox/bot-skills/uno-implement/SKILL.md
# OR after merging to main:
curl https://raw.githubusercontent.com/BilLogic/plus-uno/main/bot-skills/uno-implement/SKILL.md
```

Should return the SKILL.md content, not a 404. If 404, double-check the branch name and that the file actually committed.

**Set `BOT_SKILLS_BASE_URL`** in Pipedream env vars to match the branch you're using:
- Sandbox: `https://raw.githubusercontent.com/BilLogic/plus-uno/feat/uno-bot-v2-sandbox/bot-skills`
- Production: `https://raw.githubusercontent.com/BilLogic/plus-uno/main/bot-skills`

---

## 4. Pipedream Setup

### 4.1 Create the workflow

[pipedream.com](https://pipedream.com) → **+ New** → **Workflow** → name it `uno-bot-v2-sandbox` (don't touch the existing live workflow yet).

### 4.2 Set environment variables

Pipedream → Settings → **Environment Variables**. Add all of these:

| Variable | Value | Required? |
|----------|-------|-----------|
| `ANTHROPIC_API_KEY` | from §1 | Yes |
| `GITHUB_PAT` | from §1 | Yes (for the implement skill) |
| `GITHUB_OWNER` | `BilLogic` | Yes |
| `GITHUB_REPO` | `plus-uno` | Yes |
| `SLACK_BOT_TOKEN` | from §1 | Yes |
| `SLACK_BOT_USER_ID` | from §1 (e.g. `U07XXXXXXXX`) | Yes |
| `BOT_SKILLS_BASE_URL` | from §3 (sandbox or main branch URL) | Yes |
| `BOT_LISTENING_CHANNELS` | comma-separated channel IDs, e.g. `C07XXXXXXXX,C08YYYYYYYY` | Yes |
| `METRICS_WEBHOOK_URL` | from §5 below | Optional (recommended) |
| `NOTION_API_KEY` | from §1 | Optional (only if v2 Notion fetch lands) |

### 4.3 Wire the trigger + steps

Follow [pipedream-snippets.md](pipedream-snippets.md) in order:

1. **Trigger:** Slack → New Message in Channel → connect Slack account → pick `#figma-sync`.
2. **Step 2 (filter):** New step → Node.js code step → paste Snippet 2.
3. **Step 3 (router):** New step → Node.js code step → paste Snippet 3.
4. **Step 4 (switch):** New step → Logic → Switch → set Input to `{{ steps.router.$return_value.skill }}` → add 3 cases (`uno-implement`, `uno-critique`, `uno-assist`).
5. **Steps 5a/5b/5c:** new step under each Switch branch → paste the matching snippet from 5a (HTTP), 5b (code), 5c (code).
6. **Step 6 (metrics):** new step at the bottom of the workflow → paste Snippet 6.
7. **Step 7 (reactions):** for v2 Sprint 2; skip in initial wiring.

**Workflow Settings → Concurrency:** set max concurrent executions to **5**. Prevents thundering herd from a stuck retry loop.

### 4.4 Test the workflow with a fake event

Pipedream → workflow → **Test Event** → paste a fake Slack message event JSON (Pipedream provides templates). Run through the workflow step-by-step in the test UI:

- [ ] Filter step doesn't exit
- [ ] Router returns a JSON with one of the three skill names
- [ ] Switch routes to the expected case branch
- [ ] Worker step makes its API calls successfully
- [ ] Slack chat.postMessage returns `ok: true`

If any step fails, Pipedream's per-step logs show the error inline. Fix and re-run.

---

## 5. Google Sheet for §4.10 Metrics (Recommended, ~20 min)

### 5.1 Create the sheet

[sheets.google.com](https://sheets.google.com) → New sheet → name it "UNO Bot Metrics v2" → add a header row:

```
timestamp | user_id | channel | skill | confidence | latency_ms | input_tokens | output_tokens | success | error_category
```

### 5.2 Add the Apps Script webhook

Extensions → Apps Script → replace the default `Code.gs` with:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.user_id,
    data.channel,
    data.skill,
    data.confidence,
    data.latency_ms,
    data.input_tokens,
    data.output_tokens,
    data.success,
    data.error_category,
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

### 5.3 Deploy

Apps Script editor → **Deploy** → **New deployment** → Type: **Web app** → Execute as: **Me** → Who has access: **Anyone**. Click Deploy → copy the Web app URL.

### 5.4 Set the env var

Paste that URL into Pipedream env vars as `METRICS_WEBHOOK_URL`.

### 5.5 Test it

In Pipedream, add a test row manually:
```bash
curl -X POST "$METRICS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2026-05-12T20:00:00Z","user_id":"test","channel":"test","skill":"uno-assist","confidence":1,"latency_ms":1234,"success":true}'
```
Check the sheet — the row should appear.

---

## 6. Cutover Plan (sandbox → production)

The current bot is live. Don't break it. Two-phase cutover:

### Phase A — Sandbox parallel (Week 1-2)

- New Pipedream workflow listens on a **test channel** (e.g. `#uno-bot-sandbox`) — NOT `#figma-sync`.
- Current bot stays untouched.
- Bryan + Bill test the new workflow with manual messages in the sandbox channel.
- Run all three skill paths (implement, critique, assist) to validate.
- Adjust snippets / env vars / SKILL.md as issues surface.

### Phase B — Production swap (during a low-traffic window)

1. Update the new Pipedream workflow's Slack source: change channel from `#uno-bot-sandbox` to `#figma-sync`.
2. **Simultaneously disable the old Pipedream workflow** (don't delete — keep as fallback for 1 week).
3. Test immediately with a known-good keyword (`implement Badge`) in `#figma-sync`.
4. If anything's broken: re-enable the old workflow, fix the new one in sandbox, retry.
5. After 1 week of clean production runs, delete the old workflow.

**Optional safety net:** while both are enabled, the old workflow filters on `event.text.includes('implement')` (current keyword) and the new one has the router. They'd both fire on the same message. Either disable one OR have the new one short-circuit if the old workflow handled it — easier to just disable the old one cleanly.

---

## 7. Regression Test (before declaring the migration "done")

Goal: prove that `scripts/implement-figma-changes.js` post-migration produces equivalent output to the inline-prompt version against real production inputs.

### Steps:

1. **Pick 2-3 recently merged design-system PRs** that were created by `figma-implement.yml`. Note the component name and the Notion PRD ID for each.
2. **Capture the inputs** that produced each PR:
   - Component name (from PR title)
   - Notion PRD content (fetch via Notion API)
   - Figma component metadata at the time of the PR (this is the hardest part — Figma doesn't easily give you historical snapshots)
3. **Run the modified script locally** with those inputs:
   ```bash
   cd plus-uno
   export ANTHROPIC_API_KEY="..."
   export FIGMA_ACCESS_TOKEN="..."
   export FIGMA_FILE_KEY="..."
   export NOTION_API_KEY="..."
   export NOTION_PRD_ID="..."
   git checkout -b regression-test-Badge
   node scripts/implement-figma-changes.js --components Badge
   git diff main -- design-system/src/components/Badge/
   ```
4. **Compare against the merged PR's diff.** Allow stylistic variation (different comment wording, different blank lines). Flag structural divergence:
   - File written that wasn't in the merged PR (unexpected file creation)
   - File NOT written that was in the merged PR (regression)
   - Prop signature changed
   - Token usage materially different

5. **Document findings** in a short markdown file (`bot-skills/regression-results.md` or similar). If 2/3 or 3/3 produce structurally-equivalent output, declare the migration safe. If 0/3 or 1/3 match, debug the SKILL.md content vs the original inline prompt.

### What "structurally equivalent" looks like

| | OK | Flag |
|---|---|---|
| Files written | Same set | New file appears or expected file missing |
| Prop changes | Same props, same types | Props changed, added, or removed |
| Token usage | Same `var(--*)` references used | Different tokens, hardcoded values |
| Comment churn | Slight rewording | Comments added/removed materially |
| Storybook stories | Same story names, same `argTypes` | Stories restructured |

---

## 8. Pre-flight Checklist

Before flipping to production:

- [ ] All 9 env vars set in Pipedream (§4.2 table)
- [ ] Slack scopes verified, bot invited to `#figma-sync` (§2)
- [ ] `bot-skills/` pushed to GitHub, `BOT_SKILLS_BASE_URL` points at the right branch (§3)
- [ ] Pipedream test event passes through all 6 steps without error (§4.4)
- [ ] Google Sheet receives at least one test row (§5.5)
- [ ] Regression test ran cleanly against ≥2 past PRs (§7)
- [ ] Old Pipedream workflow ready to be disabled (§6 Phase B step 2)
- [ ] Bill confirmed org-API-key swap timing (§4.6 from main plan)

---

## 9. Things That Could Go Wrong

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Slack filter step exits "Ignored: bot message" on a user message | Wrong `SLACK_BOT_USER_ID` env var | `auth.test` to confirm the actual ID |
| Router returns malformed JSON | Haiku not following format | Add 1-2 more examples to the router system prompt; tighten "Return ONLY JSON" instruction |
| `BOT_SKILLS_BASE_URL` fetch returns 404 | Branch not pushed, OR wrong URL pattern | Run the `curl` from §3 to verify |
| GitHub `repository_dispatch` returns 401 | PAT missing `repo` scope | Regenerate PAT with `repo` scope |
| Gist creation 403 | PAT missing `gist` scope | Regenerate PAT with `gist` scope |
| Anthropic 429 | Rate limit hit (org plan tier) | Back off, batch invocations, or upgrade plan |
| Anthropic 401 | API key invalid, expired, or workspace-mismatched | Regenerate key in Anthropic console |
| Slack `chat.postMessage` returns `not_in_channel` | Bot not invited to that channel | `/invite @uno-bot` in the channel |
| Metrics sheet has wrong row order | Apps Script `appendRow` is async-ordered | Sort by timestamp column before analysis |
| Workflow runs but never replies | Caught error somewhere; check Pipedream per-step logs | Each code step has its own log tab; look for the red error |

---

## 10. What Happens After v1 Ships

Per the broader plan (§4.x tasks, Bill's Sprint 2-3 priorities):

- **Sprint 2-3:** richer Slack reactions (Pattern B sentiment reactions), user story scoping for v2, v1 voice sample evaluation
- **Sprint 5:** pilot rollout to Bryan + Bill + Ashley + Victor
- **Sprint 6:** full Plus design team rollout
- **Post-v1:** §4.3 generalization work (Notion/Substack article + plugin template repo) — only if external sharing matters
