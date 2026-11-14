import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button, DropdownMenu, Modal } from '@/components';

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
