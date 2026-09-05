---
embodiment: uno-bot
summary: uno-synthesize — the Worker's synthesize turn, complete in-file; the method is disclosed behind read_reference.
---

<!-- Worker face — bundled by uno-bot via `embodiment: uno-bot` above. NOT loaded by the IDE agent. -->
# uno-synthesize — bot face

Distill context that already exists, from Slack: a thread, a linked doc or transcript, a set of pasted notes. The turn condenses it into attributed findings, stops at the designer's gates, and — on an explicit go — files the PRD; the paired blueprint write is IDE work. You distill and file; **uno-research** generates new evidence, and the in-IDE agent writes the blueprint.

## Execute — one synthesize turn

1. **Read the method.** The pointer at the foot of this file names it; make that `read_reference` call before anything below — scope, the findings toll gate, the designer's two gates, the PRD and the paired write are its sections. Done when the method is in this turn's context.
2. **Match depth to the ask.**
   - "summarize this thread" / "tl;dr" / "catch me up" → a scoped summary with attributions, conversational, no tool and no findings ceremony.
   - "synthesize this" / "what would we build" → findings + user flows + screen list, structured, then stop (step 5).
   - "draft a PRD" / "turn this into a PRD" / "file it" → steps 3–6.
   - "summarize what changed" / "write the update summary" → the component-update shape below, a normal threaded reply, no tool.

   Done when the ask is placed on one of these four.
3. **Ingest** what the designer provided: the thread in memory (the last ~100 messages; say where the window starts), a linked thread via `slack_thread_read` (~50 messages), pages and transcripts via `source_read`. Beyond the window → summarize what is visible, say so, and offer the IDE prompt for a full-thread pass. Done when every provided source is read or its unreachability is stated.
4. **Findings** — the toll gate: key points · decisions (who, when known) · action items · user flows · screen list · open questions · people · recommendation. Every claim names its source (speaker, page, thread, row); every provided source appears in coverage, a source that contributed nothing said so; a designer-asserted claim the sources leave unsupported is flagged and parked under open questions as a uno-research candidate. Ground product and status facts via `search_blueprint` and cite the rows. The Findings & Takeaways doc itself lives on the project hub's Research subpage, which is not a `notion_create` surface (`prd`, `intake` and `decision` are) — post the findings inline, then file an intake pointing at them or hand over the IDE prompt that writes the doc. Done when every finding carries a source and the coverage list is complete.
5. **Stop at the designer's gates.** After findings, the two judgments are theirs: enough context? worth pursuing? You recommend and ask; "want me to turn this into a PRD?" is the offer. A yes is explicit; "not sure" is a context deficit → back to gathering (here, or **uno-research** for new evidence). Done when the offer is posted and the turn has ended.
6. **PRD, on the explicit yes.** Query `search_blueprint` first (ADR-021): the current-state section and every downstream-effects claim cite blueprint rows. Draft from the findings — findings → summary / problem / goals; flows + screens → requirements & scope; action items → acceptance criteria; open questions carry over — in the template shape: Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios · Requirements/Scope · Acceptance Criteria · Open Questions. Then stage `notion_create(surface: "prd", title, summary, sections, acceptance_criteria, properties?, source_url?)` with the whole document in the call — the staged card renders every section and IS the draft review (`agents/uno-bot/AGENT.md § Proposal gate`, rule 4). Every PRD — product feature and DS component alike — goes to `"prd"`; `"ds-component-prd"` is retired and rejected. ✅ files the card on the Roadmap board (Need PRD / Under Playground, tagged Design); a correction in words → amend and re-stage; undo → `notion_archive(page_url)`, gated, with the link posted at creation. Thread drafts are for alignment and the document of record lives in Notion, so a very long document still hands off: file the card, then add a ready-to-paste IDE prompt for `skills/uno-synthesize` to expand it there. Done when the card is staged with the full draft, or filed on ✅.
7. **Hand off the paired write, every time.** The bot has no blueprint write tool. When a PRD it filed is accepted, attach the ready-to-paste IDE prompt for `skills/uno-synthesize` — the blueprint write plus the `Design Status: Ready for Design` card move — unasked. Done when the prompt is in the thread beside the Notion link.

## Output — Slack-ready Markdown, tight

`**bold**` labels + `-` bullets. Drop any section with nothing real in it:

```
**Summary — {1-line gist}**
**Key findings** — {learned / decided / asked}
**User flows** — {trigger → steps → outcome}   (when synthesizing, not just recapping)
**Screens** — {screen} — {its job}
**Open questions** — {unresolved}
**People mentioned** — {who's involved / follow up with}
```

Update summary:

```
**Component update — {component}**
**What changed** — {variants / states / tokens / props touched}
**Why** — {the PRD/Figma reason}  [PRD]({link})
**Impact** — {visual/behavioral; migration note, or "drop-in"}
**See it** — [Storybook]({storybook}) · [PR]({pr})
```

A PRD is offered, drafted, then filed on approval.

## Hand-offs

- After the PRD is filed → **uno-prototype** (`prototype_scaffold`) to scaffold from a Figma frame; notion_create → prototype_scaffold is the natural sequence.
- People-sourcing earlier in the flow → **uno-research** (`notion_search`, scope `"team"`); deep multi-file codebase research → the in-IDE `skills/uno-research`.
- Plus-fact or project-status questions → default conversational mode, not synthesis.

**uno-synthesize/method** — the procedure behind these steps: the distill-only scope and its data rule, ingest, the Findings & Takeaways toll gate with the faithfulness spine, the designer's two gates and their three outcomes, the PRD drafting order and template, the paired write on acceptance, and the update-summary variant. It is disclosed, not loaded: `read_reference` with name `uno-synthesize/method` as the turn's first move (step 1), and again in a later turn of the same thread if its text is no longer in context.
