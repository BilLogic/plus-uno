// Sound (ADR-042): synthesized in the browser from the sound plan, one on/off
// setting, started against its motion's land time.
import { SOUND_SPEC } from './spec.generated';

export { installAudioUnlock, playSound, unlockAudio } from './play';
export { isSoundEnabled, setSoundEnabled } from './settings';
export { SoundProvider, useSound } from './SoundProvider';
export { soundStartFor, springT90 } from './timing';

/** Every sound token's name, without the `sound.` prefix. */
export const SOUND_TOKENS = Object.keys(SOUND_SPEC.tokens);
