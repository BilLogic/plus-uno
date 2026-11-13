import { SOUND_MOMENTS } from './spec.generated';
import { soundStartFor } from './timing';
import { playSound } from './play';

/** Resolve a registry moment; conditions such as session state stay with the caller. */
export function resolveMoment(row, event, { mode = 'productive', token } = {}) {
    const matches = SOUND_MOMENTS.filter((m) => m.row === row && m.event === event);
    const moment = matches.find((m) => m.tier === 'component') ?? matches[0];
    if (!moment) throw new Error(`Unknown sound moment: ${row}.${event}`);
    const sound = token ?? moment.token;
    return { token: sound, at: moment.at === 'start' ? 0 : soundStartFor(moment.spring, sound, { mode }) };
}

/** Route playback through the existing setting, unlock and burst gates. */
export function playMoment(row, event, options, play = playSound) {
    const { token, at } = resolveMoment(row, event, options);
    return play(token, { at });
}
