import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, DropdownMenu, Modal } from '@/components';
import { OverlayContainer } from '@/lib/overlay';
import { MotionPreferenceContext } from '@/lib/motionPreference';

describe('DropdownMenu in a Modal', () => {
    it('mounts the opened menu inside the Modal backdrop', async () => {
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
        expect(menu.closest('.plus-pattern-backdrop')).toBe(trigger.closest('.plus-pattern-backdrop'));
        expect(menu.closest('.plus-pattern-backdrop')).not.toBeNull();
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
