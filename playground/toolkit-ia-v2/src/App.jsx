import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Button from '@/components/Button/Button';
import NavTabs from '@/components/NavTabs/NavTabs';
import Card from '@/components/Card/Card';
import Badge from '@/components/Badge/Badge';
import {
    HUB_TABS,
    MOCK_SESSIONS,
    sessionById,
    sessionsByGroup,
    statusBadgeStyle,
    reflectionStatusLabel,
    reflectionBadgeStyle,
    readinessBadgeStyle,
    tutorCount,
    studentCount,
    isReflectionIncomplete,
} from './mockData';
import './App.scss';

const WORKSPACE_KEYS = {
    session: 'session',
    roster: 'roster',
    reflection: 'reflection',
};

const VIEW_MODES = {
    hub: 'hub',
    workspace: 'workspace',
};

const OPEN_WORKSPACE = {
    text: 'Open workspace',
    action: 'workspace',
    style: 'primary',
    icon: 'arrow-up-right-from-square',
};

function hubTabSecondaryActions(hubTab) {
    switch (hubTab) {
        case HUB_TABS.today:
            return [
                { text: 'Join session', action: 'join', style: 'secondary', fill: 'outline', icon: 'video' },
                {
                    text: 'Review session context',
                    action: 'session-context',
                    style: 'secondary',
                    fill: 'ghost',
                    icon: 'clipboard-list',
                },
            ];
        case HUB_TABS.upcoming:
            return [
                { text: 'Prep for session', action: 'prep', style: 'secondary', fill: 'outline', icon: 'clipboard-list' },
                {
                    text: 'Review session context',
                    action: 'session-context',
                    style: 'secondary',
                    fill: 'ghost',
                    icon: 'book-open',
                },
            ];
        case HUB_TABS.history:
            return [
                {
                    text: 'Continue reflection',
                    action: 'reflection',
                    style: 'secondary',
                    fill: 'outline',
                    icon: 'pen-to-square',
                },
                { text: 'View session notes', action: 'notes', style: 'secondary', fill: 'ghost', icon: 'note-sticky' },
            ];
        default:
            return [];
    }
}

function reflectionStatusIcon(status) {
    if (status === 'submitted') return <i className="fa-solid fa-circle-check" aria-hidden />;
    if (status === 'in-progress') return <i className="fa-solid fa-pen" aria-hidden />;
    return <i className="fa-regular fa-circle" aria-hidden />;
}

function ReflectionStatusBadge({ status, emphasize }) {
    return (
        <Badge
            text={reflectionStatusLabel(status)}
            style={reflectionBadgeStyle(status)}
            size="b2"
            className={emphasize ? 'ti2-reflection-badge--emphasize' : undefined}
            leadingVisual={reflectionStatusIcon(status)}
        />
    );
}

