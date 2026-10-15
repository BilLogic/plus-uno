---
name: share-out
embodiment: uno-bot
disclosure: reference
summary: Bot skill — share work for feedback, close the round, and publish or find a Prototype Marketplace entry, each on one card.
description: share this for feedback, post for feedback, get eyes on this, close the round, publish this to the marketplace, update the marketplace entry, find a prototype in the marketplace — read before any share-out, round close or Marketplace ask.
---

# Share out

Finished-enough work goes in front of people. Three rails, each ending in one ✅ card: a feedback round, the round's close, and the Prototype Marketplace entry.

## Steps

1. **Pick the rail once.** Share / post for feedback / get eyes on → the feedback round (step 2). Close the round / record what we decided → the close (step 3). Publish / register / update in the marketplace → the entry (step 4). Find a prototype → the search (step 5). "Post this in Slack" could be any of them or a plain message → ask which. Done when the rail is named or the question asked.
2. **Feedback round.** Stage `shareout_post` at once with the links in hand; its card audits the bundle and names what is missing. Suggest #plus-design-feedback first; the other places it can post, and their checks, are the tool's. Up to three questions fit the artifact's stage, plus what is out of scope this round. Reviewers are Slack ids from `notion_search` with scope team, or the PRD's Owner; a person with no id is named in the lead line and left off. Done when the card is staged with the questions, the link and the reviewers filled from the thread.
3. **Close the round.** When the feedback is in, offer to record the decisions: `notion_create` with surface decision, the Roadmap card and the thread permalink as evidence. Acting on the feedback is a new build ask through file-a-ticket. Done when the decision card is staged or declined.
4. **Marketplace entry.** `notion_create` with surface marketplace creates the row or updates the one already there; its description names the fields. Ask once, in one message, for only the fields the thread lacks. A value the tool reports as unmatched goes back to the designer as a question. Done when the card is staged with every field the designer supplied.
5. **Search.** `notion_search` with scope marketplace; `source_read` a hit for more. Done when the results are posted.

## Shape

The feedback round's post is `shareout_post`'s, field by field: `docs/connectors/slack/shapes` § Share-out post. A decision or Marketplace body follows `docs/connectors/notion/page-writing`.

Search results, one line each, the first 25 when there are more:

```
**{id} — {title}** ({stage}, {area}) · {creators} · [view]({url}) or "not deployed" · updated {date}
```

## Exit

- **file** — the `shareout_post` card, the decision card, or the Marketplace card; ✅ posts or writes it.
- **answer** — Marketplace search results.
- **hand off** — a Figma replica, a Handoff Spec, componentizing, or removing a Marketplace entry: a ready-to-paste IDE prompt naming uno-publish with the prototype and its links.
