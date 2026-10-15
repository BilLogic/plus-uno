---
embodiment: all
disclosure: reference
summary: Blueprint upkeep — Roadmap cards handed off or deployed since the last end of day, weighed for a service change, one blueprint revision card per matched path in the next morning's sweep at the card's place, redrafted by a reply in its thread, written on the owner's or Bill's approval.
description: blueprint revision cards from shipped work, and a drawn proposal's removal card — read before answering a reply on one, or what its Approve or Reject did.
---

# Blueprint upkeep

<!-- canonical per ADR-017 (docs/adr/) · a scheduled action, read through read_reference as `blueprint-upkeep` · the code is agents/uno-bot/src/blueprint-upkeep/; the writer it stages is ADR-034's. -->

Each end of day the `blueprint-shipped-N` jobs read the Roadmap cards that reached `Design Status: Shipped` or `Dev Status: Deployed` since the last run and weigh each through the service-change gate: a judgement that the card or its PRD changes who does what, or when, AND a confident `search_blueprint` match. A card failing either gets nothing. A card passing both gets one **blueprint revision** for every `scenario › path` matched, each drafted on the grind tier by the `blueprint-draft-N` jobs, and is weighed once per status. A deploy whose design hand-off was drafted promotes those rows instead. Work left over at the end of a night waits for the next.

The next morning, `blueprint-revision-post` hands each revision to the sweep's message at the card's place (`agents/uno-bot/scheduled-actions/sweep/ACTION.md` § One message a place): the pillar's team channel, else #plus-design. Each card is numbered; past the carousel's ten the message says "+N more in the thread" and `blueprint-revision-thread` posts those there. The card has six parts — `scenario › path` and the status change; why now (the RM-ID, its Roadmap status, one quoted sentence, a link); today's `step (lane)` rows with a link into the blueprint app; the proposed rows, added, changed, deprecated or promoted; confidence and what could not be verified; the ask. The why-now line speaks the Roadmap's words and every other part the blueprint's. In the thread uno-bot tags the card's owner with each thing a draft could not verify.

Only the card's owner or Bill can approve it — the card names exactly those two, standing confirmers left out. Approve writes the rows as uno-bot through the authoring RPCs, all or none (ADR-034). Reject, or 72 hours undecided, writes nothing. A reply in the thread from the owner or Bill redrafts that card in place — start it with the card's number (`2: …`) when they may approve several — and so does Review's Needs changes. A change that needs a new step or lane is named under what could not be verified and left for a person, who adds the step or lane through `writers/blueprint`.

A **proposal** drawn on the blueprint from a conversation (a `proposed` variant path beside today's) comes off only on a removal card that its requester alone approves. The card goes up in the proposal's own thread when the requester replies there with a short ask such as "remove it", and once from the morning's `blueprint-proposal-offer` check when no Roadmap card has been linked to the proposal in 30 days; only an unlinked proposal is offered. Approve deletes its cells, then its path, as uno-bot (ADR-034). Reject, or no answer in its window (24 hours for an ask, 4 days for the check's offer), keeps it, and the check offers each proposal once. Anyone else's "remove it" is an ordinary turn.
