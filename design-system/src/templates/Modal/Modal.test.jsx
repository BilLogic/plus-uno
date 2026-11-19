import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal, { MODAL_HEIGHTS, MODAL_WIDTHS, MODAL_WIDTH_PX, MODAL_WIDTH_SCREENS } from './Modal';
import { subscribeOverlays } from '@/lib/overlay';
import { FooterPinnedModal, ButtonInBodyModal, StepsFooterModal, TabsForStepsModal, ConfirmNarrow, ConfirmWide, ConfirmsInside, ModalOnModal } from './ModalCases';
import { CODE as MODAL_CODE } from './ModalCaseCode.js';

describe('Modal template', () => {
    const open = async (props = {}) => {
        const user = userEvent.setup();
        function Host() {
            const [show, setShow] = React.useState(false);
            return (
                <>
                    <button type="button" onClick={() => setShow(true)}>Open</button>
                    <Modal
                        show={show}
                        title="Settings"
                        body="Changes save when you close."
                        primaryButton={{ text: 'Done', onClick: () => setShow(false) }}
                        onClose={() => setShow(false)}
                        {...props}
                    />
                </>
            );
        }
        const view = render(<Host />);
        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);
        const dialog = await screen.findByRole('dialog', { name: 'Settings' });
        return { user, dialog, trigger, unmount: view.unmount };
    };

    it('exports 4-col..10-col widths and hug/fill heights with no xs/sm/md/lg values', () => {
        expect(MODAL_WIDTHS).toEqual(['4-col', '6-col', '8-col', '10-col']);
        expect(MODAL_HEIGHTS).toEqual(['hug', 'fill']);
        expect(MODAL_WIDTH_SCREENS).toEqual([768, 1024, 1280]);
        expect(Object.keys(MODAL_WIDTH_PX)).toEqual(MODAL_WIDTHS);
    });

    it('opens as a dialog on a Blanket, moves focus inside, and locks scroll', async () => {
        const { dialog } = await open();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog.closest('.plus-modal-blanket')).not.toBeNull();
        expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('returns focus to the trigger when closed and closes on Escape', async () => {
        const { user, trigger } = await open();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(document.activeElement).toBe(trigger);
    });

    it('closes on a Blanket press by default, and stays open when blanket="static" or false', async () => {
        const first = await open();
        await first.user.click(first.dialog.closest('.plus-modal-blanket'));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        first.unmount();

        for (const blanket of ['static', false]) {
            const { user, dialog, unmount } = await open({ blanket });
            await user.click(dialog.closest('.plus-modal-blanket'));
            expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: 'Close' }));
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
            unmount();
        }
    });

    it('keeps a second Modal closed and notifies its onClose', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const onSecondClose = vi.fn();
            render(
                <>
                    <Modal show title="First" body="Already open" onClose={() => {}} />
                    <Modal show title="Second" body="Refused" onClose={onSecondClose} />
                </>,
            );
            expect(screen.getByRole('dialog', { name: 'First' })).toBeInTheDocument();
            expect(screen.queryByRole('dialog', { name: 'Second' })).toBeNull();
            await waitFor(() => expect(onSecondClose).toHaveBeenCalledTimes(1));
        } finally {
            warn.mockRestore();
        }
    });

    it('notifies overlay listeners when opening, closing, and when trigger unmounts', async () => {
        const events = [];
        const unsubscribe = subscribeOverlays((e) => events.push(e.type));
        const user = userEvent.setup();
        function Host() {
            const [show, setShow] = React.useState(false);
            const [hasTrigger, setHasTrigger] = React.useState(true);
            return (
                <>
                    {hasTrigger && <button type="button" onClick={() => setShow(true)}>Open</button>}
                    <Modal
                        show={show}
                        title="Settings"
                        primaryButton={{
                            text: 'Done',
                            onClick: () => {
                                setHasTrigger(false);
                                setShow(false);
                            },
                        }}
                        onClose={() => setShow(false)}
                    />
                </>
            );
        }
        render(<Host />);
        await user.click(screen.getByRole('button', { name: 'Open' }));
        expect(events).toContain('open');
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Done' }));
        await waitFor(() => expect(events).toContain('focus-lost'));
        expect(events).toContain('close');
        unsubscribe();
    });

    it('renders inline stage with screenWidth and screenHeight', () => {
        const { container } = render(
            <Modal inline show screenWidth={1024} screenHeight={480} width="8-col" title="Inline stage" onClose={() => {}}>
                <p>Body</p>
            </Modal>,
        );
        const blanket = container.querySelector('.plus-modal-blanket-inline');
        expect(blanket).not.toBeNull();
        expect(blanket.style.getPropertyValue('--plus-overlay-screen')).toBe('1024px');
        expect(container.querySelector('.plus-dialog-width-8-col')).toBeInTheDocument();
    });

    it('renders ModalCases live examples cleanly', async () => {
        const user = userEvent.setup();
        const pinned = render(<FooterPinnedModal />);
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        pinned.unmount();

        const inBody = render(<ButtonInBodyModal />);
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        inBody.unmount();

        const steps = render(<StepsFooterModal />);
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByLabelText('Time')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
        steps.unmount();

        render(<TabsForStepsModal />);
        expect(screen.getByRole('tab', { name: '1. Student' })).toHaveAttribute('aria-selected', 'true');
    });

    it('fires onBlanketClick when clicking the inline blanket outside the panel', () => {
        const onClose = vi.fn();
        const { container } = render(
            <Modal inline show title="Inline" onClose={onClose}>
                <p>Inside</p>
            </Modal>,
        );
        fireEvent.click(container.querySelector('.plus-dialog'));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(container.querySelector('.plus-modal-blanket'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('Modal live do and dont examples', () => {
    it('ConfirmNarrow and ConfirmWide render the same confirm at 4-col and 10-col', () => {
        const narrow = render(<ConfirmNarrow />);
        expect(screen.getByRole('dialog', { name: 'Delete session?' })).toBeInTheDocument();
        const narrowClass = narrow.container.querySelector('[role="dialog"]').className;
        narrow.unmount();
        const wide = render(<ConfirmWide />);
        expect(screen.getByRole('dialog', { name: 'Delete session?' })).toBeInTheDocument();
        expect(wide.container.querySelector('[role="dialog"]').className).not.toBe(narrowClass);
    });

    it('ConfirmsInside confirms in one dialog; ModalOnModal stacks two', () => {
        const inside = render(<ConfirmsInside />);
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        expect(screen.getByRole('dialog', { name: 'Delete session?' })).toBeInTheDocument();
        inside.unmount();
        render(<ModalOnModal />);
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
    });

    it('has Show code source for each', () => {
        expect(Object.keys(MODAL_CODE)).toEqual(['ConfirmNarrow', 'ConfirmWide', 'ConfirmsInside', 'ModalOnModal']);
    });
});
