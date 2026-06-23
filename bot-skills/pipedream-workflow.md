# Pipedream Workflow + GitHub Actions Integration

> Architecture sketch for the UNO Bot cutover from the current single-prompt 4-step workflow to single-agent multi-skill. Draft scaffolding — moves to the sibling `uno-bot` repo if/when Bill approves it. Author: Bryan • Date: 2026-05-12 • Status: pre-cutover draft

## TL;DR

- **Two entry points to the bot:** Slack (via Pipedream) and the existing Figma polling cron (via GitHub Actions). They don't both trigger the same flow — polling produces a Notion PRD, the designer then triggers implementation via Slack.
- **Slack path:** Pipedream router (Haiku) → Switch operator → per-skill worker. The router picks which skill applies based on intent classification.
- **Implementation skill** delegates to existing GitHub Actions (`figma-implement.yml`), preserving today's git/Notion/Figma wiring. The migration is: the workflow's Claude call now reads its system prompt from `bot-skills/uno-implement/SKILL.md` instead of having it inline in `scripts/implement-figma-changes.js`.
- **Critique and Assist skills** run entirely in Pipedream's worker step (no git operations needed). They post directly to Slack.
- **Polling pipeline** (`figma-library-poll.yml`) is unchanged from today. It creates the Notion PRD and posts to `#figma-sync`; designer-initiated implementation closes the loop.

## Architecture Diagram

```
                                              SLACK
                                                │
                  ┌─────────────────────────────┴────────────────────────────┐
                  │ Designer message: "implement Badge"                      │
                  │                    or                                    │
                  │                    "critique this Figma frame: <link>"   │
                  │                    or                                    │
                  │                    "@uno-bot what's the diff between     │
                  │                     Card and Surface?"                   │
                  └─────────────────────────────┬────────────────────────────┘
                                                │
                                          PIPEDREAM
                                                │
                              ┌─────────────────┴─────────────────┐
                              │ Step 1: Slack trigger              │
                              │ Step 2: Filter (ignore bot msgs,   │
                              │         require bot-listening      │
                              │         channel or @-mention)      │
                              └─────────────────┬─────────────────┘
                                                │
                              ┌─────────────────┴─────────────────┐
                              │ Step 3: ROUTER (Haiku 4.5)         │
                              │  System prompt: skill registry     │
                              │  Input: parsed Slack message       │
                              │  Output: { "skill": "<name>",      │
                              │            "confidence": 0.0-1.0,  │
                              │            "params": {...} }       │
                              └─────────────────┬─────────────────┘
                                                │
                              ┌─────────────────┴─────────────────┐
                              │ Step 4: SWITCH operator            │
                              │  Branch by skill name              │
                              └─┬───────────────┬───────────────┬─┘
                                │               │               │
                          uno-implement    uno-critique     uno-assist
                                │               │               │
                                ↓               ↓               ↓
                  HTTP POST to GitHub     Claude Sonnet     Claude Sonnet
                  repository_dispatch     call (in Pipedream) call (in Pipedream)
                                │               │               │
                                ↓               ↓               ↓
                  ┌───────────────────┐   Threaded Slack   Threaded Slack
                  │ GITHUB ACTIONS    │   reply with        reply with
                  │ figma-implement.yml│  critique text     answer text
                  │                   │
                  │ • Create branch   │
                  │ • Lookup Notion   │
                  │   PRD             │
                  │ • Fetch Figma     │
                  │   design data     │
                  │ • Read code +     │
                  │   tokens          │
                  │ • Call Claude     │
                  │   (Sonnet) with   │
                  │   uno-implement   │
                  │   SKILL.md as     │
                  │   system prompt   │
                  │ • Update code +   │
                  │   stories         │
                  │ • Commit, push    │
                  │ • Open draft PR   │
                  └─────────┬─────────┘
                            │
                            ↓
                  Slack notification to
                  #figma-sync with PR link


              SEPARATELY (parallel, not a bot trigger):

              Figma poll cron (every 15min, work hours)
                            │
                            ↓
              figma-library-poll.yml (UNCHANGED)
                            │
              ┌─────────────┴─────────────┐
              │ • Compare snapshot         │
              │ • Detect changes           │
              │ • Create Notion PRD        │
              │   (status: Draft)          │
              │ • Post to #figma-sync      │
              │   with PRD link            │
              └─────────────┬─────────────┘
                            │
                            ↓
                  Designer reads PRD,
                  refines notes,
                  then types "implement <X>"
                  in Slack → back to top
```

