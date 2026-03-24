/**
 * Session Prep Card — single screen before a session.
 * Shows: last session summary, student's current goal, 2–3 quick prompts, Start session CTA.
 * Uses PageLayout + Card; all data mocked.
 */
import React from 'react';
import PageLayout from '@/specs/Universal/Pages/PageLayout/PageLayout';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

const MOCK = {
    studentName: 'Jordan',
    sessionTime: 'Today, 3:00 PM',
    lastSessionSummary: 'Worked on two-step word problems. Jordan got the first two correct and needed a hint on the third. We ended with a quick recap of “read the question twice” before choosing an operation.',
    currentGoal: 'Solve two-step word problems with 80% accuracy without hints',
    quickPrompts: [
        'Revisit today’s goal at the start of the session',
        'Check in on the “read twice” strategy before practice',
        'Leave 2 min for Jordan to summarize what we did',
    ],
};

const SessionPrepCardPage = () => {
    const handleStartSession = () => {
        alert('Start session — would navigate to session flow.');
    };

    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'My sessions', href: '#' },
                    { text: 'Session prep', active: true },
                ],
                user: { name: 'Alex Tutor', role: 'Tutor' },
            }}
            sidebarConfig={{ activeTabId: 'sessions' }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)',
                    width: '100%',
                    maxWidth: 640,
                }}
            >
                <Card
                    title="Before your session"
                    subtitle={`${MOCK.studentName} · ${MOCK.sessionTime}`}
                    actionButton={{
                        text: 'Start session',
                        onClick: handleStartSession,
                        style: 'primary',
                        fill: 'filled',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-section-gap-md)',
                        }}
                    >
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <h6
                                className="body2-txt"
                                style={{
                                    fontWeight: 'var(--font-weight-body2-semibold)',
                                    color: 'var(--color-on-surface-variant)',
                                    margin: 0,
                                }}
                            >
                                Last session
                            </h6>
                            <p className="body1-txt" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                                {MOCK.lastSessionSummary}
                            </p>
                        </section>

                        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <h6
                                className="body2-txt"
                                style={{
                                    fontWeight: 'var(--font-weight-body2-semibold)',
                                    color: 'var(--color-on-surface-variant)',
                                    margin: 0,
                                }}
                            >
                                Current goal
                            </h6>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
                                <span className="body1-txt" style={{ color: 'var(--color-on-surface)' }}>
                                    {MOCK.currentGoal}
                                </span>
                                <Badge text="Active" style="success" />
                            </div>
                        </section>

                        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <h6
                                className="body2-txt"
                                style={{
                                    fontWeight: 'var(--font-weight-body2-semibold)',
                                    color: 'var(--color-on-surface-variant)',
                                    margin: 0,
                                }}
                            >
                                Quick prompts
                            </h6>
                            <ul
                                className="body1-txt"
                                style={{
                                    margin: 0,
                                    paddingLeft: 'var(--size-element-pad-x-md)',
                                    color: 'var(--color-on-surface)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-xs)',
                                }}
                            >
                                {MOCK.quickPrompts.map((prompt, i) => (
                                    <li key={i}>{prompt}</li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default SessionPrepCardPage;
