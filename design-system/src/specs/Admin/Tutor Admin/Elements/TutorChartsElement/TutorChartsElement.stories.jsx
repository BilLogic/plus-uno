/**
 * TutorChartsElement Stories
 * 
 * Element displaying three chart types: Pie, Bar, and Line.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262214
 */

import React from 'react';
import TutorChartsElement from './TutorChartsElement';
import './TutorChartsElement.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/TutorChartsElement',
    component: TutorChartsElement,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `TutorChartsElement renders one of three chart variants: **Pie**, **Bar**, or **Line**.
                Each variant is designed to visualize specific tutor performance metrics (Attendance, Sign-up rates, etc.).
                
                ## Variants
                - **Pie**: Donut chart with center text.
                - **Bar**: Stacked bar chart showing comparison over time.
                - **Line**: Multi-line chart showing trends.
                
                ## Formatting
                - Matches specific Figma styling (Node 258:262214).
                - Fixed width container (508px) by default, but can be overridden.
                `
            }
        }
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['Pie', 'Bar', 'Line'],
            description: 'The type of chart to display'
        },
        data: { control: 'object', description: 'Chart data object/array' },
        legend: { control: 'object', description: 'Custom Legend items' },
        // Wrappers for interactive control
        donutPercentage: { control: { type: 'range', min: 0, max: 100 }, if: { arg: 'variant', eq: 'Pie' } },
        donutSubtitle: { control: 'text', if: { arg: 'variant', eq: 'Pie' } }
    }
};

/**
 * Overview - Shows all variants side-by-side
 */
export const Overview = {
    render: () => (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h6 style={{ marginBottom: '16px' }}>Pie Variant</h6>
                <TutorChartsElement variant="Pie" donutPercentage={45} donutSubtitle="ABC" />
            </div>
            <div>
                <h6 style={{ marginBottom: '16px' }}>Bar Variant</h6>
                <TutorChartsElement variant="Bar" />
            </div>
            <div>
                <h6 style={{ marginBottom: '16px' }}>Line Variant</h6>
                <TutorChartsElement variant="Line" />
            </div>
        </div>
    )
};

/**
 * Pie Variant (Interactive)
 */
export const Pie = {
    args: {
        variant: 'Pie',
        donutPercentage: 0,
        donutSubtitle: 'ABC',
        legend: [
            { label: 'ABC', color: '#61b5cf' },
            { label: 'XYZ', color: '#85ecd5' }
        ]
    },
    render: (args) => (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <TutorChartsElement
                variant="Pie"
                donutPercentage={args.donutPercentage}
                donutSubtitle={args.donutSubtitle}
                legend={args.legend}
            />
        </div>
    )
};

/**
 * Bar Variant
 */
export const Bar = {
    args: {
        variant: 'Bar',
        data: [
            { label: '10/11', values: [12, 6] },
            { label: '10/12', values: [16, 8] },
            { label: '10/13', values: [12, 5] },
            { label: '10/17', values: [12, 1] },
            { label: '10/18', values: [20, 2] },
        ],
        legend: [
            { label: 'ABC', color: '#61b5cf' },
            { label: 'XYZ', color: '#85ecd5' }
        ]
    },
    render: (args) => (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <TutorChartsElement {...args} />
        </div>
    )
};

/**
 * Line Variant
 */
export const Line = {
    args: {
        variant: 'Line',
        data: [
            { label: '06/03/24', values: [5, 0] },
            { label: '06/10/24', values: [60, 20] },
            { label: '06/17/24', values: [55, 75] },
            { label: '06/24/24', values: [65, 30] },
            { label: '07/01/24', values: [20, 40] },
        ],
        legend: [
            { label: 'ABC', color: '#004b6b' },
            { label: 'XYZ', color: '#85ecd5' }
        ]
    },
    render: (args) => (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <TutorChartsElement {...args} />
        </div>
    )
};
