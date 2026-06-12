import React, { useCallback, useMemo, useReducer, useState } from 'react';
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

function tabsReducer(state, action) {
    const { openTabIds, activeSessionId } = state;
    switch (action.type) {
        case 'open': {
            const id = action.id;
            const nextOpen = openTabIds.includes(id) ? openTabIds : [...openTabIds, id];
            return { openTabIds: nextOpen, activeSessionId: id };
        }
        case 'close': {
            const id = action.id;
            const idx = openTabIds.indexOf(id);
            const nextOpen = openTabIds.filter((x) => x !== id);
            let nextActive = activeSessionId;
            if (activeSessionId === id) {
                if (nextOpen.length === 0) nextActive = null;
                else if (idx <= 0) nextActive = nextOpen[0];
                else nextActive = nextOpen[idx - 1];
            }
            return { openTabIds: nextOpen, activeSessionId: nextActive };
        }
        case 'activate':
            return { ...state, activeSessionId: action.id };
        default:
            return state;
    }
}

function SessionListButtons({ sessions, onOpenSession }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
            }}
        >
            {sessions.map((s) => (
                <Button
                    key={s.id}
                    text={s.shortLabel}
                    style="secondary"
                    fill="ghost"
                    size="small"
                    block
                    leadingVisual="calendar-day"
                    onClick={() => onOpenSession(s.id)}
                />
            ))}
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
            <p className="body1-txt" style={{ margin: 0, maxWidth: '360px' }}>
                Open a session from the sidebar to work in a temporary tab. You can keep multiple sessions
                open and switch between them.
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
    const [{ openTabIds, activeSessionId }, dispatchTabs] = useReducer(tabsReducer, {
        openTabIds: [],
        activeSessionId: null,
    });
    const [workspaceView, setWorkspaceView] = useState(WORKSPACE_KEYS.session);

    const openSession = useCallback((id) => {
        dispatchTabs({ type: 'open', id });
        setWorkspaceView(WORKSPACE_KEYS.session);
    }, []);

    const closeTab = useCallback((id) => {
        dispatchTabs({ type: 'close', id });
    }, []);

    const todaySessions = useMemo(() => MOCK_SESSIONS.filter((s) => s.group === 'today'), []);
    const upcomingSessions = useMemo(() => MOCK_SESSIONS.filter((s) => s.group === 'upcoming'), []);

    const accordionItems = useMemo(
        () => [
            {
                eventKey: 'today',
                header: (
                    <span className="body2-txt font-weight-semibold">
                        Today
                        <Badge
                            text={String(todaySessions.length)}
                            style="secondary"
                            size="b3"
                            className="ti2-accordion-count"
                        />
                    </span>
                ),
                body: <SessionListButtons sessions={todaySessions} onOpenSession={openSession} />,
            },
            {
                eventKey: 'upcoming',
                header: <span className="body2-txt font-weight-semibold">Upcoming</span>,
                body: <SessionListButtons sessions={upcomingSessions} onOpenSession={openSession} />,
            },
        ],
        [openSession, todaySessions, upcomingSessions]
    );

    const activeSession = activeSessionId ? sessionById(activeSessionId) : null;

    return (
        <div className="ti2-shell plus-app-shell">
            <Sidebar
                user="tutor"
                activeTabId="sessions"
                onHomeClick={() => {}}
                onTabClick={() => {}}
            />

            <aside className="ti2-sessions-rail" aria-label="Sessions">
                <div className="ti2-sessions-rail__header">
                    <p className="h6" style={{ margin: 0 }}>
                        Sessions
                    </p>
                    <p className="body3-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0', color: 'var(--color-on-surface-variant)' }}>
                        Open sessions as temporary workspace tabs
                    </p>
                </div>
                <div className="ti2-sessions-rail__scroll">
                    <Accordion
                        id="ti2-sessions-accordion"
                        flush
                        alwaysOpen
                        defaultActiveKey={['today', 'upcoming']}
                        items={accordionItems}
                    />
                </div>
            </aside>

            <main className="ti2-main">
                <div className="ti2-tab-strip" role="tablist" aria-label="Open sessions">
                    {openTabIds.map((id) => {
                        const session = sessionById(id);
                        const label = session?.shortLabel ?? id;
                        const isActive = id === activeSessionId;
                        return (
                            <div
                                key={id}
                                className={`ti2-tab${isActive ? ' ti2-tab--active' : ''}`}
                                role="none"
                            >
                                <button
                                    type="button"
                                    className="ti2-tab__main"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => {
                                        dispatchTabs({ type: 'activate', id });
                                        setWorkspaceView(WORKSPACE_KEYS.session);
                                    }}
                                >
                                    {label}
                                </button>
                                <div className="ti2-tab__close">
                                    <Button
                                        type="button"
                                        title="Close tab"
                                        style="secondary"
                                        fill="ghost"
                                        size="small"
                                        leadingVisual="xmark"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeTab(id);
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="ti2-workspace">
                    {!activeSession && <WorkspaceEmpty />}
                    {activeSession && (
                        <SessionWorkspace
                            session={activeSession}
                            workspaceView={workspaceView}
                            onWorkspaceView={setWorkspaceView}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
