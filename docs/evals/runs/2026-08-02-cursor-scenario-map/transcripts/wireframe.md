### TURN 1 — brief
This maps to prototyping. I'll load the prototype skill and check for any active intake gate before we proceed.Loading the prototype method and intake next — PRD gate comes first, then the one-question-at-a-time interview.Checking how the intake PRD gate is rendered and whether a soft brief can count as an inline PRD.You skipped the PRD check — with only a requirements sketch, prototyping can't start. I'll map the synthesize-then-wireframe path from what you already said.Your brief counts as an **inline PRD** for mid-session quick notes. “See the layout before we build” points to **ASCII wireframes** (not a coded prototype) — same shape as the skill’s golden session-notes example.

Plan is ready for your approval: finish the one-step intake, ground against blueprint + existing `SessionNotes` prior art, then draw three in-chat screens (list / empty / capture) with open questions left open.

### TURN 2 — accept inline PRD
Treating your brief as the inline PRD and continuing intake — grounding the brief first, then one reflection question.Supabase needs auth for blueprint grounding. Authenticating and sweeping local prior art in parallel.**PRD accepted (inline)** — mid-session quick notes for tutors.

**Grounding snapshot** (blueprint blocked this session: Supabase MCP needs auth in Cursor desktop; not fabricating journey cites)
- Foundation ([`docs/product-and-service/flows.md`](docs/product-and-service/flows.md)): tutors may capture lightweight timestamped notes in-session; they resurface as a memory aid in post-session reflection.
- Prior art: Toolkit **SessionNotes** is a **post-session, read-only** display of notes already left ([`SessionNotes.jsx`](design-system/src/specs/Toolkit/Post-Session/Sections/SessionNotes/SessionNotes.jsx)) — empty/filled only, no capture. `prototypes/in-session-ux` has a session-notes textarea mapping in a Figma write-back manifest — related surface, not this layout settle.

**PRD summary (no recommendations yet)**
- Overview: capture short notes mid-session without leaving the session view.
- Users: tutors.
- Flow: jot → auto-timestamp → read back afterward.
- Gaps carried (not invented): edit/delete, visibility to others, format/limits, exact “afterward” surface.

**Goals (carried from your ask)** — align on layout before any build.

---

**Step 4/8 — Artifact (your words)** · say `back` to revise

In your own words, what do you picture making?

### TURN 3 — goals
Recording those goals and asking the next intake step — what artifact you picture making.Goals locked: **align stakeholders** + **reduce engineering ambiguity**.

Plan updated with that brief draft (ASCII wireframes next). Approve it when you’re ready to finish the remaining intake steps and draw the screens.

### TURN 4 — artifact (open)
Updating the plan with your artifact picture, then confirming the wireframe choice as the next intake step.

### TURN 5 — artifact (pick)
ASCII wireframe confirmed. Next intake step: confirm the fidelity dials.

### TURN 6 — fidelity
Won’t-include confirmed. Last intake step: confirm the brief card.

### TURN 7 — exclusions
Brief card confirmed. Locking it in the plan — approve the plan (or say draw) and the ASCII boxes come next.**Brief card (locked)** — Goal: align stakeholders + cut eng ambiguity · Artifact: ASCII rough boxes · Fidelity: low / none / panel+capture / happy path · Won’t include: polish, code, edit/share, session chrome.

---

## Screen: Notes panel (populated)

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ 0:08  "Borrowing in subtraction        │  │
│  │  finally clicked — used base-10        │  │
│  │  blocks."                              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ 0:23  "Rushed word problems; slow      │  │
│  │  down next time and underline the      │  │
│  │  question."                            │  │
│  └────────────────────────────────────────┘  │
│             ▸ view earlier notes             │
└──────────────────────────────────────────────┘
```

## Screen: Notes panel (empty)

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│                                              │
│        No notes yet.                         │
│        Capture a moment while it's           │
│        fresh. [+ Quick note]                 │
│                                              │
└──────────────────────────────────────────────┘
```

