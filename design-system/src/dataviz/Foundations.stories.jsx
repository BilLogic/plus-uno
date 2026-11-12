import React from 'react';
import BarChart from '@/dataviz/comparison/BarChart/BarChart';

/**
 * Specimens for Data visualizations/Foundations — the chart foundations
 * besides color: spacing, radius, elevation, stroke, type, motion. All come
 * off the same component tokens as the rest of the design system.
 */
export default {
    title: 'Data visualizations/Foundations',
    tags: ['!dev', '!autodocs'],
};

/** Columns rounding only the value end, at `--chart-bar-radius`. */
export const BarRadius = () => (
    <div style={{ maxWidth: 480 }}>
        <BarChart
            categories={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
            series={[{ name: 'Sessions', data: [12, 19, 8, 24, 16] }]}
            showLegend={false}
        />
    </div>
);

/** The tooltip's surface, shadow, radius and padding — the Popup pattern's tokens, not Highcharts' own `shadow`/`borderRadius`. */
export const TooltipSurface = () => (
    <div style={{ padding: 'var(--card-pad-compact)', background: 'var(--ds-surface-sunken)', display: 'inline-block' }}>
        <div
            style={{
                background: 'var(--ds-surface-overlay)',
                borderRadius: 'var(--popup-radius)',
                boxShadow: 'var(--ds-shadow-overlay)',
                padding: 'var(--popover-pad)',
                color: 'var(--ds-text)',
                fontFamily: 'var(--type-family-body)',
                fontSize: 'var(--font-size-0875)',
            }}
        >
            Thursday: <b>24 sessions</b>
        </div>
    </div>
);
