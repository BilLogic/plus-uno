---
summary: Motion tokens (three durations, three easings), patterns and reduced motion
---

<!-- Tier: 2 -->

# Motion

Motion has three attributes, duration, easing and property, tuned for a calm tutoring product. The tokens live in `design-system/src/tokens/ladder/_motion.scss`, generated from `scripts/lib/tokens/plan.mjs` (ADR-038).

## Tokens

| Token | Value | Use |
|---|---|---|
| `--motion-duration-short` | 100 ms | Frequent interactions: hover, press, focus, a tab, a row. |
| `--motion-duration-medium` | 200 ms | Things that appear or change in place: popup, flag, accordion panel, content swaps. |
| `--motion-duration-long` | 300 ms | Large surfaces: modal, blanket, drawer. The ceiling for anything a tutor meets mid-task. |
| `--motion-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default: color and state changes, elements that reposition or resize in place. |
| `--motion-easing-entrance` | `cubic-bezier(0, 0, 0.2, 1)` | Elements arriving: starts fast, lands softly. |
| `--motion-easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving: starts slowly, accelerates away. |

## Rules

- **Read the tokens, not numbers.** A transition names a `--motion-duration-*` and a `--motion-easing-*`; a literal `ms` or `cubic-bezier()` in a component is a defect.
- **Pick the duration by how often it happens.** Frequent things use short; things that appear use medium; large surfaces use long. When unsure, go shorter.
- **Exits are shorter than entrances:** an exit steps down one duration from its entrance (a modal enters in long and leaves in medium).
- **Easing follows direction:** entrance for arriving, exit for leaving, standard for everything that stays on screen.
- **One or two properties per transition**, and prefer transform and opacity to width, height and top. Accordion and Progress animate size and are documented exceptions. Cut properties before you shorten a duration.
- **Loops and characters** (Spinner rotation, Skeleton sweep, character moments) are not tokenized. They are non-task moments, run once per view where they are not loops, and never appear inside a task flow.
- A tooltip hides 100 ms after the pointer leaves; the delay is a component rule, not a token.
- A narrow-width sidebar, if one is specified, takes the Drawer motion.
- The tokens are built for Base UI's `data-starting-style` and `data-ending-style` transitions.

## Patterns

Guidance for choosing tokens; as components adopt the tokens, this table is what they follow.

| Pattern | Enter | Exit |
|---|---|---|
| Hover, press, focus, Tab, Checkbox | short, standard | short, standard |
| Popup, Menu | medium, entrance | short, exit |
| Tooltip | short, entrance (fade only) | short, exit |
| Flag | medium, entrance | short, exit |
| Modal and Blanket | long, entrance, together | medium, exit, together |
| Drawer | long, entrance | medium, exit |
| Accordion, Progress | medium, standard | medium, standard |

Move focus into a Modal as its enter starts, not when it ends.

## Reduced motion

Handled once, in the token layer: under `prefers-reduced-motion: reduce` every `--motion-duration-*` becomes 0 ms, so a component that reads the tokens needs no branch of its own. Components still jump to the final state, so nothing is left half-transparent. A Spinner becomes a static icon with the word Loading, a Skeleton a flat fill, charts draw their final state, and characters rest. Nothing is communicated by motion alone. Never flash or sweep large areas, with or without reduced motion.
