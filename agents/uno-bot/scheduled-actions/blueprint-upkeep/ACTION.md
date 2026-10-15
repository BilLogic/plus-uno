---
embodiment: all
disclosure: reference
summary: Blueprint upkeep — Roadmap cards deployed since the last end of day, weighed for a service change, each match a blueprint revision card in the next morning's sweep at the card's place, written live on the owner's or Bill's approval.
description: blueprint revision cards from shipped work — read before answering a reply on one, or what its Approve or Reject did.
---

# Blueprint upkeep

<!-- canonical per ADR-017 (docs/adr/) · a scheduled action, read through read_reference as `blueprint-upkeep` · the code is agents/uno-bot/src/blueprint-upkeep/; the writer it stages is ADR-034's. -->

Each end of day `blueprint-shipped` reads the Roadmap cards that reached `Dev Status: Deployed` since its last run and weighs each through the service-change gate: a judgement that the card changes who does what, or when, AND a confident `search_blueprint` match on one `scenario › path`. A card failing either gets nothing. A card passing both gets one **blueprint revision** for that path, drafted on the grind tier, and is weighed once.

The next morning, `blueprint-revision-post` hands each revision to the sweep's message at the card's place (`agents/uno-bot/scheduled-actions/sweep/ACTION.md` § One message a place): the pillar's team channel, else #plus-design. The card has six parts — `scenario › path` and the status change; why now (the RM-ID, its Roadmap status, one quoted sentence, a link); today's `step (lane)` rows with a link into the blueprint app; the proposed rows, added, changed or deprecated; confidence and what could not be verified; the ask. The why-now line speaks the Roadmap's words and every other part the blueprint's.

Only the card's owner or Bill can approve it — the card names exactly those two, standing confirmers left out. Approve writes the rows `live` as uno-bot through the authoring RPCs, all or none (ADR-034). Reject, or 72 hours undecided, writes nothing. A change that needs a new step or lane is named under what could not be verified and left for a person, who adds the step or lane through `writers/blueprint`. A correction typed in the thread is not yet a redraft — point the person to Reject and to `writers/blueprint`.
