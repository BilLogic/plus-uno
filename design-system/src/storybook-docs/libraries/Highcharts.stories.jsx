import React from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import Highcharts from '@/dataviz/highchartsModules';
import { HighchartsGallery } from './library-gallery.jsx';

/** The live gallery on Libraries/Highcharts: each chart's tooltip and legend answer. */
export default {
    title: 'Libraries/Highcharts',
    tags: ['!dev', '!autodocs'],
};

const tileOf = (root, name) => root.querySelector(`[data-gallery-tile="${name}"]`);
/** The Highcharts chart drawn inside `tile`. */
const chartIn = (tile) => Highcharts.charts.find((c) => c && tile.contains(c.container));
/** The chart theme draws its tooltip `outside`, in a layer on the page body: any one saying `text`. */
const tooltipSays = (doc, text) => [...doc.querySelectorAll('.highcharts-tooltip')].some((t) => t.textContent.includes(text));
/**
 * Hovers the first point of the chart in `tile`. A synthetic pointer event lands
 * at whatever spot a still-growing column has reached, and never enters a pie
 * slice's path, so the test calls the point's own hover: the call a real pointer
 * ends in, which draws the same tooltip.
 */
const hoverFirstPoint = async (tile) => {
    const chart = await waitFor(() => {
        const found = chartIn(tile);
        expect(found, 'the chart has drawn').toBeTruthy();
        return found;
    });
    chart.series[0].points[0].onMouseOver();
};

export const Gallery = {
    render: () => <HighchartsGallery />,
    play: async ({ canvasElement, step }) => {
        const doc = canvasElement.ownerDocument;
        for (const [name, series] of [['Bar chart', 'Sessions held'], ['Line chart', 'Attendance']]) {
            await step(`${name}: a hover shows the tooltip and the legend hides a series`, async () => {
                const tile = tileOf(canvasElement, name);
                await hoverFirstPoint(tile);
                await waitFor(() => expect(tooltipSays(doc, series), 'the tooltip names the series').toBe(true));
                await userEvent.click(tile.querySelector('.highcharts-legend-item'));
                await waitFor(() => expect(tile.querySelector('.highcharts-legend-item-hidden'), 'the legend hid a series').not.toBeNull());
            });
        }
        await step('Donut chart: a hover shows the tooltip', async () => {
            const tile = tileOf(canvasElement, 'Donut chart');
            await hoverFirstPoint(tile);
            await waitFor(() => expect(tooltipSays(doc, 'On track'), 'the tooltip names the slice').toBe(true));
        });
    },
};
