import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import { Card, Badge, Button, Table } from '@/components';
import { STUDENTS, NO_STUDENTS, PROGRESS_STATES, OUTCOMES, isNotOnTrack } from './students';
import './StudentProgressPage.scss';

/**
 * Student Progress — a tutor reviews how their assigned students are doing.
 *
 * Scope is the confirmed brief, not the whole PRD: exactly two interactions
 * behave for real — expanding a student row, and toggling the "needs
 * attention" filter. Everything else (shell chrome, session rows, column
 * headers) is deliberately inert.
 *
 * The roster is a DS `Table`; expansion works by injecting one extra row
 * directly beneath the open student, a single `colSpan` cell holding a nested
 * session table. The DS has no expandable-table component (see manifest).
 */

const SHELL_PROPS = {
    topBarConfig: {
        breadcrumbs: [
            { text: 'Toolkit', href: '#' },
            { text: 'Progress' },
        ],
        user: { name: 'Sam Rivera', counter: null, counterValue: null, type: 'tutor' },
    },
    sidebarConfig: {
        user: 'tutor',
        activeTabId: 'home',
    },
};

const ROSTER_HEADERS = [
    { text: 'Student', width: '38%' },
    { text: 'Sessions completed', width: '22%' },
    { text: 'Progress', width: '25%' },
    { text: <span className="sp__sr-only">Expand</span>, width: '15%', align: 'right' },
];

const SESSION_HEADERS = [
    { text: 'Date', width: '22%' },
    { text: 'Topic', width: '53%' },
    { text: 'Outcome', width: '25%' },
];

function formatDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Last 5 sessions for one student, rendered inside the injected roster row. */
function SessionHistory({ student }) {
    const rows = student.sessions.map((session) => [
        <span className="body3-txt sp__session-date">{formatDate(session.date)}</span>,
        <span className="body3-txt">{session.topic}</span>,
        <Badge
            text={OUTCOMES[session.outcome].label}
            style={OUTCOMES[session.outcome].badgeStyle}
            size="b3"
        />,
    ]);

    return (
        <div className="sp__history">
            <p className="body3-txt sp__history-title">
                Last {student.sessions.length} sessions · {student.name}
            </p>
            <Table headers={SESSION_HEADERS} rows={rows} density="sm" hover={false} />
        </div>
    );
}

