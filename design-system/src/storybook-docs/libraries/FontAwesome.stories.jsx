import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FontAwesomeGallery } from './library-gallery.jsx';

/** The live gallery on Libraries/Font Awesome: the search filters as you type. */
export default {
    title: 'Libraries/Font Awesome',
    tags: ['!dev', '!autodocs'],
};

export const Gallery = {
    render: () => <FontAwesomeGallery />,
    play: async ({ canvasElement }) => {
        const tile = canvasElement.querySelector('[data-gallery-tile="Icon"]');
        const field = within(tile).getByRole('textbox', { name: 'Search the Free icons' });
        await userEvent.clear(field);
        await userEvent.type(field, 'arrow down');
        await waitFor(() => {
            const names = [...tile.querySelectorAll('[data-icon-name]')].map((el) => el.dataset.iconName);
            expect(names.length).toBeGreaterThan(0);
            expect(names.every((n) => n.includes('arrow') && n.includes('down'))).toBe(true);
        });
        // Every result draws a glyph, so no name in the list renders blank.
        for (const glyph of tile.querySelectorAll('[data-icon-name] i')) {
            await expect(getComputedStyle(glyph, '::before').content).not.toBe('none');
        }
    },
};
