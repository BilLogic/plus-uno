---
name: critique-a-design
embodiment: uno-bot
disclosure: reference
summary: Bot skill — critique a frame, prototype or spec at screenshot depth, with severity, what is working and a verdict.
description: poke holes in this, critique this frame, review this design, does this match the PRD, what do you think of this prototype, Design QA on this card, what changed in this frame since a date — read before judging any design artifact.
---

# Critique a design

A designer links a frame, a prototype, a spec or a coded component and asks what is wrong with it. The bot reads the artifact, applies three lenses at the depth a screenshot allows, and answers in the thread. Fixes are separate asks.

## Steps

1. **Take the manifest.** Fidelity (low · mid · high · coded), tools used, PRD link. Ask once for what is missing. Design QA on a card at Ready for QA starts from the file whose title carries the card's number and its 📐 Specs pages instead. Done when fidelity and PRD are known, or asked for.
2. **Read the artifact.** `source_read` the frame (the rendered screen, text layers, annotations, fills, comments) and the PRD; for what changed since a date, pass that date as `since`. Annotations are the designer's own spec: quote the ones a finding rests on, word for word, with the layer they sit on. `github_read` a coded artifact's source and the rule docs a lens applies, such as `design-system/guidelines/foundations/accessibility.md`. The artifact is in hand only when the read returns its own content; a page that loads with none of it in it is unread. Done when you can quote what is in the artifact, or have said plainly what failed to load.
3. **Apply the lenses one at a time**, at the manifest's fidelity:
   - **DS:** components, tokens, layout, the constitution's hard rules. Fills come back as rendered hex; the token behind one is unread.
   - **Product:** the artifact against its PRD and the `search_blueprint` rows for the flow.
   - **Access:** contrast, target size, keyboard and focus, semantics, colour carrying meaning alone, motion.

   Screenshot depth is the bot's: layout, hierarchy, alignment, spacing feel, glaring contrast, flow logic, terminology, copy, PRD conformance. Computed values are measured depth: exact contrast ratios, token fidelity, target measurement, focus order, responsive behaviour. Mark a finding that needs them *partial*. Done when each lens has run or is marked partial.
4. **Write each finding** with severity · lens · evidence from the artifact · the rule or doc it rests on · where it re-enters (the fidelity choice or the content). Blockers and majors flip the verdict; minors are advisory. Three strong findings beat seven weak ones. Name one to three specific strengths with the principle each matches. Done when every finding carries all five parts.
5. **Post the critique**, then the next steps in the same message. A version-diff ask posts the changes instead: the version compared with (its name and date), then each change in plain words, then any finding a change raises. No actionable findings → say so and ask what worried them. A critique too long for Slack → the summary in the thread and an offer to append the rest to the card with `notion_update`. Done when the verdict is stated.

## Shape

```
**Critique: {artifact}** — {fidelity} · **Issues? {Yes/No}**
**Overall:** {the strongest signal}
**Blockers ({n})**
- [{Lens}] {finding} — Evidence: {…} — Reference: {…} — Re-entry: {…}
**Major ({n})** …
**Minor, advisory ({n})** …
**What's working ({n})**
- {strength + the principle it matches}
```

Empty severity sections drop out. How the critique renders, and how a long one splits, is `docs/connectors/slack/shapes` § Render paths.

## Exit

- **answer** — the critique, posted where the ask was made.
- **hand off** — measured depth or a coded artifact's checks: a ready-to-paste IDE prompt naming uno-review with the frame and PRD links.
- **file** — a defect in the harness, a DS component or a doc goes through file-a-ticket; an artifact fix the designer wants built goes there too, PRD first.