## Pipedream Workflow — Step by Step

### Step 1: Slack Event Source

- Source: **Slack — New Message in Channel** (existing source today)
- Channels: `#figma-sync` plus any other bot-listening channel approved later
- Optional: also listen for **App Mentions** (`@uno-bot ...`) in any channel where the bot is invited — broadens reach without requiring designers to remember a specific channel

### Step 2: Filter

Drop any of:
- Messages from bot users (`event.bot_id` is set)
- Messages with `event.subtype === "bot_message"` or `"channel_join"` etc.
- Messages that aren't in a bot-listening channel AND don't @-mention the bot

If filtered, exit the workflow with `$.flow.exit("filtered")`. This avoids paying the router-step cost on every channel message.

### Step 3: Router

Claude Haiku 4.5 call. Cache-friendly:

**System prompt (cached):**

```
You are the UNO Bot router. Pick exactly one skill from the registry
below based on the user's message. Respond with JSON only:
{ "skill": "<name>", "confidence": 0.0-1.0, "params": {...} }

Skills:
- uno-implement: Implements a design-system change end-to-end (component
  source + stories). Trigger words: "implement", "update", "build",
  "make", references to a Notion PRD or a specific component name.
- uno-critique: Reviews a design artifact (Figma frame, prototype, doc)
  and gives grounded feedback. Trigger words: "critique", "review",
  "feedback on", "look at", "what do you think of".
- uno-assist: Answers questions about the Plus Uno design system,
  components, conventions, or terminology. Trigger words: "what is",
  "how does", "where can I find", "explain", "difference between".

## Disambiguation Rules (resolve in order)

1. ARTIFACT + ACTION verb → check what kind of action.
   An artifact is a Figma URL, prototype deployment URL, marketplace
   4-digit ID (e.g. "1008"), Notion link, or GitHub PR link in the message.
   - Artifact + "critique/review/feedback/audit/look at/evaluate" → uno-critique
   - Artifact + "implement/build/apply/fix/update" → uno-implement
   - Artifact + "what is/explain/tell me about" → uno-assist
   - Artifact alone with no verb → ASK clarifying question (do not route)

2. EXPLICIT COMMAND keywords beat heuristics.
   - Starts with "implement " followed by a component name → uno-implement
     (preserves today's `implement <component>` keyword pattern)
   - Starts with "/critique" or "/review" → uno-critique
   - Starts with "/help" or "/explain" → uno-assist

3. QUESTION FORMAT → uno-assist.
   "What", "How", "Why", "Where", "When", "Which" leading a sentence,
   especially without an artifact → uno-assist.

4. AMBIGUITY → uno-assist at confidence 0.3.
   Safe fallback; assist's edge-case handling will ask for clarification.

5. NEVER route to a skill not in the registry above. If the message asks
   for something the bot doesn't do (e.g., "deploy the staging server"),
   route to uno-assist with confidence 0.0 and `params: { decline: true }`
   so assist can politely decline.

Examples:
- "implement Badge" → uno-implement, confidence 0.95
- "critique this Figma frame: https://figma.com/..." → uno-critique, 0.95
- "what's the difference between Card and Surface?" → uno-assist, 0.9
- "look at the Tutor Coach designs and tell me what to fix"
  (artifact + critique verb) → uno-critique, 0.85
- "tell me about Tutor Coach" (question, no artifact, no critique verb)
  → uno-assist, 0.85
- "is there a FloatingButton component?" → uno-assist, 0.85
```

**User input:** the parsed Slack message text plus any attached URLs (Notion links, Figma links, PR links).

**Cost:** ~500 input tokens (skill registry block, ~5x cached at 0.1x rate after first hit) + ~50 output tokens. Effective per-request cost ≈ $0.0001 after cache warm-up.

**Latency budget:** ~0.7s. Skip the router entirely if the user invoked via explicit slash command (e.g., `/implement Badge`) — slash commands bypass intent classification.

### Step 4: Switch Operator

