# uno-prototype — live Cursor scenario map (2026-08-02)

Six deliverable routes driven through **Cursor's own agent** (`cursor-agent`
CLI, headless, on `main` at `129f7dba`) after the skill restructure. Full
transcripts are in `transcripts/` — verbatim, and exempt from link checking for
that reason; this README is not.

**Read the coverage table before the results** — two of the runs test less than
they appear to.

## What each run actually tested

| Run | Interview (8 steps) | Deliverable routing + output | How it was driven |
|---|---|---|---|
| `coded-build` | ✅ **valid** | ✅ valid | Interactive — each answer written after reading the previous reply |
| `flow-map` | ❌ **invalid** | ✅ valid | Scripted — fixed answers fired blind |
| `wireframe` | ❌ invalid | ✅ valid | Scripted |
| `interactive` | ❌ invalid | ✅ valid | Scripted |
| `concept-image` | ❌ invalid | ✅ valid | Scripted |
| `storyboard` | ❌ invalid | ✅ valid | Scripted |

The scripted driver sent answers on a fixed schedule regardless of what was
asked, so those five prove nothing about question sequencing. They still prove
the half that matters most for the restructure: **which deliverable doc loads,
and what shape comes out.**

## Finding — the intake cannot run headless

`flow-map` turn 3, verbatim: *"AskQuestion was skipped again."* In
`cursor-agent --print` there is no interactive question tool and no way to wait
for an answer, so the agent proceeded on assumptions rather than interviewing.

Per `intake.md` this was *arguably correct* — "never refuse to proceed because
a tool is missing" — but the consequence is worth stating plainly: **in a
headless run the intake gate did not bind.** Anything automated (CI, cron, a
scripted agent) skipped the interview by construction, and skipped it silently.

**Fixed.** `intake.md` now distinguishes *manual* (no hook, but a person is
there to answer) from *non-interactive* (no turn exists in which anyone could
answer). In the second case the eight steps are still answered — from the PRD —
but written down as a numbered assumption list, and the brief card is labelled
**`ASSUMED — not confirmed`**, a label that rides into the spec and the artifact
manifest. Assuming in silence was the defect; assuming was not.

## Results — hi-fi coded build (the fully valid run)

Every acceptance criterion passed, on the **manual path** (no hook file
present), which was the highest-risk case in the restructure plan.

| Criterion | Result |
|---|---|
| One question per message, 8 steps in order | ✅ `Step 1/8` … `Step 7/8`, never batched |
| Flow map + `back` affordance surfaced up front | ✅ turn 1 |
| Fidelity dials rendered, each justified from the PRD | ✅ all four |
| Brief card carries dial settings, not a label | ✅ `Visual high · Interaction high · Scope 1 screen · …` |
| **R1 — deliverable doc loaded after the brief card** | ✅ read `deliverables/coded-build.md` unprompted |
| Figma question asked before building | ✅ from the deliverable doc, where it now lives |
| Missing-context gate fired | ✅ see below |

**The gate caught a real conflict.** The brief said students *submit*
reflections; the agent grounded, found that in this product reflections are
**tutor-written**, and surfaced the contradiction instead of building on it. It
also stated plainly that it could not query the live blueprint (Supabase auth)
rather than pretending otherwise.

Artifact built: `prototypes/overdue-reflection-follow-up/` — builds clean,
`validate-prototype.sh` 4 pass / 1 warn, `run-review-checks.sh` 4 pass / 2
warns, both warns inherited from `prototypes/starter`. Parked on branch
`test/cursor-acceptance-run-artifact`.

## Results — the five spec routes

All five produced the right *shape* and routed to the right doc.

| Route | Output | Evidence it read its deliverable doc |
|---|---|---|
| flow-map | Diagram-shaped prompt-spec + in-chat mermaid preview; open questions drawn **on** the map | Spec structure matches `flow-map.md`; refused to invent answers to 6 gaps |
| wireframe | **ASCII wireframe in chat** — panel populated / empty / composer | Manifest says `in-chat Route A` — Routes A/B/C exist only in `wireframe.md` |
| interactive | Prompt-spec + "paste into v0, Claude design, Stitch, or Figma Make" | Target-tool list matches `interactive.md` exactly |
| concept-image | Image-gen spec **and** a generated PNG via MCP | `concept-image.md` sanctions MCP-direct as an option — it took it |
| storyboard | Scene arc with per-beat captions, hypotheses marked as hypotheses | Continuity + arc structure matches `storyboard.md` |

Nobody generated the artifact where a spec was required — the spec-not-artifact
rule held on every route.

**Grounding was real, not decorative.** `flow-map` found that Call-Off → Fill-In
is already a *deployed* capability and reframed the map as "today vs still
losing track" rather than inventing a greenfield flow — and corrected
"substitute" to **Fill-In** per `terminology.md`, unprompted.

## Bugs found and fixed

1. **Prompt-specs had no home.** The deliverable docs said "deliver the spec
   ready-to-paste" and never said whether or where to persist it. Three runs
   chose three different places — two into `docs/plans/`, one invented
   `prototypes/_wip/`. Fixed: `docs/plans/` is the home, under the repo's own
   date-prefix convention with a `-spec` suffix
   (`2026-08-02-001-fill-in-coverage-flow-map-spec.md`), named in all five
   spec-deliverable docs and in `docs/conventions/coding.md`. The four strays
   were relocated there.

2. **`validate-spec.sh` false-positived on flow maps.** Shape detection scanned
   the whole document, so a flow map saying *"no screens yet"* matched the
   screen shape and was then failed for having no screens section. Fixed:
   detection reads the spec's own declaration — the top of the file, bounded by
   `head -40`, not by a match count that a short spec's self-check block could
   still slip past.

3. **The validator was link-checking verbatim transcripts.** A record you have
   to hand-edit to make CI green is not a record. Fixed by folder rather than by
   path glob: raw output lives in `transcripts/` and is exempt, and the analysis
   written alongside it — this README — is checked again.

4. **Two bugs that only surfaced once (2) was tightened.** A concept image was
   failed for having no screens section — narrative deliverables have frames,
   not screens, so concept image and storyboard now match neither shape. And the
   golden `interactive-spec.md` had silently *stopped* being screen-checked,
   because real specs title themselves "interactive draft" and the pattern
   demanded "interactive prototype". Both were regressions from (2)'s first cut;
   scoping a check narrower is the moment to re-run it against every example.

## Known, not fixed

- **`--mode plan` does not hold in `cursor-agent`.** Every run announced a
  switch to agent mode and wrote files despite the read-only flag. Additive
  only, nothing destructive — but do not treat `--mode plan` as a sandbox.
- **The intake is untested on four of six routes** (see coverage table). The
  routing is proven; the sequencing is proven once, on coded-build.
