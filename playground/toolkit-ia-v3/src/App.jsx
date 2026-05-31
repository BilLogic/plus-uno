import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Accordion from '@/components/Accordion/Accordion';
import Button from '@/components/Button/Button';
import NavTabs from '@/components/NavTabs/NavTabs';
import Card from '@/components/Card/Card';
import Badge from '@/components/Badge/Badge';
import { MOCK_SESSIONS, sessionById } from './mockData';
import './App.scss';

const WORKSPACE_KEYS = {
    session: 'session',
    student: 'student',
    reflection: 'reflection',
};

function SessionListRows({ sessions, activeSessionId, onSelectSession }) {
    return (
        <div className="ti2-session-list">
            {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                    <div
                        key={s.id}
                        className={`ti2-session-list__row${isActive ? ' ti2-session-list__row--active' : ''}`}
                    >
                        <Button
                            className="ti2-session-list__button"
                            text={s.shortLabel}
                            style="secondary"
                            fill="ghost"
                            size="small"
                            block
                            leadingVisual="calendar-day"
                            onClick={() => onSelectSession(s.id)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function WorkspaceEmpty() {
    return (
        <div className="ti2-empty">
            <i
                className="fa-solid fa-layer-group"
                style={{ fontSize: '2rem', color: 'var(--color-on-surface-variant)' }}
                aria-hidden
            />
            <p className="body1-txt" style={{ margin: 0, maxWidth: '400px' }}>
                Expand Today or Upcoming under Toolkit → Sessions in the sidebar and choose a session. The
                workspace updates immediately.
            </p>
        </div>
    );
}

function SessionWorkspace({ session, workspaceView, onWorkspaceView }) {
    const bodySession = (
        <div>
            <div className="ti2-session-meta">
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Student
                    </p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.studentName}
                    </p>
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Time
                    </p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.timeLabel}
                    </p>
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Course
                    </p>
                    <Badge text={session.course} style="secondary" size="b2" />
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Location
                    </p>
                    <p className="body1-txt" style={{ margin: 0 }}>{session.roomLabel}</p>
                </div>
            </div>
            <p className="h6" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>
                Plan
            </p>
            <ul className="ti2-list-plain body2-txt">
                {session.agenda.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
        </div>
    );

    const bodyStudent = (
        <div>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                {session.studentNotes}
            </p>
            <p className="h6" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>
                Goals (mock)
            </p>
            <ul className="ti2-list-plain body2-txt">
                {session.goals.map((g) => (
                    <li key={g}>{g}</li>
                ))}
            </ul>
        </div>
    );

    const bodyReflection = (
        <div>
            {session.reflectionDraft ? (
                <p className="body1-txt" style={{ margin: 0 }}>
                    {session.reflectionDraft}
                </p>
            ) : (
                <div className="ti2-reflection-placeholder body2-txt">
                    No reflection draft yet for this session. In a full build this area would host the
                    reflection assistant or composer.
                </div>
            )}
        </div>
    );

    let cardBody = bodySession;
    if (workspaceView === WORKSPACE_KEYS.student) cardBody = bodyStudent;
    if (workspaceView === WORKSPACE_KEYS.reflection) cardBody = bodyReflection;

    return (
        <div>
            <NavTabs
                activeKey={workspaceView}
                onSelect={(k) => k && onWorkspaceView(k)}
                className="mb-3"
            >
                <NavTabs.Item eventKey={WORKSPACE_KEYS.session}>
                    Session
                </NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_KEYS.student}>
                    Student
                </NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_KEYS.reflection}>
                    Reflection
                </NavTabs.Item>
            </NavTabs>

            <Card
                title={session.shortLabel}
                subtitle={session.timeLabel}
                body={cardBody}
                paddingSize="md"
                gapSize="md"
            />
        </div>
    );
}

export default function App() {
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [workspaceView, setWorkspaceView] = useState(WORKSPACE_KEYS.session);

    const selectSession = useCallback((id) => {
        setActiveSessionId(id);
        setWorkspaceView(WORKSPACE_KEYS.session);
    }, []);

    const todaySessions = useMemo(() => MOCK_SESSIONS.filter((s) => s.group === 'today'), []);
    const upcomingSessions = useMemo(() => MOCK_SESSIONS.filter((s) => s.group === 'upcoming'), []);

    const accordionItems = useMemo(
        () => [
            {
                eventKey: 'today',
                header: (
                    <span className="ti2-sidebar-sessions-nav__group-label">
                        Today
                        <Badge
                            text={String(todaySessions.length)}
                            style="secondary"
                            size="b3"
                            className="ti2-sidebar-sessions-nav__count"
                        />
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
                header: <span className="ti2-sidebar-sessions-nav__group-label">Upcoming</span>,
                body: (
                    <SessionListRows
                        sessions={upcomingSessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={selectSession}
                    />
                ),
            },
        ],
        [activeSessionId, selectSession, todaySessions, upcomingSessions]
    );

    const workspaceSession = activeSessionId ? sessionById(activeSessionId) : null;

    const sessionsTabBelow = useMemo(
        () => ({
            sessions: (
                <div className="ti2-sidebar-sessions">
                    <Accordion
                        id="ti2-sessions-accordion"
                        className="ti2-sidebar-sessions-nav"
                        flush
                        alwaysOpen
                        defaultActiveKey={['today', 'upcoming']}
                        items={accordionItems}
                    />
                </div>
            ),
        }),
        [accordionItems]
    );

    return (
        <div className="ti2-shell plus-app-shell">
            <div className="ti2-nav-column">
                <Sidebar
                    user="tutor"
                    activeTabId="sessions"
                    onHomeClick={() => {}}
                    onTabClick={() => {}}
                    tabBelowContent={sessionsTabBelow}
                    tabBelowContentStyle={{
                        minWidth: '260px',
                        maxWidth: 'min(320px, 92vw)',
                        paddingLeft: 'var(--size-element-pad-x-sm)',
                        paddingRight: 'var(--size-element-pad-x-xs)',
                    }}
                />
            </div>

            <main className="ti2-main">
                <div className="ti2-workspace">
                    {!workspaceSession && <WorkspaceEmpty />}
                    {workspaceSession && (
                        <SessionWorkspace
                            session={workspaceSession}
                            workspaceView={workspaceView}
                            onWorkspaceView={setWorkspaceView}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
