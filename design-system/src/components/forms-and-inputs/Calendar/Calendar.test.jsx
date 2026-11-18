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
    it('takes the day width in pixels and marks the grid with it', () => {
        expect(grid(24)).toHaveAttribute('data-size', '24');
        expect(grid(40)).toHaveAttribute('data-size', '40');
    });

    it('draws 32 when size is left out', () => {
        expect(grid()).toHaveAttribute('data-size', '32');
    });
});
