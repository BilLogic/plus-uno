/**
 * The motion registry: one row per template, pattern and component, naming its
 * enter, exit and change motion by semantic token (`MOTION_SEMANTICS` in
 * `plan.mjs`, e.g. `spatial.fast`), plus any per-row rule.
 *
 * Empty until BilLogic/plus-uno#2211 fills it from the motion docs' Components,
 * Patterns and Templates tables. `check:motion-registry` holds it:
 * every interactive component is a row here or on the allow-list in
 * `scripts/baselines/motion-registry.json`, and every token a row names exists.
 *
 * Row shape:
 *   { component: 'Popup', enter: 'spatial.fast', exit: 'spatial.exit',
 *     change: 'appearance.fast', rule: 'optional per-row rule' }
 * `enter`, `exit` and `change` are each optional; a name that is given must be
 * a semantic token (or `linear`).
 *
 * @type {{component: string, enter?: string, exit?: string, change?: string, rule?: string}[]}
 */
export const MOTION_REGISTRY = [];
