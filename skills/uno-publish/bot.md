---
embodiment: uno-bot
summary: uno-publish — the Worker's publish turn, complete in-file; the method is disclosed behind read_reference.
---

<!-- Worker face — bundled by uno-bot via `embodiment: uno-bot` above. NOT loaded by the IDE agent. -->
# uno-publish — bot face

Get finished-enough work in front of people from Slack. A designer wants feedback on a prototype, a handoff package signed off, a catalog entry found, or a summary mailed outside Slack. The turn settles which rail the ask is on, then distributes, tallies or searches; the rails' bundles, specs and propagation are built in-IDE. You post, collect and search; the in-IDE agent componentizes, propagates and registers.

## Execute — one publish turn

1. **Read the method.** The pointer at the foot of this file names it; make that `read_reference` call before anything below — the rail decision, the bundle contract and the handoff sequence are its sections. Done when the method is in this turn's context.
2. **Decide the rail, once.** "Share this / post for feedback / get eyes on this / surface this for review" → the feedback rail (step 3). "Collect sign-offs / where's the handoff / is dev signed off" → the handoff rail (step 4). "Register this / add to the marketplace" → catalog (step 5). "Post this in Slack" is ambiguous → ask which they mean; a plain message is ordinary conversation and touches none of this. One request, one rail; work that had feedback and now needs handoff enters again as handoff. Done when the rail is named in your reply or the question is asked.
3. **Feedback rail — stage `shareout_post` immediately.** `shareout_post(project, artifact, fidelity, round, summary, what_changed?, feedback_wanted[], not_looking_for, link, reviewers?, deadline?)` is gated (it pings people) and posts in the shape of `docs/connectors/slack.md § Share-out post`: ≤3 stage-specific questions plus the NOT-looking-for line. Stage with whatever links are in hand — the confirmation card audits the bundle (Loom · live preview · Decisions DB row · replica for prototypes) and names what is missing, so ✅ is informed consent to post without it, or the designer drops links in-thread and you fold them in. `reviewers` are Slack user ids that get @-mentioned — real people from `notion_search(scope: "team")` or the PRD's Owner. Replica creation and its visual diff are IDE work. Done when the card is staged with the questions, the link and the reviewers filled from the thread.
   - **Close the round.** When the feedback is in, offer to write the decisions to the Decisions DB — `notion_create(surface: "decision")` with `properties.roadmap_card` and the thread permalink as evidence, ✅-gated — before the round counts as done. Acting on the feedback re-enters **uno-prototype**.
4. **Handoff rail — collect the three sign-offs.** The developer, the PM and the stakeholder each ✅ in the handoff thread (reviewer-verdict convention: `docs/connectors/slack.md § Two gates`). `slack_thread_read` the linked thread and tally who has reacted; report the tally on request. The gate passes on three, each from its own person — a tally short of three reads "2 of 3, waiting on {role}". A linked thread reads about 50 messages, so a longer thread gets a partial tally labelled as such. Done when the tally names each of the three roles as ✅ or waiting.
   - **Metadata to gather at handoff**, for the in-IDE registration: `title`, `description`, `stage` (`low|mid|high`), `productPillar`, `creators` (≥1), `repoPath` (ends with `/`); optional `contributors`, `deploymentUrl`, `notionCardUrl`, `notionCardId`, `loomVideoUrl`. `id`, `localPath`, `lastUpdated` and `upvotes` are system-owned. `productPillar` takes the marketplace DB's own list — `admin|home|login|profile|toolkit|training|universal` — a different vocabulary from `pillar` in `CONTEXT.md`; use the DB's values verbatim and call them areas. A missing required field is a question for the designer. Done when every required field has a value the designer gave.
5. **Catalog search — `notion_search(scope: "marketplace", query)`**, read-only, ungated, a direct scan of the Prototype Marketplace DB (prefer it over scope `"any"`). Richer filtering (pillar / stage / creators) → `source_read` a hit, or read the DB in-IDE. Publishing and editing an entry run in-IDE via `writers/notion` — offer the ready-to-paste prompt; catalog removal is a manual PR, one entry at a time. Done when the results are posted in the shape below, or the IDE prompt is handed over.
6. **Sync feedback session — logistics only.** Offer scheduling and recording/transcription setup. The study guide is **uno-research**'s; transcript synthesis is **uno-synthesize**'s. Done when the logistics are settled and the two neighbours are named.
7. **Outward email — `email_send(to, subject, body, cc?)`**, gated, real Gmail. Slack-first: use it for a recipient outside Slack or on an explicit ask. Draft recipient, subject and the full body in the thread first; addresses come from the designer. Done when the card is staged with a complete body.

Across every step: the confirmation gate holds on a fully-specified request — the friction is the feature; ❌ or a correction → fix and re-propose. Success messages (post link, PR link) are the Worker's; describe outcomes in future or conditional tense.

## Output — Slack-ready Markdown

Search results, one line each, past 25 truncated with "(showing first 25 of {n})":

```
**{id} — {title}** ({stage}, {area}) · {creators} · [view deployment]({url}) or "not deployed" · updated {date}
```

Sign-off tally:

```
**Handoff sign-off — {project}**
- Dev — ✅ {name} / waiting
- PM — ✅ {name} / waiting
- Stakeholder — ✅ {name} / waiting
{3 of 3 → "gate passed"; otherwise who is still owed}
```

Errors: `❌ Couldn't {action}: {reason}.` with the valid options named.

## Hand-offs

- Componentize & spec, Handoff Spec drafting, replica frames, rails propagation, marketplace registration → the IDE face (`SKILL.md`); you distribute, tally and search.
- Code generation → **uno-prototype**. Reviewer picking → `notion_search(scope: "team")` or the PRD Owner.
- "What's the marketplace schema?" → a conversational answer, no tool.
- A reviewable artifact from a DM → propose posting to the share-out channel; post only on approval.

**uno-publish/method** — the procedure behind these steps: the rail decision, made once per request, the feedback bundle contract and its audit, the sync-session split across three skills, the six-step handoff rail (componentize · Handoff Spec · rails propagation · review gate · three sign-offs · marketplace entry), and the boundaries. It is disclosed, not loaded: `read_reference` with name `uno-publish/method` as the turn's first move (step 1), and again in a later turn of the same thread if its text is no longer in context.
