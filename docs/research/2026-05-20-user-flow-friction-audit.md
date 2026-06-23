# UNO Bot v2 — User-Flow Friction Audit

> Week 1 deliverable per `~/.claude/plans/piped-riding-melody.md`. Audit the existing Figma → PRD → implement chain for friction points; propose improvements; rank for v2 inclusion.
>
> Author: Bryan • Date: 2026-05-20 • Audience: Bryan + Bill

## TL;DR

The current pipeline works mechanically but has **six concrete friction points** in the designer's path from "Figma published" to "draft PR merged." Three are high-leverage to fix in v2 (action buttons on the PRD post, progress visibility during implement, better intent recognition). Two are medium-leverage (PR review back-pressure into Slack, conditional polling). One is low-leverage (faster polling cadence — probably fine as-is).

Recommendation: ship the **three high-leverage fixes in v2 Week 2 (alongside the agentic build)**, defer the two medium-leverage to v2.x, and leave the low-leverage one alone unless designers complain.

## The current flow, end to end

Tracing what a designer actually does today, with implicit costs at each step:

```
0. Designer publishes a component change in Figma
   ↓                                    ⏱ instant (designer's normal Figma workflow)
1. Polling cron runs (every 15 min, work hours)
   ↓                                    ⏱ ~10-15 min wait for the next poll cycle
2. Cron creates a Notion PRD with auto-populated fields
   ↓                                    ⏱ ~30s
3. Cron posts to #figma-sync with PRD link
   ↓                                    ⏱ instant
4. Designer notices the Slack post (or doesn't — depends on notifications)
   ↓                                    ⏱ variable; could be hours
5. Designer clicks PRD link, goes to Notion
   ↓                                    ⏱ ~5-10s (context switch to Notion)
6. Designer reads the auto-generated PRD content
   ↓                                    ⏱ ~30s-2min depending on change size
7. Designer adds implementation notes / refines acceptance criteria in Notion
   ↓                                    ⏱ ~1-5min
8. Designer goes back to Slack
   ↓                                    ⏱ ~5s (another context switch)
9. Designer types "implement <component>" in #figma-sync
   ↓                                    ⏱ ~10-30s (recall the exact keyword + component name)
10. Pipedream → repository_dispatch → figma-implement.yml starts
    ↓                                   ⏱ instant
11. Action checks out repo, creates branch, fetches Figma context
    ↓                                   ⏱ ~30-90s of silence — no Slack updates
12. Action calls Claude, parses response, commits files
    ↓                                   ⏱ ~10-60s of silence
13. Action opens draft PR, posts link to Slack thread
    ↓                                   ⏱ instant
14. Designer clicks PR link in Slack
    ↓                                   ⏱ ~5s (context switch to GitHub)
15. Designer reviews the diff in GitHub UI
    ↓                                   ⏱ ~2-10min
16. Designer approves / requests changes via GitHub UI
    ↓                                   ⏱ usually merges; sometimes a back-and-forth
17. Merged. Component update is live in main.
```

**Total round-trip time:** ~15-25 minutes assuming the designer reads the Slack post promptly. **Active designer time:** ~5-12 minutes spread across 4 context switches (Slack → Notion → Slack → GitHub).

## Friction points, ranked by leverage

### 🔴 High leverage — ship in v2

#### Friction #1 — The implement keyword is rigid

**Step 9 in the trace.** Designer has to remember exact syntax (`implement <component>`) and the component name. If they type `implement the badge change`, the v1 keyword filter doesn't match. If they type `implement Badges` (plural), the script does a fuzzy match but it's fragile.

**Cost:** ~10-30s of recall + occasional re-tries when the keyword doesn't fire.

**v2 fix (already in scope):** the agentic Claude understands intent across phrasings. "Implement the badge change", "go ahead with badge", "implement the latest from #figma-sync" all route to the implement tool. Component name extraction happens via the agent, not regex. This is one of the core benefits of the v2 architecture pivot.

**Effort:** included in v2 Week 2 build. No incremental cost.

---

#### Friction #2 — Progress visibility during implement

**Steps 11-12 in the trace.** After the designer types `implement Badge`, ~30-90 seconds pass with **zero feedback** until the PR notification arrives. No "fetching Figma...", no "calling Claude...", no "opening PR..." During that window, designers wonder if it worked, double-trigger, or context-switch and lose the thread.

**Cost:** designer trust + occasional double-triggers.

**v2 fix:** the agent posts progress updates in the thread:
- ⚙️ "Fetching Figma context for Badge..."
- 🤖 "Drafting code changes (Claude is thinking)..."
- 📝 "Committing files..."
- ✅ "Draft PR #47 ready — <link>"

Implementation: the agent (or the orchestration layer) posts intermediate messages. On Cloudflare Workers this is straightforward — the Worker fires off a `chat.postMessage` between each stage of the orchestration. Adds ~3-4 Slack API calls per implement run; trivial cost.

**Effort:** ~half-day in Week 2. Add a `progress(stage)` helper that the implement tool calls at each stage.

---

#### Friction #3 — The PRD-review → implement-trigger gap

**Steps 4-9 in the trace.** Designer sees the Slack post, has to click PRD, go to Notion, read, add notes, come back to Slack, find the original PRD post, **type the implement command from scratch**. The Notion → Slack hop loses context: the designer manually re-states what they want to implement.

**Cost:** ~5-15s of redundant typing + cognitive load of switching tools and re-stating intent.

**v2 fix:** make the cron's Slack post **interactive**. Add Slack Block Kit buttons to the PRD notification:
- 📋 "Open PRD" → opens Notion (link button)
- 🔧 "Implement now" → triggers the bot's implement flow without typing
- ⏸️ "Defer" → adds a thread reply marking the PRD as not-yet-actioned

