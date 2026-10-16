// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toneProps } from './Field';

describe('toneProps', () => {
    it('marks the box and the control invalid for an error', () => {
        expect(toneProps('invalid')).toEqual({
            field: { invalid: true, valid: false },
            control: { 'aria-invalid': true },
        });
    });

    it('marks only the box for a confirmation; the control is not invalid', () => {
        expect(toneProps('success')).toEqual({
            field: { invalid: false, valid: true },
            control: { 'aria-invalid': undefined },
        });
    });

    it('leaves help and info as the plain field', () => {
        for (const tone of ['help', 'info', undefined]) {
            expect(toneProps(tone)).toEqual({
                field: { invalid: false, valid: false },
                control: { 'aria-invalid': undefined },
            });
        }
    });
});
