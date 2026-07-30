import {
    escalationNeedsDescription,
    multiSelectComplete,
    ratingGatedRequiredness,
    toggleExclusiveNo,
} from './reflectionCopy';

describe('reflectionCopy helpers', () => {
    test('toggleExclusiveNo clears Yes options when No is selected', () => {
        expect(toggleExclusiveNo(['behavioral', 'well-being'], 'no')).toEqual(['no']);
    });

    test('toggleExclusiveNo clears No when a Yes option is selected', () => {
        expect(toggleExclusiveNo(['no'], 'behavioral')).toEqual(['behavioral']);
    });

    test('toggleExclusiveNo never leaves an empty selection', () => {
        expect(toggleExclusiveNo(['no'], 'no')).toEqual(['no']);
    });

    test('escalationNeedsDescription', () => {
        expect(escalationNeedsDescription(['no'])).toBe(false);
        expect(escalationNeedsDescription(['behavioral'])).toBe(true);
    });

    test('ratingGatedRequiredness', () => {
        expect(ratingGatedRequiredness(5)).toEqual({ positiveRequired: true, improveRequired: false });
        expect(ratingGatedRequiredness(1)).toEqual({ positiveRequired: false, improveRequired: true });
        expect(ratingGatedRequiredness(3)).toEqual({ positiveRequired: true, improveRequired: true });
    });

    test('multiSelectComplete requires Other text when Other selected', () => {
        expect(multiSelectComplete(['other'], '')).toBe(false);
        expect(multiSelectComplete(['other'], 'details')).toBe(true);
        expect(multiSelectComplete(['ahead'], '')).toBe(true);
    });
});
