<!-- ~300 tokens | Load when: the confirmed artifact is a storyboard -->

# Deliverable — storyboard

A **sequence** of concept images with captions that narrates a user's journey
through the product moment — several image prompts plus the connective story.
Not "several concept images": the sequence has structure a single image lacks.

**Execution mode: spec-handoff** (a set of image-gen prompts + captions the
designer runs), MCP-direct optional where the harness has image gen.

## The storyboard spec must name

- Open by restating the confirmed brief card.
- **Scene list** — 3–8 beats, each one moment in the journey: scene number ·
  what happens · what the user feels. The arc comes from the PRD's core
  workflow; the brief's goal decides where the story starts and ends.
- **Per-scene image prompt** — subject, viewpoint, style anchors (see
  `concept-image.md` for prompt shape).
- **Continuity rules stated once, applied to every prompt** — same character(s),
  setting, style, palette across all frames; the sequence must read as one
  story, not eight unrelated renders.
- **Caption per scene** — one or two sentences, the narrative voice consistent
  throughout; captions carry the story, images carry the feeling.
- End with the self-check block: arc serves the confirmed goal · continuity
  holds · nothing from the won't-include list appears in any frame.

**Where the spec lives.** Write it to `prototypes/_specs/<slug>-<deliverable>.md`
and give the designer the path plus the ready-to-paste text. Not `docs/plans/`
— that belongs to `ce:plan`. The file is what `uno-review` receives with the
manifest.

## Exit

Method §5: manifest line · hand to uno-review. A storyboard usually feeds
alignment (communicate vision · align stakeholders goals) and often rungs down
to wireframes for the screens it exposed.
