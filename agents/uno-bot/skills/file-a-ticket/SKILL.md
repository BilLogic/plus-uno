---
name: file-a-ticket
embodiment: uno-bot
disclosure: reference
summary: Bot skill — the one intake routing rule; turn a report, a stale doc or a build request into a GitHub issue or a Roadmap intake after a duplicate check.
description: this is stale, this is wrong, file an issue, track this, report a bug, add it to the backlog, build or implement this component, scaffold this frame, follow up on that issue — read before filing any intake or answering any build ask.
---

# File a ticket

A report lands where it gets worked. Every intake runs one rule: inspect, route, check for a duplicate, draft to maintenance standard, stage one card. A build request is an intake too, and it starts from a PRD.

## Steps

1. **Inspect the evidence yourself.** `source_read`, `slack_thread_read` or `github_read` the linked page, thread or file and confirm what is wrong. Done when you can quote the offending line, frame or behavior, or have said you could not reach it and are filing on the reporter's word.
2. **Route it.** The one rule:
   - implementation in a listed repo (uno-bot, the harness, the blueprint app, the marketing site, Storybook docs, a prototype) → a GitHub issue on the repo whose purpose matches what would change, through `github_issue_create`;
   - product or design, including a live PLUS app bug → a Roadmap intake: the named card through `notion_update`, else a new one through `notion_create` with surface intake.

   Two targets are two intakes. Unclear which → ask, naming the choices. Done when each intake has its surface and repo, named in the reply so the reporter can redirect it.
3. **Check for a duplicate.** `github_intake_search` on that repo, whose description sets what happens on a match; for a Roadmap intake, `roadmap_query` for the topic. Done when the search ran and any match is linked.
4. **Draft to maintenance standard.** The evidence, quoted · the concrete fix, quoted (the corrected sentence, the property to move, the token to swap) · the question *worth incorporating?* for whoever triages · a suggested severity: a direct fix for typos, links, dates and pure formatting, a gated change for everything else. Done when whoever reads the draft could apply the fix.
5. **A build request** (build, implement or scaffold a component, a frame or a prototype) needs a PRD: a Notion PRD link, a thread whose root links one, or a PRD pasted this turn. With none, route to draft-a-prd and stage nothing; a PRD link you give is one you fetched. With one, read it, confirm fidelity (hi-fi through the DS library, or a mid-fi draft), and confirm a component exists with `github_read` under `design-system/src/components`. Done when the PRD is read this turn or the ask has moved to draft-a-prd.
6. **Stage one card** with every intake in this reply. A follow-up on an existing issue is `github_issue_update`. Done when the card is staged.

## Shape

A Roadmap intake's body follows `docs/connectors/notion/page-writing`; a GitHub issue renders its Markdown as written.

The build hand-off:

```
{what the build does and for whom}
- Run in the IDE: uno-prototype
- Touches: {component path | prototypes/{slug}/}
- PRD: [{title}]({url}) · fidelity: {hi-fi | mid-fi}
- Open picks: {gaps the PRD leaves, or "none"}
```

## Exit

- **file** — the GitHub issue or the Roadmap intake on one card; ✅ files it.
- **hand off** — a build with its PRD: the ticket filed, plus the ready-to-paste IDE prompt naming uno-prototype in the shape above, its `Run in the IDE` line as written: the Worker reads it, and when the build changes a path on the blueprint today, posts a Check it offer under the reply; the blueprint check runs only on a press, so the reply keeps to the hand-off. A direct fix the reporter wants made now: an IDE prompt naming uno-maintain with the quoted fix.
- **answer** — an open intake already covers it: its link, and whether to add this to it.
