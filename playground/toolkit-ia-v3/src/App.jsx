import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Accordion from '@/components/Accordion/Accordion';
import Button from '@/components/Button/Button';
import NavTabs from '@/components/NavTabs/NavTabs';
import Card from '@/components/Card/Card';
import Badge from '@/components/Badge/Badge';
import Textarea from '@/forms/Textarea';
import {
    MOCK_SESSIONS,
    SESSION_GROUPS,
    sessionById,
    sessionsByGroup,
    leadTutor,
    tutorCount,
    studentCount,
    reflectionStatusLabel,
    reflectionBadgeStyle,
} from './mockData';
import './App.scss';

const WORKSPACE_TABS = {
    overview: 'overview',
    students: 'students',
    reflection: 'reflection',
};

function ReflectionStatusBadge({ status }) {
    const icon =
        status === 'submitted' ? (
            <i className="fa-solid fa-circle-check" aria-hidden />
        ) : status === 'draft' ? (
            <i className="fa-solid fa-pen" aria-hidden />
        ) : (
            <i className="fa-regular fa-circle" aria-hidden />
        );
    return (
        <Badge
            text={reflectionStatusLabel(status)}
            style={reflectionBadgeStyle(status)}
            size="b2"
            leadingVisual={icon}
        />
    );
}

