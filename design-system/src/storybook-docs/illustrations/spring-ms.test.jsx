import { describe, expect, it } from 'vitest';
import { springMs } from './motion-physics.jsx';
import { measure, springFor } from './motion.jsx';

describe('springMs', () => {
    it('reads the 90% and settle times the token table shows', () => {
        const m = measure(springFor('appearance.fast', 'productive'));
        expect(springMs('appearance.fast')).toBe(`${Math.round(m.t90 * 1000)} ms`);
        expect(springMs('appearance.fast', 'settle')).toBe(`${Math.round(m.settle * 1000)} ms`);
    });
    it('is a plain millisecond figure', () => {
        expect(springMs('spatial.fast', 't90', 'expressive')).toMatch(/^\d+ ms$/);
    });
});
