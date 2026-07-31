---
title: "Restructure uno-prototype around deliverables"
type: refactor
status: active
date: 2026-07-31
---

# ♻️ Restructure uno-prototype around deliverables

## What the skill does, in plain words

1. Demand a PRD (none → uno-synthesize).
2. Interview the designer — 8 questions, one per message, ending in a confirmed
   **brief card** (goal · artifact · fidelity · won't-include). The card is the
   contract.
3. Ground: blueprint constraints + prior art; summarize the PRD back.
4. Plan; get it confirmed.
5. Produce **one deliverable** (see taxonomy below).
6. Check it against the card; run the machine checks.
7. One-line manifest → hand to uno-review.

Today those seven steps cost ~32,000 chars (~8,000 tok) loaded up front on
every run — SKILL.md 20,757c + method.md 11,209c, with most topics written
twice (intake in both, build rules in both) and method.md carrying ~3,700c the
Worker (its other reader) explicitly never uses (bot.md:30 walls off spec
authoring; the bot never builds or validates).

## Target structure

```
skills/uno-prototype/
├── SKILL.md                    ~3,000c   ROUTER — when to use/NOT, routing
│                                         table, constraints, load table
├── bot.md                       5,570c   Worker face — unchanged
├── references/
│   ├── method.md               ~4,500c   THE CORE (filename kept): PRD gate ·
│   │                                     grounding · route choice · hard gates ·
│   │                                     exit ritual · self-check block ·
│   │                                     re-scoped generator rule
│   ├── intake.md               ~5,000c   the 8-question interview, whole
│   └── deliverables/
│       ├── flow-map.md                   FigJam / Stitch diagram specs
│       ├── wireframe.md                  ASCII (in-chat, WIP) · Figma wireframe
│       │                                 (MCP-direct via writers/figma) ·
│       │                                 Stitch / Figma Make (spec)
│       ├── concept-image.md              image-gen prompts — spec for GPT/Gemini;
│       │                                 MCP-direct optional where harness has
│       │                                 image gen
│       ├── storyboard.md                 sequenced concept images + captions —
│       │                                 scene arc, continuity rules
│       ├── interactive.md                v0 / Claude design / AI Studio specs
│       └── coded-build.md                hi-fi DS build + validation loop +
│                                         machine-check set
├── scripts/
│   ├── validate-prototype.sh             existing
│   ├── scaffold-prototype.sh   NEW       copy starter → slug, patch name + free port
│   └── validate-spec.sh        NEW       grep spec for required sections incl.
│                                         self-check block
└── examples/
    ├── vite-config-example.js            existing
    ├── flow-map-spec.md        NEW ┐
    ├── wireframe-spec.md       NEW │     each authored AGAINST an eval seed
    ├── ascii-wireframe.md      NEW │     (docs/evals/fixtures/uno-prototype-seeds/)
    └── interactive-spec.md     NEW ┘     so examples double as eval goldens
```

Leaving the folder: `figma-mcp-guide.md` + `figma-registry-mandatory-load.md`
→ `design-system/figma/` (repo infrastructure — consumed by AGENTS.md:102, a
GitHub Action, DS docs, and three skills; a skill folder is the wrong home).
Deleted: `references/README.md` (its one job — "which reference to open when" —
IS the router SKILL.md's load table; keeping it means the same routing written
three times, and the 2026-07-10 sweep caught this exact README carrying dead
paths) and `examples-index.json`, `tokens-index.json`, `integrations-index.json`
(zero consumers; hand-maintained derivable facts — the kind that rots fastest
per the 2026-07-10 sweep lesson 4). The Stitch MCP note in integrations-index
moves into `wireframe.md` / `docs/conventions/integrations.md`.

**Why bot.md doesn't change:** it is already what this migration turns SKILL.md
into — a 5,570c execution delta that leans on method.md instead of restating it
("the shared procedure … is `references/method.md`, already in this prompt")
and carries nothing its runtime never uses. The Phase 2 shrink keeps everything
bot.md leans on (gate, grounding, routing, hard gates, exit); what leaves
method.md (§3 spec modes, §4 build, §6.1 validation loop) is exactly what
bot.md:30 already walls off as IDE work. Optional follow-up (not this plan):
ASCII wireframe is the first low-fi deliverable the bot could serve in-thread —
a code-block sketch doesn't outgrow Slack the way full specs do; if adopted it
is a small bot.md addition riding Phase 2's deploy.

## The cross-skill template this preserves

`SKILL.md` (IDE face) + `bot.md` (Worker face) + `references/method.md`
(shared core) is the **standing template for every skill** — all six follow it
today and this plan keeps uno-prototype on it. method.md stays method.md: it
remains the runtime-neutral core and becomes the **pointer hub** — it names
`intake.md` and `deliverables/` at the right moments rather than restating
them. What uno-prototype adds below the template line (intake.md,
deliverables/, richer scripts/examples) is skill-specific growth, available as
a pattern for any other skill that outgrows a single method.md — not a fork of
the convention.

## Functionality preserved: the fidelity dial diagram

Today Q3 renders each fidelity dimension as a labeled low↔high scale line —
`Visual   low ──●───── high — wireframe-clean is enough` — for **Visual ·
Interaction · Scope · Complexity**, each placement justified by PRD evidence
(SKILL.md:198-208; duplicated in FSM `constants.mjs` reflect_fidelity
guidance). This diagram MUST survive the migration, and gets more
comprehensive, not less:

1. **Normative home: `intake.md`** — the dial-rendering template moves there
   with Q3 (rule-inventory diff catches any loss).
2. **Echoed in the brief card** — the card's Fidelity row carries the dial
   settings, so the contract shows the dials, not just a label.
3. **Checked at validation** — the loop objective already says "matches the
   fidelity dials"; spec deliverable docs embed the dial settings into the
   self-check block, coded-build.md checks against them explicitly.
4. **Candidate fifth dimension (Bill to confirm): Content/Data realism** —
   real copy vs lorem, real data vs sample. method §3's mid mode already
   demands "real copy, sample data" but no dial captures it. If adopted:
   intake.md + constants.mjs guidance + the brief card row, one edit each.

## Design rules the structure encodes

**One topic, one home.** Intake exists once (intake.md), build exists once
(coded-build.md), the gate/grounding/exit core exists once (method.md). Today
each is written twice across SKILL.md and method.md — that duplication, not
byte count, is the disease.

**Split on the run's decision points — and stop there.** Invoke → interview →
deliverable choice → (Figma input?) → exit. Four decisions, four load moments.
The metric is wasted tokens = always-on + loaded-but-unused; after this
structure every loaded file is used by the run that loads it, so further
splitting only converts used content into extra Reads plus extra forget-risks.
Concretely rejected: per-question intake files (8 files × ~700c; the interview
always runs start-to-finish — splitting below the unit-that-runs-together is
fragmentation), and splitting method.md's core (every piece — gate, grounding,
missing-context gate, exit — is used by every run).

