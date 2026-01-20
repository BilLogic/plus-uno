/**
 * TutorDataCard - Tutor Admin Data Card
 * 
 * Card with donut chart for displaying tutor metrics.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262197
 */

import React from 'react';
import TutorDataCard from './TutorDataCard';
import './TutorDataCard.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Cards/TutorDataCard',
    component: TutorDataCard,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Data card component for displaying tutor metrics with a donut chart.

## Figma Reference
Node ID: 258-262197

## Features
- Donut chart visualization
- Title with optional info tooltip
- Percentage display in center
- Subtitle text
- Color-coded legend
- Loading state
`,
            },
        },
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Card title',
            table: { category: 'Content' },
        },
        tooltip: {
            control: 'text',
            description: 'Tooltip text for info icon',
            table: { category: 'Content' },
        },
        percentage: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Percentage value',
            table: { category: 'Data' },
        },
        subtitle: {
            control: 'text',
            description: 'Subtitle in chart center',
            table: { category: 'Content' },
        },
        loading: {
            control: 'boolean',
            description: 'Loading state',
            table: { category: 'State' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorDataCard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Data card component for displaying tutor metrics with a donut chart visualization.
                        Used in Tutor Admin pages for performance overview.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>States</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Default</strong>: Shows chart with data</li>
                        <li><strong>Loading</strong>: Shows spinner animation</li>
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
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Tutor Data Card</h6>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <TutorDataCard
                    title="Attendance"
                    tooltip="Percentage of tutors who attended their sessions"
                    percentage={95}
                    subtitle="Attended"
                    legend={[
                        { color: '#61b5cf', label: 'Attended' },
                        { color: '#85ecd5', label: 'Missed' },
                    ]}
                />
                <TutorDataCard
                    title="Loading State"
                    loading={true}
                />
            </div>
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
                Tutor Data Card - Interactive
            </h6>
            <TutorDataCard
                title={args.title}
                tooltip={args.tooltip}
                percentage={args.percentage}
                subtitle={args.subtitle}
                loading={args.loading}
                legend={[
                    { color: '#61b5cf', label: 'ABC' },
                    { color: '#85ecd5', label: 'XYZ' },
                ]}
            />
        </div>
    ),
    args: {
        title: 'Card Title',
        tooltip: 'This is a tooltip',
        percentage: 95,
        subtitle: 'ABC',
        loading: false,
    },
};