export default function StudentProgressPage() {
    const [expandedId, setExpandedId] = useState(null);
    const [onlyNeedsAttention, setOnlyNeedsAttention] = useState(false);
    // Prototype-only: the empty state is an acceptance criterion but is
    // otherwise unreachable without a second tutor account.
    const [showEmptyRoster, setShowEmptyRoster] = useState(false);

    const roster = showEmptyRoster ? NO_STUDENTS : STUDENTS;

    const sorted = useMemo(
        () => [...roster].sort((a, b) => PROGRESS_STATES[a.progress].rank - PROGRESS_STATES[b.progress].rank),
        [roster]
    );

    const needsAttentionCount = useMemo(() => roster.filter(isNotOnTrack).length, [roster]);
    const visible = onlyNeedsAttention ? sorted.filter(isNotOnTrack) : sorted;

    /** Single-open: clicking another student closes the one already open. */
    const toggleStudent = (student) =>
        setExpandedId((current) => (current === student.id ? null : student.id));

    const toggleFilter = () => {
        const turningOn = !onlyNeedsAttention;
        // Collapse if the filter is about to hide the student that is open —
        // otherwise the detail row survives without its parent.
        const open = roster.find((s) => s.id === expandedId);
        if (turningOn && open && !isNotOnTrack(open)) setExpandedId(null);
        setOnlyNeedsAttention(turningOn);
    };

    /**
     * Roster rows plus, for the open student, one injected detail row. The two
     * are built together so the detail always lands immediately beneath its
     * parent regardless of filtering or sort.
     */
    const rosterRows = [];
    const rowStudents = [];
    visible.forEach((student) => {
        const state = PROGRESS_STATES[student.progress];
        const isOpen = expandedId === student.id;

        rosterRows.push([
            {
                content: (
                    <span className="sp__student">
                        <span className="body1-txt font-weight-semibold sp__student-name">{student.name}</span>
                        <span className="body3-txt sp__student-meta">{student.grade}</span>
                    </span>
                ),
                className: isOpen ? 'sp__cell sp__cell--open' : 'sp__cell',
            },
            {
                content: (
                    <span className="body2-txt sp__sessions">
                        {student.sessionsCompleted}
                        <span className="sp__sessions-total"> of {student.sessionsPlanned}</span>
                    </span>
                ),
                className: isOpen ? 'sp__cell sp__cell--open' : 'sp__cell',
            },
            {
                content: (
                    <Badge
                        text={state.label}
                        style={state.badgeStyle}
                        size="b2"
                        leadingVisual={<i className={`fa-solid ${state.icon}`} aria-hidden="true" />}
                    />
                ),
                className: isOpen ? 'sp__cell sp__cell--open' : 'sp__cell',
            },
            {
                content: (
                    <span className="sp__chevron" aria-hidden="true">
                        <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                    </span>
                ),
                align: 'right',
                className: isOpen ? 'sp__cell sp__cell--open' : 'sp__cell',
            },
        ]);
        rowStudents.push(student);

        if (isOpen) {
            rosterRows.push([
                {
                    content: <SessionHistory student={student} />,
                    colSpan: ROSTER_HEADERS.length,
                    className: 'sp__detail-cell',
                },
            ]);
            // Detail rows are not clickable targets — keep the index map aligned.
            rowStudents.push(null);
        }
    });

    const handleRowClick = (rowIndex) => {
        const student = rowStudents[rowIndex];
        if (student) toggleStudent(student);
    };

    return (
        <PageLayout {...SHELL_PROPS}>
            <div className="sp">
                {/* Prototype-only control — not a shipped surface. */}
                <div className="sp__demo" role="group" aria-label="Demo state">
                    <span className="body3-txt sp__demo-label">Demo</span>
                    <Button
                        text="Assigned students"
                        size="small"
                        fill={showEmptyRoster ? 'ghost' : 'tonal'}
                        style={showEmptyRoster ? 'secondary' : 'primary'}
                        onClick={() => {
                            setShowEmptyRoster(false);
                        }}
                    />
                    <Button
                        text="No students"
                        size="small"
                        fill={showEmptyRoster ? 'tonal' : 'ghost'}
                        style={showEmptyRoster ? 'primary' : 'secondary'}
                        onClick={() => {
                            setShowEmptyRoster(true);
                            setExpandedId(null);
                            setOnlyNeedsAttention(false);
                        }}
                    />
                </div>

                <header className="sp__header">
                    <h1 className="h3-txt sp__title">Student progress</h1>
                    <p className="body2-txt sp__subtitle">
                        How your assigned students are tracking across their sessions.
                    </p>
                </header>

                {roster.length === 0 ? (
                    <Card paddingSize="lg">
                        <div className="sp__empty">
                            <i className="fa-solid fa-user-group sp__empty-icon" aria-hidden="true" />
                            <h2 className="h5-txt sp__empty-title">No students assigned yet</h2>
                            <p className="body2-txt sp__empty-body">
                                Once students are assigned to you, their session progress will appear here.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card paddingSize="lg">
                        <div className="sp__toolbar">
                            <div className="sp__toolbar-text">
                                <span className="body1-txt font-weight-semibold">
                                    {onlyNeedsAttention ? 'Students not on track' : 'Your students'}
                                </span>
                                <span className="body3-txt sp__count">
                                    Showing {visible.length} of {roster.length}
                                </span>
                            </div>
                            <Button
                                text={`Needs attention (${needsAttentionCount})`}
                                size="small"
                                fill={onlyNeedsAttention ? 'filled' : 'outline'}
                                style={onlyNeedsAttention ? 'primary' : 'secondary'}
                                leadingVisual={<i className="fa-solid fa-filter" aria-hidden="true" />}
                                onClick={toggleFilter}
                                aria-pressed={onlyNeedsAttention}
                            />
                        </div>

                        <Table
                            className="sp__roster"
                            headers={ROSTER_HEADERS}
                            rows={rosterRows}
                            density="md"
                            onRowClick={handleRowClick}
                        />
                    </Card>
                )}
            </div>
        </PageLayout>
    );
}
