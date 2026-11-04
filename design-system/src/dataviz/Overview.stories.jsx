import React from 'react';
import { BarChart, chartPalette } from '@/components';

const { STATUS } = chartPalette;

/**
 * Specimens for Data visualizations/Overview — the do and don't pairs that
 * teach the chart color rules, drawn by the real `BarChart`.
 */
export default {
    title: 'Data visualizations/Overview',
    tags: ['!dev', '!autodocs'],
};

const categories = ['Math', 'Science', 'History'];
const frame = { width: '100%', maxWidth: 'var(--card-min-width-lg)' };

/** Three series: inside the limit, so each keeps its place in the categorical order. */
export const WithinTheLimit = () => (
    <div style={frame}>
        <BarChart
            height={200}
            categories={categories}
            series={[
                { name: 'Fall', data: [40, 55, 30] },
                { name: 'Winter', data: [52, 48, 41] },
                { name: 'Spring', data: [61, 66, 45] },
            ]}
        />
    </div>
);

/** Eight series: past the limit the sequence reaches into its overflow slots and the legend stops being readable. */
export const PastTheLimit = () => (
    <div style={frame}>
        <BarChart
            height={200}
            categories={categories}
            series={Array.from({ length: 8 }, (_, i) => ({ name: `Group ${i + 1}`, data: [20 + i * 3, 30 + i * 2, 25 + i] }))}
        />
    </div>
);

/** Two series on the categorical order, and nothing that reads as a state. */
export const CategoriesOnly = () => (
    <div style={frame}>
        <BarChart
            height={200}
            categories={categories}
            series={[
                { name: 'Online', data: [40, 55, 30] },
                { name: 'In person', data: [52, 48, 41] },
            ]}
        />
    </div>
);

/** A categorical color and a state color in one chart: the viewer reads "success" into one series and nothing into the other. */
export const CategoryAndStateMixed = () => (
    <div style={frame}>
        <BarChart
            height={200}
            categories={categories}
            series={[
                { name: 'Online', data: [40, 55, 30], color: 'var(--ds-chart-categorical-2)' },
                { name: 'In person', data: [52, 48, 41], color: STATUS.success },
            ]}
        />
    </div>
);
