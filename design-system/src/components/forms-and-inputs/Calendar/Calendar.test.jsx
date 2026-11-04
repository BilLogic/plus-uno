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
        expect(grid(28)).toHaveAttribute('data-size', '28');
        expect(grid(44)).toHaveAttribute('data-size', '44');
    });

    it('draws 36 when size is left out', () => {
        expect(grid()).toHaveAttribute('data-size', '36');
    });

    it('declares only pixel sizes', () => {
        expect(Calendar.propTypes.size).toBeDefined();
    });
});
