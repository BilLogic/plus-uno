import React from 'react';
import { Button, ProgressBar, Skeleton } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { PatternCard } from '@/patterns';

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
    <div style={{ display: 'flex', gap: 'var(--grid-gutter)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <PatternCard padding="sm" minWidth="var(--card-min-width-sm)">
            {metric}
        </PatternCard>
        <PatternCard title="Math fluency" description="Grade 7 · this term" minWidth="var(--card-min-width-md)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
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

const tallies = [['128', 'Completed'], ['12', 'Canceled'], ['4', 'No-shows']];

const tally = ([value, label]) => (
    <>
        <p style={{ margin: 0, font: 'var(--metric-medium)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{label}</p>
    </>
);

/** Card titles in the do and don't cards sit below the docs page outline. */
const Outline = ({ children }) => (
    <InDocs>
        <HeadingLevelContext.Provider value={4}>{children}</HeadingLevelContext.Provider>
    </InDocs>
);

/** One card: three metrics stacked in its body, split by rules. */
export const MetricsWithDividers = () => (
    <Outline>
        <PatternCard title="Sessions this week" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tallies.map((row, i) => (
                    <div
                        key={row[1]}
                        style={{
                            paddingBlock: 'var(--card-stack-md)',
                            borderTop: i === 0 ? 'none' : 'var(--border-default) solid var(--ds-border)',
                        }}
                    >
                        {tally(row)}
                    </div>
                ))}
            </div>
        </PatternCard>
    </Outline>
);

/** Three mini cards nested inside the card. */
export const MetricsAsNestedCards = () => (
    <Outline>
        <PatternCard title="Sessions this week" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                {tallies.map((row) => (
                    <PatternCard key={row[1]} padding="sm">{tally(row)}</PatternCard>
                ))}
            </div>
        </PatternCard>
    </Outline>
);

/** The card holds its place while it loads: skeleton bars fill the body. */
export const LoadingInPlace = () => (
    <InDocs>
        <PatternCard aria-busy="true" style={{ maxWidth: 'var(--card-min-width-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <Skeleton shape="text" width="50%" />
                <Skeleton shape="text" width="75%" />
                <Skeleton shape="text" width="100%" />
                <Skeleton shape="text" width="40%" />
            </div>
        </PatternCard>
    </InDocs>
);

/** A bare loading line takes the card away. */
export const LoadingLine = () => (
    <InDocs>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Loading…</p>
    </InDocs>
);
