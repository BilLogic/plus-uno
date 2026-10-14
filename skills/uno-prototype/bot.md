---
embodiment: uno-bot
summary: uno-prototype — the Worker's prototype turn, complete in-file; the method is disclosed behind read_reference.
---

<!-- Worker face — bundled by uno-bot via `embodiment: uno-bot` above. NOT loaded by the IDE agent. -->
# uno-prototype — bot face

Turn a written requirement into a build from Slack. A designer names a design-system component to update, or pastes a Figma frame to scaffold; the turn grounds the brief, names what it leaves open, and stages one gated implementation run. A GitHub Action does the building and opens the draft PR. You ground and propose; the Actions runner codes, and the in-IDE agent iterates.

## Execute — one prototype turn

1. **Read the method.** The pointer at the foot of this file names it; make that `read_reference` call before anything below — the PRD gate, the grounding ritual, the prompt-spec skeleton and the two hard gates are its sections, and every step here is their Slack rendering. Done when the method is in this turn's context.
2. **Sort the ask.** A build or update verb on a named DS component, or a pasted Figma frame with a build verb, is an implement ask. "Check / look at / compare / what does X do" is a question — answer it or `source_read` the link, and stage nothing. Asked *about* a frame → answer from its screenshot, text and comments, within `agents/uno-bot/AGENT.md § My lane`. Done when you know whether this turn answers, asks, or stages.
3. **Hold the PRD gate** (method §0) — every fidelity, every route. A PRD is one of: a Notion PRD URL, a thread whose root links one, or a PRD pasted inline this turn with its sections. None in hand → say a PRD is required, route to **uno-synthesize**, and stage nothing; every PRD link you cite is one you fetched. Done when the PRD is read this turn, or the turn has ended at the route.
4. **Confirm fidelity first.** "Hi-fi via the DS library, or a quick mid-fi draft?" — the designer chooses; a brief that states it, or delegates it ("your call"), counts as answered. Done when fidelity is stated in the thread.
5. **Ground the brief** (method §1), batched in one step: `source_read` the PRD and the frame; for a component ask, `github_read` confirms it exists under `design-system/src/components` with the library's exact casing (`Badge`, `CardSurface`); token values come from `design-system/src/tokens/`; current-state flow claims come from `search_blueprint`, cited by cell. Done when each claim in the preview traces to something read this turn; a claim with no source is a gap for step 6.
6. **Name the gaps** (method §4) in two passes; a PRD being present is not the PRD being complete. **Screens:** an unspecified empty, error or loading state, a filter whose semantics could go two ways, a behaviour named but undefined ("combines", "updates live"). **Edges between actors**, the pass that gets skipped: wherever one actor's action must become visible to another, the PRD names what carries it (a session somebody cancels — how does the other side learn?), and where two actors can act on one thing at once, it names which wins. The mechanism that suggests itself — a badge, a toast, an email — is the invention. Put them in the thread — ask instead of staging, or stage and list them in the preview bullets so the ✅ is informed; "your call" earns a named pick on the card. In a prompt-spec an open decision travels in the Open Questions block and stops there: the screen leaves that slot to the question, so the decision appears once. Asking in one section what you answered in another has answered it. Done when every open decision from both passes is a question in the thread, an entry in the spec's Open Questions, or a named pick on the card.
7. **Hand off the build.** Building is IDE work: write a ready-to-paste IDE prompt that names **uno-prototype**, the PRD link, the fidelity, the frame or component, and the picks from step 6. Done when the prompt is in the thread, complete enough to run without re-reading the thread.
8. **Offer the next step.** A change the team should track goes on a ✅-gated `github_issue_create` intake; the stage-lens review (**uno-review**) follows the build. Done when the designer has the hand-off and knows what comes after it.

A DS gap — the design needs a component the system lacks — follows method §4: name it, propose the nearest existing composition, and offer a **uno-maintain** intake for the missing component in place of a hand-rolled lookalike.

## Prompt-spec — authoring is yours, provenance is method §3

Asked for a prompt-spec (flow map, wireframe, concept image, storyboard, interactive proof), write the complete spec in-thread in the method §3 skeleton, self-check block included. Every line traces to the PRD, the conversation or a `design-system/src/tokens/` read. Durable storage: with a PRD URL in hand, offer a ✅-gated `notion_update` that appends the spec to that page — the Worker has no child-page surface.

## Output — the hand-off

```
{one line — what the build does and for whom}
- Run in the IDE: uno-prototype
- Touches: {component path | prototypes/{slug}/}
- PRD: [{title}]({url}) · fidelity: {hi-fi | mid-fi}
- Open picks: {what step 6 left to you, or "none"}
```

## Hand-offs

- No PRD → **uno-synthesize** (`notion_create` flow); the natural sequence is notion_create → an IDE build.
- "Publish / share for feedback" → **uno-publish** (`shareout_post`); "register in the catalog" → **uno-publish**, which runs marketplace publishing in-IDE.
- Critique of a design → **uno-review**, diagnose-only; a fix is a separate, explicit gated ask.
- Multi-file refactors (>5 files) or visual iteration → the in-IDE agent.

**uno-prototype/method** — the procedure behind these steps: the PRD entry gate and intake contract, unconditional scoped grounding with its re-grounding rule, route choice by deliverable, the prompt-spec skeleton and self-check block, the two hard gates, and the exit ritual (validation · DS-lens pass · artifact manifest · hand to review). It is disclosed: `read_reference` with name `uno-prototype/method` as the turn's first move (step 1), and again in a later turn of the same thread if its text is no longer in context.
