import React, { useState } from 'react';
import { Card, LollipopChart, LineChart, Dropdown } from '@/components';
import StatRow from '../StatRow';
import { METRICS, WEEKS, latest, previous } from '../data';

/** Option 1 — headline numbers, then one ranked chart of mistakes. */
const RankedOption = ({ onOpenImmediate, onOpenRepeat }) => {
    const ranked = [...METRICS].sort((a, b) => latest(b.weekly) - latest(a.weekly));
    const [metricId, setMetricId] = useState(ranked[0].id);
    const metric = METRICS.find((m) => m.id === metricId);
    const change = latest(metric.weekly) - previous(metric.weekly);

    return (
        <>
            <StatRow onOpenImmediate={onOpenImmediate} onOpenRepeat={onOpenRepeat} />

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <h3 className="h5 compliance-chart-card__title">Most common mistakes</h3>
                <p className="body3-txt compliance-chart-card__caption">
                    Share of tutors flagged at least once this week
                </p>
                {/* LollipopChart, not BarChart: BarChart's horizontal mode puts categories on the value axis. */}
                <LollipopChart
                    categories={ranked.map((m) => m.name)}
                    data={ranked.map((m) => latest(m.weekly))}
                    yAxisLabel="% of tutors flagged"
                    height={340}
                />
            </Card>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <div className="compliance-trend-head">
                    <div>
                        <h3 className="h5 compliance-chart-card__title">{metric.name} over time</h3>
                        <p className="body3-txt compliance-chart-card__caption">
                            {latest(metric.weekly)}% of tutors this week · {change > 0 ? '+' : ''}{change} pts vs last week
                        </p>
                    </div>
                    <Dropdown
                        buttonText={metric.name}
                        fill="outline"
                        items={ranked.map((m) => ({
                            text: `${m.name} (${latest(m.weekly)}%)`,
                            selected: m.id === metricId,
                            onClick: () => setMetricId(m.id),
                        }))}
                    />
                </div>
                <LineChart
                    data={[{ name: '% of tutors flagged', data: metric.weekly, categories: WEEKS }]}
                    yAxisLabel="% of tutors flagged"
                    height={300}
                />
            </Card>
        </>
    );
};

export default RankedOption;
