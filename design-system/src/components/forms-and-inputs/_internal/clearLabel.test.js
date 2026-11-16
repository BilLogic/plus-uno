import { describe, expect, it } from 'vitest';
import React from 'react';
import clearLabel from './clearLabel';

describe('clearLabel', () => {
    it('lowercases the noun after Clear', () => {
        expect(clearLabel('Start date')).toBe('Clear start date');
        expect(clearLabel('Session date', 'date')).toBe('Clear session date');
        expect(clearLabel('Report period', 'dates')).toBe('Clear report period');
        expect(clearLabel('School')).toBe('Clear school');
    });

    it('falls back when the noun is empty or not a string', () => {
        expect(clearLabel(undefined, 'date')).toBe('Clear date');
        expect(clearLabel('', 'dates')).toBe('Clear dates');
        expect(clearLabel(React.createElement('span', null, 'School'))).toBe('Clear selection');
    });
});
