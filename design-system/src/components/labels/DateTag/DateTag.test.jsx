import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar, DateTag } from '@/components';

const NAME = 'Due date, Session 12: Due tomorrow';

const PickCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date(2026, 10, 1));
    const [selected, setSelected] = useState('2026-11-27');
    return <Calendar viewDate={viewDate} onViewDateChange={setViewDate} selected={selected} onPick={(d) => setSelected(d)} />;
};

const Tag = (props) => (
    <DateTag appearance="warning" menu={<PickCalendar />} aria-label={NAME} {...props}>Due tomorrow</DateTag>
);

describe('DateTag without a menu', () => {
    it('is a label: no button', () => {
        render(<DateTag>Due tomorrow</DateTag>);
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('DateTag with a menu', () => {
    it('is a button with the full accessible name, a popup and aria-expanded', () => {
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toHaveAttribute('aria-haspopup');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens a popup holding the calendar and flips the chevron up', async () => {
        const user = userEvent.setup();
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger.querySelector('.fa-angle-down')).not.toBeNull();
        await user.click(trigger);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger.querySelector('.fa-angle-up')).not.toBeNull();
    });

    it.each([['{Enter}'], [' ']])('opens from the keyboard with %j', async (key) => {
        const user = userEvent.setup();
        render(<Tag />);
        screen.getByRole('button', { name: NAME }).focus();
        await user.keyboard(key);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('closes on Escape and returns focus to the tag', async () => {
        const user = userEvent.setup();
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        await user.click(trigger);
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('reports open changes and honors a controlled isOpen', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const { rerender } = render(<Tag isOpen={false} onOpenChange={onOpenChange} />);
        await user.click(screen.getByRole('button', { name: NAME }));
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.queryByRole('dialog')).toBeNull();
        rerender(<Tag isOpen onOpenChange={onOpenChange} />);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('cannot be opened while disabled', async () => {
        const user = userEvent.setup();
        render(<Tag isDisabled />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toBeDisabled();
        await user.click(trigger);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('while loading is busy and draws one spinner sized 12 (default) or 16 (spacious)', () => {
        const { container, rerender } = render(<Tag isLoading />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toHaveAttribute('aria-busy', 'true');
        expect(trigger).toBeDisabled();
        expect(container.querySelectorAll('.plus-spinner')).toHaveLength(1);
        expect(container.querySelector('.plus-spinner')).toHaveAttribute('data-size', '12');
        rerender(<Tag isLoading spacing="spacious" />);
        expect(container.querySelector('.plus-spinner')).toHaveAttribute('data-size', '16');
    });
});
