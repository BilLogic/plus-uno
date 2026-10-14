---
embodiment: all
disclosure: reference
summary: Figma's six annotation category labels, disclosed — what each holds, the Logic / data vs Development test, where status, construction notes and analytics go instead, and why a file's list drifts
description: writing, classifying or auditing a Figma annotation — the six category labels and what each holds, the Logic / data vs Development test, and where status and construction notes go instead; read before labelling one or judging a label.
---

# Figma annotation category labels

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07-07 with the Figma overview · categories consolidated 2026-10-09 · moved out of the overview 2026-10-14, read on demand. -->

Every annotation carries exactly one category label. There are six:

| Label | Colour | What it holds |
|---|---|---|
| `Development` | green | API, field names, implementation and component-construction constraints |
| `Interaction` | blue | click, hover, focus, tap; when a thing shows, hides, enables or disables |
| `Content` | orange | copy, labels, empty states, string templates |
| `Logic / data` | violet | conditions, what is counted, what is derived, where a number comes from, what is recorded |
| `Tooltip` | teal | hover and help text |
| `Accessibility` | pink | focus order, keyboard, labels, contrast |

The first four are Figma's presets, kept at their preset colours; `Logic / data` and `Tooltip` are the file's own. Handoff notes are annotations with the relevant category — written per `docs/conventions/writing.md`.

**`Logic / data` is not `Development`, and the test is the reader.** A product rule a non-engineer can review is `Logic / data`; an endpoint only a developer can review is `Development`. Ask *could a non-engineer tell me this is wrong?* — yes is `Logic / data`.

**Status lives in section names.** Build status, scope and on-hold go there: Figma allows one category per annotation, so a status label would take the type's slot.

<!-- ide-only -->
**Component construction and usage go in the component's `description`.** Dev Mode already shows name, variant props and token bindings; usage guidance in the description travels with the component instead of one frame.

**Analytics and responsive have no label.** What is recorded sits in `Logic / data`; responsive behaviour sits in its own section, which annotations point at. Add an `Analytics` label only once specs carry event names and payloads.

### Why the list drifts

Annotation categories are per-file; a library does not carry them. Pasting a layer into another file recreates its category there unless the label **and** the colour both match, so a near-duplicate spawns silently. Preferring the presets is the cheapest defence, since every file already has them at a fixed colour.

To retire a category, re-point every annotation off it first, then delete it; `getAnnotationCategoriesAsync` may serve the old list for a while afterwards.
<!-- /ide-only -->
