import { describe, expect, it, vi } from 'vitest';
import { resolveMoment, playMoment } from './moments';
import { soundStartFor } from './timing';

describe('registry sound moments', () => {
    it.each([['enter', 'notify'], ['failed', 'error'], ['prompt', 'prompt']])('resolves Flag %s from the registry', (event, token) => {
        expect(resolveMoment('Flag', event)).toMatchObject({ token, at: soundStartFor('spatial.default', token) });
    });
    it('uses the same landing rule in reduced mode', () => {
        expect(resolveMoment('Flag', 'enter', { mode: 'reduced' }).at).toBe(soundStartFor('spatial.default', 'notify', { mode: 'reduced' }));
    });
    it('preserves a caller sound override and times that score', () => {
        expect(resolveMoment('Flag', 'enter', { token: 'prompt' })).toMatchObject({ token: 'prompt', at: soundStartFor('spatial.default', 'prompt') });
    });
    it.each([['Missing', 'enter'], ['Flag', 'exit'], ['Flag', 'typo']])('rejects unknown or silent %s %s', (row, event) => {
        expect(() => resolveMoment(row, event)).toThrow(/Unknown sound moment/);
    });
    it('delegates token and timing to the one playback runtime', () => {
        const play = vi.fn().mockReturnValue(false);
        const resolved = resolveMoment('Flag', 'enter');
        expect(playMoment('Flag', 'enter', {}, play)).toBe(false);
        expect(play).toHaveBeenCalledExactlyOnceWith(resolved.token, { at: resolved.at });
    });
});
