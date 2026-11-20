import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
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

const Held = ({ selected = '2026-10-21', ...props }) => {
    const [viewDate, setViewDate] = useState(new Date(2026, 9, 1));
    return <Calendar viewDate={viewDate} onViewDateChange={setViewDate} selected={selected} onPick={() => {}} {...props} />;
};

const day = (text) => screen.getByRole('button', { name: new RegExp(text) });
const focusDay = async (user, text) => {
    await user.tab();
    await user.tab();
    await user.tab();
    expect(day(text)).toHaveFocus();
};

describe('Calendar keyboard', () => {
    it('puts one day in the tab order: the picked day', async () => {
        render(<Held />);
        const days = screen.getAllByRole('button').filter((b) => /\d{4}$/.test(b.getAttribute('aria-label')));
        expect(days.filter((b) => b.tabIndex === 0)).toEqual([day('October 21, 2026')]);
    });

    it('moves by day with the left and right arrows', async () => {
        const user = userEvent.setup();
        render(<Held />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{ArrowRight}');
        expect(day('October 22, 2026')).toHaveFocus();
        await user.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(day('October 20, 2026')).toHaveFocus();
    });

    it('moves by week with the up and down arrows', async () => {
        const user = userEvent.setup();
        render(<Held />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{ArrowDown}');
        expect(day('October 28, 2026')).toHaveFocus();
        await user.keyboard('{ArrowUp}{ArrowUp}');
        expect(day('October 14, 2026')).toHaveFocus();
    });

    it('goes to the start and end of the week with Home and End', async () => {
        const user = userEvent.setup();
        render(<Held />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{Home}');
        expect(day('October 18, 2026')).toHaveFocus();
        await user.keyboard('{End}');
        expect(day('October 24, 2026')).toHaveFocus();
    });

    it('goes by month with Page Up and Page Down, and by year with Shift', async () => {
        const user = userEvent.setup();
        render(<Held />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{PageDown}');
        expect(await screen.findByText('November 2026')).toBeInTheDocument();
        expect(day('November 21, 2026')).toHaveFocus();
        await user.keyboard('{PageUp}{PageUp}');
        expect(day('September 21, 2026')).toHaveFocus();
        await user.keyboard('{Shift>}{PageDown}{/Shift}');
        expect(day('September 21, 2027')).toHaveFocus();
    });

    it('crosses into the next month when an arrow leaves the grid month', async () => {
        const user = userEvent.setup();
        render(<Held selected="2026-10-31" />);
        await focusDay(user, 'October 31, 2026');
        await user.keyboard('{ArrowRight}');
        expect(day('November 1, 2026')).toHaveFocus();
    });

    it('stops at minDate and maxDate', async () => {
        const user = userEvent.setup();
        render(<Held minDate="2026-10-20" maxDate="2026-10-22" />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{ArrowRight}{ArrowRight}');
        expect(day('October 22, 2026')).toHaveFocus();
        await user.keyboard('{ArrowUp}');
        expect(day('October 20, 2026')).toHaveFocus();
    });

    it('still picks with Enter on the focused day', async () => {
        const user = userEvent.setup();
        const onPick = vi.fn();
        render(<Held onPick={onPick} />);
        await focusDay(user, 'October 21, 2026');
        await user.keyboard('{ArrowRight}{Enter}');
        expect(onPick).toHaveBeenCalledWith(new Date(2026, 9, 22));
    });
});
