import React, { useMemo, useState } from 'react';
import { Card, Dropdown, NavPills } from '@/components';
import Chart, { PALETTE } from './Chart';
import FlagsTab from './FlagsTab';
import { isOpen } from './audit';
import {
    WEEKS, THIS_WEEK, CONDUCT, TOTAL_TUTORS, FLAG_INSTANCES, COMPLIANCE_SUMMARY,
    TUTORS_TO_TALK_TO, WEEKLY_BY_COMPLIANCE, latest,
    HISTORY_WEEKS, HISTORY_BY_COMPLIANCE, HISTORY_WINDOWS, BREAK_WEEKS, IN_PROGRESS_WEEK,
} from '../data';

/**
 * Overview — two lanes, then the flags themselves.
 *
 * Lane 1: who to talk to, and what was broken this week.
 * Lane 2: whether it is moving, and whether the flags are being dealt with.
 * Every tooltip carries something the axis cannot: a tutor's mix of flags,
 * a rule's occurrence count, a week's share of each outcome.
 */
const OverviewTab = ({ decisions, relabels = {}, flags = FLAG_INSTANCES, onOpenRecording }) => {
    const [complianceFilter, setComplianceFilter] = useState(CONDUCT.name);
    const [windowIndex, setWindowIndex] = useState(0);
    const open = flags.filter((f) => isOpen(f, decisions)).length;
    // Severe flags (Communication & Conduct) nobody has reviewed yet.
    const severeOpen = flags.filter((f) => f.severe && isOpen(f, decisions)).length;

    // Lane 1 · left: tutors to talk to, horizontal, tooltip spells out their flags.
    const tutorChart = useMemo(() => ({
        chart: { type: 'bar' },
        xAxis: { ...chartAxis(), categories: TUTORS_TO_TALK_TO.map((t) => t.name) },
        yAxis: { title: { text: 'Flagged occurrences' }, allowDecimals: false },
        legend: { enabled: false },
        plotOptions: { bar: { borderWidth: 0, pointPadding: 0.12 } },
        tooltip: {
            useHTML: true,
            formatter() {
                const t = TUTORS_TO_TALK_TO[this.point.index];
                const lines = t.breakdown
                    .map((b) => `<div>${b.name} — ${b.n} (${b.basis.toLowerCase()})</div>`)
                    .join('');
                return `<b>${t.name}</b>${t.severe ? ' · severe flag' : ''}<br/>${lines}`;
            },
        },
        series: [{
            name: 'Occurrences',
            data: TUTORS_TO_TALK_TO.map((t) => ({
                y: t.total,
                color: t.severe ? PALETTE[0] : PALETTE[1],
            })),
        }],
    }), []);

    // Lane 1 · right: flags this week, horizontal as before, richer tooltip.
    const flagsThisWeekChart = useMemo(() => ({
        chart: { type: 'lollipop', inverted: true },
        xAxis: { ...chartAxis(), categories: COMPLIANCE_SUMMARY.map((c) => c.name) },
        yAxis: { title: { text: '% of tutors flagged' }, max: 50 },
        legend: { enabled: false },
        tooltip: {
            useHTML: true,
            formatter() {
                const c = COMPLIANCE_SUMMARY[this.point.index];
                const volume = c.countsOccurrences
                    ? `<div>${c.occurrences} occurrence${c.occurrences === 1 ? '' : 's'} this week</div>`
                    : `<div>${c.patternTutors} tutor${c.patternTutors === 1 ? '' : 's'} past the ${THIS_WEEK.patternThreshold}% pattern threshold</div>`;
                return `<b>${c.name}</b><br/>`
                    + `<div>${c.pctTutors}% flagged at least once (${c.tutors} of ${TOTAL_TUTORS} tutors)</div>`
                    + volume;
            },
        },
        series: [{
            name: '% of tutors',
            data: COMPLIANCE_SUMMARY.map((c) => ({
                y: c.pctTutors,
                color: c.severe ? PALETTE[0] : PALETTE[1],
            })),
        }],
    }), []);

    // Lane 2 · left: over time, filterable by compliance.
    const overTimeChart = useMemo(() => {
        const shown = WEEKLY_BY_COMPLIANCE.filter((c) => c.name === complianceFilter);
        return {
            chart: { type: 'line' },
            xAxis: { ...chartAxis(), categories: WEEKS },
            yAxis: { title: { text: 'Tutors flagged' }, allowDecimals: false },
            legend: { enabled: false },
            tooltip: { shared: true },
            series: shown.map((c, i) => ({
                name: c.name,
                data: c.data,
                color: c.id === 'conduct' ? PALETTE[0] : PALETTE[(i + 1) % PALETTE.length],
                marker: { enabled: true },
            })),
        };
    }, [complianceFilter]);

    // Lane 2 · right: every compliance stacked, so the week's total and its mix read together.
    const win = HISTORY_WINDOWS[windowIndex];
    const winWeeks = HISTORY_WEEKS.slice(win.start, win.end);
    const winSeries = HISTORY_BY_COMPLIANCE.map((c) => ({ ...c, data: c.data.slice(win.start, win.end) }));
    const breakIdx = winWeeks.map((w, i) => (BREAK_WEEKS.includes(w) ? i : -1)).filter((i) => i >= 0);
    const progressIdx = winWeeks.indexOf(IN_PROGRESS_WEEK);

    const stackedChart = useMemo(() => ({
        chart: {
            type: 'column',
        },
        xAxis: {
            ...chartAxis(),
            categories: winWeeks,
            // The narrower plot would tip week labels to diagonal; keep them level.
            labels: { autoRotation: false, style: { fontSize: '9px' } },
            // A break is a week with no sessions, not a week with no flags; the
            // newest week is still being processed. Both are labelled, not drawn as data.
            plotBands: [
                ...breakIdx.map((i) => ({
                    from: i - 0.5,
                    to: i + 0.5,
                    color: 'var(--color-surface-container)',
                    label: { text: 'Break', rotation: 0, y: 14, style: { fontSize: '9px', color: 'var(--color-on-surface-variant)' } },
                })),
                ...(progressIdx >= 0 ? [{
                    from: progressIdx - 0.5,
                    to: progressIdx + 0.5,
                    color: 'var(--color-primary-state-08)',
                    // Two short lines so it fits over one narrow column.
                    label: { text: 'In<br/>progress', rotation: 0, y: 12, style: { fontSize: '8px', color: 'var(--color-primary-text)', textAlign: 'center' } },
                }] : []),
            ],
        },
        yAxis: { title: { text: 'Tutors flagged' }, allowDecimals: false, max: 100 },
        legend: {
            // One compliance per row, beside the bars, every name on a single line.
            enabled: true,
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            symbolWidth: 8,
            symbolHeight: 8,
            symbolPadding: 4,
            symbolRadius: 2,
            itemMarginBottom: 4,
            itemStyle: { fontSize: '9px', fontWeight: '400', textOverflow: 'none', whiteSpace: 'nowrap' },
            padding: 0,
        },
        // Beside the bars when the card is wide; below them when it is narrow, so
        // the bars never get squeezed to make room for the names.
        responsive: {
            rules: [{
                condition: { maxWidth: 520 },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom',
                        itemDistance: 12,
                    },
                },
            }],
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 1,
                borderColor: 'var(--color-surface-container-lowest)',
                // Fade the other blocks so the hovered one reads as the subject.
                states: { inactive: { opacity: 0.35 } },
            },
        },
        tooltip: {
            // One block, not the whole week: the tooltip describes the compliance
            // under the cursor.
            shared: false,
            useHTML: true,
            formatter() {
                const c = winSeries.find((x) => x.name === this.series.name);
                const i = this.point.index;
                const count = this.y;
                const weekTotal = winSeries.reduce((n, x) => n + (x.data[i] ?? 0), 0);
                const share = Math.round((count / weekTotal) * 100);
                const pct = Math.round((count / TOTAL_TUTORS) * 100);
                const rule = c.id === 'conduct'
                    ? 'Each occurrence is acted on individually.'
                    : `Acted on only once it repeats in ${THIS_WEEK.patternThreshold}%+ of a tutor's sessions.`;
                const note = i === progressIdx
                    ? '<div style="color:var(--color-primary-text)">Week still processing — counts will rise.</div>'
                    : '';
                return `<b>${c.name}</b> · week of ${winWeeks[i]}<br/>`
                    + `<div>${count} tutor${count === 1 ? '' : 's'} flagged (${pct}% of ${TOTAL_TUTORS})</div>`
                    + `<div>${share}% of all flags that week</div>`
                    + `<div style="color:var(--color-on-surface-variant)">${rule}</div>`
                    + note;
            },
        },
        series: winSeries.map((c, i) => ({
            name: c.name,
            data: c.data,
            color: c.id === 'conduct' ? PALETTE[0] : PALETTE[(i + 1) % PALETTE.length],
        })),
    }), [windowIndex]);

    return (
        <>
            <div className="v2-tiles">
                <div className="v2-tile v2-tile--alert">
                    <p className="h4 v2-tile__value">{severeOpen}</p>
                    <p className="body3-txt v2-tile__label">Severe, act on one</p>
                </div>
                <div className="v2-tile">
                    <p className="h4 v2-tile__value">{THIS_WEEK.tutorsPastPatternThreshold}</p>
                    <p className="body3-txt v2-tile__label">Tutors repeating</p>
                </div>
                <div className="v2-tile">
                    <p className="h4 v2-tile__value">{open}</p>
                    <p className="body3-txt v2-tile__label">Flags to review</p>
                </div>
                <div className="v2-tile">
                    <p className="h4 v2-tile__value">{THIS_WEEK.sessionsReviewed}/{THIS_WEEK.sessionsTotal}</p>
                    <p className="body3-txt v2-tile__label">Sessions analysed</p>
                </div>
                <div className="v2-tile">
                    <p className="h4 v2-tile__value">{latest(CONDUCT.weeklyFlags)}</p>
                    <p className="body3-txt v2-tile__label">Conduct flags this week</p>
                </div>
            </div>
            <div className="v2-charts">
                <Card paddingSize="md" showBorder={false} className="compliance-surface v2-chart">
                    <h3 className="h6 v2-chart__title">Tutors to talk to</h3>
                    <Chart options={tutorChart} height={230} />
                </Card>
                <Card paddingSize="md" showBorder={false} className="compliance-surface v2-chart">
                    <h3 className="h6 v2-chart__title">Compliance Flags this Week</h3>
                    <Chart options={flagsThisWeekChart} height={230} />
                </Card>
            </div>
            <div className="v2-charts">
                <Card paddingSize="md" showBorder={false} className="compliance-surface v2-chart">
                    <div className="v2-chart-head">
                        <h3 className="h6 v2-chart__title">Compliance flags over time</h3>
                        <Dropdown
                            buttonText={complianceFilter}
                            fill="outline"
                            size="small"
                            items={WEEKLY_BY_COMPLIANCE.map((c) => c.name).map((n) => ({
                                text: n,
                                selected: n === complianceFilter,
                                onClick: () => setComplianceFilter(n),
                            }))}
                        />
                    </div>
                    <Chart options={overTimeChart} height={230} />
                </Card>
                <Card paddingSize="md" showBorder={false} className="compliance-surface v2-chart">
                    <div className="v2-chart-head">
                        <h3 className="h6 v2-chart__title">All Compliance Flags</h3>
                    </div>
                    <div className="v2-window-tabs">
                        <NavPills activeKey={String(windowIndex)} onSelect={(k) => setWindowIndex(Number(k))}>
                            {HISTORY_WINDOWS.map((w, i) => (
                                <NavPills.Item key={w.label} eventKey={String(i)} active={windowIndex === i}>
                                    {i === 0 ? `${w.label} (latest)` : w.label}
                                </NavPills.Item>
                            ))}
                        </NavPills>
                    </div>
                    <Chart key={windowIndex} options={stackedChart} height={250} />
                </Card>
            </div>

            {/* A section heading at the same level as "Compliance Overview" — .h4, as PLUS's Admin pages do. */}
            <h2 className="h4 v2-section-title">Flags</h2>
            <FlagsTab decisions={decisions} relabels={relabels} flags={flags} onOpenRecording={onOpenRecording} />

        </>
    );
};


/** Axis styling the DS theme applies to its own charts. */
function chartAxis() {
    return { labels: { style: { fontSize: '11px' } } };
}

export default OverviewTab;