function SessionHubCard({ session, hubTab, isSelected, onSelect, onAction }) {
    const secondary = hubTabSecondaryActions(hubTab);
    const needsReflection =
        hubTab === HUB_TABS.history && isReflectionIncomplete(session);
    const tutors = tutorCount(session);
    const students = studentCount(session);

    const footer = (
        <div className="ti2-session-card__actions">
            <Button
                text={OPEN_WORKSPACE.text}
                style={OPEN_WORKSPACE.style}
                fill="filled"
                size="small"
                leadingVisual={OPEN_WORKSPACE.icon}
                onClick={(e) => {
                    e.stopPropagation();
                    onAction(session.id, OPEN_WORKSPACE.action);
                }}
            />
            {secondary.map((btn) => (
                <Button
                    key={btn.text}
                    text={btn.text}
                    style={btn.style}
                    fill={btn.fill}
                    size="small"
                    leadingVisual={btn.icon}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction(session.id, btn.action);
                    }}
                />
            ))}
        </div>
    );

    const body = (
        <div className="ti2-session-card__body">
            <div className="ti2-session-card__meta">
                <span className="ti2-session-card__meta-item body2-txt">
                    <i className="fa-solid fa-clock" aria-hidden />
                    {session.timeLabel}
                </span>
                <span className="ti2-session-card__meta-item body2-txt">
                    <i className="fa-solid fa-school" aria-hidden />
                    {session.schoolLabel}
                </span>
                <span className="ti2-session-card__meta-item body2-txt">
                    <i className="fa-solid fa-chalkboard-user" aria-hidden />
                    {tutors} tutor{tutors !== 1 ? 's' : ''}
                </span>
                <span className="ti2-session-card__meta-item body2-txt">
                    <i className="fa-solid fa-users" aria-hidden />
                    {students} student{students !== 1 ? 's' : ''}
                </span>
            </div>
            {session.rosterChanges?.length > 0 && (
                <p className="body3-txt ti2-session-card__roster-note" style={{ margin: 0 }}>
                    <i className="fa-solid fa-arrows-rotate" aria-hidden /> Roster updated (
                    {session.rosterChanges.length} change
                    {session.rosterChanges.length !== 1 ? 's' : ''})
                </p>
            )}
            <p className="body2-txt ti2-session-card__preview" style={{ margin: 0 }}>
                {session.contextSummary}
            </p>
            <div className="ti2-session-card__reflection-row">
                <ReflectionStatusBadge status={session.reflectionStatus} emphasize={needsReflection} />
                {needsReflection && (
                    <span className="body3-txt ti2-session-card__reflection-callout">
                        Complete when schedule allows
                    </span>
                )}
            </div>
            {footer}
        </div>
    );

    return (
        <div
            className={[
                'ti2-session-card',
                isSelected ? 'ti2-session-card--selected' : '',
                needsReflection ? 'ti2-session-card--reflection-incomplete' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(session.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(session.id);
                }
            }}
        >
            {needsReflection && (
                <div className="ti2-session-card__incomplete-banner body3-txt" aria-live="polite">
                    <i className="fa-solid fa-pen-to-square" aria-hidden />
                    Reflection incomplete
                </div>
            )}
            <Card
                title={session.title}
                body={body}
                paddingSize="md"
                gapSize="sm"
                header={
                    <div className="ti2-session-card__header">
                        <Badge text={session.statusLabel} style={statusBadgeStyle(session.status)} size="b2" />
                        <ReflectionStatusBadge
                            status={session.reflectionStatus}
                            emphasize={needsReflection}
                        />
                    </div>
                }
            />
        </div>
    );
}

