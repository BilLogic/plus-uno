---
name: draft-a-prd
embodiment: uno-bot
disclosure: reference
summary: Bot skill — turn a thread, doc or notes into a PRD filed whole on one card, and write prompt-specs from a PRD.
description: draft a PRD, turn this thread into a PRD, file it as a PRD, write it up as requirements, a prompt-spec for Figma Make or Stitch, append a spec to my PRD — read before drafting any PRD or prompt-spec.
---

# Draft a PRD

Existing context becomes a PRD: a thread, a linked doc or transcript, pasted notes. The bot drafts the whole document, files it on one card, and hands the paired blueprint write to the IDE. Every build needs a PRD, so a build ask with none arrives here first.

## Steps

1. **Ingest every source given.** The thread in memory (say where its window starts), a linked thread via `slack_thread_read`, pages and transcripts via `source_read`. Done when each source is read or its unreachability is stated.
2. **Ground it.** Current-state claims and downstream effects cite `search_blueprint` rows; planned work cites cards from `roadmap_query`. Done when every claim about how the service works today names its row.
3. **Draft the whole PRD** in the template: Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios · Requirements/Scope · Acceptance Criteria · Open Questions. Each requirement traces to a source; a claim the sources leave unsupported moves to Open Questions. Write the body in the Markdown `docs/connectors/notion/page-writing` describes. Done when every section is filled from the sources or names what is missing.
4. **Name the gaps in two passes.** Screens: an unspecified empty, error or loading state, a filter that could mean two things, a behaviour named and left undefined. Edges between actors: wherever one actor's action must reach another, the PRD names what carries it, and where two actors act on one thing at once, it names which wins. Each gap becomes an Open Question; the mechanism that suggests itself is still a question. Done when both passes are written into Open Questions.
5. **Stage it.** `notion_create` with surface prd and the whole document in the call; the card is the draft review. A correction in words → amend and re-stage. Undo after filing → `notion_archive`. Done when the card is staged with the full draft.
6. **Hand off the paired write.** A filed PRD changes the service, so the blueprint changes with it. Attach the IDE prompt every time, unasked. Done when the prompt sits beside the Notion link.

## Prompt-spec

Asked for one (flow map, wireframe, concept image, storyboard, interactive proof), write the complete spec in the thread from a PRD read this turn:

- **Flow:** trigger → steps → outcome, with the actors and systems touched.
- **Constraints** from grounding; design-system names and values from a `github_read` of the tokens and component source.
- **Assets** for anything interactive: real copy, sample data, every screen state including empty and error, and the behaviour under test.
- **Out of scope**, named, so the generating tool leaves it out.
- **Open Questions:** a slot the PRD left open holds its question, and the screen leaves that slot to it, so each decision appears once.
- **Self-check:** the brief restated as pass/fail checks (serves the goal · right artifact · agreed fidelity · nothing out of scope · the named states), telling the tool to check its output and regenerate once on a failure.

Every line traces to the PRD, the conversation or a design-system read.

## Exit

- **file** — the PRD card through `notion_create`; a prompt-spec appended to its PRD through `notion_update`.
- **hand off** — the paired blueprint write and the Design Status move to Ready for Design, as a ready-to-paste IDE prompt naming uno-synthesize with the PRD link. A document too long for one card files its essentials and hands off the expansion the same way.
- **answer** — a prompt-spec with no PRD page to store it on lives in the thread.
