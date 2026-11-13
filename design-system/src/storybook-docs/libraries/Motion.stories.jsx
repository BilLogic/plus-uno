import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MotionGallery, galleryTile as tileOf } from './library-gallery.jsx';

/**
 * The live gallery on Libraries/Motion. Reorder and the resisted drag are the
 * Motion docs' own demos and carry their tests there; this plays the two
 * tiles that live here.
 */
export default {
    title: 'Libraries/Motion',
    tags: ['!dev', '!autodocs'],
};


export const Gallery = {
    render: () => <MotionGallery />,
    play: async ({ canvasElement, step }) => {
        await step('Spring to rest replays and comes to rest at the end of its lane', async () => {
            const tile = tileOf(canvasElement, 'Spring to rest');
            const demo = tile.querySelector('[data-spring-demo]');
            await userEvent.click(within(tile).getByRole('button', { name: 'Playback speed: 1×' }));
            await expect(within(tile).getByRole('button', { name: 'Playback speed: ½×' })).toBeInTheDocument();
            await userEvent.click(within(tile).getByRole('button', { name: 'Replay' }));
            await waitFor(() => expect(demo.dataset.phase).toBe('rest'), { timeout: 5000 });
        });

        await step('Enter and exit removes a row and adds one', async () => {
            const tile = within(tileOf(canvasElement, 'Enter and exit'));
            const rows = () => tileOf(canvasElement, 'Enter and exit').querySelectorAll('[data-presence-list] > li');
            await userEvent.click(tile.getByRole('button', { name: 'Remove Maya · Fractions' }));
            await waitFor(() => expect(rows()).toHaveLength(2), { timeout: 5000 });
            await userEvent.click(tile.getByRole('button', { name: 'Add row' }));
            await waitFor(() => expect(rows()).toHaveLength(3));
            // The new row has landed once its fade-in is done (and the page reads at full contrast).
            await waitFor(() => expect([...rows()].map((r) => getComputedStyle(r).opacity)).toEqual(['1', '1', '1']), { timeout: 5000 });
        });
    },
};
