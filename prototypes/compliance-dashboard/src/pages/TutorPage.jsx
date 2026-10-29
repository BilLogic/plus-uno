import React, { useState } from 'react';
import { Card, Table, Badge, Button, Dropdown } from '@/components';
import { THIS_WEEK } from '../data';
import { unitsOnSession, patternState, isPatternFlag } from '../v2/audit';

const STATUS_TONE = {
    'On Track': 'secondary',
    'Verification Needed': 'warning',
    'Check-In Needed': 'danger',
};

/**
 * One tutor: every pattern that put them here, and every session they worked —
 * flagged or clean — so the rate can be judged against the whole history.
 */
const REVIEW_TONE = {
    'Needs verification': 'primary', Violation: 'danger', 'Not a violation': 'success', 'No violation found': 'success',
};

const TutorPage = ({
    tutor, status, added = [], flags = [], decisions = {}, relabels = {}, cleanChecks = [], onOpenSession,
}) => {
    /**
     * Where a session stands, from its own verdicts — each flagged session is
     * judged on its own: any still unreviewed → needs verification, else a
     * violation if any was confirmed, else not a violation.
     */
    const reviewOf = (s) => {
        if (!s.recording) return null;
        const units = unitsOnSession(tutor.name, s, flags);
        if (units.length === 0) {
            if (added.some((v) => v.sessionId === s.id)) return 'Violation';
            return cleanChecks.some((c) => c.key === `s-${s.id}`) ? 'No violation found' : null;
        }
        if (units.some((u) => !decisions[u.key])) return 'Needs verification';
        return units.some((u) => decisions[u.key] === 'confirmed') ? 'Violation' : 'Not a violation';
    };

    /**
     * A repeating compliance: what supervisors confirmed against all of the
     * tutor's sessions, and what's still waiting. Past the threshold it's a pattern.
     */
    const total = tutor.sessions.length;
    // One row per pattern the AI flagged for this tutor — each has sessions to verify.
    const patternRows = flags
        .filter((f) => f.tutor === tutor.name && isPatternFlag(f))
        .map((f) => {
            const metric = f.aiCategory ?? f.category;
            const flagged = tutor.sessions.filter((s) => s.flags.includes(metric)).length;
            return { metric, flagged, ...patternState(f, decisions, relabels), total };
        });
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    const toVerify = tutor.sessions.filter((s) => reviewOf(s) === 'Needs verification');
    // AI flags on the session, plus any violation a supervisor added in its recording.
    const flagsOn = (s) => [
        ...s.flags.map((name) => ({ name, byYou: false })),
        ...added.filter((v) => v.transcriptId === s.transcriptId).map((v) => ({ name: v.category, byYou: true })),
    ];
    const flaggedSessions = tutor.sessions.filter((s) => flagsOn(s).length > 0);
    const [sessionFilter, setSessionFilter] = useState('All sessions');
    const SESSION_FILTERS = ['All sessions', 'Needs verification', 'Flagged', 'Not flagged'];
    const visibleSessions = tutor.sessions.filter((s) => {
        if (sessionFilter === 'Needs verification') return reviewOf(s) === 'Needs verification';
        if (sessionFilter === 'Flagged') return flagsOn(s).length > 0;
        if (sessionFilter === 'Not flagged') return flagsOn(s).length === 0;
        return true;
    });


    const headers = [
        { text: 'Session', width: '190px' },
        { text: 'Students', width: '220px' },
        { text: 'Flags' },
        { text: 'Review', width: '170px' },
        { text: '', width: '150px', align: 'right' },
    ];

    const rows = visibleSessions.map((s) => [
        <div key={`${s.id}-when`}>
            <p className="body2-txt compliance-review__tutor">{s.date}</p>
            <p className="body3-txt compliance-review__muted">{s.time}</p>
        </div>,
        <p key={`${s.id}-students`} className="body3-txt compliance-review__muted">
            {s.students.join(', ')}
        </p>,
        flagsOn(s).length === 0
            ? <span key={`${s.id}-none`} className="body3-txt compliance-review__muted">No flags</span>
            : (
                <div key={`${s.id}-flags`} className="repeat__patterns">
                    {flagsOn(s).map((f, i) => (
                        <Badge
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${f.name}-${i}`}
                            style={f.byYou ? 'primary' : 'warning'}
                            text={f.byYou ? `${f.name} · added by you` : f.name}
                        />
                    ))}
                </div>
            ),
        reviewOf(s)
            ? <Badge key={`${s.id}-rv`} style={REVIEW_TONE[reviewOf(s)]} text={reviewOf(s)} />
            : <span key={`${s.id}-rv`} className="body3-txt compliance-review__muted">—</span>,
        {
            align: 'right',
            content: s.recording ? (
                <Button
                    // The sessions waiting on you get the stronger button.
                    text={reviewOf(s) === 'Needs verification' ? 'Verify' : 'Open session'}
                    style="primary"
                    fill={reviewOf(s) === 'Needs verification' ? 'filled' : 'outline'}
                    size="small"
                    leadingVisual="play"
                    disabled={!s.transcriptId}
                    onClick={() => onOpenSession(tutor, s)}
                />
            ) : (
                <span className="body3-txt compliance-review__muted">No recording</span>
            ),
        },
    ]);

    return (
        <>
            <div className="compliance-surface tutor-head">
                <div>
                    <div className="tutor-head__title">
                        <Badge style={STATUS_TONE[status ?? tutor.status]} text={status ?? tutor.status} />
                    </div>
                    <p className="body3-txt compliance-review__muted">
                        {tutor.sessions.length} sessions on record ·
                        {' '}{flaggedSessions.length} with flags · pattern since {tutor.since}
                    </p>
                </div>
                <Button text="Export tutor record" style="primary" fill="outline" size="medium" leadingVisual="download" />
            </div>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <h3 className="h5 compliance-chart-card__title">What is repeating</h3>
                <p className="body3-txt compliance-chart-card__caption">
                    It&apos;s a pattern once supervisors confirm more than {THIS_WEEK.patternThreshold}% of the
                    tutor&apos;s sessions. Solid is confirmed; light is flagged by the AI and still to verify.
                </p>

                <div className="tutor-patterns">
                    {patternRows.map((p) => (
                        <div key={p.metric} className="tutor-pattern">
                            <div className="tutor-pattern__head">
                                <p className="h6 tutor-pattern__metric">{p.metric}</p>
                                <p className="body2-txt font-weight-semibold tutor-pattern__rate">
                                    {pct(p.confirmed)}% confirmed
                                    <span className="body3-txt compliance-review__muted">
                                        {' '}({p.confirmed} of {p.total} sessions)
                                    </span>
                                </p>
                            </div>
                            <div
                                className="tutor-pattern__bar"
                                role="img"
                                aria-label={`${pct(p.confirmed)} percent of sessions confirmed, ${pct(p.open)} percent still to verify`}
                            >
                                <div className="tutor-pattern__fill" style={{ width: `${pct(p.confirmed)}%` }} />
                                <div
                                    className="tutor-pattern__pending"
                                    style={{ left: `${pct(p.confirmed)}%`, width: `${pct(p.open)}%` }}
                                />
                                <div
                                    className="tutor-pattern__threshold"
                                    style={{ left: `${THIS_WEEK.patternThreshold}%` }}
                                />
                            </div>
                            <p className="body3-txt compliance-review__muted">
                                {p.flagged} flagged by AI · {p.confirmed} confirmed · {p.dismissed} not a violation
                                {' · '}{p.open} to verify
                            </p>
                        </div>
                    ))}
                </div>
            </Card>

            {added.length > 0 && (
                <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                    <h3 className="h5 compliance-chart-card__title">Violations you added</h3>
                    <p className="body3-txt compliance-chart-card__caption">
                        Violations the AI didn&apos;t flag, found while reviewing this tutor&apos;s recordings. They count toward their status.
                    </p>
                    <Table
                        headers={[
                            { text: 'When', width: '160px' },
                            { text: 'Compliance', width: '220px' },
                            { text: 'Notes' },
                        ]}
                        rows={added.map((v) => [
                            <p key={`${v.id}-d`} className="body3-txt">{v.dateLabel}</p>,
                            <p key={`${v.id}-c`} className="body3-txt">{v.category}</p>,
                            <p key={`${v.id}-n`} className="body3-txt compliance-review__muted">{v.note || '—'}</p>,
                        ])}
                        density="md"
                    />
                </Card>
            )}

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <div className="compliance-review__header">
                    <div>
                        <h3 className="h5 compliance-chart-card__title">Session history</h3>
                        <p className="body3-txt compliance-chart-card__caption">
                            {visibleSessions.length} of {tutor.sessions.length} sessions ·
                            {' '}{flaggedSessions.length} flagged
                            {toVerify.length > 0 && ` · ${toVerify.length} need verification`}
                        </p>
                    </div>
                    <Dropdown
                        buttonText={`Show: ${sessionFilter}`}
                        fill="outline"
                        size="small"
                        items={SESSION_FILTERS.map((f) => ({
                            text: f,
                            selected: f === sessionFilter,
                            onClick: () => setSessionFilter(f),
                        }))}
                    />
                </div>
                {tutor.sessions.length === 0 ? (
                    <p className="body2-txt compliance-review__muted">
                        No session history loaded for this tutor yet.
                    </p>
                ) : (
                    <Table headers={headers} rows={rows} hover density="lg" />
                )}
            </Card>
        </>
    );
};

export default TutorPage;
