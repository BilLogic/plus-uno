---
embodiment: ide
summary: How code adds a sound — a cell on the motion registry, played through the runtime in design-system/src/sound/.
---

# Sound

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · applied by every agent adding or changing a sound · decision trail: ADR-043. -->

Sound is the fifteenth foundation, built on the motion registry. Read Foundations · Sound first (the AGENTS.md loading row names it); this page is the code half.

## Add a sound to a moment

1. Open the moment's row in `scripts/lib/tokens/motion-registry.mjs` and give the event a `sound` cell: `sound: { token: 'notify' }`. The token is a name from `SOUND_SPEC` without the `sound.` prefix; `at` is `'land'` (default) or `'start'`; `when` is the condition, in words.
2. Run `npm run generate:agent` and `npm run generate:docs-agent-files`: the cell reaches the page's Motion section, Motion · Library and `get-documentation`.
3. Play it from the component with `playSound(token, { at: soundStartFor(spring, token, { mode }) })` (a component inside the design system imports `@/sound` directly; app code imports from `@/components`). `soundStartFor` places the first note at the spring's 90% time minus the sound's pickup; `mode` is `modeFor(reduced)`, `'reduced'` under reduced motion, and the sound still plays.
4. A moment that must stay silent goes in `scripts/lib/tokens/sound-silence.mjs` with its reason.

## Where audio code lives

`design-system/src/sound/` is the only home of `AudioContext` and `new Audio(`; `check:sound-registry` fails anywhere else. The score is pure (`score.js`), so tests assert on notes and levels without a browser. `SoundProvider` wraps the app, `useSound()` returns `{ enabled, setEnabled, play }`, and one on/off switch (`plus.sound` in localStorage) is the only setting. Gate an app's own plays on `enabled`; a component's `sound` prop (Flag has one) is the lever.

## Tokens

The plan is `scripts/lib/tokens/sound-plan.mjs`; `npm run generate:sound-spec` writes `design-system/src/sound/spec.generated.js`. A new sound or a changed note starts in the plan, and `check:sound-spec` names the stale file.
