import React, { useMemo, useState } from 'react';
import { Avatar, Button, EmptyState, Count } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { DataTable, FilterBar, COMPLIANCE_OPTIONS } from './Shared';
import {
    ROSTER, STATUS_ORDER, ASSIGNED_COUNT, TOTAL_ROSTER, THIS_WEEK, FLAG_INSTANCES, FLAG_CATEGORIES,
} from '../data';
import {
    statusFor, tutorReview, patternState, isPatternFlag, tutorSessions,
} from './audit';

/** What each group means and what to do about it, most urgent first. */
const STATUS_META = {
    'Check-In Needed': `Violations confirmed in more than ${THIS_WEEK.patternThreshold}% of their sessions, or a Communication & Conduct violation. Talk to these tutors first.`,
    'Verification Needed': 'Flagged sessions still waiting on your verdict. Verify them to see whether it adds up to a pattern.',
    'On Track': 'Nothing past the threshold and nothing waiting on a verdict.',
};

/** The compliances supervisors said they care about most — what "Priority only" keeps. */
const PRIORITY_NAMES = FLAG_CATEGORIES.filter((c) => c.group === 'priority').map((c) => c.name);

const SCOPES = [`My tutors (${ASSIGNED_COUNT})`, `All tutors (${TOTAL_ROSTER})`];

const rate = (p) => Math.round((p.flagged / p.of) * 100);

/**
 * Tutors, grouped by who needs a conversation first: Check-In Needed, then
 * Verification Needed, then On Track. On Track is most of any roster, so that
 * group starts collapsed — the two above it are where the work is.
 */
