<!-- Acceptance guide for the uno-prototype restructure (PR #92). Delete or
     archive once the run is recorded. -->

# Cursor acceptance test — uno-prototype restructure

**Branch:** `refactor/uno-prototype-skill-ia` · **PR:** #92

What this proves that nothing automated can: that a *live agent* actually
follows the new load chain — router → method → intake → the one deliverable
doc — instead of improvising from whatever is already in context.

## Setup (2 min)

```bash
cd "/Users/billguo/Desktop/Vibe Coding/PLUS-UNO/plus-vibe-coding-starting-kit" && git checkout refactor/uno-prototype-skill-ia && rm -f .cursor/hooks/briefings/active-intake-question.json
```

Open a **fresh Cursor chat** (context from an old chat invalidates the test —
the agent might "remember" removed content). Three runs below; Run A is the
one that matters most.

---

## Run A — hi-fi, hook ON (the main path)

**Paste this, exactly:**

> prototype this: build the approved reflection-streak card for the tutor
> dashboard in the prototypes, production-quality against the design system.
> Requirements: shows current streak (consecutive sessions with a submitted
> reflection); tapping opens the reflection composer; celebrates milestone
> streaks (5, 10, 25).

*(That is eval seed-3, PRD text inline — satisfies the gate.)*

**Answer the interview naturally.** Suggested answers if you want to move fast:
Q1 goals → "reduce engineering ambiguity" · Q2 open → "a real card component
on the dashboard" · Q2 pick → the hi-fi build option · Q3 dials → accept, or
adjust one · Q4 exclusions → "skip the composer screen itself".

### ✅ Pass criteria

| # | What to watch for | Why it matters |
|---|---|---|
| 1 | Exactly **one question per message**, eight in order | S6 — the core intake contract |
| 2 | Q3 renders the **four dial lines** (`Visual low ──●───── high`), each justified from the PRD | The functionality we explicitly protected |
| 3 | The **brief card** shows fidelity as **dial settings**, not a bare word | New in this restructure |
| 4 | **Missing-context gate fires** on seed-3's planted gaps — loading/error state, broken-streak behavior, or "celebrates" having no DS mapping | Hard gate; asking beats inventing |
| 5 | ⭐ After the brief is confirmed, the agent **reads `references/deliverables/coded-build.md`** | **THE test.** Risk R1 — a silent failure if it doesn't |
| 6 | It asks *"Do you already have a Figma file?"* before building | That question moved into the deliverable doc |
| 7 | It runs `scaffold-prototype.sh` (or scaffolds from starter) rather than hand-rolling | Phase 3 script wired in |
| 8 | DS-gap protocol fires if no celebration component exists — names the gap, proposes nearest, files intake | Hard gate, zero silent inventions |

**Watching #5:** the tool-call log should show a Read of
`skills/uno-prototype/references/deliverables/coded-build.md`. If it plans and
builds without ever opening that file, **R1 has materialized** — capture the
transcript, that's the finding.

You can stop the run after it presents the plan. Building the whole card isn't
necessary for acceptance.

---

## Run B — low-fi spec route, hook ON (5 min)

Fresh chat. Paste **eval seed-1** (`docs/evals/fixtures/uno-prototype-seeds/seed-1-lowfi-missing-flows.md`)
with "prototype this — quick flow sketch to react to".

### ✅ Pass criteria

- Q2 offers the **new vocabulary** where relevant — concept image · storyboard ·
  ASCII sketch are now live options
- Confirmed artifact = user flow → agent loads **`deliverables/flow-map.md`**
  (*not* coded-build)
- Output is a **prompt-spec for FigJam/Stitch**, ending with a **self-check
  block** — NOT a generated diagram
- The three planted gaps (moderation · empty state · notification) appear as
  **open questions**, not invented flows
- Bonus: it may run `validate-spec.sh` on the spec before handing off

---

## Run C — manual path, hook OFF (the real R1 exposure) ⭐

The hook injects a handoff message naming the deliverable doc. Manual mode has
no such injection — the agent must follow the router's load table on its own.
**This is the weakest link in the whole design.**

```bash
cd "/Users/billguo/Desktop/Vibe Coding/PLUS-UNO/plus-vibe-coding-starting-kit" && node -e "const f='.cursor/settings.json',fs=require('fs');const j=JSON.parse(fs.readFileSync(f,'utf8'));j.uno={...(j.uno||{}),prdGate:false};fs.writeFileSync(f,JSON.stringify(j,null,2));console.log('prdGate disabled')"
```

Fresh chat, same seed-3 prompt as Run A.

### ✅ Pass criteria

- Agent still runs the eight steps **itself**, one per message (intake.md's
  manual row)
- Still reaches a confirmed brief card
- ⭐ **Still loads `coded-build.md`** — with no hook message telling it to

**Restore when done:**

```bash
cd "/Users/billguo/Desktop/Vibe Coding/PLUS-UNO/plus-vibe-coding-starting-kit" && node -e "const f='.cursor/settings.json',fs=require('fs');const j=JSON.parse(fs.readFileSync(f,'utf8'));if(j.uno)delete j.uno.prdGate;fs.writeFileSync(f,JSON.stringify(j,null,2));console.log('prdGate restored')"
```

---

## Recording the result

Comment on PR #92 with per-run pass/fail against the criteria above. Any
criterion that fails is a fix on this branch before merge — especially #5 /
Run C, which are the risk the whole restructure hinges on.

If everything passes, the acceptance gate in
`docs/plans/2026-07-31-001-refactor-uno-prototype-skill-context-optimization-plan.md`
is closed and the PR is mergeable.
