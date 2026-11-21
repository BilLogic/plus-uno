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
        <p className="body-default" style={{ margin: 0 }}>Sessions this week</p>
        <p className="metric-md" style={{ margin: 0 }}>24</p>
        <p className="body-default color-secondary" style={{ margin: 0 }}>+3 from last week</p>
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
                <p className="body-sm color-secondary" style={{ margin: 0 }}>68 percent of goals met</p>
            </div>
        </Card>
        <Card
            title="Lincoln Middle · Thursday"
            description="4:30 to 5:15 PM"
            minWidth="var(--card-min-width-md)"
            footer={<LinkButton text="View session" href="#view-session" appearance="link" spacing="compact" onClick={(event) => event.preventDefault()} />}
        >
            <p className="body-default color-secondary" style={{ margin: 0 }}>
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
        <p className="metric-md" style={{ margin: 0 }}>{value}</p>
        <p className="body-default color-secondary" style={{ margin: 0 }}>{label}</p>
    </>
);

export const MetricsInOneCard = () => (
    <Card title="Sessions this week" style={{ maxWidth: 'var(--card-min-width-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
            {tallies.map((row) => (
                <div key={row[1]}>{tally(row)}</div>
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
    <p className="body-default color-secondary" style={{ margin: 0 }}>Loading…</p>
);