## Screen: Capture box

```
┌──────────────────────────────────────────────┐
│  ← back              Quick note              │
├──────────────────────────────────────────────┤
│  0:12 into session — added automatically     │
│  Note: ┌────────────────────────────────┐    │
│        │                                │    │
│        └────────────────────────────────┘    │
│                                              │
│               [Save note]                    │
└──────────────────────────────────────────────┘
```

**Open (not drawn):** edit/delete · who else sees notes · inline expand vs overlay for the capture box · how “afterward” ties to post-session Toolkit `SessionNotes`.

**Brief check:** serves layout alignment + eng-clarity · rough boxes only · panel + capture · no polish/code/edit/share/chrome.

---

**Manifest:** `ascii-wireframe · Visual low / Interaction none / Scope panel+capture · tools: in-chat Route A · PRD: inline (this thread)`

Ready for `skills/uno-review`, or say what to tweak on the boxes.

### TURN 8 — confirm brief
Brief confirmed — switching to produce the ASCII wireframes now.**Brief confirmed.** Deliverable below (ASCII Route A — no files written).

---

## Notes panel — populated

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ 0:08  "Borrowing in subtraction        │  │
│  │  finally clicked — used base-10        │  │
│  │  blocks."                              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ 0:23  "Rushed word problems; slow      │  │
│  │  down next time and underline the      │  │
│  │  question."                            │  │
│  └────────────────────────────────────────┘  │
│             ▸ view earlier notes             │
└──────────────────────────────────────────────┘
```

## Notes panel — empty

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│                                              │
│        No notes yet.                         │
│        Capture a moment while it's           │
│        fresh. [+ Quick note]                 │
│                                              │
└──────────────────────────────────────────────┘
```

## Capture box

```
┌──────────────────────────────────────────────┐
│  ← back              Quick note              │
├──────────────────────────────────────────────┤
│  0:12 into session — added automatically     │
│  Note: ┌────────────────────────────────┐    │
│        │                                │    │
│        └────────────────────────────────┘    │
│                                              │
│               [Save note]                    │
└──────────────────────────────────────────────┘
```

**Carried open (not drawn):** edit/delete · visibility · capture as expand vs overlay · post-session read-back surface.

**Manifest:** `ascii-wireframe · low / none / panel+capture / happy-path · in-chat Route A · PRD: inline (this thread)`

Hand off: run `skills/uno-review` when you want a stage-lens pass — or say what to change on the boxes.

### TURN 9 — proceed
**Brief locked. Deliverable:**

## Notes panel — populated

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ 0:08  "Borrowing in subtraction        │  │
│  │  finally clicked — used base-10        │  │
│  │  blocks."                              │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ 0:23  "Rushed word problems; slow      │  │
│  │  down next time and underline the      │  │
│  │  question."                            │  │
│  └────────────────────────────────────────┘  │
│             ▸ view earlier notes             │
└──────────────────────────────────────────────┘
```

## Notes panel — empty

```
┌──────────────────────────────────────────────┐
│  Session notes                [+ Quick note] │
├──────────────────────────────────────────────┤
│                                              │
│        No notes yet.                         │
│        Capture a moment while it's           │
│        fresh. [+ Quick note]                 │
│                                              │
└──────────────────────────────────────────────┘
```

## Capture box

```
┌──────────────────────────────────────────────┐
│  ← back              Quick note              │
├──────────────────────────────────────────────┤
│  0:12 into session — added automatically     │
│  Note: ┌────────────────────────────────┐    │
│        │                                │    │
│        └────────────────────────────────┘    │
│                                              │
│               [Save note]                    │
└──────────────────────────────────────────────┘
```

**Manifest:** `ascii-wireframe · low / none / panel+capture / happy-path · in-chat Route A · PRD: inline (this thread)`

Open (not drawn): edit/delete · visibility · expand vs overlay · post-session read-back. Say what to tweak, or run `skills/uno-review`.