When the designer clicks "Implement now", the button posts a structured payload to our bot endpoint with the component name pre-extracted. No typing, no context switching back.

**Effort:** ~1 day in Week 2. Slack Block Kit is well-documented; Cloudflare Worker handles the button payload. Requires Slack app `interactivity` setting + a request URL for action handling (same Worker URL, different route).

---

### 🟡 Medium leverage — defer to v2.x

#### Friction #4 — PR review back-pressure into Slack

**Steps 14-16 in the trace.** Designer leaves Slack to review the diff in GitHub UI. If something's off, they comment on the PR (in GitHub) and someone (Claude or a human) has to react. There's no Slack-side "looks good / needs changes" flow.

**Cost:** ~5s context switch + the reality that GitHub UI is the right place to review code diffs. The friction is mild.

**v2.x fix candidates:**
- Bot posts a TL;DR of the diff in the Slack thread alongside the PR link ("Updated Badge.scss: 3 token migrations, 1 new variant. View PR for full diff.")
- Bot watches PR comments; if a comment mentions `@uno-bot` or matches a keyword, the bot can respond in the GitHub thread (or re-trigger an implement with the feedback as additional context)
- Reaction-based approval: 👍 on the bot's PR notification means "I reviewed and approved" (informational, doesn't bypass GitHub's merge checks)

**Why defer:** GitHub UI is the right place for code review. Pulling that flow into Slack risks fragmenting the review surface. Worth waiting to see if designers actually ask for it.

**Effort:** ~2-3 days when we tackle it. Not v2.

---

#### Friction #5 — Polling cadence

**Step 1 in the trace.** Polling runs every 15 min during work hours. A designer who publishes at 9:01 waits ~14 min for the next poll cycle. For non-urgent changes this is fine. For "I want to test something now" it's painful.

**Cost:** ~0-15 min wait for the first poll after a Figma publish.

**v2.x fix candidates:**
- **Webhook from Figma instead of polling.** Figma has a webhook API for FILE_VERSION_UPDATE events. Replace the cron with a webhook receiver. Latency drops from "up to 15 min" to "a few seconds."
- **Faster polling cadence.** Every 5 min instead of 15. Triples the Figma API hits (still well within rate limits) but tightens the window.
- **Manual "check now" trigger.** Designer types "uno check figma" in Slack; the bot does an on-demand poll.

**Why defer:** the 15-min cadence has been fine for 6+ months of bot use. Designers haven't complained. Premature optimization. Worth revisiting if we hear "I wish polling was faster" from real usage.

**Effort:** ~1 day for the webhook migration, low risk. Schedule for v2.x or v3.

---

### 🟢 Low leverage — leave alone

#### Friction #6 — Notion as the PRD store adds a hop

**Steps 5-7 in the trace.** Designer has to leave Slack and go to Notion to read the PRD, even though most of the PRD content is also available in Figma + the components-data file in the repo. There's an argument for collapsing the PRD into a Slack message + GitHub PR description, skipping Notion entirely.

**Cost:** ~5-10s context switch to Notion + reading time.

**Why low-leverage:** Notion is already where Plus tracks PRDs across the team (per `docs/figma-sync-workflow.md`). Pulling out of Notion means losing that home. The Notion PRD is also where designers add **implementation notes and acceptance criteria** — that's purpose-built for Notion's editing affordances; Slack/GitHub aren't good substitutes.

**Decision:** leave it. The Notion PRD is a feature, not a bug. The Slack → Notion hop is the cost of having a real PRD-tracking system, which is worth keeping.

---

## Proposed v2 improvements (consolidated)

Three things ship in v2 Week 2, alongside the agentic build:

1. **Better intent recognition for implement** — comes free with the agentic architecture
2. **Progress updates during implement** — agent posts `:gear:` → `:robot_face:` → `:memo:` → `:white_check_mark:` thread messages between orchestration stages
3. **Interactive buttons on the Notion-PRD Slack post** — add "Implement now" and "Defer" buttons; the bot endpoint handles the button payloads

Two deferred:

4. PR review back-pressure into Slack (v2.x)
5. Faster / webhook-based polling (v2.x or v3)

One left alone:

6. Notion as PRD home (intentional)

## Effort estimate for v2-scoped changes

| Improvement | Effort | Where it lands |
|-------------|--------|----------------|
| Better intent recognition | Free (comes with agentic architecture) | v2 Week 2 |
| Progress updates during implement | ~Half day | v2 Week 2, after tool wiring |
| Interactive PRD-post buttons | ~1 day | v2 Week 2, late in the week |

**Total incremental scope on top of the v2 agentic build:** ~1.5 dev-days. Fits in Week 2 without changing the schedule.

## What this audit doesn't cover

- **Designer-team rituals around bot output.** E.g., how does Bill review draft PRs? Does Ashley review every one or only specific pillars? Those team norms affect what "good UX" looks like and deserve their own audit if friction shows up there.
- **First-time user onboarding.** A new rotating-semester designer arrives — how do they learn what the bot does? Today: they don't, unless someone shows them. v2 could add an onboarding flow (designer @-mentions the bot → bot explains itself).
- **Cross-pillar coordination.** When a Figma change touches multiple pillars (Toolkit + Admin), who owns the implement? The current PRD only captures one designer. Out of scope for v2.

These are real but secondary. The six points above are what's actually slowing designers down in the existing flow.

## Open questions for Bill

1. Are designers actually asking for any of the deferred items (PR review in Slack, faster polling)? If so, promote them.
2. Are there friction points you've heard about that aren't in this audit?
3. Are the three v2-scoped improvements (intent, progress, buttons) all worth the 1.5 days, or would you cut one to keep Week 2 leaner?

End of audit.