function ContextPanel({ session, hubTab, onAction }) {
    const secondary = hubTabSecondaryActions(hubTab);
    const nextActions = useMemo(() => [OPEN_WORKSPACE, ...secondary], [hubTab]);

    if (!session) {
        return (
            <aside className="ti2-context-panel ti2-context-panel--empty" aria-label="Session context">
                <p className="h6" style={{ margin: 0 }}>
                    Session context
                </p>
                <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                    Select a session to view attendance, engagement, reflection status, and roster details.
                </p>
            </aside>
        );
    }

    return (
        <aside className="ti2-context-panel" aria-label="Session context">
            <p className="h6" style={{ margin: 0 }}>
                {session.title}
            </p>
            <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                {session.timeLabel} · {session.schoolLabel}
            </p>

            {session.attendance && (
                <section className="ti2-context-panel__section">
                    <p className="body2-txt ti2-context-panel__label">Attendance</p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.attendance.label}
                    </p>
                    {session.attendance.detail && (
                        <p className="body2-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0' }}>
                            {session.attendance.detail}
                        </p>
                    )}
                </section>
            )}

            {session.engagement && (
                <section className="ti2-context-panel__section">
                    <p className="body2-txt ti2-context-panel__label">Engagement</p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.engagement.label}
                    </p>
                    {session.engagement.detail && (
                        <p className="body2-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0' }}>
                            {session.engagement.detail}
                        </p>
                    )}
                </section>
            )}

            <section className="ti2-context-panel__section">
                <p className="body2-txt ti2-context-panel__label">Reflection</p>
                <ReflectionStatusBadge
                    status={session.reflectionStatus}
                    emphasize={isReflectionIncomplete(session)}
                />
                {isReflectionIncomplete(session) && (
                    <p className="body3-txt ti2-context-panel__reflection-note">
                        Tutors often finish reflections after back-to-back sessions. Prioritize when reviewing
                        History.
                    </p>
                )}
                {session.reflectionDraft && (
                    <p className="body3-txt ti2-context-panel__notes">{session.reflectionDraft}</p>
                )}
            </section>

            <section className="ti2-context-panel__section">
                <p className="body2-txt ti2-context-panel__label">Session context</p>
                <p className="body2-txt" style={{ margin: 0 }}>
                    {session.contextSummary}
                </p>
                <p className="body3-txt" style={{ margin: 'var(--size-element-gap-sm) 0 0' }}>
                    {tutorCount(session)} tutor{tutorCount(session) !== 1 ? 's' : ''} ·{' '}
                    {studentCount(session)} student{studentCount(session) !== 1 ? 's' : ''}
                </p>
                <ul className="ti2-list-plain body3-txt ti2-context-panel__roster">
                    {session.tutors.map((t) => (
                        <li key={t.id}>
                            <i className="fa-solid fa-chalkboard-user" aria-hidden /> {t.name}
                            {t.role ? ` (${t.role})` : ''}
                            {t.readiness && (
                                <>
                                    {' '}
                                    ·{' '}
                                    <Badge
                                        text={t.readiness === 'ready' ? 'Ready' : t.readiness === 'needs-prep' ? 'Prep needed' : 'Prep pending'}
                                        style={readinessBadgeStyle(t.readiness)}
                                        size="b3"
                                    />
                                </>
                            )}
                        </li>
                    ))}
                    {session.students.map((s) => (
                        <li key={s.id}>
                            <i className="fa-solid fa-user" aria-hidden /> {s.name}
                            {s.status ? ` · ${s.status}` : ''}
                        </li>
                    ))}
                </ul>
                {session.rosterChanges?.length > 0 && (
                    <>
                        <p className="body2-txt ti2-context-panel__label" style={{ marginTop: 'var(--size-element-gap-sm)' }}>
                            Roster changes
                        </p>
                        <ul className="ti2-list-plain body3-txt">
                            {session.rosterChanges.map((change) => (
                                <li key={`${change.at}-${change.note}`}>
                                    <span className="font-weight-semibold">{change.at}: </span>
                                    {change.note}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            {session.flags.length > 0 && (
                <section className="ti2-context-panel__section">
                    <p className="body2-txt ti2-context-panel__label">Flags</p>
                    <ul className="ti2-list-plain body2-txt ti2-context-panel__flags">
                        {session.flags.map((flag) => (
                            <li key={flag}>
                                <i className="fa-solid fa-flag" aria-hidden /> {flag}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="ti2-context-panel__section ti2-context-panel__section--actions">
                <p className="body2-txt ti2-context-panel__label">Actions</p>
                <div className="ti2-context-panel__actions">
                    {nextActions.map((action, index) => (
                        <Button
                            key={action.text}
                            text={action.text}
                            style={action.style}
                            fill={index === 0 ? 'filled' : 'outline'}
                            size="small"
                            block
                            leadingVisual={action.icon}
                            onClick={() => onAction(session.id, action.action)}
                        />
                    ))}
                </div>
            </section>
        </aside>
    );
}

function SessionWorkspace({ session, workspaceView, onWorkspaceView, onBack }) {
    const bodySession = (
        <div>
            <div className="ti2-session-meta">
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        When
                    </p>
                    <p className="body1-txt font-weight-semibold" style={{ margin: 0 }}>
                        {session.timeLabel}
                    </p>
                </div>
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
                        Status
                    </p>
                    <Badge text={session.statusLabel} style={statusBadgeStyle(session.status)} size="b2" />
                </div>
                <div>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                        Reflection
                    </p>
                    <ReflectionStatusBadge status={session.reflectionStatus} emphasize={isReflectionIncomplete(session)} />
                </div>
            </div>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                {session.contextSummary}
            </p>
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

    const bodyRoster = (
        <div>
            <p className="h6" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>
                Tutors ({tutorCount(session)})
            </p>
            <ul className="ti2-list-plain body2-txt">
                {session.tutors.map((t) => (
                    <li key={t.id}>
                        {t.name} — {t.role}
                    </li>
                ))}
            </ul>
            <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                Students ({studentCount(session)})
            </p>
            <ul className="ti2-list-plain body2-txt">
                {session.students.map((s) => (
                    <li key={s.id}>
                        {s.name} ({s.status})
                    </li>
                ))}
            </ul>
            {session.rosterChanges?.length > 0 && (
                <>
                    <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                        Roster changes
                    </p>
                    <ul className="ti2-list-plain body2-txt">
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
            {session.priorNotes && (
                <>
                    <p className="h6" style={{ margin: 'var(--size-section-gap-sm) 0 var(--size-element-gap-sm)' }}>
                        Prior notes
                    </p>
                    <p className="body2-txt" style={{ margin: 0 }}>
                        {session.priorNotes}
                    </p>
                </>
            )}
        </div>
    );

    const bodyReflection = (
        <div>
            <ReflectionStatusBadge status={session.reflectionStatus} emphasize={isReflectionIncomplete(session)} />
            {session.reflectionDraft ? (
                <p className="body1-txt" style={{ marginTop: 'var(--size-section-gap-sm)' }}>
                    {session.reflectionDraft}
                </p>
            ) : (
                <div className="ti2-reflection-placeholder body2-txt">
                    Reflection not started. Open when ready after your session block.
                </div>
            )}
        </div>
    );

    let cardBody = bodySession;
    if (workspaceView === WORKSPACE_KEYS.roster) cardBody = bodyRoster;
    if (workspaceView === WORKSPACE_KEYS.reflection) cardBody = bodyReflection;

    return (
        <div className="ti2-workspace-view">
            <div className="ti2-workspace-view__toolbar">
                <Button
                    text="Back to session hub"
                    style="secondary"
                    fill="ghost"
                    size="small"
                    leadingVisual="arrow-left"
                    onClick={onBack}
                />
            </div>
            <NavTabs
                activeKey={workspaceView}
                onSelect={(k) => k && onWorkspaceView(k)}
                className="mb-3"
            >
                <NavTabs.Item eventKey={WORKSPACE_KEYS.session}>Session overview</NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_KEYS.roster}>
                    Roster ({tutorCount(session)} / {studentCount(session)})
                </NavTabs.Item>
                <NavTabs.Item eventKey={WORKSPACE_KEYS.reflection}>Reflection</NavTabs.Item>
            </NavTabs>
            <Card title={session.title} subtitle={session.timeLabel} body={cardBody} paddingSize="md" gapSize="md" />
        </div>
    );
}

function SessionHub({ hubTab, onHubTab, selectedSessionId, onSelectSession, onAction }) {
    const sessions = useMemo(() => sessionsByGroup(hubTab), [hubTab]);
    const incompleteReflectionCount = useMemo(
        () => (hubTab === HUB_TABS.history ? sessions.filter(isReflectionIncomplete).length : 0),
        [hubTab, sessions]
    );

    const tabCounts = useMemo(
        () => ({
            [HUB_TABS.today]: sessionsByGroup(HUB_TABS.today).length,
            [HUB_TABS.upcoming]: sessionsByGroup(HUB_TABS.upcoming).length,
            [HUB_TABS.history]: sessionsByGroup(HUB_TABS.history).length,
        }),
        []
    );

    return (
        <div className="ti2-hub">
            <header className="ti2-hub__header">
                <div>
                    <h1 className="h4" style={{ margin: 0 }}>
                        Sessions
                    </h1>
                    <p className="body2-txt" style={{ margin: 'var(--size-element-gap-xs) 0 0' }}>
                        Session-centric hub — Today, Upcoming, and History with roster and reflection status.
                    </p>
                </div>
            </header>

            {hubTab === HUB_TABS.history && incompleteReflectionCount > 0 && (
                <div className="ti2-hub__reflection-alert body2-txt" role="status">
                    <i className="fa-solid fa-pen-to-square" aria-hidden />
                    {incompleteReflectionCount} session{incompleteReflectionCount !== 1 ? 's' : ''} with incomplete
                    reflections — sorted first for follow-up after back-to-back blocks.
                </div>
            )}

            <NavTabs activeKey={hubTab} onSelect={(k) => k && onHubTab(k)} className="ti2-hub__tabs">
                <NavTabs.Item eventKey={HUB_TABS.today}>
                    Today ({tabCounts[HUB_TABS.today]})
                </NavTabs.Item>
                <NavTabs.Item eventKey={HUB_TABS.upcoming}>
                    Upcoming ({tabCounts[HUB_TABS.upcoming]})
                </NavTabs.Item>
                <NavTabs.Item eventKey={HUB_TABS.history}>
                    History ({tabCounts[HUB_TABS.history]})
                </NavTabs.Item>
            </NavTabs>

            <div className="ti2-hub__list" role="list">
                {sessions.length === 0 && (
                    <div className="ti2-empty">
                        <p className="body1-txt" style={{ margin: 0 }}>
                            No sessions in this time range.
                        </p>
                    </div>
                )}
                {sessions.map((session) => (
                    <SessionHubCard
                        key={session.id}
                        session={session}
                        hubTab={hubTab}
                        isSelected={session.id === selectedSessionId}
                        onSelect={onSelectSession}
                        onAction={onAction}
                    />
                ))}
            </div>
        </div>
    );
}

export default function App() {
    const [hubTab, setHubTab] = useState(HUB_TABS.today);
    const [selectedSessionId, setSelectedSessionId] = useState(MOCK_SESSIONS[0]?.id ?? null);
    const [viewMode, setViewMode] = useState(VIEW_MODES.hub);
    const [workspaceView, setWorkspaceView] = useState(WORKSPACE_KEYS.session);

    const selectedSession = selectedSessionId ? sessionById(selectedSessionId) : null;
    const workspaceSession =
        viewMode === VIEW_MODES.workspace && selectedSessionId ? sessionById(selectedSessionId) : null;

    const selectSession = useCallback((id) => {
        setSelectedSessionId(id);
    }, []);

    const handleCardAction = useCallback((sessionId, action) => {
        setSelectedSessionId(sessionId);
        if (action === 'workspace' || action === 'prep' || action === 'reflection') {
            setViewMode(VIEW_MODES.workspace);
            if (action === 'reflection') {
                setWorkspaceView(WORKSPACE_KEYS.reflection);
            } else if (action === 'prep' || action === 'session-context') {
                setWorkspaceView(WORKSPACE_KEYS.roster);
            } else {
                setWorkspaceView(WORKSPACE_KEYS.session);
            }
            return;
        }
        if (action === 'notes' || action === 'join') {
            setViewMode(VIEW_MODES.workspace);
            setWorkspaceView(action === 'notes' ? WORKSPACE_KEYS.roster : WORKSPACE_KEYS.session);
        }
    }, []);

    const backToHub = useCallback(() => {
        setViewMode(VIEW_MODES.hub);
        setWorkspaceView(WORKSPACE_KEYS.session);
    }, []);

    return (
        <div className="ti2-shell plus-app-shell">
            <div className="ti2-nav-column">
                <Sidebar
                    user="supervisor"
                    activeTabId="admin-sessions"
                    onHomeClick={() => {}}
                    onTabClick={() => {}}
                />
            </div>

            <main className="ti2-main">
                <div className="ti2-main__inner">
                    {viewMode === VIEW_MODES.hub && (
                        <SessionHub
                            hubTab={hubTab}
                            onHubTab={setHubTab}
                            selectedSessionId={selectedSessionId}
                            onSelectSession={selectSession}
                            onAction={handleCardAction}
                        />
                    )}
                    {viewMode === VIEW_MODES.workspace && workspaceSession && (
                        <SessionWorkspace
                            session={workspaceSession}
                            workspaceView={workspaceView}
                            onWorkspaceView={setWorkspaceView}
                            onBack={backToHub}
                        />
                    )}
                    {viewMode === VIEW_MODES.workspace && !workspaceSession && (
                        <div className="ti2-empty">
                            <p className="body1-txt" style={{ margin: 0 }}>
                                Session not found. Return to the hub to select a session.
                            </p>
                            <Button
                                text="Back to session hub"
                                style="secondary"
                                fill="outline"
                                size="small"
                                onClick={backToHub}
                            />
                        </div>
                    )}
                </div>
            </main>

            <ContextPanel session={selectedSession} hubTab={hubTab} onAction={handleCardAction} />
        </div>
    );
}