Use Pipedream's [Switch operator](https://pipedream.com/docs/workflows/building-workflows/control-flow/switch) (beta — confirmed in §4.2 feasibility writeup). One case per skill name. Default case routes to `uno-assist` with a "I'm not sure what you're asking for — here's my best guess" preamble.

### Step 5a: `uno-implement` Branch

This skill needs git access, so dispatch to GitHub Actions rather than running Claude in Pipedream directly.

**HTTP Request step:**

- Method: `POST`
- URL: `https://api.github.com/repos/BilLogic/plus-uno/dispatches`
- Headers:
  - `Authorization: token {{env.GITHUB_PAT}}`
  - `Accept: application/vnd.github.v3+json`
- Body:
```json
{
  "event_type": "implement-figma-changes",
  "client_payload": {
    "component": "{{steps.router.$return_value.params.component}}",
    "trigger_source": "slack",
    "user_id": "{{steps.trigger.event.user}}",
    "channel": "{{steps.trigger.event.channel}}",
    "thread_ts": "{{steps.trigger.event.thread_ts || steps.trigger.event.ts}}",
    "spec_text": "{{steps.trigger.event.text}}",
    "notion_prd_id": "{{steps.router.$return_value.params.notion_prd_id || null}}"
  }
}
```

**Slack reply step:** post a threaded ack — "🔧 Working on `{component}` — I'll update this thread when the draft PR is ready."

The GitHub Action takes it from there (see §"GitHub Actions Integration" below). When the Action completes, it posts its own threaded reply with the PR link by writing back to the same thread.

### Step 5b: `uno-critique` Branch

Runs entirely in Pipedream. **Drafted 2026-05-12** — see [uno-critique/SKILL.md](uno-critique/SKILL.md).

**Claude Sonnet call:**

- System prompt (cached): contents of `bot-skills/AGENTS.md` + contents of `bot-skills/uno-critique/SKILL.md` + always-load references (principles.md + cheat-sheet.md) ≈ 5-7K cached tokens
- User input: the Slack message text + any attached references (Figma link, prototype URL, marketplace ID, Notion link, GitHub PR). When a Figma link is present, fetch context via Figma MCP (`get_design_context` + `get_screenshot`) — if the desktop app isn't open, fall back to asking the user for a screenshot
- When-relevant references (accessibility.md, content-voice.md, layout.md, terminology.md, target component source) loaded based on focus area / what's visible in the artifact
- Tools: GitHub read (component reference lookups), Notion read (design notes), Figma MCP (design context)

**Slack reply step:** post the critique as a threaded reply, formatted per the `uno-critique/SKILL.md` output spec — severity-tiered (P0/P1/P2) with category tags, omit empty sections, always include "What's working". If output exceeds ~1500 chars, post a 3-bullet summary and Gist link.

### Step 5c: `uno-assist` Branch

Same shape as critique. **Drafted 2026-05-12** — see [uno-assist/SKILL.md](uno-assist/SKILL.md).

- System prompt (cached): `AGENTS.md` + `uno-assist/SKILL.md` + always-loaded knowledge map (~500 tokens listing all `docs/context/` and `docs/knowledge/` files with 1-line descriptions) ≈ 2-3K cached tokens
- User input: the Slack message (the question)
- Workflow: bot classifies the question type → picks 1-3 specific docs to fetch from the knowledge map → reads them → composes a source-cited answer
- Tools: GitHub read (for fetching the picked docs), Notion read (optional, for design notes)
- Output: threaded Slack reply with answer + Sources block + optional Related pointer. Default length 2-5 sentences for the answer itself.

### Step 6: Metrics Logging (Side Effect)

After every workflow run (success or failure), append a row to a Google Sheet:

| timestamp | user_id | skill | latency_ms | input_tokens | output_tokens | success |

This is the §4.10 metrics scaffolding. Cheap to add at build time; expensive to retrofit. Add it Week 2-3, not Week 1.

## GitHub Actions Integration

### Existing workflow: `figma-implement.yml`

Today this workflow:
1. Triggered by `repository_dispatch` with `event_type: implement-figma-changes`
2. Reads `client_payload.component`
3. Creates branch `ds-review/{component}-{date}-{time}`
4. Calls `node scripts/implement-figma-changes.js {component}`
5. The script handles: Notion PRD lookup, Figma fetch, code reading, Claude call, file writes, commit, PR open, Slack notification

