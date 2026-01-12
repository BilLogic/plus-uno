/**
 * TutorChartsElement - Tutor Admin Element
 * 
 * Element displaying three chart types: Donut, Stacked Bar, and Line.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262214
 */

import React from 'react';
import TutorChartsElement from './TutorChartsElement';
import './TutorChartsElement.scss';

const defaultStackedBarData = [
    { label: '10/11', values: [12, 6] },
    { label: '10/12', values: [16, 8] },
    { label: '10/13', values: [12, 5] },
    { label: '10/17', values: [12, 1] },
    { label: '10/18', values: [20, 2] },
];

const defaultLineChartData = [
    { label: '06/03/24', values: [5, 0] },
    { label: '06/10/24', values: [60, 20] },
    { label: '06/17/24', values: [55, 75] },
    { label: '06/24/24', values: [65, 30] },
    { label: '07/01/24', values: [20, 40] },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/TutorChartsElement',
    component: TutorChartsElement,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Element displaying three chart types: Donut, Stacked Bar, and Line charts.

## Figma Reference
Node ID: 258-262214

## Charts
1. **Donut Chart** - Shows percentage with center text and legend
2. **Stacked Bar Chart** - Shows data breakdown over dates with values in segments
3. **Line Chart** - Shows trend lines over time with percentage Y-axis

## Features
- Consistent color schemes (ABC/XYZ)
- Responsive layout
- Configurable data and legends
`,
            },
        },
    },
    argTypes: {
        donutPercentage: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Donut chart percentage',
            table: { category: 'Donut Chart' },
        },
        donutSubtitle: {
            control: 'text',
            description: 'Donut chart subtitle',
            table: { category: 'Donut Chart' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorChartsElement</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Element component displaying three chart types: Donut, Stacked Bar, and Line charts.
                        Used for data visualization in Tutor Admin sections.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Chart Types</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Donut Chart</strong>: Percentage display with center text</li>
                        <li><strong>Stacked Bar Chart</strong>: Data breakdown with segment values</li>
                        <li><strong>Line Chart</strong>: Trend visualization over time</li>
                    </ul>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Tutor Charts Element</h6>
            <TutorChartsElement
                donutPercentage={0}
                donutSubtitle="ABC"
                stackedBarData={defaultStackedBarData}
                lineChartData={defaultLineChartData}
            />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                Tutor Charts Element - Interactive
            </h6>
            <TutorChartsElement
                donutPercentage={args.donutPercentage}
                donutSubtitle={args.donutSubtitle}
                stackedBarData={defaultStackedBarData}
                lineChartData={defaultLineChartData}
            />
        </div>
    ),
    args: {
        donutPercentage: 0,
        donutSubtitle: 'ABC',
    },
};
