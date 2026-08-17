# UNO Bot — future-state blindness and the preload/search split

Date: 2026-08-17 · Intake: Slack DM `D0APTB20SK0` p1786989040489759 · Branch: `fix/uno-bot-future-state-blindness` · Tier: 2

**Deepened 2026-08-17** by eight parallel agents (ToC implementation · deletion budget · drift-sweep hook · PR #117 reconciliation · knowledge retrieval · simplicity · architecture · agent-native). Corrections they forced are marked **[corrected]**.

## Problem

Asked for "the link to the future state of the lead tutor's post session reflection", the bot said the blueprint holds only current state and no such future state exists. It does: a path named `Future (roadmap)` under **Wrap-Up**, 8 cells, added 2026-08-08, indexed. It also called Wrap-Up "Post-session" — Wrap-Up is **In-session**. Corrected, it restated the same three links at greater length, pitched a PRD again, and claimed "I checked … just now" while cached results were likely being served.

## Root cause

Instance data about blueprint *contents* frozen into a deploy-time artifact while the blueprint changes daily. `scripts/bundle-harness.mjs` bakes 22 files into `src/generated/harness.ts` (**154,030 chars post-strip**), Block 0 of every request, updated only on manual deploy (ADR-014 amendment already recorded this consequence).

This is ADR-013 §6 — *"cache the foundation, retrieve the rest"* — violated. The invariant is a repo principle, not this plan's opinion.

**[corrected] The cost framing was overstated.** The Gemini production lane *does* cache: build-recap §5 lists "implicit caching"; a prior plan records the harness served from a Gemini explicit cache with `cached_in` logged. Per build-recap §5, *"let hallucination, not latency, be the veto"* — **if a size reduction would cut a rule that prevents a confident-wrong answer, the budget yields.**

| Symptom | Mechanism |
|---|---|
| Denied future state | `tool-definitions.json:82` axiom, echoed in `AGENT.md`, `supabase.md` ×2, `scope-keywords.ts:45`, `blueprint-search.ts` |
| Mislabeled the phase | `phases` never joined into the chunk view; semantic rows carry no phase, yet citations require one |
| Missed the future path | `SEMANTIC_MATCH_COUNT` 6 of ~839; short-circuits on ≥1 hit; no `paths` in `SOURCES`; cells matched on `content` only; empty-`content` cells dropped |
| Doubled down | No correction rule. History persists `{role, content}` only — tool results never saved |
| Two PRD pitches | Wall-ritual fires on "found nothing" |

**[corrected] Most of changes 1, 2, 4, 5 are already drafted in the working tree.** `SEMANTIC_MATCH_COUNT` is 15, `paths` is in `SOURCES`, `description` is searchable, `draft-judge` D9 is aligned. Genuinely unbuilt: the ToC, the cache-bypass wiring, the size reduction, the drift guard.

## Design

Preload **contracts and reading rules**. Search **contents**.

Refined invariant: **instance *inventory* is a bug; instance *vocabulary* is a contract.** Layer names and the `Future (roadmap)` marker are vocabulary — they stay. Counts and membership lists are inventory — they go.

### ToC and migration 0004 are not substitutes **[corrected]**

The plan previously dropped 0004 as redundant. Wrong — they fix different failures:

- **0004 (phase in the chunk view)** — citation accuracy for a row you *did* retrieve. It also embeds phase words into the chunk *text*, so phase becomes retrievable. No tool-result attachment can do that.
- **ToC** — knowing what you *failed* to retrieve. Existence, not location.

Keep both.

### ToC shape (measured)

One PostgREST call: `/phases?select=name,service_scenarios(name,paths(name))&order=order_position`. **Verified live: HTTP 200, 2,308 bytes, 6 phases / 23 scenarios / 39 paths**; five scenarios carry a future path (Interview & Offer, Session Sign Up, Standard Scheduling, Call-off Request, Wrap-Up). Rendered compactly ≈ **182 tokens**.

**[corrected] Budget:** the ceiling is `LOOKUP_CEILING = 38` (ADR-022), not 50. Worst-case `blueprint_search` today is 11; unconditional ToC makes it 12, and the design *mandates* re-queries — three searches a turn is 36 of 38. **Therefore the ToC must be module-scope memoized with its own ~10-minute TTL and must NOT be invalidated by `fresh: true`.** Orientation is per-isolate data; cells are per-query data. That makes it +1 per isolate, not per call.

Failure handling follows the codebase's existing degradation pattern, with one addition: an explicit `orientation: "live" | "cached" | "unavailable"` field mirroring `retrieval`, and a note that fires **only** when unavailable. An omitted key is indistinguishable from "no future path exists" — regenerating the original bug.

Carry `phase`, `path_names[]` and `cell_count` per scenario, and state the precondition as a rule about the *claim*: **you may assert a scenario has no future state only when its ToC row shows no `Future (roadmap)` path.** That turns a false negative from an inference into a lookup. `cell_count` also replaces the calibration lost with §8's deleted coverage leaderboard — live, instead of baked. Note the size tradeoff: names-only + counts measures ~182 tokens; adding all 39 path names pushes it to 600–900. Ship the compact form.

### The constraint that governs the ToC **[corrected]**

**Tool-payload instructions are not additive.** On 2026-08-06 a `slack_search` fix displaced an unrelated instruction and broke a different eval case. The ToC adds a block beside a `notes` array ADR-021 tuned. Required protocol: judged evals green at baseline · **flag off by default, enabled in one DM first** · post-change evals compared **case by case** (a stable total hides one case breaking as another recovers).

This incident lives only in `docs/plans/`, never promoted to `docs/knowledge/` — which is why a plan written today was unaware of it. Promoting it is part of this work.

## Latent bugs found while deepening — same defect class, must ship together

1. **`truncated` is hardcoded `false` on the semantic short-circuit** (`blueprint.ts:198`) while the result is capped at `SEMANTIC_MATCH_COUNT = 15`. The most common result shape reports "this is everything" while clipped — a structural false negative sitting beside the one being fixed. Fix: `truncated: rows.length >= SEMANTIC_MATCH_COUNT`, plus a `capped_by` discriminator.
2. **No cache-hit signal.** `searchBlueprint` returns cached results at `:176` before any logging or annotation. `AGENT.md` demands a freshness claim be backed by a fetch *this turn*, but nothing distinguishes a fetch from a cache hit — the same "must supply a field it is never given" defect as the phase. Add `cached: boolean` + `age_ms`. **Eval R14 is unfalsifiable until this lands.**
3. **The zero-row note will contradict the ToC.** `blueprint-search.ts:107-109` says "the blueprint has nothing on this" — wrong the moment the ToC shows the scenario exists. Rewrite in the same PR, or the two give opposite instructions.
4. **Retrieval quality is computed and discarded.** Per-row `similarity` (`:295`) and `SEMANTIC_THIN_RESULTS` (`:52`) exist; neither surfaces. Emit `thin` and `top_score`.
5. **No structural navigation primitive.** `blueprint_search` requires free-text and rejects empty — the agent can only reach a browsable tree by guessing terms, which is the mechanism of this incident. Consider `scope: {scenario?, path?}` to list cells directly.

## Making correction structural, not instructional

`HistoryTurn` is `{role, content}`; `buildThreadHistory` (`events.ts:875-903`) rebuilds from raw Slack text and returns at `:897` without touching the DO in the common case. Tool results are never persisted. So on turn 2 the agent's own false claim sits in context as authoritative prose with no counter-evidence — **a positive feedback loop, not merely a missing trail.** A prompt rule competes against context that already looks like the answer, and fires exactly when instruction-following is weakest.

- **Detect correction in the Worker.** `loop-shared.ts:203-231` already establishes the pattern (`CONFIRM_PHRASES`, `looksLikeResolution` — Worker-side classifiers driving control flow). Add `looksLikeCorrection()`; on a hit force `fresh: true` and inject a one-turn directive naming the prior query so it cannot be reissued.
- **Persist a retrieval receipt, not rows:** `retrieval?: {tool, query, path, count, scenarios[]}` on `HistoryTurn`. Merge by message `ts` — `buildThreadHistory` short-circuits the DO, so a receipt added only there is invisible on the common path.
- **`draft-judge` is blind by construction**: it skips drafts under `MIN_DRAFT_CHARS = 1500` (the failing denial was short — never judged), and `reviewDraft` takes `{userText, draft}` only, so it cannot know this is a correction turn. Add `priorAssistantText` + `toolsUsedThisTurn`, bypass the length floor on a detected correction, and gate: *if the user's message is a correction and the draft neither cites a source fetched this turn nor concedes error, fail.*
- **Reuse `revision-guard`.** `shouldRejectRevision` already encodes "too similar = malfunction". The mirror — a turn-2 reply near-identical to turn-1 after a correction — is the same machinery and catches R14's fail condition without a model call.

## Observability — an operator could not tell this happened

No correlation id on any `[blueprint]` line (`:194`, `:224`) or per-request line; cache hits produce **no log at all**, so the failing thread looks like it never searched; `draft-judge` skips are never logged. Add channel+ts correlation (already in scope at both sites), log cache hits, log skips with `draft_chars`, and emit one structured line on delivery: `[answer] corr=… tools=[…] blueprint_rows=N cached=… negative_claim=… correction_turn=…`. Two alerts then catch this class:

- `negative_claim=yes AND blueprint_rows>0` — asserted absence while holding evidence.
- `correction_turn=yes AND blueprint_search not in tools` — doubled down without re-reading. Subject-independent, and the more valuable of the two.

## Budget — reset, not append

**[corrected] Measure the assembled bundle, not source files.** `ide-only` regions are stripped; `tool-definitions.json` is not bundled at all. Real drafted delta: **+6,500 post-strip chars**, not +8,254.

**[corrected] Do NOT delete the SQL query recipes.** They are inside `ide-only`, cost **zero** bundle chars, and four files promise them to IDE agents who have no `blueprint_search`.

| File | HEAD | drafted | proposed | vs HEAD |
|---|---|---|---|---|
| `AGENT.md` | 27,574 | 29,900 | 28,420 | +846 |
| `blueprint-navigation.md` | 9,397 | 12,813 | 7,297 | −2,100 |
| `supabase.md` | 5,529 | 6,287 | 4,465 | −1,064 |
| `terminology.md` | 6,940 | 6,940 | 6,210 | −730 |
| others + dividers | 104,590 | 104,590 | 104,590 | 0 |
| **assembled harness** | **154,030** | **160,530** | **150,982** | **−3,048** |

`AGENT.md` alone stays +846 over HEAD — the behaviour rules cost more than its internal de-duplication recovers. Getting that file negative means cutting Slack etiquette or Identity, out of defect class. The whole-harness figure absorbs it.

Principal cuts: the `Future (roadmap)` contract currently appears in **six places** — collapse to the tool description + the runtime note + one `supabase.md` routing row. The backtick guardrail in `AGENT.md` is verbatim `terminology.md:83`. An HTML TODO comment in `AGENT.md` ships to production (only `ide-only` is stripped). Nav-guide §2's "Phases are a query" paragraph, §4's Goal Setting instance block, §8's changelog prose, and rules 5–7 that duplicate `AGENT.md`.

Acceptance: assembled `harness.ts` smaller than baseline **and** within `loading-order.md` Tier-1 char budget (ADR-011 amendment — a relative test can pass while still over the absolute one). Report the delta in the PR.

## Drift guard **[corrected]**

Not a `harness-intake` issue. **The queue has 14 open issues, oldest 2026-07-17, and no automation reads it** — the drain is prose. The repo already ran this experiment: registry checks "caught drift by luck" until promoted to deterministic steps.

**There is no PR CI in this repo** — every workflow is `schedule` or `workflow_dispatch`. The one blocking gate is `npm run deploy`.

- **Tier 1 (blocking):** a guard inside `bundle-harness.mjs`, after the existing `ide-only` survival check, run on the **assembled string** — which makes SQL false positives vanish for free (`union all select` appears 0 times in the bundle). Strip dates first; require a blueprint noun adjacent to the digit; provide an `<!-- instance-data-ok: reason -->` escape, which is **required** because the refreshed nav guide deliberately keeps a rot ledger. Run log-only for one cycle before making it blocking.
- **Tier 2 (advisory):** enumeration-vs-live comparison needs DB access the sweep runner doesn't have. Add **section E** to `staleness-sweep.md` (and bump the adapter's "sections A–D" to "A–E", or section E never runs), executed in-IDE where the Supabase MCP exists.
- Also add `bundle:harness --check` — it is the only generator in the repo without a `--check` counterpart.

