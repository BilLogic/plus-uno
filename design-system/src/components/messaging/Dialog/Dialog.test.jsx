import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Dialog, { DIALOG_HEIGHTS, DIALOG_WIDTHS } from './Dialog';
import Button from '@/components/forms-and-inputs/Button';
import { Section } from '@/templates';

describe('Dialog', () => {
    it('renders inline without a Blanket or modal portal', () => {
        const { container } = render(
            <Dialog title="Session details" body="Thursday at 4:00 PM ET" />,
        );
        const panel = container.querySelector('.plus-dialog');
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveClass('plus-dialog-width-6-col', 'plus-dialog-height-hug');
        expect(document.querySelector('.plus-modal-blanket')).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByRole('heading', { level: 1, name: 'Session details' })).toBeInTheDocument();
    });

    it('supports all screen-grid width and height steps', () => {
        for (const width of DIALOG_WIDTHS) {
            const { container, unmount } = render(<Dialog title="Step" width={width} />);
            expect(container.querySelector(`.plus-dialog-width-${width}`)).toBeInTheDocument();
            unmount();
        }
        for (const height of DIALOG_HEIGHTS) {
            const { container, unmount } = render(<Dialog title="Step" height={height} />);
            expect(container.querySelector(`.plus-dialog-height-${height}`)).toBeInTheDocument();
            unmount();
        }
    });

    it('renders header description, headerActions, close button, body, children, dividers, and footer slots', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const onPrimary = vi.fn();
        const onSecondary = vi.fn();
        const { container } = render(
            <Dialog
                title="Edit session"
                description="Changes apply to this session only."
                headerActions={<Button text="Help" spacing="compact" />}
                dividers
                body="Session notes"
                secondaryButton={{ text: 'Discard', onClick: onSecondary }}
                primaryButton={{ text: 'Save', onClick: onPrimary }}
                onClose={onClose}
            >
                <p>Extra details</p>
            </Dialog>,
        );

        expect(screen.getByText('Changes apply to this session only.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
        expect(screen.getByText('Session notes')).toBeInTheDocument();
        expect(screen.getByText('Extra details')).toBeInTheDocument();
        expect(container.querySelectorAll('.plus-dialog-divider')).toHaveLength(2);

        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Discard' }));
        expect(onSecondary).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(onPrimary).toHaveBeenCalledTimes(1);
    });

    it('supports custom header and tabs slots', async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();
        const tabs = [
            { key: 'details', label: 'Details', content: <p>Details panel</p> },
            { key: 'notes', label: 'Notes', content: <p>Notes panel</p> },
        ];
        render(
            <Dialog
                title="Session settings"
                tabs={tabs}
                defaultActiveTab="details"
                onTabChange={onTabChange}
            />,
        );

        expect(screen.getByText('Details panel')).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Notes' }));
        expect(onTabChange).toHaveBeenCalledWith('notes');
        expect(screen.getByText('Notes panel')).toBeInTheDocument();
    });

    it('renders loading skeleton with aria-busy and keeps heading hierarchy starting at h2 inside', () => {
        const { container, rerender } = render(<Dialog title="Loading" loading />);
        const body = container.querySelector('.plus-dialog-body');
        expect(body).toHaveAttribute('aria-busy', 'true');
        expect(container.querySelector('.plus-dialog-skeleton')).toBeInTheDocument();

        rerender(
            <Dialog title="Schedule">
                <Section title="Details">Monday at 4:00 PM</Section>
            </Dialog>,
        );
        expect(screen.getByRole('heading', { level: 1, name: 'Schedule' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Details' })).toBeInTheDocument();
    });
});