function SessionListRows({ sessions, activeSessionId, onSelectSession }) {
    return (
        <div className="ti3-session-list">
            {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const incomplete = s.reflectionStatus !== 'submitted' && s.group === SESSION_GROUPS.history;
                return (
                    <div
                        key={s.id}
                        className={`ti3-session-list__row${isActive ? ' ti3-session-list__row--active' : ''}`}
                    >
                        <Button
                            className="ti3-session-list__button"
                            text={s.title}
                            style="secondary"
                            fill="ghost"
                            size="small"
                            block
                            leadingVisual="calendar-day"
                            trailingVisual={
                                incomplete ? <Badge text="!" style="warning" size="b3" /> : undefined
                            }
                            onClick={() => onSelectSession(s.id)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function PersistentContextPanel({ session }) {
    if (!session) {
        return (
            <aside className="ti3-context-panel ti3-context-panel--empty" aria-label="Session context">
                <p className="h6 ti3-context-panel__heading">Session context</p>
                <p className="body2-txt" style={{ margin: 0 }}>
                    Stays visible while you switch workspace tabs. Select a session from Today, Upcoming, or
                    History.
                </p>
            </aside>
        );
    }

    const lead = leadTutor(session);
    const tutors = tutorCount(session);
    const students = studentCount(session);

    return (
        <aside className="ti3-context-panel" aria-label="Session context">
            <p className="h6 ti3-context-panel__heading">{session.title}</p>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Time / date</p>
                <p className="body1-txt font-weight-semibold ti3-context-panel__value">{session.timeLabel}</p>
                <p className="body3-txt ti3-context-panel__value">{session.dateLabel}</p>
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Lead tutor</p>
                <p className="body1-txt font-weight-semibold ti3-context-panel__value">
                    {lead?.name ?? '—'}
                </p>
                <p className="body3-txt ti3-context-panel__value">
                    {tutors} tutor{tutors !== 1 ? 's' : ''} assigned
                </p>
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Students</p>
                <p className="body1-txt font-weight-semibold ti3-context-panel__value">
                    {students} student{students !== 1 ? 's' : ''}
                </p>
                {session.rosterChanges?.length > 0 && (
                    <ul className="ti3-context-panel__roster-delta body3-txt">
                        {session.rosterChanges.map((c) => (
                            <li key={`${c.at}-${c.note}`}>
                                <i className="fa-solid fa-arrows-rotate" aria-hidden /> {c.at}: {c.note}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Attendance</p>
                {session.attendance ? (
                    <>
                        <p className="body1-txt ti3-context-panel__value">{session.attendance.label}</p>
                        <p className="body3-txt ti3-context-panel__value">{session.attendance.detail}</p>
                    </>
                ) : (
                    <p className="body2-txt ti3-context-panel__value">Not yet recorded</p>
                )}
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Engagement</p>
                {session.engagement ? (
                    <>
                        <p className="body1-txt ti3-context-panel__value">{session.engagement.label}</p>
                        <p className="body3-txt ti3-context-panel__value">{session.engagement.detail}</p>
                    </>
                ) : (
                    <p className="body2-txt ti3-context-panel__value">—</p>
                )}
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Session goals</p>
                <ul className="ti3-list-plain body2-txt">
                    {session.goals.map((g) => (
                        <li key={g}>{g}</li>
                    ))}
                </ul>
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Previous notes</p>
                <p className="body2-txt ti3-context-panel__value">{session.priorNotes}</p>
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Reflection status</p>
                <ReflectionStatusBadge status={session.reflectionStatus} />
                {session.group === SESSION_GROUPS.history && session.reflectionStatus !== 'submitted' && (
                    <p className="body3-txt" style={{ marginTop: 'var(--size-element-gap-xs)' }}>
                        May complete after back-to-back sessions — context stays here while you draft.
                    </p>
                )}
            </section>

            <section className="ti3-context-panel__section">
                <p className="ti3-context-panel__sticky-label">Zoom summary</p>
                {session.zoomSummary ? (
                    <p className="body3-txt ti3-context-panel__zoom">{session.zoomSummary}</p>
                ) : (
                    <p className="body3-txt ti3-context-panel__zoom">
                        {session.zoomRecording?.status ?? 'No summary yet'}
                        {session.zoomRecording?.available === false &&
                            session.roomLabel?.includes('Zoom') &&
                            ' · Recording will appear post-session'}
                    </p>
                )}
            </section>
        </aside>
    );
}

function ReflectionWorkspace({ session, draft, onDraftChange }) {
    return (
        <div>
            <div className="ti3-workspace__context-hint body2-txt">
                <i className="fa-solid fa-arrow-right" aria-hidden />
                <span>
                    Session context remains in the panel on the right (attendance, engagement, goals, Zoom
                    summary). Use it while drafting — tab changes do not hide this information.
                </span>
            </div>

            <div className="ti3-reflection-form__status-row">
                <span className="body2-txt font-weight-semibold">Reflection status</span>
                <ReflectionStatusBadge status={session.reflectionStatus} />
                {session.zoomRecording?.available && (
                    <Badge
                        text="Zoom recording available"
                        style="info"
                        size="b3"
                        leadingVisual={<i className="fa-solid fa-video" aria-hidden />}
                    />
                )}
            </div>

            <Card
                title="Reflection form"
                subtitle={`${session.title} · ${session.timeLabel}`}
                body={
                    <div>
                        <Textarea
                            id="reflection-draft"
                            label="Session reflection"
                            rows={6}
                            value={draft}
                            placeholder="What happened in the session? Note per-student attendance and engagement from the context panel…"
                            onChange={(e) => onDraftChange(e.target.value)}
                            disabled={session.reflectionStatus === 'submitted'}
                        />
                        {session.reflectionStatus === 'submitted' ? (
                            <p className="body3-txt" style={{ marginTop: 'var(--size-element-gap-sm)' }}>
                                Submitted reflections are read-only in this prototype.
                            </p>
                        ) : (
                            <div className="ti3-form-actions">
                                <Button text="Save draft" style="secondary" fill="outline" size="small" />
                                <Button text="Submit reflection" style="primary" fill="filled" size="small" />
                            </div>
                        )}
                    </div>
                }
                paddingSize="md"
                gapSize="md"
            />
        </div>
    );
}

function CenterWorkspace({ session, workspaceTab, onWorkspaceTab, reflectionDraft, onReflectionDraft }) {
    if (!session) {
        return (
            <div className="ti3-empty">
                <i
                    className="fa-solid fa-layer-group"
                    style={{ fontSize: '2rem', color: 'var(--color-on-surface-variant)' }}
                    aria-hidden
                />
                <p className="body1-txt" style={{ margin: 0, maxWidth: '420px' }}>
                    Choose a session from the left rail. The workspace and context panel update together;
                    switching tabs keeps context visible.
                </p>
            </div>
        );
    }

    const overviewBody = (
        <div>
            <div className="ti3-session-meta">
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        School
                    </p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.schoolLabel}
                    </p>
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Location
                    </p>
                    <p className="body1-txt" style={{ margin: 0 }}>
                        {session.roomLabel}
                    </p>
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Status
                    </p>
                    <Badge text={session.statusLabel} style="secondary" size="b2" />
                </div>
            </div>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                {session.contextSummary}
            </p>
            <p className="h6" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>
                Agenda
            </p>
            <ul className="ti3-list-plain body2-txt">
                {session.agenda.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
            <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                Tutors on session
            </p>
            <ul className="ti3-list-plain body2-txt">
                {session.tutors.map((t) => (
                    <li key={t.id}>
                        {t.name} — {t.role}
                        {t.isLead ? ' (lead)' : ''}
                    </li>
                ))}
            </ul>
        </div>
    );

    const studentsBody = (
        <div>
            <p className="body2-txt" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                {studentCount(session)} students · {tutorCount(session)} tutors. Roster may change before or
                during session.
            </p>
            {session.students.map((st) => (
                <div key={st.id} className="ti3-student-row">
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {st.name}
                    </p>
                    <p className="body3-txt" style={{ margin: 'var(--size-element-gap-xs) 0' }}>
                        Status: {st.status}
                        {st.notes ? ` · ${st.notes}` : ''}
                    </p>
                </div>
            ))}
            {session.rosterChanges?.length > 0 && (
                <>
                    <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                        Recent roster changes
                    </p>
                    <ul className="ti3-list-plain body2-txt">
                        {session.rosterChanges.map((c) => (
                            <li key={`${c.at}-${c.note}`}>
                                <strong>{c.at}:</strong> {c.note}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                Session notes
            </p>
            <p className="body2-txt" style={{ margin: 0 }}>
                {session.sessionNotes}
            </p>
        </div>
    );

    let tabContent = overviewBody;
    if (workspaceTab === WORKSPACE_TABS.students) tabContent = studentsBody;
    if (workspaceTab === WORKSPACE_TABS.reflection) {
        return (
            <>
                <header className="ti3-workspace__header">
                    <h1 className="h5" style={{ margin: 0 }}>
                        {session.title}
                    </h1>
                    <p className="body2-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0' }}>
                        {session.timeLabel}
                    </p>
                </header>
                <NavTabs
                    activeKey={workspaceTab}
                    onSelect={(k) => k && onWorkspaceTab(k)}
                    className="mb-3"
                >
                    <NavTabs.Item eventKey={WORKSPACE_TABS.overview}>Session Overview</NavTabs.Item>
                    <NavTabs.Item eventKey={WORKSPACE_TABS.students}>Students</NavTabs.Item>
                    <NavTabs.Item eventKey={WORKSPACE_TABS.reflection}>Reflection</NavTabs.Item>
                </NavTabs>
                <ReflectionWorkspace
                    session={session}
                    draft={reflectionDraft}
                    onDraftChange={onReflectionDraft}
                />
            </>
        );
    }

    return (
        <>
            <header className="ti3-workspace__header">
                <h1 className="h5" style={{ margin: 0 }}>
                    {session.title}
                </h1>
                <p className="body2-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0' }}>
                    {session.timeLabel}
                </p>
            </header>
            <NavTabs activeKey={workspaceTab} onSelect={(k) => k && onWorkspaceTab(k)} className="mb-3">
                <NavTabs.Item eventKey={WORKSPACE_TABS.overview}>Session Overview</NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_TABS.students}>Students</NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_TABS.reflection}>Reflection</NavTabs.Item>
            </NavTabs>
            <Card title="Workspace" body={tabContent} paddingSize="md" gapSize="md" />
        </>
    );
}

export default function App() {
    const [activeSessionId, setActiveSessionId] = useState(MOCK_SESSIONS[0]?.id ?? null);
    const [workspaceTab, setWorkspaceTab] = useState(WORKSPACE_TABS.overview);
    const [reflectionDrafts, setReflectionDrafts] = useState(() =>
        Object.fromEntries(
            MOCK_SESSIONS.map((s) => [s.id, s.reflectionDraft ?? ''])
        )
    );

    const activeSession = activeSessionId ? sessionById(activeSessionId) : null;

    const selectSession = useCallback((id) => {
        setActiveSessionId(id);
        setWorkspaceTab(WORKSPACE_TABS.overview);
    }, []);

    const updateReflectionDraft = useCallback((value) => {
        if (!activeSessionId) return;
        setReflectionDrafts((prev) => ({ ...prev, [activeSessionId]: value }));
    }, [activeSessionId]);

    const todaySessions = useMemo(() => sessionsByGroup(SESSION_GROUPS.today), []);
    const upcomingSessions = useMemo(() => sessionsByGroup(SESSION_GROUPS.upcoming), []);
    const historySessions = useMemo(() => sessionsByGroup(SESSION_GROUPS.history), []);

    const accordionItems = useMemo(
        () => [
            {
                eventKey: 'today',
                header: (
                    <span>
                        Today
                        <Badge text={String(todaySessions.length)} style="secondary" size="b3" />
                    </span>
                ),
                body: (
                    <SessionListRows
                        sessions={todaySessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={selectSession}
                    />
                ),
            },
            {
                eventKey: 'upcoming',
                header: (
                    <span>
                        Upcoming
                        <Badge text={String(upcomingSessions.length)} style="secondary" size="b3" />
                    </span>
                ),
                body: (
                    <SessionListRows
                        sessions={upcomingSessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={selectSession}
                    />
                ),
            },
            {
                eventKey: 'history',
                header: (
                    <span>
                        History
                        <Badge text={String(historySessions.length)} style="secondary" size="b3" />
                    </span>
                ),
                body: (
                    <SessionListRows
                        sessions={historySessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={selectSession}
                    />
                ),
            },
        ],
        [activeSessionId, selectSession, todaySessions, upcomingSessions, historySessions]
    );

    return (
        <div className="ti3-shell plus-app-shell">
            <div className="ti3-nav-column">
                <Sidebar
                    user="tutor"
                    activeTabId="sessions"
                    onHomeClick={() => {}}
                    onTabClick={() => {}}
                />
            </div>

            <aside className="ti3-session-rail" aria-label="Sessions by time">
                <p className="h6 ti3-session-rail__title">Sessions</p>
                <Accordion
                    id="ti3-sessions-accordion"
                    className="ti3-sessions-nav"
                    flush
                    alwaysOpen
                    defaultActiveKey={['today', 'upcoming', 'history']}
                    items={accordionItems}
                />
            </aside>

            <main className="ti3-workspace">
                <CenterWorkspace
                    session={activeSession}
                    workspaceTab={workspaceTab}
                    onWorkspaceTab={setWorkspaceTab}
                    reflectionDraft={activeSessionId ? reflectionDrafts[activeSessionId] ?? '' : ''}
                    onReflectionDraft={updateReflectionDraft}
                />
            </main>

            <PersistentContextPanel session={activeSession} />
        </div>
    );
}
