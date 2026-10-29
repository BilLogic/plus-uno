import React from 'react';
import { Card, HeatmapChart, Alert } from '@/components';
import { METRICS, CONDUCT, WEEKS, latest } from '../data';

/** Option 3 — conduct called out above, then a metrics × weeks heatmap. */
const HeatmapOption = () => {
    // HeatmapChart fixes its color axis at 0–1, so values are scaled against
    // the highest week; cell labels are hidden because they'd show the scaled value.
    const peak = Math.max(...METRICS.flatMap((m) => m.weekly));
    const data = [];
    METRICS.forEach((m, y) => {
        m.weekly.forEach((value, x) => data.push([x, y, Number((value / peak).toFixed(2))]));
    });

    return (
        <>
            <Alert style="danger" title="Communication & Conduct" dismissible={false}>
                {latest(CONDUCT.weeklyFlags)} flags this week ({CONDUCT.highSeverityThisWeek} high severity).
                Shown here, not in the heatmap, so a rare but serious flag isn't lost in the shading.
            </Alert>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <h3 className="h5 compliance-chart-card__title">Mistakes by week</h3>
                <p className="body3-txt compliance-chart-card__caption">
                    Share of tutors flagged at least once, per week. Darkest = highest week ({peak}% of tutors).
                </p>
                <HeatmapChart
                    xCategories={WEEKS}
                    yCategories={METRICS.map((m) => m.name)}
                    data={data}
                    height={380}
                    pointPadding={0.04}
                    compactSpacing
                    showDataLabels={false}
                    showLegend={false}
                    enableAnimation={false}
                />
            </Card>
        </>
    );
};

export default HeatmapOption;