**The interview selects the deliverable doc.** Q2's answer names the artifact;
the artifact names the file. "Journey map" → flow-map.md. "Something clickable"
→ interactive.md. "Build it" → coded-build.md. Zero new routing judgment.

**Execution modes are explicit.** Three, declared per deliverable:

| Mode | Meaning | Routes |
|---|---|---|
| In-chat | UNO produces it in conversation | ASCII wireframe |
| MCP-direct | UNO drives a connected tool | Figma wireframe (writers/figma) · concept image (when image-gen is in harness) |
| Spec-handoff | UNO writes the brief; designer runs the tool | FigJam/Stitch · Figma Make · v0/Claude design/AI Studio · GPT/Gemini image prompts |

This re-scopes method's "UNO is the prompt engineer, not the generator": the
rule's true target is UNO hand-faking what a tool must render. Where the
harness holds the tool, driving it is legitimate. One paragraph in method.md;
Figma writes stay gated behind writers/figma per `docs/conventions/figma-workspace.md`.

**WIP ladder.** flow-map → ASCII → concept image/storyboard → Figma wireframe →
interactive → coded build. Each rung optional, any entry, any exit; WIP
artifacts exist to converge cheaply before the next rung. ASCII is also the one
low-fi deliverable the Slack bot can deliver in-thread (it's text; bot.md:30's
spec wall is about specs outgrowing Slack).

## Cost per run

| Run | Today | After |
|---|---|---|
| Always-on (SKILL + method) | ~7,991 tok | **~1,900 tok** |
| Interview running | 7,991 | ~3,150 |
| + spec deliverable | 7,991 | ~3,400–3,700 |
| + coded build | 7,991 | ~4,300 |
| + Figma input | 9,949 | ~6,250 |
| Worker share (bundled method.md) | ~2,500 tok | ~1,150 tok |

## Phases — staged, each independently shippable

### Phase 1 — IDE-only restructure (no Worker impact)

1. Create `references/intake.md` (SKILL § Intake mode + Step 2, deduped),
   `references/deliverables/` (six docs; spec docs seeded from method §3 +
   SKILL Step 4; coded-build.md from SKILL Step 4 hi-fi + validation loop).
2. Rewrite SKILL.md as router.
3. Relocate the two Figma docs to `design-system/figma/`; update ~15 inbound
   pointers (AGENTS.md:102, `scripts/prompts/uno-implement/SKILL.md`, DS docs,
   uno-research, uno-maintain, this skill). Fix todos/061's stale pattern
   numbers while the files are open. Break the circular cross-reference
   (guide §gate restates the gate doc; both point at each other).
