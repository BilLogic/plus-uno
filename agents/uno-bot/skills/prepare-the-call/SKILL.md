---
name: prepare-the-call
embodiment: uno-bot
disclosure: reference
summary: Bot skill — a cited options-and-cost brief for a call someone else makes, or a list of what is open with a person before a 1:1.
description: this needs your call, lay out the options, what should we decide about X, pros and cons of X, prep my 1:1 with X, what's open with X, catch me up before my meeting with X — read before briefing a decision or a meeting.
---

# Prepare the call

Someone faces a decision or a meeting. The bot gathers what the estates say and lays it out so the person walks in prepared. The call stays with whoever owns it: the brief informs, and the lead decides product direction.

## Steps

1. **Sort the ask.** A decision → the brief (step 2). A meeting with a person → the prep (step 3). Done when the ask is one of the two.
2. **The brief.**
   - Gather what is on record: the cards (`roadmap_query`), PRDs and Decisions DB rows (`notion_search` with scope decisions, then `source_read`), the threads (`slack_search`, `slack_thread_read`), and the service as it works today (`search_blueprint`).
   - Lay out two to four options. Each carries what it costs (effort, risk, what it rules out) and what it rests on, cited.
   - Name who decides, from a cited source: a Decisions DB owner, a PRD, the app directory. With none on record, say the owner is undocumented; a product-direction call is the lead's.

   Done when every option carries a cost and a citation, and the decider is named or the gap is stated.
3. **The prep.**
   - `roadmap_query` for the cards the person owns or shares with the asker, with each card's status.
   - Open intakes the person filed or is named on (`github_intake_search`).
   - Recent threads that mention them and wait on an answer (`slack_search`).
   - Their running-notes page (`notion_search` with scope running notes), summarized neutrally under the persona's discretion rule.

   Done when each list is filled from a lookup this turn or reported empty.

## Shape

```
**Decision — {question}**
- **{Option}** — {what it costs} · {what it rests on, linked}
**Who decides** — {person, cited} or "not documented"
**Open questions** — {what would settle it}
```

The prep is grouped by cards, intakes and threads, each item one line with its link and status. A list of cards from one lookup is the result table: `docs/connectors/slack/shapes` § Answer shapes.

## Exit

- **answer** — the brief or the prep, cited. The brief recommends at most and leaves the choice open.
- **hand off** — a call that is the lead's: the brief goes to them, as an @-mention in this thread or a DM through relay-a-message.
