import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { installAudioUnlock, playSound } from './play';
import { isSoundEnabled, setSoundEnabled, subscribeSoundSetting } from './settings';

/**
 * Mount once at the app root: it unlocks audio on the first user gesture, so
 * `playSound` and `useSound().play` can sound afterwards. It renders its
 * children unchanged.
 */
export function SoundProvider({ children }) {
  useEffect(() => installAudioUnlock(), []);
  return children;
}

/**
 * The one sound setting and the player: `enabled` and `setEnabled` read and
 * write the switch (on by default, kept across visits); `play` is `playSound`.
 * @returns {{enabled: boolean, setEnabled: (next: boolean) => void, play: typeof playSound}}
 */
export function useSound() {
  const enabled = useSyncExternalStore(subscribeSoundSetting, isSoundEnabled, () => true);
  return useMemo(() => ({ enabled, setEnabled: setSoundEnabled, play: playSound }), [enabled]);
}