4. Delete `references/README.md` and the three index JSONs, plus their Tier-2
   rows and the `validate-doc-links.sh:109-113` entries. SKILL.md's load table
   is the only reference index from here on.
5. **method.md untouched in this phase** — SKILL.md stops duplicating it, which
   is most of the saving already.

Gate: `validate-doc-links.sh` green · `check:intake-fsm` green · rule-inventory
diff (every MUST/NEVER/gate line before vs after — zero disappearances) ·
evals S0–S7, with S2 run hook-disabled (`"uno": { "prdGate": false }`).

### Phase 2 — method.md shrink (Worker-affecting, own PR + deploy)

Shrink method.md to the core (§0 gate · §1 grounding · §2 route · §5 hard
gates · §6.2–6.4 exit ritual · self-check block · re-scoped generator rule).
§3 content lives in the spec deliverable docs; §4/§6.1 in coded-build.md —
all moved there in Phase 1, so this phase is deletion + the one new paragraph.

**Filename stays `method.md`** → `bundle-harness.mjs` needs zero changes; the
six-skill convention (every skill has a method.md) survives; the Worker prompt
shrinks on next deploy.

Gate: bot evals R1–R12 green against the deployed Worker · bot.md byte-identical.

### Phase 3 — author scripts + examples

`scaffold-prototype.sh`, `validate-spec.sh`; golden examples authored against
the eval seeds so each demonstrates the missing-context gate on the seed's
planted gaps ("moderation flow unspecified — asked, not invented").

### Phase 4 — vocabulary + eval sync

1. FSM `constants.mjs` Q2 guidance: artifact vocabulary gains concept image ·
   storyboard · ASCII wireframe (the interview must be able to offer them).
2. SKILL.md routing table rows for the new deliverables.
3. Follow-up (not blocking): eval scenarios for the new deliverable families;
   S0–S7 cover only the old surface.

## Lingering issues, stated plainly

- **Scope is ~5x the original plan.** Hence the phases; Phase 1 alone delivers
  most of the token saving and all of the dedup.
- **Phase 2 touches the Worker prompt** (content only, no code). Its own PR,
  eval run, and deploy. R5-class regressions are the thing to watch.
- **New deliverables ship without eval coverage** (Phase 4.3 follow-up).
- **Thin deliverable docs may sit unused.** Accepted deliberately ("thin files
  are great" — Bill); the monthly integrity sweep catches rot.
- **Superseded:** the earlier bot.md-as-evidence claim (withdrawn — bot.md is
  small because its job is small: two gated tools, no intake/build/validation)
  and the earlier Codex-test deferral on intake extraction (dissolved — under
  the router model intake.md loads at interview start on both hook and manual
  paths, so the FSM's fate no longer changes the structure).

## Acceptance criteria (cumulative)

- [ ] SKILL.md ≤ 4,000c, contains no procedures — router only
- [ ] Rule-inventory diff: zero MUST/NEVER/gate lines lost (hard gate)
- [ ] One-topic-one-home: intake, build, gate/grounding/exit each exist in
      exactly one file; no SKILL↔method duplication remains
- [ ] Figma docs relocated; all inbound pointers updated; circular reference gone
- [ ] Index JSONs deleted everywhere they're named
- [ ] `/Step 3/i` + `/Step 4/i` still match `buildHandoffMessage`
      (test-fsm.mjs:205-206)
- [ ] `validate-doc-links.sh` + `check:intake-fsm` green after every phase
- [ ] bot.md byte-identical throughout; method.md byte-identical through Phase 1
- [ ] Evals S0–S7 green; S2 run hook-disabled; bot evals green after Phase 2
- [ ] Q2 vocabulary offers all six deliverable families
- [ ] Fidelity dial diagram intact end-to-end: rendered at Q3 (intake.md),
      echoed in the brief card, checked in the validation loop / self-check
- [ ] Skill-quality checklist §5 Context Design: all three items pass

## Sources

- `skills/uno-prototype/SKILL.md` · `references/method.md` · `bot.md` (bot.md:30
  spec wall; updated 2026-07-30)
- `agents/uno-bot/scripts/bundle-harness.mjs:24` (why the filename must not change)
- `agents/writers/figma.md` (MCP-direct wireframe plumbing already exists)
- `docs/evals/fixtures/uno-prototype-seeds/` (example-authoring inputs)
- `docs/evals/scenarios/uno-prototype.md` S0–S7 · `docs/evals/rubrics/uno-prototype.md`
- `skills/uno-maintain/references/skill-quality/checklist.md` §5
- `docs/knowledge/lessons/2026-07-10-harness-consistency-sweep.md` (lessons 3–5)
- `todos/061` (stale pattern numbers in the Figma docs — fix during Move 2)
