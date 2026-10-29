import React from 'react';
import { LineChart } from '@/components';
import { TutorDataCard } from '@/specs/Admin';
import { METRICS, CONDUCT, WEEKS, latest, previous } from '../data';

const Change = ({ now, before, unit }) => {
    const diff = now - before;
    const sign = diff > 0 ? '+' : '';
    return (
        <p className="body2-txt compliance-trend__summary">
            <span className="compliance-trend__now">{now}{unit}</span>
            {' '}this week · {sign}{diff}{unit === '%' ? ' pts' : ''} vs last week
        </p>
    );
};

/** Option 2 — one TutorDataCard per metric, each with a weekly trend line. */
const TrendsOption = () => (
    <div className="compliance-card-grid">
        <TutorDataCard
            title={CONDUCT.name}
            tooltip="Number of conduct flags per week. Any single flag warrants review."
        >
            <Change now={latest(CONDUCT.weeklyFlags)} before={previous(CONDUCT.weeklyFlags)} unit=" flags" />
            <LineChart
                data={[{ name: 'Flags', data: CONDUCT.weeklyFlags, categories: WEEKS, color: 'var(--color-danger)' }]}
                yAxisLabel="Flags"
                height={220}
            />
        </TutorDataCard>

        {METRICS.map((m) => (
            <TutorDataCard
                key={m.id}
                title={m.name}
                tooltip="Share of tutors flagged at least once per week"
            >
                <Change now={latest(m.weekly)} before={previous(m.weekly)} unit="%" />
                <LineChart
                    data={[{ name: '% of tutors flagged', data: m.weekly, categories: WEEKS }]}
                    yAxisLabel="% of tutors"
                    height={220}
                />
            </TutorDataCard>
        ))}
    </div>
);

export default TrendsOption;
