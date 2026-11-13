import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Modal from './Modal';
import { subscribeOverlays } from '@/lib/overlay';

const panel = () => screen.getByTestId('modal');

describe('Modal width by column count', () => {
    it('is 6 columns by default', () => {
        render(<Modal show renderAs="inline" title="T" data-testid="modal" />);
        expect(panel()).toHaveClass('plus-modal-width-6-col');
    });

    it.each(['8-col', '10-col'])('draws %s from the screen grid', (width) => {
        render(<Modal show renderAs="inline" title="T" width={width} data-testid="modal" />);
        expect(panel()).toHaveClass(`plus-modal-width-${width}`);
        expect(panel().style.width).toBe('');
    });

    it('treats the old sm / md / lg names as unsafe lengths, not grid widths', () => {
        render(<Modal show renderAs="inline" title="T" width="md" data-testid="modal" />);
        expect(panel().className).not.toMatch(/plus-modal-width-/);
        expect(panel().style.width).toBe('');
    });

    it('still takes a fixed pixel width', () => {
        render(<Modal show renderAs="inline" title="T" width={480} data-testid="modal" />);
        expect(panel().style.width).toBe('480px');
    });
});

describe('Modal sizing props', () => {
    it('ignores paddingSize, gapSize and radiusSize: they are gone', () => {
        render(<Modal show renderAs="inline" title="T" paddingSize="lg" gapSize="lg" radiusSize="lg" data-testid="modal" />);
        expect(panel().className).not.toMatch(/plus-modal-(pad|gap|radius)-/);
    });
});

/**
 * The dialog behavior comes from Base UI's Dialog: focus in on open, focus
 * kept in, Escape, a press on the backdrop, focus back on close, and the page
 * behind hidden from assistive tech while it is open.
 */
describe('Modal dialog behavior', () => {
    const Harness = (props) => {
        const [open, setOpen] = React.useState(false);
        return (
            <>
                <button type="button" onClick={() => setOpen(true)}>Open</button>
                <button type="button">Behind</button>
                <Modal
                    show={open}
                    title="Settings"
                    description="Choose what changes."
                    primaryButton={{ text: 'Save', onClick: () => setOpen(false) }}
                    onClose={() => setOpen(false)}
                    {...props}
                />
            </>
        );
    };

    const open = async (props) => {
        const user = userEvent.setup();
        render(<Harness {...props} />);
        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);
        const dialog = await screen.findByRole('dialog', { name: 'Settings' });
        return { user, trigger, dialog };
    };

    it('is named by its title and described by its description', async () => {
        const { dialog } = await open();
        expect(dialog).toHaveAccessibleDescription('Choose what changes.');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('is a Base UI dialog popup', async () => {
        const { dialog } = await open();
        expect(dialog).toHaveAttribute('data-open');
    });

    it('moves focus inside on open', async () => {
        const { dialog } = await open();
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    });

    it('hides the page behind from assistive tech while open', async () => {
        await open();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Behind' })).toBeNull());
    });

    it('closes on Escape and gives focus back to the trigger', async () => {
        const { user, trigger } = await open();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        await waitFor(() => expect(document.activeElement).toBe(trigger));
    });

    it('keeps open on Escape with keyboard={false}', async () => {
        const { user } = await open({ keyboard: false });
        await user.keyboard('{Escape}');
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    });

    it('closes on a press on the backdrop', async () => {
        const { user, dialog } = await open();
        await user.click(dialog.closest('.plus-pattern-backdrop'));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it.each(['static', false])('keeps open on a press on the backdrop with backdrop=%s', async (backdrop) => {
        const { user, dialog } = await open({ backdrop });
        await user.click(dialog.closest('.plus-pattern-backdrop'));
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    });

    it('closes from the close button', async () => {
        const { user, dialog } = await open();
        await user.click(within(dialog).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('takes ariaLabel as its name when it has no title', () => {
        render(<Modal show ariaLabel="Quick note" body="Saved." onClose={() => {}} />);
        expect(screen.getByRole('dialog', { name: 'Quick note' })).toBeInTheDocument();
    });

    it('reports lost focus when its trigger left the page while it was open', async () => {
        const events = [];
        const unsubscribe = subscribeOverlays((event) => events.push(event.type));
        const Gone = () => {
            const [open, setOpen] = React.useState(false);
            const [triggerShown, setTriggerShown] = React.useState(true);
            return (
                <>
                    {triggerShown && <button type="button" onClick={() => setOpen(true)}>Open</button>}
                    <Modal
                        show={open}
                        title="Settings"
                        primaryButton={{ text: 'Done', onClick: () => { setTriggerShown(false); setOpen(false); } }}
                        onClose={() => setOpen(false)}
                    />
                </>
            );
        };
        const user = userEvent.setup();
        render(<Gone />);
        await user.click(screen.getByRole('button', { name: 'Open' }));
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Done' }));
        await waitFor(() => expect(events).toContain('focus-lost'));
        unsubscribe();
    });
});
