import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ButtonItem, StatusTag } from '@/components';

const NAME = 'Attendance, Hermione Granger: Present';

const rows = (
    <>
        <ButtonItem isSelected>Present</ButtonItem>
        <ButtonItem>Late</ButtonItem>
        <ButtonItem>Absent</ButtonItem>
    </>
);

const Tag = (props) => (
    <StatusTag appearance="success" menu={rows} aria-label={NAME} {...props}>Present</StatusTag>
);

describe('StatusTag without a menu', () => {
    it('is a label: no button, no role', () => {
        render(<StatusTag appearance="success">Present</StatusTag>);
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.getByText('Present').closest('.plus-status').tagName).toBe('SPAN');
    });
});

describe('StatusTag with a menu', () => {
    it('is a button named "<field>, <record>: <status>" that announces a menu', () => {
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('draws the chevron down at rest and up while open', async () => {
        const user = userEvent.setup();
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger.querySelector('.fa-angle-down')).not.toBeNull();
        expect(trigger.querySelector('.fa-angle-up')).toBeNull();
        await user.click(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        expect(trigger.querySelector('.fa-angle-up')).not.toBeNull();
        expect(trigger.querySelector('.fa-angle-down')).toBeNull();
    });

    it('lists the rows when opened, the current one marked', async () => {
        const user = userEvent.setup();
        render(<Tag />);
        await user.click(screen.getByRole('button', { name: NAME }));
        expect(await screen.findByRole('menuitem', { name: 'Late' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Present' })).toHaveAttribute('aria-current', 'true');
    });

    it.each([['{Enter}'], [' '], ['{ArrowDown}']])('opens from the keyboard with %j', async (key) => {
        const user = userEvent.setup();
        render(<Tag />);
        screen.getByRole('button', { name: NAME }).focus();
        await user.keyboard(key);
        expect(await screen.findByRole('menuitem', { name: 'Late' })).toBeInTheDocument();
    });

    it('closes on Escape and returns focus to the tag', async () => {
        const user = userEvent.setup();
        render(<Tag />);
        const trigger = screen.getByRole('button', { name: NAME });
        await user.click(trigger);
        await screen.findByRole('menuitem', { name: 'Late' });
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Late' })).toBeNull());
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when a row is picked', async () => {
        const user = userEvent.setup();
        const onPick = vi.fn();
        render(<Tag menu={<ButtonItem onClick={onPick}>Late</ButtonItem>} />);
        await user.click(screen.getByRole('button', { name: NAME }));
        await user.click(await screen.findByRole('menuitem', { name: 'Late' }));
        expect(onPick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Late' })).toBeNull());
    });

    it('reports open changes, and honors a controlled isOpen', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const { rerender } = render(<Tag isOpen={false} onOpenChange={onOpenChange} />);
        await user.click(screen.getByRole('button', { name: NAME }));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
        expect(screen.queryByRole('menuitem', { name: 'Late' })).toBeNull();
        rerender(<Tag isOpen onOpenChange={onOpenChange} />);
        expect(await screen.findByRole('menuitem', { name: 'Late' })).toBeInTheDocument();
    });

    it('starts open with defaultOpen', async () => {
        render(<Tag defaultOpen />);
        expect(await screen.findByRole('menuitem', { name: 'Late' })).toBeInTheDocument();
    });

    it('cannot be opened while disabled', async () => {
        const user = userEvent.setup();
        render(<Tag isDisabled />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toBeDisabled();
        await user.click(trigger);
        expect(screen.queryByRole('menuitem', { name: 'Late' })).toBeNull();
    });

    it('while loading is busy, cannot be opened, and draws one spinner sized 12 (default) or 16 (spacious)', async () => {
        const user = userEvent.setup();
        const { container, rerender } = render(<Tag isLoading />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger).toHaveAttribute('aria-busy', 'true');
        expect(trigger).toBeDisabled();
        await user.click(trigger);
        expect(screen.queryByRole('menuitem', { name: 'Late' })).toBeNull();
        expect(container.querySelectorAll('.plus-spinner')).toHaveLength(1);
        expect(container.querySelector('.plus-spinner')).toHaveAttribute('data-size', '12');
        // The label stays in the tree so the tag keeps its width.
        expect(trigger).toHaveTextContent('Present');
        rerender(<Tag isLoading spacing="spacious" />);
        expect(container.querySelector('.plus-spinner')).toHaveAttribute('data-size', '16');
    });

    it('keeps the nested count and the icon before', () => {
        render(<Tag iconBefore="circle-check" trailingMetric={3} />);
        const trigger = screen.getByRole('button', { name: NAME });
        expect(trigger.querySelector('.fa-circle-check')).not.toBeNull();
        expect(trigger.querySelector('.plus-count')).not.toBeNull();
    });
});
