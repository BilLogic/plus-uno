/**
 * The motion registry: one row per template, pattern and component, naming its
 * enter, exit and change motion by semantic token (`MOTION_SEMANTICS` in
 * `plan.mjs`, e.g. `spatial.fast`), plus any per-row rule.
 *
 * Filled from the motion docs' Components, Patterns and Templates tables, one
 * row per PR. `check:motion-registry` holds it:
 * every interactive component is a row here or on the allow-list in
 * `scripts/baselines/motion-registry.json`, and every token a row names exists.
 *
 * Row shape:
 *   { name: 'Popup', tier: 'component',   // 'component' | 'pattern' | 'template'
 *     events: {
 *       enter:  { transition: 'Open', spatial: 'spatial.fast', appearance: 'appearance.fast',
 *                 note: 'optional', sound: { token: 'prompt', at: 'land', when: 'optional' } },
 *       exit:   { transition: 'Close', spatial: 'spatial.exit' },
 *       change: { ... },                  // optional
 *       // further named events: success, milestone, rejected, land, blocked, ...
 *     } }
 * Each event's `spatial` and `appearance` are optional but one is required, and
 * each must be a semantic token (or `linear`). `transition`, `note` and `sound`
 * are not read by `check:motion-registry`; `check:sound-registry` owns `sound`.
 * Only `tier: 'component'` rows must be interactive components in the index.
 *
 * @typedef {{token: string, at?: 'land' | 'start', when?: string}} MotionSound
 * @typedef {{transition?: string, spatial?: string, appearance?: string, note?: string, sound?: MotionSound}} MotionEvent
 * @type {{name: string, tier: 'component' | 'pattern' | 'template', events: Record<string, MotionEvent>}[]}
 */
export const MOTION_REGISTRY = [
  {
    name: 'Popup',
    tier: 'component',
    events: {
      enter: {
        transition: 'Open',
        spatial: 'spatial.fast',
        appearance: 'appearance.fast',
        note: "Clips open from the trigger's corner on the side it is aligned to. From the keyboard it opens with no animation.",
      },
      exit: {
        transition: 'Close',
        spatial: 'spatial.exit',
        appearance: 'appearance.fast',
        note: 'The clip folds back to the same corner while it fades. Under reduced motion it is the fade alone.',
      },
    },
  },
];
