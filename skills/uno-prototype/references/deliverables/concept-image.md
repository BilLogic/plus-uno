<!-- ~300 tokens | Load when: the confirmed artifact is a concept image -->

# Deliverable — concept image

A single evocative image that communicates a product concept, mood, or visual
direction — upstream of wireframes, for alignment and reaction, not for spec.

**Execution mode: spec-handoff first.** UNO writes an image-generation prompt
for the designer's model of choice (GPT image gen · Gemini). Where the harness
has an image-gen tool connected, MCP-direct generation is an option — offer it,
don't assume it.

## The prompt must name

- Open by restating the confirmed brief card (the goal decides the image).
- **Subject and scene** — what is depicted, from whose viewpoint.
- **Style anchors** — medium, palette direction, mood words; anchor to PLUS
  brand adjectives where the goal is product-visual, leave artistic latitude
  where the goal is concept exploration.
- **What the image must communicate** — the one idea a viewer should take away.
- What to avoid (off-brand elements, competitor lookalikes, UI chrome unless
  the concept IS the UI).
- Aspect ratio / intended surface (deck slide, Slack post, Notion header).
- End with the self-check block: does the image serve the confirmed goal ·
  right artifact shape · nothing from the won't-include list.

**Where the spec lives.** Write it to `prototypes/_specs/<slug>-<deliverable>.md`
and give the designer the path plus the ready-to-paste text. Not `docs/plans/`
— that belongs to `ce:plan`. The file is what `uno-review` receives with the
manifest.

## Exit

Method §5: manifest line (fidelity · tool · PRD link) · hand to uno-review.
A concept image feeding further work rungs up the ladder (→ storyboard,
wireframe) rather than exiting.
