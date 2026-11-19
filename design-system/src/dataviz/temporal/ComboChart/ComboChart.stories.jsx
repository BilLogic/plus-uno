import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import ComboChart from './ComboChart';

export default {
    title: 'Data visualizations/Temporal/Combo chart',
    component: ComboChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        primaryAxisLabel: { control: 'text', description: 'Left axis label' },
        secondaryAxisLabel: { control: 'text', description: 'Right axis label' },
        categories: { control: 'object', description: 'X-axis period labels' },
        barData: { control: 'object', description: 'Column series on the primary axis' },
        lineData: { control: 'object', description: 'Line series (pass yAxis: 1 for secondary axis)' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort categories from most to least; false by default on temporal axes' },
    },
};

const stackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--stack-2xl)',
};

const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--card-stack-md)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

const attendanceData = {
    primaryAxisLabel: 'Sessions held',
    secondaryAxisLabel: 'Attendance rate (%)',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    barData: [{ name: 'Sessions', data: [100, 200, 150, 300, 250] }],
    lineData: [{ name: 'Attendance', data: [84, 88, 86, 92, 90], yAxis: 1 }],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Sessions held vs. attendance rate</Heading>
                <p style={captionStyle}>
                    Combines columns for volume on the left axis with a line for percentage rate on the right axis.
                </p>
                <ComboChart {...attendanceData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-axis-labels text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        primaryAxisLabel: 'Sessions held',
        secondaryAxisLabel: 'Attendance rate (%)',
        categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        barData: [{ name: 'Sessions', data: [50, 80, 60, 100] }],
        lineData: [{ name: 'Attendance rate', data: [82, 88, 85, 92], yAxis: 1 }],
        height: 400,
        sort: false,
    },
};
