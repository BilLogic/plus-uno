# Tutor-home feeling — concept image prompt-spec

WIP ladder: concept image (mood / visual direction). Not a screen. Deck-bound.

## Confirmed brief card

| Field | Setting |
|---|---|
| Goal | Align stakeholders + reduce engineering ambiguity |
| Artifact | Concept image — one evocative mood / visual-direction frame |
| Fidelity | Visual mid–high · Interaction none · Scope 1×16:9 + caption · Complexity mood-only |
| Won't include | UI chrome / readable screens · layout/IA commit · storyboard · coded/interactive build · admin-first / dense metrics |
| PRD (inline) | Feeling of redesigned tutor home before layout commit; calm + momentum; tutor-first, not admin-first; deck next week; not a screen design |

## Deck caption (for the slide under the image)

**Tutor home should feel like a clear start to the day — calm focus with forward motion — not an ops dashboard.**

Eng takeaway (spoken, not drawn): the home answers “am I settled, what’s next, are we moving?” for the tutor — it does not supervise the program.

---

## Image-generation prompt

Paste into GPT Image / Gemini (or equivalent). Aspect ratio **16:9**.

```
BRIEF (do not letter these on the image)
Goal: help leadership feel the emotional direction of a redesigned tutor home
before any layout is chosen. Align stakeholders; reduce eng ambiguity by showing
what the experience is for (tutor calm + momentum), not what screens look like.
Artifact: one evocative concept / visual-direction image — NOT a UI mockup.
Won't include: app chrome, nav bars, sidebars, dashboards, metric cards, tables,
wireframes, readable UI text, admin/supervisor hierarchy, dense data walls.

SUBJECT AND SCENE
From a college tutor’s quiet vantage at the start of a tutoring day: a calm desk
or window-lit study nook suggesting preparation and readiness, not performance
review. Soft natural light. Soft sense of forward motion — a notebook half-open,
a warm mug cooling, light catching a clean surface as if the day is about to
begin well. Human presence implied (hands at edge of frame, or empty chair
recently sat in) rather than a staged portrait stare. Tutor-first intimacy —
personal scale, never a command center.

STYLE ANCHORS
Editorial visual-direction still; refined but approachable; soft focus depth;
restrained contemporary educational-product atmosphere. Mood words: calm,
focused, clear, unhurried, progressive, hopeful without cheerleading.
Palette direction: soft neutrals with a controlled warm accent of forward
energy — avoid purple-to-indigo AI gradients, cream-and-terracotta clichés,
neon glow, dark-mode cyber aesthetics. No logos required. No brand wordmarks
unless abstract and secondary.

ONE IDEA TO COMMUNICATE
“Being a tutor here starts calm — and already moving.”

AVOID
Product UI of any fidelity; dashboards; kanban; stacked KPI tiles; admin
control rooms; surveillance / monitoring vibes; crowded classrooms as the
hero; stock “team high-five” energy; competitor ed-tech screenshot lookalikes;
overlaid stickers, badges, or promo chips on the image; text callouts on the
visual itself.

SURFACE
16:9 horizontal frame for a leadership deck slide. Composition should leave
quiet mass for a title outside the image (caption sits under the slide), not
inside it.

SELF-CHECK — verify output, regenerate once if any fail
[ ] Serves goal: leadership can react to feeling / direction without debating layout
[ ] Artifact shape: single evocative image; reads as visual direction, not a screen
[ ] Fidelity: mood-only; no interaction implied; one 16:9 frame
[ ] Nothing from won't-include: no UI chrome, metrics walls, admin-first framing
[ ] Communicates calm + latent momentum; tutor-personal scale
```

---

## Output

- Generated frame: [`tutor-home-feeling-concept.png`](./tutor-home-feeling-concept.png)
- Session fallback path: `/Users/billguo/.cursor/projects/Users-billguo-Desktop-Vibe-Coding-PLUS-UNO-plus-vibe-coding-starting-kit/assets/tutor-home-feeling-concept.png`

## Brief self-check (against confirmed card)

| Check | Result |
|---|---|
| Serves goal (stakeholder feel / direction, no layout debate) | Pass — desk vignette reads as mood, not IA |
| Artifact shape (concept image, not UI) | Pass — no chrome, nav, cards, or readable UI |
| Fidelity (mood-only, 16:9) | Pass |
| Won't-include respected | Pass — not admin/ops; no metrics wall |
| Calm + latent momentum; tutor-personal scale | Pass — quiet prep scene; notebook/pen imply next action |

## Manifest

- **Fidelity:** concept image · mood / visual direction · 16:9 deck  
- **Tool:** prompt-spec + in-session image gen  
- **PRD:** inline (chat) — tutor-home feeling before layout  
- **Brief status:** confirmed · deliverable closed  
- **Grounding note:** uno-blueprint live query unavailable this session (Supabase MCP unauthenticated); prior art noted: `prototypes/home-redesign/` (layout-committed — not used)  
- **Next:** Optional `skills/uno-review` before the deck; ladder up only after leadership reacts  
