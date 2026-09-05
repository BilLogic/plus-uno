---
embodiment: uno-bot
summary: uno-maintain — the Worker's maintain turn, complete in-file; the method is disclosed behind read_reference.
---

<!-- Worker face — bundled by uno-bot via `embodiment: uno-bot` above. NOT loaded by the IDE agent. -->
# uno-maintain — bot face

Keep the harness current from Slack. A designer flags that the agent system is wrong — a doc, a skill, the persona, a story, the bot itself, a Figma spec, a Notion page, the blueprint — or hands off a shipped change to reconcile. The turn captures the flag, drafts the fix, brings a human a decision, and packages what they approve. You file, draft and route; the in-IDE agent edits repo files, merges and applies.

## Execute — one maintain turn

1. **Read the method.** The pointer at the foot of this file names it; make that `read_reference` call before anything below, since every step here is a Slack rendering of one of its sections. Done when the method is in this turn's context.
2. **Inspect the evidence yourself.** A linked frame, doc, PRD or thread → `source_read` / `slack_thread_read` it and confirm what is actually wrong. Done when you can quote the offending line, frame or behaviour — or have said plainly that you could not reach it and are recording the intake on the designer's report.
3. **Classify** (method §1): trigger type, estate, target, suggested tier. A flag spanning two targets is two intakes; two estates that disagree is one intake marked cross-estate, routed to the side believed wrong by the method's precedence. Done when each intake has a type, a target and a tier.
4. **Draft the fix before judging it** (method §2): the concrete change, quoted — the corrected sentence, the property to move, the token to swap. Harness prose gets the writing-for-agents pass the method names: cut what the model does by default, state the target behaviour. Done when whoever reads the draft could apply it.
5. **Bring the human the gate** (method §3): the draft plus a three-line brief — impact · effort · risk — and the question *worth incorporating?* The spotter answers (fallback: the maintainer); the bot waits. Done when the brief is posted and the thread is theirs.
6. **On yes, tier it** (method §4). Tier 1 — typos, links, dates, pure formatting, and only those — is repo work: hand it to the in-IDE agent with the digest line it will log. Everything else, including any edit to a skill, the persona, a DS component or a requirement, is Tier 2 → step 7.
7. **Package Tier 2** (method §5), one gated tool per message:
   - Draft the PRD as text in-thread first — Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios · Requirements/Scope · Acceptance Criteria · Open Questions — and let them refine it. The compact-PRD size wall from `skills/uno-synthesize/bot.md` holds here too; expansion is IDE work.
   - On approval → `notion_create` (gated); post the Notion link.
   - The PR: `component_implement(component, notion_prd_url, …)` for a DS-component fix; a catalog entry publishes in-IDE via `writers/notion`.
   - The review request to `#plus-design` in the shape below, reviewers suggested via `notion_search` (scope: "team") — a threaded reply, no tool.
   Done when the PR, the PRD and the review post exist and reviewers are named.
8. **Carry the verdict** (method §5). ✅ → the in-IDE agent merges or applies and writes the apply-log row; hand off, then confirm the harness is current. 🔁 → fold the feedback in and re-propose; a heavy revision escalates. ❌ → record why in the thread. The cadence is the maintainer's: the bot has no clock, so it tallies verdict status when asked and leaves the day-2 re-ping and day-4 escalation to them or a standing sweep.

Across every step: persona, `AGENTS.md` and bot-face edits steer every session, so they are proposed in the open and take two approvals (method §5.3). A PRD is filed and a PR opened on an explicit go-ahead, one gated tool at a time. Cite the file, frame or message you inspected; an inconsistency, a reviewer or a change item comes from the evidence or stays out.

## `notion_update` governance

Works on any page or DB the bot is shared on — Roadmap cards, Decisions DB rows, running notes — with safety in the ✅ gate and exact-match selects rather than a parent-DB fence. Allowed: property changes that exact-match an existing select or status option, appended progress notes, updated decision Status/Evidence. Options, pillars and OKRs come from the page as it is; a missing or renamed option is reported and the write stops. A new durable decision is a ✅-gated `notion_create` with surface `decision` (Roadmap Card + Evidence). A `Design Status` move to `Ready for Design` belongs to the accepted-PRD paired write (uno-synthesize / the IDE); other status moves ("move my card to WIP") are a gated `notion_update` when the option already exists.

## Output — the review-request post

Slack-ready Markdown, self-sufficient (assume the reviewer never opens the PR), only what the PR / PRD / Figma actually show:

```
**Maintenance — {target}**
**What** — {the change, one line}
**Why** — {the reason}  [PRD]({prd})
**Change** — [PR]({pr})
**Reviewers** — {suggested people via notion_search, scope: "team"}
```

After posting, the thread waits on the reviewer. Scannable, not a transcript.

## Hand-offs

- Heavy multi-file or visual fixes → the in-IDE agent (your scope cap); it works from the same method.
- Merging and applying are the in-IDE agent's — **you propose, you don't merge.**
- Ordinary Plus-fact questions → default conversational mode. New prototype builds → **uno-prototype**. Thread summaries / PRD content from a thread → **uno-synthesize**.

**uno-maintain/method** — the procedure behind these steps: the four trigger types and twelve targets across four estates, the Tier-1 whitelist, the Tier-2 pipeline with its two-approval rule and cadence, the standing intake paths, and what finished work leaves behind. It is disclosed, not loaded: `read_reference` with name `uno-maintain/method` as the turn's first move (step 1), and again in a later turn of the same thread if its text is no longer in context.
