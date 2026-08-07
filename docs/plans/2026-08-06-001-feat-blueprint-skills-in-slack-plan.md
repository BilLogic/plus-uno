---
title: "Blueprint in Slack: deepen the tool, don't port the skills"
type: feat
status: draft
date: 2026-08-06
supersedes: the first draft of this file, which planned three new slash commands
---

# Blueprint in Slack

**Revised 2026-08-06.** The first draft planned `/uno-whatif`, `/uno-slice`, and
`/uno-audit` as ports of the `sb:*` skills. That was wrong, and the reason is
worth keeping: there are already two consumers doing this properly, and a third
weaker one helps nobody.

| consumer | tier | job |
|---|---|---|
| **IDE plugin** (`sb:*`, v0.2.2) | filesystem + subagents + Python | authoring, import, orchestration, sign-off |
| **blueprint app** (`plus-uno-blueprint`) | `service` — writes | the canvas: draw slices, triage findings, edit cells |
| **uno-bot** | `anon` — read | answer "how does this work today?" where the question gets asked |

A `/uno-slice` that cannot save the slice or draw it is a demo. uno-bot's edge
is not running the skills; it is **being in the conversation** — grounding an
answer in the blueprint while someone is mid-thread in `#plus-design`, then
handing off to whichever surface can actually do the work.

**No new slash commands.** The plan is: read more of the blueprint, cite it
properly, and link into the app.

## Access, confirmed

`supabase/DATABASE.md:117` — *"Blueprint tables and `services` have RLS enabled
with public `SELECT` policies. No write policies yet."* The 2026-08-05 tier
migrations add RESTRICTIVE write policies scoped to `authenticated` and state
*"anon is untouched"*, with a three-tier model: `service` (edit) →
`authenticated` (view + agent chat) → `anon` (read).

So uno-bot's anon key is exactly the unauthenticated-browser tier — the ceiling
is correct by construction, not by our restraint. `cells`, `cell_triggers`,
`findings`, `slices`, `slice_items`, `evidence`, and `propositions` are all
readable.

## What to build

**1. Widen `blueprint_search` beyond cells.** It reads cells today. Anon can
also read:

- **`cell_triggers`** — the `trigger`/`needs` edges. This is what makes "what
  breaks if we drop X" answerable rather than hand-wavy; it is the
  `impact-tracer` subagent's job in the plugin, reduced to a graph read.
- **`findings`** — audit results that already exist. "What's flagged here?"
  becomes a read, not a re-run of the roster.
- **`slices`** — named views someone already cut, so the bot can point at one
  instead of improvising a worse version.

**2. Hand out deep links.** The app is at `https://uno-blueprint.netlify.app/`
(already linked from App Home). Observed in dev: `?slice=<uuid>` selects a
slice. **Verify the full param surface before relying on it** — code search on
the repo returned nothing indexed, so the scheme below is a proposal, not a
confirmed contract:

| answer type | link |
|---|---|
| a cell or step | deep link to that cell in the canvas |
| a named slice | `?slice=<uuid>` |
| a scenario walkthrough | scenario/path selector |

This is the "complementary material" case: when someone asks about a
complicated journey, the honest answer is three sentences **and a link to the
thing that shows it**, not five paragraphs trying to be the canvas.

**3. Teach consultation in the harness.** When to consult the blueprint, how to
cite by cell key, and the existing conflict rule (blueprint = today, Roadmap =
planned; surface conflicts, never blend).

## User stories

**Grounding mid-conversation** — the common case.
> In `#plus-design` someone asks *"wait, does the tutor see the goal card before
> or after check-in?"* The bot answers from the blueprint in two sentences,
> cites the cell, and links the scenario in the app for anyone who wants the
> picture. Nobody opens the canvas unless they want to.

**Impact check before a PRD** — the whatif value, without the skill.
> *"If we drop the manual roster confirmation, what else moves?"* The bot walks
> `cell_triggers` from that cell and names what depends on it, cited. It does
> **not** produce a whatif variant or promote anything — it says which cells
> would need attention and hands off to the app for the real trace.

**Reading existing findings** — the audit value, without re-running it.
> *"Anything already flagged on Warm-Up?"* Reads `findings`, reports severities
> by cell key, links each into the app for triage. Triage stays a write, so it
> stays in the app.

**Pointing at a slice instead of improvising** — the slice value.
> *"Do we have something I can show the client about the tutor journey?"* If a
> slice exists, the bot links it. If not, it says so and routes to `sb:slice` in
> the IDE rather than inventing a worse one in a Slack message.

**Conflict surfacing** — the thing only the bot is placed to notice.
> Someone quotes a Notion doc that disagrees with a blueprint row. The bot
> surfaces the conflict with both sources rather than blending them, and names
> which one is the today-baseline. This is already the tool contract; widening
> the reads makes it fire more often.

## Sequencing

1. Verify the deep-link param surface against the deployed app.
2. Widen the reads (`cell_triggers`, `findings`, `slices`) behind the existing
   `blueprint_search` tool — one tool, richer payload, no new commands.
3. Deep links in answers.
4. Harness guidance for consultation and citation.
5. Judged evals for each — blueprint answers are exactly the shape that passes
   deterministic checks and fails a judge (see S1/S2, 2026-08-06).

## Open

- Deep-link params unverified.
- Whether `search_blueprint` and the `semantic_search` schema are actually
  deployed; the code silently falls back, so the bot may be on the slow path.
- Whether widening the payload costs subrequests we do not have. Each extra
  table read is a subrequest against a 50-per-invocation budget, and the
  blueprint path already spends up to 5 on the fallback route.
