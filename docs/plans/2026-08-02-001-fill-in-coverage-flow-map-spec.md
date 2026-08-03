# Prompt-spec — Session coverage · who-does-what flow map (FigJam)

Paste into FigJam diagram generation or Stitch. Boxes and arrows only — no screens.

**Source PRD (inline):**

- Problem: tutors and coordinators lose track of who covers a session when
  someone drops out.
- Requirements: a tutor can flag they can't make a session; someone else can
  pick it up; the schedule updates.
- Intent: work the flow before anyone designs screens.

**Confirmed brief**

- **Goal:** align stakeholders · reduce engineering ambiguity
- **Artifact:** who-does-what map — drop side + pick-up side; boxes and arrows;
  no screens (user flow · journey map)
- **Fidelity:** Visual low · Interaction low · Scope mid-low (drop + pick-up +
  schedule update) · Complexity mid-low (happy path + eng-critical branches
  only)
- **Won't include:** screen layouts · UI chrome · wireframes/comps · coded
  prototype · invented notification copy · matching algorithm · full
  coordinator admin suite

## Grounding snapshot (read 2026-08-02)

**uno-blueprint:** not queried this session — Supabase MCP `needsAuth` in this
environment. Do not invent `phase › scenario › path — layer × step` citations.
Re-ground when MCP is available before raising fidelity.

**Current product (foundation — not blueprint):**
`docs/context/product/features.md` + `flows.md` (repo foundation; live journey
truth is blueprint when reachable).

- **Call-Off** = assigned tutor cancels a session (reason required; late
  call-off (< 24h) may strike; supervisor notified) — *drop side today*.
- **Fill-In** = another tutor covers an open session slot — *pick-up side today*.
- **Shift Swap** = directed cover request; if accepted, original call-off is
  not counted as a strike — *related, separate path*; not in the inline PRD.
- Sessions View / Session Sign-Up v2 / Call-Off & Shift Swap Redesign listed
  **Deployed**. Sign-up flow: Fill-In follows when other tutors call off.
- DS prior art: `Specs/Toolkit/Pre-Session/Pages/Fill-In` (screens exist;
  out of scope for this sketch).

**Conflict to surface on the map (do not blend):** foundation says this
coverage loop is already deployed. The PRD asks stakeholders to align on
who-does-what because people still lose track. Treat this map as **alignment
on the intended loop**, not as inventing greenfield product — mark "today vs
problem" explicitly without asserting undocumented gaps.

## Layout (mandated)

Two vertical swimlanes or two labeled halves on one board:

1. **Drop side** (left) — assigned tutor + schedule system outcomes that open
   the slot
2. **Pick-up side** (right) — Fill-In tutor + schedule system outcomes that
   close coverage

Coordinator / supervisor appears only where the foundation already places them
(e.g. notified of call-off) or as a **visibility stakeholder** box labeled
open if the PRD's "losing track" implies a read they don't have — do not invent
admin screens.

Label actors with product terms: **Assigned Tutor**, **Fill-In Tutor**,
**Supervisor** (coordinator role), **PLUS schedule**. Never say "substitute".

## Flow A — Drop side (flag can't make it)

- **Trigger:** Assigned Tutor cannot attend an upcoming session they are on.
- **Steps:** open that session on their schedule → submit a Call-Off with a
  reason → (system) evaluate lateness / frequency against compliance rules →
  (system) notify Supervisor of the call-off.
- **Outcome:** session coverage is open / slot is available for Fill-In;
  Assigned Tutor is no longer the covering tutor on the schedule for that
  session.
- **Actors/systems:** Assigned Tutor · PLUS schedule · compliance check ·
  Supervisor (notification receipt — note presence only; no notification design).

## Flow B — Pick-up side (Fill-In)

- **Trigger:** Fill-In Tutor discovers an open session slot created by a
  Call-Off (how they discover it is **TBD** — show as open question on map).
- **Steps:** review open slot details available to them → claim / Fill-In the
  slot.
- **Outcome:** session moves onto the Fill-In Tutor's schedule; open-slot list
  no longer shows it as uncovered; Assigned Tutor / Supervisor can see who
  covers (**visibility path TBD** — open question).
- **Actors/systems:** Fill-In Tutor · PLUS schedule · open-slot inventory
  (name as a system box; do not invent UI).

## Eng-critical branch (Complexity mid-low)

- **No claim before session:** if nobody Fill-Ins after Call-Off, show a
  dangling outcome box **"Uncovered session — policy TBD"** with an open-question
  marker. Do not invent cancel / escalate / auto-assign.

## Constraints from grounding (only these — do not add)

- Use **Call-Off** and **Fill-In** vocabulary (foundation terminology).
- Call-Off requires a reason; late Call-Off (< 24h) can flag as strike;
  Supervisor is notified (flows.md).
- Fill-In covers open slots created when tutors Call-Off (flows.md / features.md).
- Schedule must reflect drop (uncovered) and pick-up (new covering tutor) —
  PRD acceptance criteria.
- **Shift Swap** is out of this map's happy path unless an open-question
  sticky asks whether it is in scope.

## Open questions — draw ON the map; do not resolve

1. **Discovery:** how does a Fill-In Tutor learn a slot is open? (list, push,
   supervisor ask — PRD silent)
2. **Visibility:** after a Fill-In, how do Assigned Tutor and Coordinator
   confirm who covers without "losing track"? (PRD problem statement; no
   mechanism specified)
3. **Uncovered session:** what if nobody claims before start?
4. **Eligibility:** can any tutor Fill-In, or only matched tutors?
5. **Shift Swap vs Call-Off→Fill-In:** is the directed swap path in or out of
   this alignment exercise?
6. **Blueprint re-ground:** which Pre-session / Sessions cells own Call-Off and
   Fill-In today? (MCP auth needed)

## What feedback this sketch should provoke

Stakeholder agreement on: (a) drop = Call-Off opens the slot, (b) pick-up =
Fill-In claims it, (c) schedule is the single coverage truth — and explicit
rulings on the six open questions before any screen work. Also: whether this
is a clarity/ops problem on an already-shipped loop vs a product-change ask.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Brief card honored: goals = align + reduce eng ambiguity; artifact =
      who-does-what drop + pick-up; Visual/Interaction low; no screens
- [ ] Both Flow A and Flow B read **trigger → steps → outcome**
- [ ] Schedule update appears as a system outcome on both sides
- [ ] Terms are Call-Off / Fill-In / Supervisor — no "substitute"
- [ ] Nothing from won't-include appears (no UI chrome, notification copy,
      matching rules, admin suite)
- [ ] Every open question is visible on the map, not answered silently
- [ ] No invented product policy (especially uncovered-session handling)
- [ ] "Deployed today vs still losing track" conflict is labeled, not blended
