---
embodiment: ide
---

<!-- GOLDEN EXAMPLE — flow-map prompt-spec, demonstrating the shape
     references/deliverables/flow-map.md demands. The source PRD is
     hypothetical and inlined below (no external fixture). Shows how the
     missing-context gate surfaces the PRD's planted gaps as QUESTIONS,
     never invented behavior. -->

# Prompt-spec — Substitute request · user flow (FigJam)

**Source PRD (inline, hypothetical):**

- A tutor who can't make an upcoming session can request a substitute.
- Open requests are visible to other tutors, who can claim one.
- A claimed session moves onto the claiming tutor's schedule.
- Requests show the session's subject, student level, date, and time.

**Confirmed brief:** Goal = align stakeholders on the request/claim flow ·
Artifact = user flow map · Fidelity = Visual low (boxes and arrows), Scope 2
flows, Complexity happy-path-plus-gaps · Won't include = admin approval
workflow, notification design.

## Flow 1 — request a substitute

- **Trigger:** a tutor opens an upcoming session and taps "Request a
  substitute" (entry surface TBD by this sketch's feedback).
- **Steps:** confirm session details (subject, level, date/time) → add an
  optional handoff note → submit.
- **Outcome:** the request appears on the open-requests list.
- **Actors/systems:** requesting tutor · PLUS schedule (session record) ·
  requests store · open-requests list.

## Flow 2 — claim a request

- **Trigger:** another tutor opens the open-requests list.
- **Steps:** browse open requests (soonest first) → open one → review details
  and handoff note → claim.
- **Outcome:** the session moves onto the claiming tutor's schedule and the
  request leaves the open list.
- **Actors/systems:** claiming tutor · requests store · both tutors'
  schedules.

## Constraints from grounding

- Requests show subject, student level, date, and time (PRD).
- Any tutor can see open requests; a claim reassigns the session (PRD).

## Open questions — answer before higher fidelity (do NOT invent)

1. **Unclaimed deadline:** what happens if nobody claims before the session
   starts? Escalation, cancellation, or nothing — the PRD is silent.
2. **Withdrawal:** can the requesting tutor cancel a request — and what if it
   was already claimed? No flow exists for either.
3. **Eligibility:** can any tutor claim, or only tutors matched to the
   subject/level? The PRD says "other tutors" without qualification, so it is
   asked, not assumed.
4. **Requester feedback:** does the requesting tutor learn who claimed, or
   discover it from their schedule?

## What feedback this sketch should provoke

Where the request action should live, whether the open-requests list needs
filtering, and rulings on the four open questions above.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Both flows read trigger → steps → outcome with no invented steps
- [ ] No approval workflow or notification design appears (won't-include)
- [ ] Boxes-and-arrows fidelity only — no visual styling
- [ ] Every open question is visible ON the map, not resolved silently
- [ ] Nothing on the map states a fact the PRD does not (e.g. who may claim)
      — an invented requirement is a defect, not a helpful default
