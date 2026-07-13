# Field Scan → uno-bot Improvement Backlog (2026-07-12)

> From benchmarking the always-on-Slack-teammate field (Claude Tag, Cursor, Codex, Copilot,
> Devin, Ramp's Inspect + Research, OpenClaw, Slackbot-as-agent, Notion Custom Agents).
> Trend narrative lives in the recap §0 "The tailwind"; this file is the actionable half:
> what the field does that we should adopt, ranked by fit with our own corpus evidence.

## Ranked improvement ideas

| # | Idea | Who does it | Why it fits us | Effort |
|---|---|---|---|---|
| 1 | **Ambient follow-up on stale threads** — periodic sweep for unresolved asks past N days, nudge in-thread | Claude Tag ("follows up on forgotten threads") | Continuity-recap is our measured #2 demand (19/170) and hides in DMs; today our proactive mode is only event/cron-triggered | Medium — new cron + thread-state scan |
| 2 | **Per-project Canvas the bot keeps updated** — status, decisions, links; durable answer to "where did we leave off" | Codex/Devin (persistent task links) | Gives continuity recaps a durable artifact instead of thread scroll-back; we already have `slack_create_canvas`/`slack_update_canvas` | Low-Medium — tool exists, needs ritual |
| 3 | **Observed-decisions log** — when a thread resolves with a clear decision, bot proposes (gated) appending it to a decisions page | Claude Tag's passive context-building, bounded by our gate | "The decision log is the missing source of truth" is our own diagnosed root cause across two themes | Medium |
| 4 | **Channel-level memory** (not just thread-level) — recent decisions, open questions, owners per channel | Claude Tag (one instance per channel) | Our DO state is thread-scoped; channel context would cut re-explaining | Medium-High |
| 5 | **Self-verification pass before presenting drafts** — cheap inline judge against our own rubric before sending | Ramp Inspect (runs tests/screenshots before presenting) | We already built the rubric + LLM judge for evals (§8); run a light version pre-send | Low-Medium |
| 6 | **Scheduled digest** — weekly "Figma→code drift + unanswered spec questions" post | Ramp Research (10–20x lift once on-demand in Slack) | Wayfinding + spec questions are our #1/#3 themes; a digest pre-empts them | Low |
| 7 | **App Home tab rendering the capability contract live** | Slack AI assistant surfaces | Makes the ✅/🟡/🔴 contract discoverable in Slack itself; pure rendering of the existing markdown brain | Low |
| 8 | **Read the whole thread before delegating builds** | Cursor background agents | Reduces re-explaining on `implement <Component>`; we sometimes only use the trigger message | Low |
| 9 | **Voice-clip task briefing** | Devin (record audio to brief) | Low-friction for on-the-go designers; Slack voice messages exist | Medium (transcription path) |
| 10 | **Mention-the-bot from Notion comments** as an alternate trigger | Copilot's Linear integration | Cuts the Figma→Notion→Slack round-trip for PRD work | Medium-High |

## Verdicts (Bill, 2026-07-12)

| # | Idea | Verdict |
|---|---|---|
| 1 | Ambient stale-thread nudges | **Dropped** — too rare for us |
| 2 | Per-project Canvas | **Refined → catch-me-up capability** (see below) |
| 3 | Observed-decisions log | **No new build** — the new project-hub Notion template produces decision logs as the bot follows the routine (forward-only). Probe: test bot read/update/answer on recent projects that already have one |
| 4 | Channel-level memory | **Refined** — shared team Design Notes DB with filtered views per running-notes page |
| 5 | Self-verification pass | **Approved** ("very legit") — light D1–D9 judge pre-send |
| 6 | Scheduled digest | **Nice-to-have, reframed** — lead with what the bot did proactively |
| 7 | App Home contract tab | **Dropped** |
| 8 | Read whole thread before delegating | **Approved** — within contract: bot never edits repos, it only enriches the payload the gated GitHub Actions runner receives |
| 9 | Voice-clip briefing | **Dropped** |
| 10 | Notion-comment triggers | **Dropped** — can't make it work |

**Catch-me-up capability (promoted from #2 + hindsight-gap review).** Recipe: resolve the
requester → past week's running-notes pages (Design Running Notes DB, via Note Takers) →
cards the requester is tagged on (Roadmap DB, Contributor/Dev) → linked Zoom pages via web
fetch. Foundation check 2026-07-12: Note Takers populated 90/105; Contributor on 191/244
recently-edited Roadmap cards — one tagging cleanup pass recommended before building.
Corpus support: continuity recap = 36 requests, 50% repeat rate, 35/36 bot-addressable.

**Developer rollout test battery** (from the 24 dev requests in the corpus): spec-field
semantics; spec detail lookup (tooltip copy, required fields, thresholds, badge rules);
"was this intentional?" → route to designer with context; Figma wayfinding ("where do I
start for card N"); Notion wayfinding ("card N not on either board"); policy/access →
route to owner, never answer policy itself.

**Access-request routing (approved).** Ground truth = Third Party Applications DB
(Power User(s) relation + Application Admin people per service). Bot suggests the person
and pre-fills the ask; the grant stays human. Meeting-recap ingestion was reviewed and
dropped as negligible.

## What we already do that the field doesn't

- **Pre-execution confirmation gate** (proposal card, requester-only ✅, deterministic
  confirmation parsing, non-silent expiry). The field's default is post-hoc review of
  auto-executed work. This is our differentiator — keep it, and say so in the article.
- **Evidence-corpus scoping and a published capability contract** — nothing in the field
  derives bot scope from mined demand or publishes a team-facing can/partial/can't table
  (also confirmed by the earlier skills-landscape benchmark in the skill plan §7).

## Trend receipts (for the article)

- Cursor background agents in Slack — June 12, 2025 ([changelog](https://cursor.com/changelog/1-1))
- Codex in Slack GA — October 6, 2025 ([OpenAI](https://openai.com/index/codex-now-generally-available/))
- Copilot coding agent in Slack + Linear — October 28, 2025 ([GitHub](https://github.blog/changelog/2025-10-28-work-with-copilot-coding-agent-in-slack/))
- Slackbot relaunched as a context-aware agent — January 13, 2026 ([Slack](https://slack.com/blog/news/slackbot-context-aware-ai-agent-for-work))
- Claude Tag — June 23, 2026; "65% of our product team's code" ([Anthropic](https://www.anthropic.com/news/introducing-claude-tag))
- Ramp: Inspect writes ~30% of merged PRs ([Ramp](https://builders.ramp.com/post/why-we-built-our-background-agent)); Ramp Research 1,800+ questions, 10–20x lift ([Ramp](https://builders.ramp.com/post/meet-ramp-research))
- OpenClaw: viral Nov 2025–Feb 2026; creator joined OpenAI ([Wikipedia](https://en.wikipedia.org/wiki/OpenClaw), [TechCrunch](https://techcrunch.com/2026/02/15/openclaw-creator-peter-steinberger-joins-openai/))
- Notion Custom Agents in private Slack channels — May 1, 2026 ([Notion](https://www.notion.com/releases/2026-05-01))

**"Tommy Gecko" verdict:** best candidate is **Tommy Geoco** (designer, Dive Club podcast,
runs a design-creators Slack; describes his always-on agent "Beans" that wakes every 30
minutes, checks his operation, fixes what it can — "persistent context + specialized agents
+ review loops"). Moderate-high confidence on the name match, not confirmed — cite as
inspiration only if verified. ([UX Tools piece](https://www.uxtools.co/blog/the-next-gap-in-design-work))
