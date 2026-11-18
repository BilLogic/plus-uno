import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import BulletChart from './BulletChart';

export default {
    title: 'Data visualizations/Comparison/Bullet chart',
    component: BulletChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { y, target }' },
        categories: { control: 'object', description: 'Metric labels' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort categories from most to least by default; pass false for ordinal or temporal axes' },
    },
};

const stackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--section-stack-lg)',
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

const kpiData = {
    categories: ['Session completion', 'Attendance', 'Reflection rate'],
    data: [
        { y: 78, target: 85 },
        { y: 92, target: 90 },
        { y: 64, target: 75 },
    ],
    height: 250,
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Program goals against targets</Heading>
                <p style={captionStyle}>
                    Shows actual vs. target with quality ranges in the danger, warning and success backgrounds.
                </p>
                <BulletChart {...kpiData} />
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
        categories: ['Metric'],
        data: [{ y: 75, target: 80 }],
        height: 120,
        sort: true,
    },
};