**Live find:** `terminology.md:66` enumerates the phases as a closed list of **five**; there are six. Committed, bundled, shipping today. The manual nav-guide fix did not fix the class — proof the guard is the actual deliverable, not the doc edit.

## Sequencing **[corrected]**

Basing on `feat/blueprint-share-links` (PR #117) is **forced** — `scope-keywords.ts` exists nowhere else, and `blueprint.ts` / `blueprint-search.ts` / `tool-definitions.json` / `AGENT.md` all conflict semantically.

But #117's base is **`feat/stop-command`, which has no PR at all**: `main → stop-command (10 commits) → share-links (5)`. Landing this fix lands **15 commits with one PR's review coverage and zero human reviews** (#117 unreviewed, 8 days idle, CI green). Either open a PR for stop-command, or retarget #117 to `main` (merges cleanly — main is an ancestor) so the stack lands as one reviewed unit. **Needs Bill's call.**

### Migration merge — the highest-risk unguarded surface

`0001`, `0003`, `0004` all `create or replace` the same view, and **neither 0003 nor 0004 is a superset**. Whichever runs last *is* the view. Drop 0004 → phase gone. Apply 0004 last → 0003's spec columns gone. **Merge into one migration** carrying the `phases` join and the spec columns.

**[corrected] The "0003 references non-existent columns" claim is false.** Those columns were added 2026-07-29 (`20260729120000_derived_layer.sql`); the drafter read `schema.reference.sql`, whose header says it is verified only through 2026-07-16. Delete that reasoning from 0004's comment block.

Two traps that block deploy or silently revert:
- Adding `Phase` to the breadcrumb requires editing the **canonical** `uno-blueprint/src/lib/blueprintContract.ts:37`, not the vendored copy — `check:contract` is wired into `deploy`.
- The merged view must be re-vendored into `uno-blueprint/supabase/migrations/20260809000000_semantic_search_vendored.sql`, or a `supabase db reset` restores the phase-less view.

## Changes

1. Remove the no-future axiom and its echoes; state the contract **once** in the tool description, once at runtime, once in the routing table.
2. Strip instance inventory per the budget table; keep vocabulary and IDE recipes.
3. ToC on every `blueprint_search`, module-memoized, `orientation` status field, behind a flag, one DM first.
4. Retrieval widening (largely drafted) — note this is a stopgap; `2026-08-07-003-blueprint-search-rpc-proposal.md` proposes deleting `SOURCES` entirely for a hybrid RPC. Reference it rather than silently diverging.
5. Behaviour rules, one copy each. Wire `fresh` or delete it — it currently has **zero call sites** and `cacheKey` is a sorted term-set, so a re-phrased pushback query returns identical cached rows.
6. Drift guard per above.
7. Regression evals — **judged**, not deterministic; blueprint answers are the shape that passes deterministic checks and fails a judge. As drafted they test the symptom, and R13 is **over-fitted to instance data**: it enumerates the five features of the reflection redesign, so it will fail on a *correct* answer once the blueprint moves — the plan's own invariant violated inside the plan's own deliverable. Rewrite structurally: *cites a cell whose `path` is `Future (roadmap)` under the named scenario, and states the phase as the ToC gives it.* Then add:
   - **The false-positive half.** As written, an agent that always answers "yes, there's a future state" passes R13. Add 2–3 scenarios that genuinely have no `Future (roadmap)` path, where a confident negative is correct. Without the pair, the fix just moves the error to the other side.
   - **R14 mechanism, not outcome:** assert the turn issues a `blueprint_search` whose query differs from turn 1's. Machine-checkable once queries are logged — and unscoreable until the `cached` field lands.
   - **Disorientation without correction:** a scenario retrieval misses entirely; correct answer is "I found nothing under X, though the blueprint does have that scenario" — the case that exercises the zero-row-note/ToC conflict.
   - **R11 ↔ R13 are scored against each other.** R11 rewards claiming a gap; R13 punishes it. Neither references the other, and tuning one silently regresses the other — plausibly how the original axiom got written. Score as a paired matrix.
8. `scope-keywords.ts:45` axiom fix (test-covered by `tests/scope-keywords.test.ts` — update the expected string).

## Verification

`rm -rf .test-build` (the `include` list changes 6 → 14 entries; stale artifacts caused a false failure before) · `npm run typecheck` — the real gate for the `blueprint.ts` hand-merge, which has no test coverage · `npm test` · `check:fetch` · `BLUEPRINT_REPO=… check:contract` · assembled-harness char delta · **judged** evals case-by-case vs baseline · manual deploy (`workflow_dispatch`) — the replay is meaningless until then, and Durable Objects pin their script version, so a "still broken" reading immediately post-deploy is probably stale code.

**Test blind spot:** `blueprint-link.test.ts` feeds `parseChunkTitle` a synthetic string containing `Phase: In-session`. It passes whether or not the view emits a phase. **A green `npm test` is not evidence the migration landed.** Verify against the live view.

## Capture (method §7)

`docs/knowledge/changelog.md` has had no entry since 2026-07-08 and the whole August bot era is uncaptured. This work files: a lesson for the count-rot incident, the 2026-08-06 notes-displacement constraint promoted out of `docs/plans/`, and changelog lines for the two durable rules (the instance-inventory invariant; pushback → re-query).

## Decisions (Bill, 2026-08-17)

1. **Auto-deploy on any push to `main`.** `uno-bot-deploy.yml` is `workflow_dispatch`-only today, so the build-time bundle's invalidation never fires and merged rules never reach the bot. Deploy already gates on typecheck, `check:fetch`, `check:contract`, `bundle:harness`.
2. **Retarget PR #117 to `main`.** It sits on `feat/stop-command`, which has no PR at all; `main` is a strict ancestor so it merges cleanly, and the 15 commits become one reviewable unit instead of arriving under one PR's coverage.
3. **`supabase.md` § Access & keys → `ide-only`** (−1,182 chars). The bot has no write path and does not choose credentials.
4. **The Notion nav-guide mirror is retired, not rewritten.** Batches 1–4 are complete and published, so it has no live consumer. **Banner it as superseded** — pointing at repo-canonical `docs/conventions/blueprint-navigation.md`, per ADR-017 — and freeze it as the C2/D2 eval artifact. Do **not** delete: the published scorecard is only interpretable if the context block that produced it survives. This removes the mirror-rewrite workstream and the eval-comparability constraint entirely.

## Consequence for the eval golds

The eval's headline dual-source example is inverted. It scored "followed the Blueprint" as a pass where the Blueprint said Shift Swap form + email and a Notion PRD said ≥12h auto-approve. Production verification (2026-08-17) shows the PRD was right: in-app call-off live since 2026-01-11, 64% auto-approved, Google Form retired. That case is filed as `docs-risk aspirational` but was really `docs-benefit` — and it is the cited evidence for insight #2 and for the "Blueprint wins" framing that Batch 4's own insight #6 later called "too blunt."

So the guide-v2 pass (the eval's own prescribed next step, driven by `nav-failure` at 32 — its largest tag) should also re-verify Batch 1–4 golds against the blueprint as corrected on 2026-08-08, and allow the `stale-source` tag to point at the **blueprint**, not only at Notion.
