import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BaseUiGallery, galleryTile as tileOf } from './library-gallery.jsx';

/**
 * The live gallery on Libraries/Base UI. The play test opens, uses and closes
 * every tile once, so a tile that stops being live turns the gate red.
 */
export default {
    title: 'Libraries/Base UI',
    tags: ['!dev', '!autodocs'],
};


export const Gallery = {
    render: () => <BaseUiGallery />,
    play: async ({ canvasElement, step }) => {
        const doc = canvasElement.ownerDocument;
        const body = within(doc.body);

        await step('Modal opens on click and closes on Escape', async () => {
            await userEvent.click(within(tileOf(canvasElement, 'Modal')).getByRole('button', { name: 'Reschedule session' }));
            await body.findByRole('dialog', { name: 'Reschedule session' });
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(body.queryByRole('dialog', { name: 'Reschedule session' })).toBeNull());
        });

        await step('Popup opens its calendar under the date and closes on a pick', async () => {
            const tile = within(tileOf(canvasElement, 'Popup'));
            const trigger = tile.getByRole('button', { name: /Session date/ });
            await userEvent.click(trigger);
            const dialog = await body.findByRole('dialog', { name: 'Choose a session date' });
            await expect(dialog.getBoundingClientRect().top, 'anchored under the field').toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom);
            await userEvent.click(within(dialog).getByRole('button', { name: /November 20/ }));
            await waitFor(() => expect(trigger).toHaveAccessibleName('Session date, Nov 20, 2026'));
        });

        await step('Dropdown menu opens, and Delete runs', async () => {
            const tile = within(tileOf(canvasElement, 'Dropdown menu'));
            await userEvent.click(tile.getByRole('button', { name: 'Session actions' }));
            await userEvent.click(await body.findByRole('menuitem', { name: 'Delete' }));
            await waitFor(() => expect(tile.getByText('Delete', { selector: '[data-menu-last]' })).toBeInTheDocument());
        });

        await step('Tooltip shows on hover', async () => {
            await userEvent.hover(within(tileOf(canvasElement, 'Tooltip')).getByRole('button', { name: 'Edit session' }));
            await waitFor(() => expect(doc.querySelector('[role="tooltip"]')?.textContent).toBe('Edit session'));
        });

        await step('Toggle and Checkbox switch on click', async () => {
            const toggle = within(tileOf(canvasElement, 'Toggle')).getByRole('switch', { name: 'Weekly digest' });
            await userEvent.click(toggle);
            await expect(toggle).toBeChecked();
            const box = within(tileOf(canvasElement, 'Checkbox')).getByRole('checkbox', { name: 'Ratios' });
            await userEvent.click(box);
            await expect(box).toBeChecked();
        });

        await step('Range steps with the arrow keys', async () => {
            const tile = tileOf(canvasElement, 'Range');
            within(tile).getByRole('slider').focus();
            await userEvent.keyboard('{ArrowRight}');
            await expect(tile.querySelector('[data-range-value]').textContent).toBe('60 minutes');
        });

        await step('Tabs and Accordion change on click', async () => {
            const tabs = within(tileOf(canvasElement, 'Tabs'));
            await userEvent.click(tabs.getByRole('tab', { name: 'Sessions' }));
            await expect(tabs.getByRole('tab', { name: 'Sessions' })).toHaveAttribute('aria-selected', 'true');
            const accordion = within(tileOf(canvasElement, 'Accordion'));
            await userEvent.click(accordion.getByRole('button', { name: 'Progress' }));
            await waitFor(() => expect(accordion.getByText('Four of six lessons done.')).toBeVisible());
        });
    },
};