**Migration:** modify `scripts/implement-figma-changes.js` to:

1. Read `bot-skills/uno-implement/SKILL.md` from the repo at runtime (or have it baked into the script via a build step)
2. Use the SKILL.md content as the **system prompt** for the Claude call
3. Pass the change context (Notion PRD content + Figma data + current component source) as the **user prompt**

The script's other responsibilities (git ops, PR creation, Slack notification back to thread) stay unchanged. The migration is roughly a 20-30 line diff in the script — the rest of the workflow is identical.

**Why this matters:** the same SKILL.md is now the source of truth for the bot's implementation behavior whether triggered from Slack OR from a hypothetical future direct dispatch (e.g., a GitHub-UI manual workflow run for testing). One source of truth, multiple entry points.

### Polling workflow: `figma-library-poll.yml`

**Unchanged from today.** Cron schedule, Figma API polling, snapshot diff, Notion PRD creation, Slack notification — all stay as-is. This workflow does NOT route through Pipedream; it's a standalone GitHub Actions cron that produces a PRD for the designer to react to.

The clean separation: polling creates context, the bot implements when invoked. Polling is not a bot trigger.

## Cross-Cutting Operational Concerns

These apply across all skills and live at the orchestration layer (Pipedream + the GitHub Action), not in individual SKILL.md files. Per audit finding #8.

### 1. Error handling on Claude API failures (v1 essential)

**Failure modes to handle:**
- Anthropic API returns 429 (rate limit) — back off with exponential retry up to 3 attempts
- Anthropic API returns 5xx — retry once, then surface failure
- Anthropic API returns malformed JSON for the router — fall back to `uno-assist` with confidence 0.0
- Pipedream code step throws — Pipedream's built-in error step posts to Slack ack thread with a friendly message and a link to the workflow run

**Pattern:** every Claude call is wrapped in a try/catch with explicit error categories. The catch posts a Slack thread reply like: `❌ Something went wrong while running uno-{skill}. Workflow log: {link}`. The error never silently disappears.

### 2. Rate limiting (v1 light, formalize in v2)

**v1 approach:** rely on Pipedream's per-workflow concurrency limits + Anthropic's per-account rate limits as the natural ceiling. No explicit per-user limiting.

**v2 candidate:** track invocations per user per minute via the §4.10 metrics sheet. If a single user exceeds N requests/min (suggested: 10), reply with `🛑 You're going fast — pausing for 60s` and skip the worker call. Implement only if real abuse appears in pilot.

**Pipedream-level guard:** set the workflow's max concurrent executions to 5 in Pipedream's UI to prevent a thundering herd from a buggy slash command.

### 3. PII redaction (v1 N/A, revisit when bot expands beyond Plus team)

**v1:** Plus designers are an internal trusted team. User input may include student names, tutor names, session IDs — all internal-only and acceptable in Claude context per the team's data agreement. No active redaction in v1.

**When this changes:** if/when the bot is used in channels with external collaborators OR if Plus's data agreement changes, add a redaction pass before the Claude call. Candidate regex set: SSN, email addresses, phone numbers, Plus-specific student ID format (TBD).

**Audit step:** §4.10 metrics should NOT log full message text in v1 (only user_id, skill name, latency, token counts). Avoid creating a PII liability via the metrics sheet itself.

### 4. Audit logging (v1 essential — also serves §4.10 metrics)

