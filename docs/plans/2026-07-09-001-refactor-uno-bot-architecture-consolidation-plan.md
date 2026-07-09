---
title: "refactor: uno-bot architecture consolidation — final ADR, capability matrix, full iteration"
type: refactor
status: active
date: 2026-07-09
---

# uno-bot Architecture Consolidation — Final Decision + Full Iteration Plan

## Overview

Consolidates one intensive iteration day (2026-07-09) into a single canonical
architecture decision record for **uno-bot** (the PLUS design team's Slack
Worker agent), a final **can / partial / cannot** capability matrix, a sweep of
remaining obsolete/inconsistent setup, and a phased plan for the rest of the
iteration. Supersedes the architecture narrative fragments across
`2026-07-08-00{1,2,3,4}-*.md` (those remain as historical records; see Phase 5
for superseded-banners).

**Inputs consolidated here** (all from the 2026-07-09 working session):
- Multi-service hosted-MCP rollout (Notion OAuth 2.1 · GitHub · Supabase ·
  Slack live; Figma investigated and rejected — closed catalog).
- Harness consistency audit + fixes (PR #35), harness resilience (PR #36).
- Over-challenge audit → capability walls + preflight backstops (PR #37, open).
- External Slack-bot best-practices research (sourced report).
- User decisions: dials loosened, accuracy law, vision input, relay deferrals,
  document-to-Notion/gist-to-Slack, usage monitoring.

## Problem Statement

uno-bot grew capability-by-capability across sessions; its self-description,
harness docs, code gates, and actual runtime repeatedly drifted apart (audits
found live behavioral bugs, prompt-only "hard gates," and a persona describing
an imagined runtime). Meanwhile real constraints (what a headless Worker is
*good at*) were never encoded as an intentional design — so the bot was
simultaneously over-challenged (asked to do IDE-shaped work) and under-used
(artificial budget limits). This plan fixes both by declaring the architecture,
enforcing it at three layers, and scheduling the remaining work.

---

## Part 1 — Architecture Decision Record (FINAL)

### ADR-1: Two runtimes, one brain-shape — bot ⊂ IDE

The system has **one shared knowledge spine** (`skills/*/references/method.md` +
`docs/conventions/*`) and **two runtime faces**: `SKILL.md` (IDE agent — full
tools: filesystem, shell, subagents, real Figma MCP) and `bot.md` (Slack Worker).
**uno-bot's capability set is a deliberate, enforced subset of the IDE agent's.**
The differences are intrinsic (headless vs. interactive; chat vs. editor), not
provisional. Rationale: shared spine prevents doc drift; two thin faces encode
only runtime deltas.

### ADR-2: The briefing-packet model (stateless brain, assembled context)

The Claude API is rented intelligence with total amnesia. Deterministic Worker
code (`src/agent/skills.ts` — a hardcoded 22-file `SKILL_PATHS` list) assembles
every request: constitution + persona + 6 skills (method+bot) + 6 conventions,
fetched from GitHub Raw (`SKILLS_BASE_URL`) → **merging a doc PR reprograms the
bot within 5 minutes** (TTL'd in-memory cache) without redeploys. Resilience:
every clean assembly is snapshotted to `HARNESS_KV` (last-known-good); degraded
fetches serve the snapshot and post a throttled ⚠️ to `#uno-bot`. Anthropic
prompt caching (1h TTL, byte-stable prefix) makes the always-identical big
packet *cheaper* than "smart" per-message selection. Model portability falls
out for free: the harness is vendor-neutral markdown; swapping Claude→Gemini
would be a client + tool-format change only.

### ADR-3: Rules pushed, facts pulled

**Rules/identity/gates ride in every request** (a rule not in context is a rule
not in force; the model can't fetch a job description it doesn't know exists).
**Facts are fetched on demand** by the model: hosted MCP reads (Notion · GitHub
readonly · Supabase `read_only=true` · Slack), Anthropic server-side
`web_search`, `source_read`, `blueprint_search`. Progressive disclosure of
*rules* is a future option only if the packet roughly doubles.

### ADR-4: The write model — gate what can hurt, free what can't

MCP tools execute inline server-side and **cannot** be intercepted by the ✅
gate. Therefore:
- **Direct via MCP:** only writes that wouldn't need the gate anyway —
  reversible + low-blast-radius = **Slack messaging/reactions/canvases** (the
  bot's native medium; it already replies ungated).
- **Hard-gated own tools** (✅ proposal card, requester-only, 15-min TTL):
  Notion artifacts (`notion_create` prd|intake · `notion_update` ·
  `notion_archive`), `component_implement`, `prototype_scaffold`,
  `shareout_post`, `email_send`.
- **No write path at all:** Supabase/blueprint (server-enforced `read_only`;
  asks convert to a maintenance intake or IDE handoff) and Figma (closed MCP
  catalog; generation is IDE work — bot triggers Figma→code via GitHub Actions,
  never code→Figma).
- Heavy execution is **delegated to GitHub Actions** (figma-implement,
  figma-implement-design, figma-library-poll cron) — the bot proposes and
  gates; runners do the work.

### ADR-5: Relay deferrals — walls are handoffs, never rejections

Every "can't/shouldn't" runs the **wall-ritual**: (1) what + why it's
intentional, (2) a concrete offer — file a ticket (✅-gated intake/card) ·
synthesize into kanban cards · hand a **ready-to-paste IDE prompt with links
pre-filled**. Enforced at three layers, each catch in exactly one: harness
rules (bot.md walls) → code preflight (deterministic, can't be talked out of)
→ runtime caps (last rail).

### ADR-6: The quality law + loosened dials

**"Slow and right beats fast and wrong."** Users accept long-running turns and
multi-turn back-and-forth before a gated send; the hard rule is accuracy — when
input or grounding is missing, **ask**; never deliver a guessed result. Dials
(2026-07-09): 16 iterations · 12 reads · 50-turn thread memory · **flat 8192
output-token ceiling** (a rail, not a target — no per-tier ceilings; unused
budget is free and invisible to the model). Length is persona-calibrated:
**the document of record goes to Notion (via the gated tool payload); Slack
gets the link + a 2–3 bullet gist.** Full documents are never pasted into
threads.

### ADR-7: Vision + honest Figma boundary

The bot receives **images**: Slack-pasted screenshots (≤3/message,
size-guarded, never persisted to history) and auto-fetched **Figma frame
renders** for pasted frame links. Review boundary: **qualitative visual review**
(layout, hierarchy, alignment, glaring contrast) + content/copy/structure =
bot; **quantitative/spec review** (exact WCAG ratios, token fidelity, 44×44
measurement, focus order, responsive behavior) = IDE — computed values, not
pictures. Figma access truth, stated once: text-layer REST reads + rendered
screenshots, no variables/tokens/pixel-computation, no Figma MCP (closed
catalog), no write-back ever.

### ADR-8: Ops posture

At-least-once Slack delivery handled (event-id + per-message dedup); failures
after ack are **user-visible** (⚠️ reply) + ops-visible (throttled #uno-bot
alerts); per-request telemetry logs tier/tokens/cache-hits/**tools used** (the
usage-monitoring loop that feeds future tuning). Prompt pipeline stays
live-fetch (NOT SHA-pinned — reprogram-on-merge is load-bearing; KV
last-known-good covers the failure mode).

---

## Part 2 — Capability Matrix (FINAL — post PR #37 + dials/vision)

### ✅ DOES fully (Slack-native sweet spot)
| Ask | Delivery |
|---|---|
| Status/facts: "where are we on X?" | Grounded answer + citations (blueprint, Notion, GitHub, Slack, web) + confidence line |
| "Who owns / who should review?" | Roster SME match + page owners |
| File a PRD / maintenance intake | Gated card on Roadmap (Pillar + `Maintenance` tag); iterative in-thread drafting welcome |
| Update/archive cards, log decisions | Gated Notion writes |
| "Implement Badge" / "scaffold this frame" | Gated proposal (+frame screenshot) → GitHub Action → draft PR |
| Share-out for feedback | Bundle-enforced post (code bounces incomplete bundles, lists missing links) |
| Thread tl;dr (≤50 turns) | Attributed summary |
| Triage: bug/inconsistency routing | Classified intake + evidence |
| Qualitative visual review | From pasted screenshots / Figma renders: layout, hierarchy, alignment, glaring contrast |
| Copy/content/structure review | Text layers + PRD conformance + terminology |
| Slack messaging/reactions/canvases | Direct (native medium), any workspace emoji |
| Figma usage/practice questions | From docs + web_search; passes along links found in Notion/repo |

### 🟡 PARTIAL — good-enough deliverable + named threshold + relay
| Ask | Delivers | Relays when |
|---|---|---|
| Full PRD | Iterative in-thread draft → files complete doc to Notion; Slack shows gist | Doc-of-record polish/expansion → IDE (`uno-synthesize`) |
| Long-thread synthesis | ≤50-turn window, says where window starts | Full-history pass → IDE |
| Design review | Qualitative visual + full content review, findings labeled | Quantitative/spec (ratios, tokens, targets, focus) → IDE |
| Prototype spec (low/mid) | Trigger→steps→outcome skeleton | Full spec (copy, sample data, states) → IDE |
| Grounding | As thorough as accuracy requires; names gaps | Gap remains → asks, never guesses |
| Sign-off tally | ≤~50 messages, labeled partial beyond | — |
| Marketplace | Catalog search (read) | Publish/edit → IDE `writers/notion` (wave-3 candidate: atomic gated Worker tool) |

### 🔴 REJECTS + routes (wall-ritual, always with the why + offer)
| Ask | Why intentional → route |
|---|---|
| Blueprint/Supabase writes | Source of truth, server-enforced read-only → maintenance intake or IDE `uno-maintain` |
| Figma generation / write-back | No Figma connection possible (closed catalog) → IDE (`uno-prototype` + `figma-use`) |
| Repo edits, multi-file PRs, marketplace publish, Handoff Spec instantiation | Filesystem/iteration runtime → IDE skills |
| Findings & Takeaways doc | Not a bot surface (`notion_create` = prd\|intake) → IDE writes it |
| Scheduled follow-ups / escalation timers | No clock; acts only when messaged → humans/standing sweeps |
| Deep research (>3 docs), eval/lesson logging, visual diffs, replica creation | IDE-only surfaces |

**One-sentence identity:** *uno-bot is the PLUS design team's Slack-native AI
teammate: it answers anything grounded in real sources, executes quick
✅-approved actions, and for anything bigger hands you a solid first draft plus
a ready-to-paste handoff to the full-powered IDE agent.*

---

## Part 3 — Obsolete / Inconsistent Setup Sweep (remaining items)

| # | Item | Evidence | Resolution (phase) |
|---|---|---|---|
| S1 | `uno-maintain` method tracks intake lifecycle in an **`Intake Status`** property that does not exist on the live Roadmap schema | method.md §1/§5 vs. live data-source dump (2026-07-09) | **Decision needed**: add property via API (need lifecycle options from Bill) OR amend method to use existing `Status` (Phase 5) |
| S2 | `email_send` documented as a bot capability but **GMAIL_* secrets are unconfigured** on the Worker | Cloudflare vars audit 2026-07-09 | Decide: configure Gmail OAuth or mark "not yet configured" in AGENT.md/faces (Phase 5) |
| S3 | Redundant read tools now that MCPs are live: `github_read` (GitHub MCP enabled), `notion_search` + `find_experts` (Notion MCP) | tool inventory | Delete after live trial-run validates MCP paths; update faces + tool-definitions + AGENT.md (Phase 2) |
| S4 | `blueprint_search` (bespoke RPC + actor attribution) vs Supabase MCP `execute_sql` overlap | 2026-07-08-004 §1 | Trial-run comparison; keep RPC if attribution quality wins, else retire (Phase 2) |
| S5 | Stale plan docs lack superseded banners: `-001` (thin-router), `-002` (MCP shelving — overturned), `-003` (v4 — landed), `-004` (read-migration — Slack/Figma verdicts overturned by live probes) | docs/plans/ | Add status banners pointing here (Phase 5) |
| S6 | Merged/obsolete local branches (`feat/uno-bot-notion-mcp-and-surface-cleanup`, `feat/uno-bot-figma-rest-decision`, `feat/uno-bot-enable-github-mcp`, `fix/harness-consistency-sweep`, `feat/harness-resilience`; verify `feat/uno-bot-tools-v4`, `feat/uno-bot-sdk-mcp`) + 2 stale stashes | `git branch` / `git stash list` 2026-07-09 | Prune after confirming merged; ask before dropping stashes (Phase 5) |
| S7 | Rolled-back doc fixes from the 07-08 session (marketplace-live wording, findings toll-gate, lesson-model, uno-research write-target) — most re-applied during today's sweeps, needs one verification pass | 07-08 session log | Verify-only sweep (Phase 5) |
| S8 | Eval Runs DB still pending (interim `docs/evals/runs/*.jsonl`) | conventions table | Fold into eval loop (Phase 7) |
| S9 | `pickModel` keyword routing only partially fixed (review→heavy landed in PR #37); no systematic scenario↔tier mapping | anthropic-client.ts | Routing deep-pass (Phase 3) |
| S10 | Slack reaction-gate vs. platform-blessed Block Kit buttons; no interactivity endpoint | research report §d3 | Wave-2 (Phase 4) |

---

## Part 4 — Implementation Phases

### Phase 0 — Land the in-flight branch (BLOCKS everything)
- [ ] Review background-agent output on `feat/capability-walls` (dials 16/12/50 + flat 8192, vision input both paths, usage telemetry, wall softening).
- [ ] Apply final persona tweaks: length-calibration rule + **document-to-Notion / gist-to-Slack** rule next to the quality law; confirm NO per-tier ceilings.
- [ ] Typecheck → commit → **Bill merges PR #37** → deploy → smoke-check `/health` + one message.
- Success: bot answers with new dials; a pasted screenshot is described accurately.

### Phase 1 — Live trial run (validation gate for everything downstream)
- [ ] Scripted Slack session (driveable via session Slack connector): grounded Notion Q, repo/DS Q (GitHub MCP), blueprint Q (Supabase MCP), Figma-link Q (screenshot vision), screenshot-paste review, PRD draft→file flow (gate fires, doc lands in Notion, reply is gist+link), share-out with missing bundle (bounces), blueprint-write ask (wall-ritual fires), long-thread tl;dr.
- [ ] Watch telemetry: `tools=`, `cache_read`, latency; confirm MCP paths actually used over REST fallbacks.
- Success: every scenario behaves per the matrix; failures triaged before Phase 2.

### Phase 2 — MCP lean-up sweep (S3, S4)
- [ ] Delete `github_read`, `notion_search`, `find_experts` (tool code, dispatcher, tool-definitions.json, faces, AGENT.md grounding rules → "GitHub/Notion MCP").
- [ ] `blueprint_search` decision per trial-run comparison; document outcome in conventions.
- [ ] Keep: gated writes, `source_read` (multi-domain), `slack_thread_read` (plumbing-adjacent), REST Notion fallback via `ntn_` key documented.
- Success: tool surface = gated writes + irreplaceable reads only; faces/docs consistent (grep sweep clean).

### Phase 3 — Routing deep-pass (S9)
- [ ] Map every matrix scenario → required tier; audit `pickModel` regexes against the map (drafting/synthesis/review → opus; lookups/confirms → haiku; default sonnet).
- [ ] Add telemetry check: log mis-tier suspicion (heavy keywords at haiku tier).
- Success: before/after table reviewed by Bill; no matrix scenario routes below its tier.

### Phase 4 — Slack platform wave-2 (approved; research report recs 2–4 + §d3)
- [ ] **Block Kit approve/deny buttons** on proposal cards (interactivity request URL + signed `block_actions` handler; reactions remain a fallback). Closes the platform-guidance gap; reduces event noise.
- [ ] **Streaming replies** via `chat.startStream`/`appendStream`/`stopStream` (Tier 2, `chat:write` only) with `chat.update`-throttle fallback.
- [ ] **Feedback capture**: `feedback_buttons` 👍/👎 on substantive replies → log to KV/jsonl (feeds Phase 7 evals).
- [ ] **Staging bot**: second Slack app + `wrangler` env pointing at a branch `SKILLS_BASE_URL` for canarying prompt changes.
- Success: buttons resolve gates end-to-end; streamed first token < 3s perceived; feedback events land in the log.

### Phase 5 — Consistency closeout (S1, S2, S5, S6, S7)
- [ ] S1 decision with Bill → apply (API property add or method.md amend).
- [ ] S2 decision → configure GMAIL_* or annotate as unconfigured.
- [ ] Superseded banners on `2026-07-08-00{1,2,4}` (and mark `-003` landed).
- [ ] Branch prune + stash review (ask before dropping).
- [ ] S7 verification grep-sweep; file fixes if any regressions.
- Success: repeat of the consistency audit returns zero findings.

### Phase 6 — Designer README (`agents/uno-bot/README.md`)
- [ ] Non-technical explainer: the brain/briefing-packet model; "merge a doc = reprogram the bot"; rules-pushed/facts-pulled; why the ✅ gate exists.
- [ ] The capability matrix (Part 2) verbatim as the usage contract + scenario walkthroughs (one per skill) + FAQ (from this session's Q&A: why no Figma, why docs go to Notion, who assembles context).
- [ ] Link map: which doc controls which behavior (AGENT.md ↔ bot.md ↔ method.md ↔ conventions).
- Success: a new designer can predict what the bot will/won't do without asking.

### Phase 7 — Eval loop (S8; pairs with Phase 4 feedback)
- [ ] Golden Slack transcripts per matrix row (happy + wall + gate cases) in `docs/evals/scenarios/uno-bot/`.
- [ ] Runner (IDE-side or CI) scoring against rubrics; wire 👍/👎 stream as regression seeds.
- [ ] Eval Runs DB in Notion or keep jsonl (decision), retire the "pending" marker.
- Success: prompt-change PRs can cite an eval run; feedback data reviewed in the monthly retro.

## Dependencies & Risks

- **Phase 0 blocks all.** Phase 2 gated by Phase 1 results (never delete a working fallback before its replacement passes live).
- **MCP connector is beta** (`mcp-client-2025-11-20`): shape may move; mitigation = REST fallbacks retained until Phase 2, and even then `ntn_` read fallback stays.
- **Slack MCP posts as the consenting account** (user-token): acceptable per decision; revisit if identity confusion appears in practice.
- **Cost growth** from loosened dials + vision tokens + 1h cache writes: telemetry (Phase 0/1) is the watchdog; revisit dials with data, not fear.
- **Vision inputs are untrusted content**: screenshots/frames can contain adversarial text; harness already treats fetched content as data, and writes stay gated — keep it that way.
- **Concurrent editing** by Bill on skill files (clobber risk seen 07-08): phases touching `skills/**` announce a window first.

## Success Metrics

- Zero findings on a re-run consistency audit (Phase 5 exit).
- Trial-run matrix pass rate 100% before lean-up.
- ≥1 real designer completes a PRD file→IDE-expand relay without help (README + walls working).
- Telemetry shows MCP reads carrying ≥90% of grounding calls post-Phase-2; cache_read > 0 on ≥80% of consecutive-traffic requests.
- Feedback loop live: ≥1 eval regression caught from a 👎 within the first month.

## Sources & References

- **Session artifacts (2026-07-09):** consistency audit (PR #35) · harness resilience (PR #36) · over-challenge audit + capability walls (PR #37, open) · Slack best-practices research report (sourced: docs.slack.dev events/streaming/AI-apps, Cloudflare agents example, Anthropic caching docs, Vercel ai-sdk-slackbot).
- **Prior plans:** [2026-07-08-003-uno-bot-tool-surface.md](2026-07-08-003-uno-bot-tool-surface.md) (v4 tool registry — mechanical/editorial split retained) · [2026-07-08-004-uno-bot-mcp-read-migration.md](2026-07-08-004-uno-bot-mcp-read-migration.md) (per-service research; Slack/Figma verdicts overturned by live probes 2026-07-09).
- **Live infra state:** Worker `uno-bot` (Cloudflare, root `agents/uno-bot`), KVs: `NOTION_OAUTH_KV`, `SLACK_OAUTH_KV`, `HARNESS_KV`; MCPs consented: Notion, Slack; enabled: GitHub, Supabase; Roadmap `Product Tag: Maintenance` option added via API.
- **Key conventions:** `docs/conventions/notion.md` (gate principle, write-surface allowlist) · `agents/uno-bot/AGENT.md` (lanes, wall-ritual, quality law).
