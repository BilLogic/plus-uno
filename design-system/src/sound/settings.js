/**
 * The one sound setting (ADR-042): on or off, on by default, kept across
 * visits. Storage can be absent or throw (private modes, blocked cookies); the
 * setting then lives for the page and sound still works. Reduced motion is not
 * an input here: it never mutes sound.
 */
export const SOUND_STORAGE_KEY = 'plus.sound';

const ON = 'on';
const OFF = 'off';

let enabled = null;
const listeners = new Set();

function readStored() {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== OFF;
  } catch {
    return true;
  }
}

/** @returns {boolean} whether sound may play */
export function isSoundEnabled() {
  if (enabled === null) enabled = typeof window === 'undefined' ? true : readStored();
  return enabled;
}

/** Turns all sound on or off, and remembers it. */
export function setSoundEnabled(next) {
  enabled = Boolean(next);
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? ON : OFF);
  } catch {
    // Storage is unavailable: the setting holds for this page only.
  }
  listeners.forEach((listener) => listener());
}

/** @returns {() => void} unsubscribe; for `useSyncExternalStore` */
export function subscribeSoundSetting(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Forgets the in-memory value so the next read goes back to storage. */
export function forgetSoundSetting() {
  enabled = null;
}
