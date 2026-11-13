import React from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { HighchartsGallery, galleryTile as tileOf } from './library-gallery.jsx';

/** The live gallery on Libraries/Highcharts: each chart's tooltip and legend answer. */
export default {
    title: 'Libraries/Highcharts',
    tags: ['!dev', '!autodocs'],
};

/** The chart theme draws its tooltip `outside`, in a layer on the page body: any one saying `text`. */
const tooltipSays = (doc, text) => [...doc.querySelectorAll('.highcharts-tooltip')].some((t) => t.textContent.includes(text));
/**
 * Moves to the chart's first point from the keyboard: focus the chart, then an
 * arrow key, through the accessibility module every PLUS chart keeps on. It
 * draws the same tooltip a hover does, and a synthetic pointer event cannot
 * reach a pie slice's path or a column still growing in.
 */
const focusFirstPoint = async (tile) => {
    const chart = await waitFor(() => {
        const found = tile.querySelector('.highcharts-container');
        expect(found, 'the chart has drawn').not.toBeNull();
        return found;
    });
    chart.focus();
    await userEvent.keyboard('{ArrowRight}');
};

export const Gallery = {
    render: () => <HighchartsGallery />,
    play: async ({ canvasElement, step }) => {
        const doc = canvasElement.ownerDocument;
        for (const [name, series] of [['Bar chart', 'Sessions held'], ['Line chart', 'Attendance']]) {
            await step(`${name}: a point shows its tooltip and the legend hides a series`, async () => {
                const tile = tileOf(canvasElement, name);
                await focusFirstPoint(tile);
                await waitFor(() => expect(tooltipSays(doc, series), 'the tooltip names the series').toBe(true));
                await userEvent.click(tile.querySelector('.highcharts-legend-item'));
                await waitFor(() => expect(tile.querySelector('.highcharts-legend-item-hidden'), 'the legend hid a series').not.toBeNull());
            });
        }
        await step('Donut chart: a point shows its tooltip', async () => {
            const tile = tileOf(canvasElement, 'Donut chart');
            await focusFirstPoint(tile);
            await waitFor(() => expect(tooltipSays(doc, 'On track'), 'the tooltip names the slice').toBe(true));
        });
    },
};
