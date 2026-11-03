// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toneProps } from './FieldFrame';

describe('toneProps', () => {
    it('marks the box and the control invalid for an error', () => {
        expect(toneProps('invalid')).toEqual({
            field: { invalid: true, warning: false, valid: false },
            control: { 'aria-invalid': true },
        });
    });

    it('marks only the box for a warning; the value is accepted, so the control is not invalid', () => {
        expect(toneProps('warning')).toEqual({
            field: { invalid: false, warning: true, valid: false },
            control: { 'aria-invalid': undefined },
        });
    });

    it('marks only the box for a confirmation; the control is not invalid', () => {
        expect(toneProps('success')).toEqual({
            field: { invalid: false, warning: false, valid: true },
            control: { 'aria-invalid': undefined },
        });
    });

    it('leaves help and info as the plain field', () => {
        for (const tone of ['help', 'info', undefined]) {
            expect(toneProps(tone)).toEqual({
                field: { invalid: false, warning: false, valid: false },
                control: { 'aria-invalid': undefined },
            });
        }
    });
});
