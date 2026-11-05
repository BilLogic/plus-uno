import React, { useState } from 'react';
import { Avatar, Button, EmptyState, StaticTable, StatusTag, Tag, VisuallyHidden } from '@/components';
import OptionMenu from '../v2/OptionMenu';
import { PatternCard, PatternSection } from '@/patterns';
import { THIS_WEEK } from '../data';
import { unitsOnSession, patternState, isPatternFlag } from '../v2/audit';
import './pages.css';

const STATUS_STYLE = {
    'On Track': 'success',
    'Verification Needed': 'warning',
    'Check-In Needed': 'danger',
};

/**
 * One tutor: every pattern that put them here, and every session they worked —
 * flagged or clean — so the rate can be judged against the whole history.
 */
const REVIEW_STYLE = {
    'Needs verification': 'info', Violation: 'danger', 'Not a violation': 'success', 'No violation found': 'success',
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
        { text: 'Session', width: '12rem' },
        { text: 'Students', width: '14rem' },
        { text: 'Flags' },
        { text: 'Review', width: '12rem' },
        { text: <VisuallyHidden>Open</VisuallyHidden>, width: '10rem', align: 'right' },
    ];

    const rows = visibleSessions.map((s) => [
        { content: s.date, secondary: s.time, emphasis: 'title' },
        s.students.join(', '),
        flagsOn(s).length === 0
            ? <span key={`${s.id}-none`} className="cm-muted cm-small">No flags</span>
            : (
                <div key={`${s.id}-flags`} className="cm-row">
                    {flagsOn(s).map((f, i) => (
                        <Tag
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${f.name}-${i}`}
                            color={f.byYou ? 'blue' : 'orange'}
                            text={f.byYou ? `${f.name} · added by you` : f.name}
                        />
                    ))}
                </div>
            ),
        reviewOf(s)
            ? <StatusTag key={`${s.id}-rv`} appearance={REVIEW_STYLE[reviewOf(s)]}>{reviewOf(s)}</StatusTag>
            : <span key={`${s.id}-rv`} className="cm-muted cm-small">—</span>,
        {
            align: 'right',
            content: s.recording ? (
                <Button
                    // The sessions waiting on you get the stronger button.
                    text={reviewOf(s) === 'Needs verification' ? 'Verify' : 'Open session'}
                    appearance={reviewOf(s) === 'Needs verification' ? 'primary' : 'default'}
                    iconBefore="play"
                    disabled={!s.transcriptId}
                    onClick={() => onOpenSession(tutor, s)}
                />
            ) : (
                <span className="cm-muted cm-small">No recording</span>
            ),
        },
    ]);

    return (
        <div className="cm-stack">
            <div className="cm-tutor-head">
                <div className="cm-tutor-head__who">
                    <Avatar name={tutor.name} size={48} />
                    <div className="cm-tutor-head__text">
                        <div className="cm-row">
                            <StatusTag appearance={STATUS_STYLE[status ?? tutor.status]}>{status ?? tutor.status}</StatusTag>
                        </div>
                        <p className="cm-muted cm-small">
                            {tutor.sessions.length} sessions on record ·
                            {' '}{flaggedSessions.length} with flags · pattern since {tutor.since}
                        </p>
                    </div>
                </div>
                <Button text="Export tutor record" iconBefore="download" />
            </div>

            <PatternSection
                title="What is repeating"
                description={`It's a pattern once supervisors confirm more than ${THIS_WEEK.patternThreshold}% of the tutor's sessions. Solid is confirmed; light is flagged by the AI and still to verify.`}
            >
                <div className="cm-stack">
                    {patternRows.map((p) => (
                        <PatternCard
                            key={p.metric}
                            padding="lg"
                            title={p.metric}
                            actions={(
                                <p className="cm-pattern__rate">
                                    <span className="cm-strong">{pct(p.confirmed)}% confirmed</span>
                                    <span className="cm-muted cm-small">
                                        {' '}({p.confirmed} of {p.total} sessions)
                                    </span>
                                </p>
                            )}
                        >
                            <div className="cm-stack">
                                <div
                                    className="cm-bar"
                                    role="img"
                                    aria-label={`${pct(p.confirmed)} percent of sessions confirmed, ${pct(p.open)} percent still to verify`}
                                >
                                    <div className="cm-bar__fill" style={{ width: `${pct(p.confirmed)}%` }} />
                                    <div
                                        className="cm-bar__pending"
                                        style={{ left: `${pct(p.confirmed)}%`, width: `${pct(p.open)}%` }}
                                    />
                                    <div
                                        className="cm-bar__threshold"
                                        style={{ left: `${THIS_WEEK.patternThreshold}%` }}
                                    />
                                </div>
                                <p className="cm-muted cm-small">
                                    {p.flagged} flagged by AI · {p.confirmed} confirmed · {p.dismissed} not a violation
                                    {' · '}{p.open} to verify
                                </p>
                            </div>
                        </PatternCard>
                    ))}
                </div>
            </PatternSection>

            {added.length > 0 && (
                <PatternSection
                    title="Violations you added"
                    description="Violations the AI didn't flag, found while reviewing this tutor's recordings. They count toward their status."
                >
                    <PatternCard padding="lg">
                        <StaticTable
                            headers={[
                                { text: 'When', width: '12rem' },
                                { text: 'Compliance', width: '16rem' },
                                { text: 'Notes' },
                            ]}
                            rows={added.map((v) => [v.dateLabel, v.category, v.note || '—'])}
                        />
                    </PatternCard>
                </PatternSection>
            )}

            <PatternSection
                title="Session history"
                description={`${visibleSessions.length} of ${tutor.sessions.length} sessions · ${flaggedSessions.length} flagged${toVerify.length > 0 ? ` · ${toVerify.length} need verification` : ''}`}
                actions={(
                    <OptionMenu
                        buttonText={`Show: ${sessionFilter}`}
                        items={SESSION_FILTERS.map((f) => ({
                            text: f,
                            selected: f === sessionFilter,
                            onClick: () => setSessionFilter(f),
                        }))}
                    />
                )}
            >
                <PatternCard padding="lg">
                    {tutor.sessions.length === 0 ? (
                        <EmptyState
                            spacing="compact"
                            icon="clock-rotate-left"
                            header="No session history yet"
                            description="No session history is loaded for this tutor yet."
                        />
                    ) : (
                        <StaticTable headers={headers} rows={rows} />
                    )}
                </PatternCard>
            </PatternSection>
        </div>
    );
};

export default TutorPage;
