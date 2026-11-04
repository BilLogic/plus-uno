import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Calendar from './Calendar';

const grid = (size) => {
    const { container } = render(
        <Calendar viewDate={new Date(2026, 9, 1)} onViewDateChange={() => {}} onPick={() => {}} size={size} />,
    );
    return container.querySelector('.plus-calendar');
};

describe('Calendar size', () => {
    it('takes the day width in pixels and draws it from the matching token', () => {
        expect(grid(28).style.getPropertyValue('--plus-calendar-day')).toBe('var(--calendar-day-sm)');
        expect(grid(36).style.getPropertyValue('--plus-calendar-day')).toBe('var(--calendar-day-md)');
        expect(grid(44).style.getPropertyValue('--plus-calendar-day')).toBe('var(--calendar-day-lg)');
    });

    it('draws 36 when size is left out', () => {
        expect(grid().style.getPropertyValue('--plus-calendar-day')).toBe('var(--calendar-day-md)');
    });

    it('declares only pixel sizes', () => {
        expect(Calendar.propTypes.size).toBeDefined();
    });
});