**What gets logged per invocation:**
- `timestamp` (ISO 8601)
- `user_id` (Slack user ID, not display name)
- `channel` (Slack channel ID)
- `skill` (chosen by router)
- `confidence` (router's confidence score)
- `latency_ms` (end-to-end, Slack message in to Slack reply out)
- `input_tokens`, `output_tokens` (from the worker Claude call)
- `success` (boolean)
- `error_category` (only if `success: false` — one of `claude_api_error`, `dispatch_error`, `parse_error`, `unknown`)

**Where it lands:** a Google Sheet (cheap to start, switch to Postgres or BigQuery if rows exceed ~10k). Sheet is private to the Plus team Google Workspace.

**What is NOT logged:**
- Full message text (PII liability per concern #3)
- Claude's full response (large; sample 1% for prompt-quality auditing if needed)
- Slack message timestamps (not useful for analysis, marginal privacy risk)

This logging step is added as a Pipedream side-effect in the Slack reply step (Step 6 above). Cheap at build time; expensive to retrofit.

## Migration Path (Week 1-2)

Doing this in a sandbox, not in production. The current bot keeps running until the new one is verified.

1. **Week 1, Day 1-2 (Sandbox setup)**
   - Create a new Pipedream workflow in a separate project (call it `uno-bot-v2-sandbox`)
   - Configure Slack source pointing to a TEST channel (not `#figma-sync`)
   - Build Steps 1-4 (filter + router + switch) with one branch (`uno-implement`)
   - Hardcode a test repository_dispatch target (a fork or test repo, not production plus-uno)

2. **Week 1, Day 3-4 (Verify router)**
   - Manually send test messages to the test channel: "implement Badge", "critique this design", "what is a Surface", various ambiguous cases
   - Log the router's classification decisions; tune the system prompt if misclassifications appear
   - Confirm latency budget (router + switch < 1.5s total)

3. **Week 1, Day 5 (Verify the implement path)**
   - Wire the test workflow to a sandbox copy of `figma-implement.yml` in a fork
   - Confirm dispatch payload arrives correctly, branch is created, draft PR opens
   - Migrate `scripts/implement-figma-changes.js` to read SKILL.md (in the fork)
   - Verify Claude produces equivalent output to today's inline prompt by running against past PRs (regression test)

4. **Week 2, Day 1-3 (Add other skills)**
   - Add `uno-critique` and `uno-assist` branches (Claude calls in Pipedream, no GitHub dispatch)
   - These skills are Week 3-4 in the main plan, but stubbed branches let the router output something for those classifications without 500-ing

5. **Week 2, Day 4 (Cutover)**
   - Maintenance window (~15 min) during low-activity time
   - Promote sandbox workflow to production: change Slack source to `#figma-sync`, change dispatch target to production plus-uno repo
   - Update the live `scripts/implement-figma-changes.js` to read from SKILL.md (committed and merged in advance)
   - Swap to org-managed API key (§4.6) — same workflow rebuild = natural moment
   - Disable old monolithic Pipedream workflow

6. **Week 2, Day 5 (Verify in production)**
   - Pings from designers in `#figma-sync` should route correctly
   - Polling cron continues firing (independent, unchanged)
   - Watch for 24h before declaring the cutover complete
   - Old workflow remains as fallback for 1 week before final decommission

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pipedream's Switch operator (beta) has edge cases | Medium | Medium | Test exhaustively in sandbox. If unstable, replace with explicit If/Else operators (more verbose but stable) |
| Router misclassifies common requests | Medium | Medium | Log all router decisions for first 2 weeks; tune the system prompt based on actual misclassifications. Add "I think you want X — is that right?" confirmation pattern for low-confidence cases |
| Slack event URL change drops messages during cutover | Low | High | Use a maintenance window during low-activity time. Old and new workflows can listen to the same channel briefly (deduplication via message ID at the entry filter) |
| `scripts/implement-figma-changes.js` migration loses subtle current behavior | Medium | High | Pre-cutover: capture inputs + outputs of the current bot's last 10 invocations as regression test cases. Run new SKILL.md against same inputs; diff the outputs. Anything materially different = either fix in SKILL.md or document as known intentional change |
| Org API key procurement (§4.6) doesn't land by Week 2 | Medium | Low | Cutover with per-user keys; swap to org key in a follow-up day. Annoying but not blocking |
| Router latency too high (>2s feels sluggish) | Low | Medium | Skip router for explicit slash commands. Cache aggressively. Drop to Haiku 4.5 from any larger model |
| Critique/Assist Pipedream credit burns faster than expected | Medium | Medium | §4.10 metrics surface this in Week 3. Optimize prompts or switch tone-light skills to Haiku |
| Designers keep using the old keyword pattern by muscle memory | Low | Low | No problem — the new bot still recognizes `implement <component>` since the router catches it. The only new affordance is freeform requests in addition |

## Self-Check / Where I Might Be Wrong

Being honest about uncertainty so this gets verified rather than trusted:

1. **I haven't seen the current Pipedream workflow's source.** I'm inferring its structure from `docs/figma-sync-workflow.md`. The actual workflow may have steps or quirks not documented there. **Verification:** before Week 1, dump the current workflow's JSON export and compare against my sketch. Adjust if there are surprises.

2. **`scripts/implement-figma-changes.js` content is unknown to me.** I'm assuming it has an inline system prompt that can be cleanly replaced with the SKILL.md content. If the script's logic is tightly entangled with prompt structure, the refactor is harder than 20-30 lines. **Verification:** read the script in Week 1, Day 1. If it's a big rewrite, flag it and decide whether to do a thinner migration (e.g., reference SKILL.md from a parallel new prompt path rather than replacing the inline one).

3. **Pipedream's Switch operator beta status.** I cited it as feasible in the §4.2 deliverable but haven't built with it. **Verification:** Day 1 of sandbox work, prove a 3-branch Switch end-to-end before committing the architecture.

4. **The router's classification accuracy with this prompt is unproven.** I designed the system prompt based on common LLM-routing patterns, not against real Plus designer messages. **Verification:** Day 3-4 of sandbox includes the classification tuning loop. Expect to iterate the system prompt 2-3 times before it's reliable.

5. **Caching specifics.** I claimed prompt caching makes the router cheap. This relies on Pipedream making consistent calls with the same cache breakpoints; the Pipedream + Anthropic SDK integration may or may not expose the cache control parameter cleanly. **Verification:** read Anthropic's prompt caching docs alongside Pipedream's Anthropic integration docs before assuming the 90% discount applies.

6. **Concurrent invocations.** Multiple designers pinging the bot simultaneously should work — Pipedream supports parallel execution natively — but the metrics-logging Google Sheet write could race-condition. **Mitigation:** use append-only writes with auto-generated row IDs, or switch to a small Postgres/BigQuery table if rows >1000.

## Open Decisions (Doesn't Need Bill, But Worth Naming)

1. **Slash-command support** — Should the bot accept `/implement Badge` in addition to natural-language `implement Badge`? Slash commands skip the router (faster, cheaper) but require Slack app config. **My call:** support both. Slash commands as the power-user path, natural language as the discoverable default.

2. **`@uno-bot` mention support** — Beyond keyword listening in `#figma-sync`, should the bot respond to `@uno-bot ...` in any channel where it's invited? **My call:** yes. Lets the bot reach beyond `#figma-sync` without requiring channel-listening configuration for every workspace channel.

3. **Confirmation gate for `uno-implement` from Slack** — Should the bot ask "About to implement X — confirm?" before dispatching to GitHub Actions, or just go? Today's bot doesn't confirm. **My call:** no confirmation for v1 (matches today, lower friction). Add confirmation later only if the bot ships incorrect implementations frequently.

4. **What does the bot say when the router is low-confidence (<0.6)?** **My call:** route to `uno-assist` with a preamble: "I'm not sure exactly what you want — here's my best guess. If this is wrong, reply with `implement X` / `critique X` / etc."

## Next Artifacts (After This One)

In order of next-best-leverage (drafted items struck through):

1. **Executable code** — the gap I've been deferring:
   - Modify `scripts/implement-figma-changes.js` to consume `uno-implement/SKILL.md` as its system prompt (replaces inline prompt)
   - Produce paste-ready Pipedream code-step snippets (Slack filter, router LLM call, Switch config, per-skill worker calls, Slack reply formatter)
   - Decide on a skill-loader pattern: a shared `bot-skills/lib/skill-loader.js` Node module, OR inlined parsing in each consumer
2. **`bot.config.example.json`** — locks the Plus-specific-vs-generic boundary. Foundational for phase-2 generalization.
3. ~~`uno-critique` SKILL.md draft~~ — ✅ done 2026-05-12
4. ~~`uno-assist` SKILL.md draft~~ — ✅ done 2026-05-12
5. **v1 voice spec** — concrete sample bot responses for "neutral-warm + direct." Useful for the 1:1 with Bill (Decision #5 in the prep doc).
6. **Regression test plan** — capture last N production invocations of the current bot; build a checklist for verifying the new SKILL.md produces equivalent output.

Pick one and say the word. After all four skills (3 drafted + the implement skill) have spec coverage, **the executable code is the biggest remaining gap** — without it, the SKILL.md files don't do anything by themselves.
