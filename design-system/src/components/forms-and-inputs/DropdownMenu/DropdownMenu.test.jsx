import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, DropdownMenu, Modal } from '@/components';
import { OverlayContainer } from '@/lib/overlay';
import { MotionPreferenceContext } from '@/lib/motionPreference';

describe('DropdownMenu in a Modal', () => {
    it('mounts the opened menu inside the Modal blanket', async () => {
        const user = userEvent.setup();
        render(
            <Modal show title="Actions dialog">
                <DropdownMenu trigger={<Button>Actions</Button>} testId="actions-menu">
                    <button role="menuitem" type="button">Rename</button>
                </DropdownMenu>
            </Modal>,
        );

        const trigger = await screen.findByRole('button', { name: 'Actions' });
        await user.click(trigger);
        const menu = await screen.findByTestId('actions-menu');
        expect(menu.closest('.plus-pattern-blanket')).toBe(trigger.closest('.plus-pattern-blanket'));
        expect(menu.closest('.plus-pattern-blanket')).not.toBeNull();
    });
});

describe('DropdownMenu floating behavior', () => {
    it('keeps the menu open underneath a Modal it raised', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        function Example() {
            const [show, setShow] = useState(false);
            return (
                <>
                    <DropdownMenu trigger={<Button>Actions</Button>} onOpenChange={onOpenChange} testId="actions-menu">
                        <button role="menuitem" type="button" data-keep-open="true" onClick={() => setShow(true)}>Details</button>
                    </DropdownMenu>
                    <Modal show={show} title="Details dialog" onClose={() => setShow(false)}>
                        <Button>Inside dialog</Button>
                    </Modal>
                </>
            );
        }
        render(<Example />);
        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Details' }));
        await user.click(await screen.findByRole('button', { name: 'Inside dialog' }));
        expect(screen.getByTestId('actions-menu')).toHaveAttribute('data-open');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Details dialog' })).not.toBeInTheDocument());
        expect(screen.getByTestId('actions-menu')).toHaveAttribute('data-open');
        expect(onOpenChange.mock.calls).toEqual([[true]]);
    });

    it('honors controlled isOpen via useOpenState', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const { rerender } = render(
            <MotionPreferenceContext.Provider value={true}>
                <DropdownMenu
                    trigger={<Button>Controlled actions</Button>}
                    isOpen={false}
                    onOpenChange={onOpenChange}
                    testId="controlled-actions-menu"
                >
                    <button role="menuitem" type="button">Rename</button>
                </DropdownMenu>
            </MotionPreferenceContext.Provider>,
        );
        expect(screen.queryByTestId('controlled-actions-menu')).toBeNull();

        rerender(
            <MotionPreferenceContext.Provider value={true}>
                <DropdownMenu
                    trigger={<Button>Controlled actions</Button>}
                    isOpen
                    onOpenChange={onOpenChange}
                    testId="controlled-actions-menu"
                >
                    <button role="menuitem" type="button">Rename</button>
                </DropdownMenu>
            </MotionPreferenceContext.Provider>,
        );
        const menu = await screen.findByTestId('controlled-actions-menu');
        await user.click(within(menu).getByRole('menuitem', { name: 'Rename' }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(screen.getByTestId('controlled-actions-menu')).toBeInTheDocument();
    });

    it('keeps a controlled menu open on ignored outside clicks and still closes on Escape', async () => {
        const user = userEvent.setup();
        function ControlledCard() {
            const [isOpen, setIsOpen] = useState(true);
            const insideRef = React.useRef(false);
            return (
                <div>
                    <div
                        onClickCapture={() => { insideRef.current = true; }}
                        onKeyDownCapture={() => { insideRef.current = true; }}
                    >
                        <DropdownMenu
                            trigger={<Button>Actions</Button>}
                            isOpen={isOpen}
                            onOpenChange={(next) => {
                                if (next || insideRef.current) {
                                    insideRef.current = false;
                                    setIsOpen(next);
                                }
                            }}
                            testId="controlled-outside-menu"
                        >
                            <button role="menuitem" type="button">Rename</button>
                        </DropdownMenu>
                    </div>
                    <button type="button">Outside target</button>
                </div>
            );
        }
        render(<ControlledCard />);
        expect(screen.getByTestId('controlled-outside-menu')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Outside target' }));
        expect(screen.getByTestId('controlled-outside-menu')).toBeInTheDocument();

        const item = screen.getByRole('menuitem', { name: 'Rename' });
        item.focus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('controlled-outside-menu')).toBeNull());
    });

    it('closes an uncontrolled menu on Escape and returns focus to its trigger', async () => {
        const user = userEvent.setup();
        render(
            <DropdownMenu trigger={<Button>Actions</Button>} testId="uncontrolled-menu">
                <button role="menuitem" type="button">Rename</button>
            </DropdownMenu>,
        );
        const trigger = screen.getByRole('button', { name: 'Actions' });
        await user.click(trigger);
        const item = await screen.findByRole('menuitem', { name: 'Rename' });
        item.focus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('uncontrolled-menu')).not.toBeInTheDocument());
        expect(trigger).toHaveFocus();
    });

    it('closes a controlled menu whose parent accepts the close and returns focus to its trigger', async () => {
        const user = userEvent.setup();
        function ControlledExample() {
            const [isOpen, setIsOpen] = useState(false);
            return (
                <DropdownMenu
                    trigger={<Button>Actions</Button>}
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    testId="controlled-close-menu"
                >
                    <button role="menuitem" type="button">Rename</button>
                </DropdownMenu>
            );
        }
        render(<ControlledExample />);
        const trigger = screen.getByRole('button', { name: 'Actions' });
        await user.click(trigger);
        const item = await screen.findByRole('menuitem', { name: 'Rename' });
        item.focus();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByTestId('controlled-close-menu')).not.toBeInTheDocument());
        expect(trigger).toHaveFocus();
    });

    it('honors an explicit container over the preview container and preserves the trigger ref', async () => {
        const user = userEvent.setup();
        const preview = document.createElement('div');
        const explicit = document.createElement('div');
        document.body.append(preview, explicit);
        const ref = React.createRef();
        const { unmount } = render(
            <OverlayContainer container={preview}>
                <MotionPreferenceContext.Provider value={true}>
                    <DropdownMenu trigger={<Button ref={ref}>Actions</Button>} container={explicit} testId="actions-menu">
                        <button role="menuitem" type="button">Rename</button>
                    </DropdownMenu>
                </MotionPreferenceContext.Provider>
            </OverlayContainer>,
        );
        try {
            expect(ref.current).toBe(screen.getByRole('button', { name: 'Actions' }));
            await user.click(ref.current);
            const menu = await screen.findByTestId('actions-menu');
            expect(explicit).toContainElement(menu);
            expect(preview).not.toContainElement(menu);
            expect(menu).toHaveAttribute('data-reduced', 'true');
            await user.keyboard('{Escape}');
            await waitFor(() => expect(screen.queryByTestId('actions-menu')).not.toBeInTheDocument());
            expect(ref.current).toHaveFocus();
        } finally {
            unmount();
            preview.remove();
            explicit.remove();
        }
        expect(ref.current).toBeNull();
    });
});
