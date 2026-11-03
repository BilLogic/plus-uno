import React, { useMemo, useState } from 'react';
import { AiIcon, Button, Dropdown, EmptyState, Status } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import Tabs from './Tabs';
import { DataTable, Tiles, statusStyle } from './Shared';
import Chart, { PALETTE, CHART_COLORS } from './Chart';
import { FLAG_INSTANCES, AUDIT_HISTORY, REASON_GROUPS, reasonGroupOf } from '../data';
import { OUTCOMES, auditUnits, openUnitsOf } from './audit';

const pct = (x) => (x === null ? '—' : `${Math.round(x * 100)}%`);

/**
 * AI diagnosis — for whoever is improving the pipeline.
 *
 * Every audit, this week's and earlier, indexed by flag (one model prediction).
 * The category tabs and the audit table are one component: a tab narrows the
 * table to that kind of error and groups it by specific reason, with each
 * supervisor's note on its row — so no annotation appears in two places.
 * Green and red mean "model right / model wrong" here and nowhere else.
 *
 * Four outcomes: right, wrong compliance (a real violation filed under the
 * wrong rule — a classification problem), wrong (no violation — a detection
 * problem), and missed (a violation the supervisor found with no flag).
 */
const DiagnosisTab = ({
    decisions, annotations = {}, relabels = {}, flags = FLAG_INSTANCES, cleanChecks = [], onOpenRecording,
}) => {
    const [view, setView] = useState('right');
    // The specific reason inside the current tab; 'all' shows every reason, grouped.
    const [reason, setReason] = useState('all');
    const openTab = (key) => {
        setView(key);
        setReason('all');
    };

    const audits = useMemo(() => {
        // One audit per session a supervisor judged, plus each violation they added,
        // plus each unflagged session they watched and found nothing in.
        const current = auditUnits(flags, decisions, relabels, annotations)
            .map((a) => ({ ...a, week: 'This week', live: true }));
        const clean = cleanChecks.map((c) => ({
            ...c.flag,
            category: 'No AI flag',
            confidence: null,
            outcome: 'clean',
            note: '',
            week: 'This week',
            live: true,
        }));
        const history = AUDIT_HISTORY.map((h) => ({
            ...h,
            outcome: h.outcome ?? (h.verdict === 'confirmed' ? 'right' : 'wrong'),
            live: false,
        }));
        return [...current, ...clean, ...history];
    }, [flags, decisions, relabels, annotations, cleanChecks]);

    const by = (o) => audits.filter((a) => a.outcome === o);
    const right = by('right');
    const relabelled = by('relabelled');
    const wrong = by('wrong');
    const missed = by('missed');
    const clean = by('clean');
    // The matrix follows the strict definitions: a true positive is the violation
    // the AI named, confirmed. A real violation under the wrong compliance is
    // neither, so it's counted on its own and left out of both rates.
    const tp = right.length;
    const fp = wrong.length;
    const fn = missed.length;
    const tn = clean.length;
    const precision = tp + fp ? tp / (tp + fp) : null;
    const recall = tp + fn ? tp / (tp + fn) : null;
    // Sessions still waiting on a verdict.
    const unlabelled = flags.reduce((n, f) => n + openUnitsOf(f, decisions).length, 0);

    // Confidence vs outcome — one dot per audit, nothing averaged. Built only when
    // the audits change, so switching tabs or reasons doesn't replay its animation;
    // a real change (a new verdict) moves the dots without animating either.
    const confidenceChart = useMemo(() => {
        const of = (o) => audits.filter((a) => a.outcome === o);
        return {
        chart: { type: 'scatter', animation: false },
        xAxis: {
            title: { text: 'AI confidence when it raised the flag' },
            min: 50,
            max: 100,
            labels: { format: '{value}%', style: { fontSize: '10px' } },
            gridLineWidth: 1,
        },
        yAxis: {
            categories: ['AI was wrong', 'Wrong compliance', 'AI was right'],
            title: { text: null },
            min: 0,
            max: 2,
            labels: { style: { fontSize: '11px' } },
        },
        legend: { enabled: false },
        plotOptions: { scatter: { marker: { radius: 6, symbol: 'circle' } } },
        tooltip: {
            useHTML: true,
            formatter() {
                const a = this.point.audit;
                return `<b>${a.tutor}</b> · ${a.category}<br/>`
                    + `<div>${Math.round(a.confidence * 100)}% confidence · ${a.week}</div>`
                    + `<div>${a.outcome === 'wrong'
                        ? `AI was wrong — ${a.reason ?? 'no reason given'}`
                        : a.outcome === 'relabelled' ? `Was ${a.category}, AI said ${a.aiCategory}` : 'AI was right'}</div>`;
            },
        },
        series: [
            // Missed violations have no confidence to plot — the AI never scored them.
            {
                name: 'AI was right',
                color: CHART_COLORS.success,
                data: of('right').map((a, i) => ({ x: a.confidence * 100, y: 2 + ((i % 3) - 1) * 0.1, audit: a })),
            },
            {
                name: 'Wrong compliance',
                color: CHART_COLORS.warning,
                data: of('relabelled').map((a, i) => ({ x: a.confidence * 100, y: 1 + ((i % 3) - 1) * 0.1, audit: a })),
            },
            {
                name: 'AI was wrong',
                color: PALETTE[0],
                data: of('wrong').map((a, i) => ({ x: a.confidence * 100, y: ((i % 3) - 1) * 0.1, audit: a })),
            },
        ],
        };
    }, [audits]);

    /*
     * Tabs follow the reasons a supervisor picks from on the recording page, so
     * each one points at a part of the pipeline to fix, plus "AI was right".
     * Within a tab, rows sit under a header for each specific reason.
     *  AI was right      — true positives and true negatives
     *  AI judgement error — its reasons, plus flags filed under the wrong compliance
     *  Other             — "Other", no reason given, and violations the AI missed
     */
    const wrongFor = (reason) => wrong.filter((a) => a.reason === reason);
    const unexplained = wrong.filter((a) => !reasonGroupOf(a.reason));
    const sectionsFor = (key) => {
        if (key === 'right') {
            return [
                { title: 'AI flagged it, supervisor confirmed it', members: right },
                { title: 'AI flagged nothing, supervisor found nothing', members: clean },
            ];
        }
        const group = REASON_GROUPS.find((g) => g.id === key);
        const sections = group.reasons.map((r) => ({ title: r, members: wrongFor(r), showFix: true }));
        if (key === 'judgement') {
            sections.push({ title: 'Real violation, wrong compliance', members: relabelled });
        }
        if (key === 'other') {
            sections.push({ title: 'No reason given', members: unexplained });
            sections.push({ title: 'Violation the AI missed', members: missed });
        }
        return sections;
    };
    const count = (key) => sectionsFor(key).reduce((n, sec) => n + sec.members.length, 0);
    const tabs = [
        { key: 'right', label: `AI was right (${count('right')})` },
        ...REASON_GROUPS.map((g) => ({ key: g.id, label: `${g.name} (${count(g.id)})` })),
    ];

    const columns = [
        { key: 'week', label: 'Week', width: '100px' },
        { key: 'tutor', label: 'Tutor', width: '150px', title: true },
        { key: 'compliance', label: 'Compliance', width: '200px' },
        { key: 'confidence', label: 'Confidence', width: '110px', align: 'number' },
        { key: 'result', label: 'Model result', width: '140px' },
        { key: 'note', label: 'Annotation' },
        { key: 'open', label: 'Open', width: '100px', iconOnly: true, align: 'icon' },
    ];

    // In a category tab the reason is already the group header, so the row shows only the note.
    const auditRow = (a) => ({
        key: a.id,
        cells: [
            { content: a.week, wrap: false },
            a.tutor,
            { content: a.category, secondary: a.aiCategory ? `AI said: ${a.aiCategory}` : undefined },
            a.confidence == null ? '—' : `${Math.round(a.confidence * 100)}%`,
            <Status key="r" style={statusStyle(OUTCOMES[a.outcome].tone)}>{OUTCOMES[a.outcome].label}</Status>,
            a.note || '—',
            a.live ? <Button key="o" text="Open" fill="text" onClick={() => onOpenRecording(a, a.category)} /> : null,
        ],
    });

    const sections = sectionsFor(view);
    const chosen = sections.find((sec) => sec.title === reason);
    const tabTotal = sections.reduce((n, sec) => n + sec.members.length, 0);
    // One reason picked: just its rows. All: each reason's rows under its own heading.
    const shown = chosen ? [chosen] : sections.filter((sec) => sec.members.length > 0);
    const activeGroup = REASON_GROUPS.find((g) => g.id === view);

    return (
        <>
            <Tiles
                items={[
                    { value: audits.length, label: 'Sessions audited (all weeks)' },
                    { value: pct(precision), label: 'Precision: AI flags supervisors confirmed' },
                    { value: pct(recall), label: 'Recall: confirmed violations the AI caught' },
                    { value: unlabelled, label: 'Sessions this week, not yet audited' },
                ]}
            />

            <div className="cm-grid-2">
                <PatternCard
                    title="Confusion matrix"
                    description="How the AI's calls compare with what supervisors found."
                >
                    <table className="cm-matrix">
                        <thead>
                            <tr>
                                <th aria-label="Corner" />
                                <th scope="col">Supervisor confirmed violation</th>
                                <th scope="col">Supervisor found no violation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row">AI flagged violation</th>
                                <td className="cm-matrix__cell cm-matrix__cell--good">
                                    <span className="cm-matrix__n">{tp}</span>
                                    <span>true positive</span>
                                </td>
                                <td className="cm-matrix__cell cm-matrix__cell--bad">
                                    <span className="cm-matrix__n">{fp}</span>
                                    <span>false positive</span>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">AI silent</th>
                                <td className="cm-matrix__cell cm-matrix__cell--bad">
                                    <span className="cm-matrix__n">{fn}</span>
                                    <span>false negative</span>
                                </td>
                                <td className="cm-matrix__cell cm-matrix__cell--good">
                                    <span className="cm-matrix__n">{tn}</span>
                                    <span>true negative</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="cm-note">
                        False negatives are violations supervisors added on a recording. True negatives are
                        sessions with no AI flag that a supervisor watched and found nothing in.
                        {relabelled.length > 0 && ` Not counted: ${relabelled.length} real violation${relabelled.length === 1 ? '' : 's'} the AI filed under the wrong compliance (under AI judgement error).`}
                    </p>
                </PatternCard>

                <PatternCard
                    title="Was the AI's confidence a good sign?"
                    description="One dot per audit, by the confidence the AI had when it raised the flag."
                >
                    <Chart options={confidenceChart} height={210} />
                </PatternCard>
            </div>

            <PatternSection
                title="Audits"
                description={`${audits.filter((a) => !a.live).length} from earlier weeks · ${audits.filter((a) => a.live).length} this week`}
                tabs={<Tabs appearance="pills" label="Audit category" items={tabs} value={view} onChange={openTab} />}
            >
                <PatternCard padding="sm">
                    {/* Every reason in this tab, with its count, zeros included, so it is
                        clear what is not going wrong as well as what is. */}
                    <div className="cm-reason-bar">
                        <Dropdown
                            buttonText={`Reason: ${chosen ? chosen.title : 'All'} (${chosen ? chosen.members.length : tabTotal})`}
                            fill="outline"
                            items={[
                                // Counts in parentheses, matching the tabs above.
                                { text: `All (${tabTotal})`, selected: !chosen, onClick: () => setReason('all') },
                                ...sections.map((sec) => ({
                                    text: `${sec.title} (${sec.members.length})`,
                                    selected: sec.title === reason,
                                    disabled: sec.members.length === 0,
                                    onClick: () => setReason(sec.title),
                                })),
                            ]}
                        />
                        {activeGroup && (
                            <p className="cm-note cm-note--inline">
                                <AiIcon name="suggest" />
                                Where to fix it: {activeGroup.fix}.
                            </p>
                        )}
                    </div>
                    {shown.length === 0 ? (
                        <EmptyState size="compact" icon="clipboard-check" header="No audits in this category yet" />
                    ) : shown.map(({ title, members }) => (
                        <section key={title} className="cm-audit-group">
                            <h4 className="cm-audit-group__title">
                                {title}
                                <span className="cm-audit-group__count">{members.length}</span>
                            </h4>
                            {members.length === 0
                                ? <p className="cm-note">None.</p>
                                : <DataTable label={title} columns={columns} rows={members.map(auditRow)} />}
                        </section>
                    ))}
                </PatternCard>
            </PatternSection>
        </>
    );
};

export default DiagnosisTab;
