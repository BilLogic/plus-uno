<!-- GOLDEN EXAMPLE — flow-map prompt-spec, authored against
     docs/evals/fixtures/uno-prototype-seeds/seed-1-lowfi-missing-flows.md.
     Shows the shape references/deliverables/flow-map.md demands, including how
     the missing-context gate surfaces the seed's planted gaps as QUESTIONS,
     never invented behavior. -->

# Prompt-spec — Tutor shout-outs board · user flow (FigJam)

**Confirmed brief:** Goal = align stakeholders on the posting/browsing flow ·
Artifact = user flow map · Fidelity = Visual low (boxes and arrows), Scope 2
flows, Complexity happy-path-plus-gaps · Won't include = moderation UI,
notification design.

## Flow 1 — post a shout-out

- **Trigger:** any PLUS-account holder taps "Give a shout-out" (entry surface
  TBD by this sketch's feedback).
- **Steps:** pick tutor (search by name) → write message → preview → post.
- **Outcome:** shout-out appears on the board, attributed to the poster.
- **Actors/systems:** poster · PLUS auth (account gate) · shout-outs store ·
  board.

## Flow 2 — browse the board

- **Trigger:** tutor opens the board.
- **Steps:** board lists shout-outs (newest first) → tutor scrolls/reads.
- **Outcome:** tutor sees their recognition.

## Constraints from grounding

- Any PLUS account can post; board visible to all tutors (PRD).
- Shout-outs show tutor name + message (PRD).

## Open questions — answer before higher fidelity (do NOT invent)

1. **Moderation:** nothing gates what can be posted about whom. Flow for
   report/remove needed?
2. **Empty state:** what does a tutor with zero shout-outs see?
3. **Notification:** does the tutor find out, or discover by browsing?

## What feedback this sketch should provoke

Where posting should live, whether browsing needs filters/search, and rulings
on the three open questions above.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Both flows read trigger → steps → outcome with no invented steps
- [ ] No moderation UI or notification design appears (won't-include)
- [ ] Boxes-and-arrows fidelity only — no visual styling
- [ ] The three open questions are visible ON the map, not resolved silently
