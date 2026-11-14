import { describe, expect, it } from 'vitest';
import { STEPS_ACROSS_MAX, measureRelativeBox, resolveStepAxis } from './navigationMotion';

describe('resolveStepAxis', () => {
    it('places four or fewer short steps across the top', () => {
        expect(resolveStepAxis({ maxSteps: 4, labels: ['Student', 'Schedule', 'Goals', 'Review'] })).toBe('across');
        expect(resolveStepAxis({ maxSteps: STEPS_ACROSS_MAX, labels: ['One', 'Two'] })).toBe('across');
    });

    it('places five or more steps down the side', () => {
        expect(resolveStepAxis({
            maxSteps: 5,
            labels: ['Student', 'Schedule', 'Goals', 'Materials', 'Review'],
        })).toBe('down');
    });

    it('pushes four steps down the side when long labels would truncate across the top', () => {
        expect(resolveStepAxis({
            maxSteps: 4,
            labels: ['Select student cohort', 'Weekly availability', 'Instructional goals', 'Supervisor sign-off'],
        })).toBe('down');
    });
});

describe('measureRelativeBox', () => {
    it('normalizes scaled bounding rects back to unscaled layout coordinates', () => {
        const host = {
            offsetWidth: 1000,
            offsetHeight: 500,
            getBoundingClientRect: () => ({ left: 100, top: 50, width: 500, height: 250 }),
        };
        const el = {
            getBoundingClientRect: () => ({ left: 220, top: 110, width: 380, height: 20 }),
        };
        const origGetComputedStyle = globalThis.getComputedStyle;
        globalThis.getComputedStyle = () => ({ borderTopLeftRadius: '8px' });
        try {
            expect(measureRelativeBox(el, host)).toEqual({
                x: 240,
                y: 120,
                width: 760,
                height: 40,
                borderRadius: 8,
            });
        } finally {
            globalThis.getComputedStyle = origGetComputedStyle;
        }
    });
});
