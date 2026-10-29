import React from 'react';
import { Card, LineChart } from '@/components';
import StatRow from '../StatRow';
import { METRICS, WEEKS, latest } from '../data';

/**
 * Option 4 — options 1 + 2 combined: every mistake on one trend chart,
 * series ordered by this week's share so the legend reads as the ranking.
 */
const RankedTrendsOption = ({ onOpenImmediate, onOpenRepeat }) => {
    const ranked = [...METRICS].sort((a, b) => latest(b.weekly) - latest(a.weekly));

    return (
        <>
            <StatRow onOpenImmediate={onOpenImmediate} onOpenRepeat={onOpenRepeat} />

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <h3 className="h5 compliance-chart-card__title">Most common mistakes over time</h3>
                <p className="body3-txt compliance-chart-card__caption">
                    Share of tutors flagged at least once per week. Legend is ranked by this week.
                </p>
                <LineChart
                    data={ranked.map((m, i) => ({
                        name: `${i + 1}. ${m.name} (${latest(m.weekly)}%)`,
                        data: m.weekly,
                        categories: WEEKS,
                    }))}
                    yAxisLabel="% of tutors flagged"
                    height={420}
                />
            </Card>
        </>
    );
};

export default RankedTrendsOption;
