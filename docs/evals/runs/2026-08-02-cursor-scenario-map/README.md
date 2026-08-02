# uno-prototype — live Cursor scenario map (2026-08-02)

Six deliverable routes driven through **Cursor's own agent** (`cursor-agent`
CLI, headless, on `main` at `129f7dba`) after the skill restructure. Full
transcripts are the sibling files in this folder.

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

Per `intake.md` this is *arguably correct* — "never refuse to proceed because a
tool is missing" — but the consequence is worth stating plainly: **in headless
runs the intake gate does not bind.** Anything automated (CI, cron, a scripted
agent) skips the interview by construction. The gate protects interactive
sessions only.

Not filed as a bug because no runtime currently runs uno-prototype headless.
It becomes one the day something does.

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

## Bugs found and fixed (commit `f41a0bdf`)

1. **Prompt-specs had no home.** The deliverable docs said "deliver the spec
   ready-to-paste" and never said whether or where to persist it. Three runs
   chose three different places — two into `docs/plans/` (which belongs to
   `ce:plan`), one invented `prototypes/_wip/`. Fixed: `prototypes/_specs/`
   with a README, named in all five spec-deliverable docs; the strays were
   relocated there.

2. **`validate-spec.sh` false-positived on flow maps.** Shape detection scanned
   the whole document, so a flow map saying *"no screens yet"* matched the
   screen shape and was then failed for having no screens section. Fixed:
   detection reads only the spec's own declaration (title + Confirmed-brief
   artifact clause).

## Known, not fixed

- **`--mode plan` does not hold in `cursor-agent`.** Every run announced a
  switch to agent mode and wrote files despite the read-only flag. Additive
  only, nothing destructive — but do not treat `--mode plan` as a sandbox.
- **The intake is untested on four of six routes** (see coverage table). The
  routing is proven; the sequencing is proven once, on coded-build.
