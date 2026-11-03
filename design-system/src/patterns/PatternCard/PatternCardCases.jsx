import React from 'react';
import { Button, ProgressBar } from '@/components';
import PatternCard from '@/patterns/PatternCard';

/**
 * The examples of the Card page that compose a card for a job: the size pair
 * of the do and don't, and one card in three jobs.
 */

const metric = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>Sessions this week</p>
        <p style={{ margin: 0, font: 'var(--metric-medium)', fontVariantNumeric: 'tabular-nums' }}>24</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>+3 from last week</p>
    </div>
);

/** `sb-unstyled` keeps Storybook's docs styles off the examples, as it does inside a canvas. */
const InDocs = ({ children }) => <div className="sb-unstyled">{children}</div>;

/** One number fits a small card, which is only as wide as it needs. */
export const MetricInSmall = () => (
    <InDocs>
        <PatternCard padding="sm" minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-sm)' }}>
            {metric}
        </PatternCard>
    </InDocs>
);

/** The same number in a large card leaves most of it empty. */
export const MetricInLarge = () => (
    <InDocs>
        <PatternCard padding="lg" minWidth="var(--card-min-width-lg)">
            {metric}
        </PatternCard>
    </InDocs>
);

/** The same card shell serves a metric tile, a progress display and a session summary. */
export const CardJobs = () => (
    <div style={{ display: 'flex', gap: 'var(--layout-gutter)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <PatternCard padding="sm" minWidth="var(--card-min-width-sm)">
            {metric}
        </PatternCard>
        <PatternCard title="Math fluency" description="Grade 7 · this term" minWidth="var(--card-min-width-md)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <ProgressBar value={68} ariaLabel="68% of goals met" />
                <p style={{ margin: 0, font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>68% of goals met</p>
            </div>
        </PatternCard>
        <PatternCard
            title="Algebra I · Thursday"
            description="4:30 to 5:15 PM"
            minWidth="var(--card-min-width-md)"
            footer={<Button text="View session" spacing="compact" onClick={() => {}} />}
        >
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>
                Tutor · Ana Ruiz
                <br />
                Students · 4
                <br />
                Room · Online
            </p>
        </PatternCard>
    </div>
);