const TutorsTab = ({ decisions = {}, relabels = {}, flags = FLAG_INSTANCES, onOpenTutor }) => {
    const [query, setQuery] = useState('');
    const [compliance, setCompliance] = useState('all');
    const [status, setStatus] = useState('All');
    const [priorityOnly, setPriorityOnly] = useState(false);
    const [scope, setScope] = useState(SCOPES[0]);
    const [showOnTrack, setShowOnTrack] = useState(false);

    const clear = () => {
        setQuery('');
        setCompliance('all');
        setStatus('All');
        setPriorityOnly(false);
        setScope(SCOPES[0]);
    };

    // Each tutor's group follows the verdicts given so far, not the status they started with.
    const pool = useMemo(
        () => (scope === SCOPES[0] ? ROSTER.filter((t) => t.assigned) : ROSTER)
            .map((t) => ({ ...t, status: statusFor(t, flags, decisions, relabels) })),
        [scope, flags, decisions, relabels],
    );

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const target = COMPLIANCE_OPTIONS.find((c) => c.id === compliance)?.name;
        return pool.filter((t) => {
            // A tutor's compliances: their patterns, plus any flag on them this term.
            const names = [...new Set([
                ...t.patterns.map((p) => p.metric),
                ...flags.filter((f) => f.tutor === t.name).map((f) => f.category),
            ])];
            const matchesQuery = !q
                || t.name.toLowerCase().includes(q)
                || names.some((n) => n.toLowerCase().includes(q));
            const matchesCompliance = compliance === 'all' || names.includes(target);
            const matchesStatus = status === 'All' || t.status === status;
            // Same meaning as on the flags list: only tutors with a priority compliance.
            const matchesPriority = !priorityOnly || names.some((n) => PRIORITY_NAMES.includes(n));
            return matchesQuery && matchesCompliance && matchesStatus && matchesPriority;
        });
    }, [pool, flags, query, compliance, status, priorityOnly]);

    const columns = [
        { key: 'tutor', label: 'Tutor', width: '220px', title: true },
        { key: 'repeating', label: 'Repeating' },
        { key: 'reviewed', label: 'Reviewed', width: '210px' },
        { key: 'open', label: 'Open', width: '110px', iconOnly: true, align: 'icon' },
    ];

    const tutorRow = (t) => {
        // Counted per flagged session, since each session gets its own verdict.
        const { total, reviewed, violations, notViolations } = tutorReview(t.name, flags, decisions);
        // A pattern's rate is what supervisors confirmed, against all the tutor's sessions.
        // A pattern with no AI flag in this prototype's data (other supervisors'
        // tutors): show how often the AI flagged it, from the session list if there is one.
        const flaggedLabel = (p) => {
            const sessions = tutorSessions(t.name);
            if (sessions.length === 0) return `${p.flagged}/${p.of} flagged (${rate(p)}%)`;
            const n = sessions.filter((x) => x.flags.includes(p.metric)).length;
            return `${n}/${sessions.length} flagged (${Math.round((n / sessions.length) * 100)}%)`;
        };
        const confirmedRate = (metric) => {
            const f = flags.find((x) => x.tutor === t.name && isPatternFlag(x) && x.category === metric);
            return f ? patternState(f, decisions, relabels) : null;
        };
        return {
            key: t.id,
            cells: [
                {
                    content: (
                        <span className="cm-person">
                            <Avatar name={t.name} size={24} />
                            {t.name}
                        </span>
                    ),
                },
                t.patterns.length === 0
                    ? <span className="cm-muted">None</span>
                    : (
                        <div className="cm-stack">
                            {t.patterns.map((p) => {
                                const c = confirmedRate(p.metric);
                                return (
                                    <span key={p.metric}>
                                        {p.metric}
                                        {' '}
                                        <span className="cm-muted">
                                            {c
                                                ? `${c.confirmed}/${c.total} confirmed (${Math.round(c.rate * 100)}%)${c.open ? ` · ${c.open} to verify` : ''}`
                                                : flaggedLabel(p)}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    ),
                total === 0
                    ? <span className="cm-muted">No flags this term</span>
                    : {
                        content: `${reviewed} of ${total} flagged sessions`,
                        secondary: reviewed > 0
                            ? `${violations} violation${violations === 1 ? '' : 's'} · ${notViolations} not`
                            : undefined,
                    },
                t.hasPage ? <Button key="o" text="Open" fill="outline" trailingVisual="arrow-right" onClick={() => onOpenTutor(t)} /> : null,
            ],
        };
    };

    // A Status filter shows only that group's section.
    const sections = STATUS_ORDER.filter((group) => status === 'All' || group === status).map((group) => ({
        group,
        members: rows.filter((t) => t.status === group),
    }));

    return (
        <>
            {/* Filters stay on one bar above all three sections, so they narrow every section at once. */}
            <PatternSection
                title="Tutors"
                description={`Pattern threshold: ${THIS_WEEK.patternThreshold}% of a tutor's sessions. "Priority only" keeps tutors with a pattern or flag in a priority compliance: ${PRIORITY_NAMES.join(', ')}.`}
                toolbar={(
                    <FilterBar
                        query={query}
                        onQuery={setQuery}
                        compliance={compliance}
                        onCompliance={setCompliance}
                        priorityOnly={priorityOnly}
                        onPriorityOnly={setPriorityOnly}
                        filters={[
                            {
                                label: 'Tutors',
                                value: scope,
                                defaultValue: SCOPES[0],
                                options: SCOPES,
                                onChange: setScope,
                            },
                            {
                                label: 'Status',
                                value: status,
                                defaultValue: 'All',
                                options: ['All', ...STATUS_ORDER],
                                onChange: setStatus,
                            },
                        ]}
                        onClear={clear}
                        count={rows.length}
                        total={pool.length}
                        searchPlaceholder="Tutor or compliance"
                    />
                )}
                layout="subsections"
            >
                {sections.map(({ group, members }) => {
                    // Picking On Track in the Status filter opens it; otherwise it starts collapsed.
                    const collapsible = group === 'On Track' && status !== 'On Track';
                    const open = !collapsible || showOnTrack;
                    return (
                        <PatternSection
                            key={group}
                            title={(
                                <span className="cm-person">
                                    {group}
                                    <Count value={members.length} showZero label={`${members.length} tutors`} />
                                </span>
                            )}
                            description={STATUS_META[group]}
                            actions={collapsible && members.length > 0 ? (
                                <Button text={open ? 'Hide' : 'Show'} fill="text" onClick={() => setShowOnTrack((v) => !v)} />
                            ) : undefined}
                        >
                            {members.length === 0 ? (
                                <PatternCard padding="sm">
                                    <EmptyState size="compact" icon="user-check" header="No tutors in this group with these filters" />
                                </PatternCard>
                            ) : open && (
                                <PatternCard padding="sm">
                                    <DataTable label={group} columns={columns} rows={members.map(tutorRow)} />
                                </PatternCard>
                            )}
                        </PatternSection>
                    );
                })}
            </PatternSection>
        </>
    );
};

export default TutorsTab;
