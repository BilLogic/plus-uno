import React from 'react';
import { LinkButton, ProgressBar, Skeleton } from '@/components';
import { Card } from '@/templates';

/**
 * The Card page's examples, as PLUS parts only: the do and don't pairs and
 * one card in three jobs. Show code prints each one from this file; the docs
 * wrapper (Storybook's unstyled class, a heading level below the page outline)
 * lives in `CardCases.jsx`. Body copy is a plain `p` on the body token: PLUS
 * has no text component to reach for first.
 */

const metric = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>Sessions this week</p>
        <p style={{ margin: 0, font: 'var(--metric-md)', fontVariantNumeric: 'tabular-nums' }}>24</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>+3 from last week</p>
    </div>
);

export const MetricAtMin224 = () => (
    <Card minWidth="var(--card-min-width-sm)" style={{ maxWidth: 'var(--card-min-width-sm)' }}>
        {metric}
    </Card>
);

export const MetricAtMin480 = () => (
    <Card minWidth="var(--card-min-width-lg)">
        {metric}
    </Card>
);

export const CardJobs = () => (
    <div style={{ display: 'flex', gap: 'var(--grid-gutter)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Card minWidth="var(--card-min-width-sm)">
            {metric}
        </Card>
        <Card title="Math fluency" description="Grade 7 · this term" minWidth="var(--card-min-width-md)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <ProgressBar value={68} ariaLabel="68 percent of goals met" />
                <p style={{ margin: 0, font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>68 percent of goals met</p>
            </div>
        </Card>
        <Card
            title="Lincoln Middle · Thursday"
            description="4:30 to 5:15 PM"
            minWidth="var(--card-min-width-md)"
            footer={<LinkButton text="View session" href="#view-session" appearance="link" spacing="compact" onClick={(event) => event.preventDefault()} />}
        >
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>
                Tutor · Ana Ruiz
                <br />
                Students · 4
                <br />
                Room · Online
            </p>
        </Card>
    </div>
);

const tallies = [['128', 'Completed'], ['12', 'Canceled'], ['4', 'No-shows']];

const tally = ([value, label]) => (
    <>
        <p style={{ margin: 0, font: 'var(--metric-md)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{label}</p>
    </>
);

export const MetricsWithDividers = () => (
    <Card title="Sessions this week" style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tallies.map((row, i) => (
                <div
                    key={row[1]}
                    style={{
                        paddingBlock: 'var(--card-stack-md)',
                        borderTop: i === 0 ? 'none' : 'var(--border-width-default) solid var(--ds-border)',
                    }}
                >
                    {tally(row)}
                </div>
            ))}
        </div>
    </Card>
);

export const MetricsAsNestedCards = () => (
    <Card title="Sessions this week" style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
            {tallies.map((row) => (
                <Card key={row[1]}>{tally(row)}</Card>
            ))}
        </div>
    </Card>
);

export const LoadingInPlace = () => (
    <Card aria-busy="true" style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
            <Skeleton shape="text" lines={4} />
        </div>
    </Card>
);

export const LoadingLine = () => (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Loading…</p>
);
