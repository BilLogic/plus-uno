/**
 * When a sound starts against its motion (ADR-042): a sound lands when its
 * motion lands, so it starts at the spring's 90% time minus the sound's
 * pickup. The springs are the generated motion configs (ADR-041).
 */
import { SPRINGS } from '../tokens/ladder/springs.generated';
import { scoreFor } from './score';

const STEP = 0.0001;
const LAND = 0.9;
const LIMIT = 10;

/** Position over time of a spring config ({stiffness, damping, mass}) released from 0 toward 1. */
function springStep({ stiffness, damping, mass = 1 }) {
  const w = Math.sqrt(stiffness / mass);
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  if (ratio < 1) {
    const wd = w * Math.sqrt(1 - ratio * ratio);
    return (t) => 1 - Math.exp(-ratio * w * t) * (Math.cos(wd * t) + ((ratio * w) / wd) * Math.sin(wd * t));
  }
  return (t) => 1 - Math.exp(-w * t) * (1 + w * t);
}

/**
 * A motion token's 90% time, in seconds. A mode the token does not re-declare
 * (Expressive only where it differs) reads its Productive spring. An exit
 * spring aims past the edge and is cut there, so its 90% is of the visible move.
 * @param {string} name a motion semantic, e.g. `spatial.default`
 * @param {{mode?: 'productive' | 'expressive' | 'reduced'}} [options]
 */
export function springT90(name, { mode = 'productive' } = {}) {
  const entry = SPRINGS[name];
  if (!entry) throw new Error(`"${name}" is not a motion token: ${Object.keys(SPRINGS).join(', ')}`);
  const y = springStep(entry[mode] ?? entry.productive);
  const target = LAND / (entry.aim ?? 1);
  let t = 0;
  while (y(t) < target && t < LIMIT) t += STEP;
  return t;
}

/**
 * Seconds from a motion event's start to its sound's start: the spring's 90%
 * time minus the sound's pickup, never below 0. Pass it as `playSound`'s `at`.
 * @param {string} springToken a motion semantic, e.g. `spatial.default`
 * @param {string} soundToken a sound token without the `sound.` prefix
 * @param {{mode?: 'productive' | 'expressive' | 'reduced'}} [options]
 */
export function soundStartFor(springToken, soundToken, options) {
  return Math.max(0, springT90(springToken, options) - scoreFor(soundToken).pickup);
}
