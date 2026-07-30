import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import { Card, Badge, Button, Alert, Table, Modal } from '@/components';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import './EarningsCenterPage.scss';

const EARLY_PAYOUT_THRESHOLD = 50;
const PAY_PERIOD_LABEL = 'Jul 1 – Jul 14, 2026';

const SESSIONS = [
    {
        id: 'SES-28471',
        date: 'Jul 12, 2026',
        dateSort: '2026-07-12',
        student: 'Marcus J.',
        duration: '45 min',
        rate: '$28/hr',
        amount: 105.0,
        school: 'PS 234 Lincoln Elementary',
    },
    {
        id: 'SES-28458',
        date: 'Jul 11, 2026',
        dateSort: '2026-07-11',
        student: 'Aisha L.',
        duration: '60 min',
        rate: '$28/hr',
        amount: 110.0,
        school: 'Washington Academy',
    },
    {
        id: 'SES-28442',
        date: 'Jul 10, 2026',
        dateSort: '2026-07-10',
        student: 'Diego R.',
        duration: '30 min',
        rate: '$28/hr',
        amount: 98.5,
        school: 'River Valley HS',
    },
    {
        id: 'SES-28431',
        date: 'Jul 9, 2026',
        dateSort: '2026-07-09',
        student: 'Priya K.',
        duration: '45 min',
        rate: '$28/hr',
        amount: 105.0,
        school: 'Lincoln High',
    },
    {
        id: 'SES-28418',
        date: 'Jul 8, 2026',
        dateSort: '2026-07-08',
        student: 'Marcus J.',
        duration: '60 min',
        rate: '$28/hr',
        amount: 110.0,
        school: 'PS 234 Lincoln Elementary',
    },
    {
        id: 'SES-28405',
        date: 'Jul 7, 2026',
        dateSort: '2026-07-07',
        student: 'Sofia M.',
        duration: '45 min',
        rate: '$28/hr',
        amount: 105.0,
        school: 'Washington Academy',
    },
    {
        id: 'SES-28388',
        date: 'Jul 5, 2026',
        dateSort: '2026-07-05',
        student: 'Aisha L.',
        duration: '30 min',
        rate: '$28/hr',
        amount: 98.5,
        school: 'Washington Academy',
    },
    {
        id: 'SES-28370',
        date: 'Jul 3, 2026',
        dateSort: '2026-07-03',
        student: 'Diego R.',
        duration: '60 min',
        rate: '$28/hr',
        amount: 110.5,
        school: 'River Valley HS',
    },
];

const BELOW_THRESHOLD_SESSIONS = [
    {
        id: 'SES-28471',
        date: 'Jul 12, 2026',
        dateSort: '2026-07-12',
        student: 'Marcus J.',
        duration: '45 min',
        rate: '$28/hr',
        amount: 280.0,
        school: 'PS 234 Lincoln Elementary',
    },
    {
        id: 'SES-28458',
        date: 'Jul 11, 2026',
        dateSort: '2026-07-11',
        student: 'Aisha L.',
        duration: '60 min',
        rate: '$28/hr',
        amount: 240.0,
        school: 'Washington Academy',
    },
];

const SCENARIOS = {
    default: {
        label: 'Current period',
        sessions: SESSIONS,
        paid: 520,
    },
    belowThreshold: {
        label: 'Below $50 threshold',
        sessions: BELOW_THRESHOLD_SESSIONS,
        paid: 488,
    },
    empty: {
        label: 'Empty period',
        sessions: [],
        paid: 0,
    },
};

const SHELL_PROPS = {
    topBarConfig: {
        breadcrumbs: [
            { text: 'Toolkit', href: '#' },
            { text: 'Earnings', href: '#' },
            { text: 'Earnings center' },
        ],
        user: { name: 'Sam Rivera', counter: null, counterValue: null, type: 'tutor' },
    },
    sidebarConfig: {
        user: 'tutor',
        activeTabId: 'earnings',
        onHomeClick: () => {},
        onTabClick: () => {},
    },
    id: 'tutor-earnings-center-shell',
    shellEntered: true,
};

function formatCurrency(value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function SummaryCard({ label, amount, badge }) {
    return (
        <Card paddingSize="lg" gapSize="sm" className="ec-summary-card">
            <p className="body3-txt ec-summary-card__label">{label}</p>
            <p className="h3-txt ec-summary-card__amount">{formatCurrency(amount)}</p>
            <Badge text={badge.text} style={badge.style} size="b3" />
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="ec-empty">
            <div className="ec-empty__icon" aria-hidden="true">
                <i className="fa-solid fa-receipt" />
            </div>
            <h2 className="h5-txt ec-empty__title">No sessions this period</h2>
            <p className="body2-txt ec-empty__body">
                Sessions you complete will appear here once logged.
            </p>
        </div>
    );
}

export default function EarningsCenterPage() {
    const [scenarioKey, setScenarioKey] = useState('default');
    const [sortDirection, setSortDirection] = useState('desc');
    const [expandedId, setExpandedId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);

    const scenario = SCENARIOS[scenarioKey];
    const earned = scenario.sessions.reduce((sum, session) => sum + session.amount, 0);
    const pending = Math.max(earned - scenario.paid, 0);
    const canRequestPayout = pending >= EARLY_PAYOUT_THRESHOLD;

    const summaryBadges = useMemo(() => {
        if (scenario.sessions.length === 0) {
            return {
                earned: { text: 'No activity', style: 'secondary' },
                paid: { text: 'No activity', style: 'secondary' },
                pending: { text: 'No activity', style: 'secondary' },
            };
        }

        return {
            earned: { text: 'On track', style: 'info' },
            paid: { text: 'Processed', style: 'success' },
            pending: { text: 'Awaiting payout', style: 'warning' },
        };
    }, [scenario.sessions.length]);

    const sortedSessions = useMemo(() => {
        const copy = [...scenario.sessions];
        copy.sort((a, b) => {
            const cmp = a.dateSort.localeCompare(b.dateSort);
            return sortDirection === 'asc' ? cmp : -cmp;
        });
        return copy;
    }, [scenario.sessions, sortDirection]);

    const openModal = () => {
        setAcknowledged(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setAcknowledged(false);
    };

    const confirmPayout = () => {
        closeModal();
        setToastVisible(true);
    };

    return (
        <PageLayout {...SHELL_PROPS}>
            <div className="ec">
                {toastVisible && (
                    <Alert
                        style="success"
                        title="Early payout requested"
                        dismissable
                        onDismiss={() => setToastVisible(false)}
                    >
                        We&apos;ll email you when your payout is processed.
                    </Alert>
                )}

                <header className="ec__header">
                    <div>
                        <h1 className="h2-txt ec__title">Earnings center</h1>
                        <p className="body2-txt ec__period">{PAY_PERIOD_LABEL} pay period</p>
                        <p className="body3-txt ec__meta">Payouts process every two weeks on Fridays.</p>
                    </div>

                    <div className="ec__demo" role="group" aria-label="Prototype scenario">
                        <span className="body3-txt ec__demo-label">Demo state</span>
                        <div className="ec__demo-options">
                            {Object.entries(SCENARIOS).map(([key, value]) => (
                                <Button
                                    key={key}
                                    text={value.label}
                                    style={scenarioKey === key ? 'primary' : 'secondary'}
                                    fill={scenarioKey === key ? 'filled' : 'outline'}
                                    size="small"
                                    onClick={() => {
                                        setScenarioKey(key);
                                        setExpandedId(null);
                                        setToastVisible(false);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                <section className="ec__summary" aria-label="Period summary">
                    <SummaryCard label="Total earned" amount={earned} badge={summaryBadges.earned} />
                    <SummaryCard label="Paid" amount={scenario.paid} badge={summaryBadges.paid} />
                    <SummaryCard label="Pending" amount={pending} badge={summaryBadges.pending} />
                </section>

                <section className="ec__breakdown">
                    <div className="ec__breakdown-header">
                        <div>
                            <h2 className="h4-txt ec__section-title">Session breakdown</h2>
                            <p className="body3-txt ec__section-hint">
                                Click a row to expand details. Use the date column to sort.
                            </p>
                        </div>
                    </div>

                    {scenario.sessions.length === 0 ? (
                        <Card paddingSize="lg">
                            <EmptyState />
                        </Card>
                    ) : (
                        <Card paddingSize="lg" gapSize="md">
                            <Table
                                id="earnings-session-table"
                                headers={[
                                    {
                                        text: (
                                            <button
                                                type="button"
                                                className="ec-date-sort ec-date-sort--header"
                                                onClick={() =>
                                                    setSortDirection((prev) =>
                                                        prev === 'asc' ? 'desc' : 'asc',
                                                    )
                                                }
                                            >
                                                Date
                                                <i
                                                    className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'}-short-wide`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        ),
                                    },
                                    'Student',
                                    'Duration',
                                    'Rate',
                                    { text: 'Amount', align: 'right' },
                                ]}
                                rows={sortedSessions.flatMap((session) => {
                                    const baseRow = [
                                        session.date,
                                        session.student,
                                        session.duration,
                                        session.rate,
                                        { content: formatCurrency(session.amount), align: 'right' },
                                    ];

                                    if (expandedId !== session.id) {
                                        return [baseRow];
                                    }

                                    return [
                                        baseRow,
                                        [
                                            {
                                                content: (
                                                    <span className="body3-txt ec-detail">
                                                        Session ID: {session.id} · School:{' '}
                                                        {session.school}
                                                    </span>
                                                ),
                                                colSpan: 5,
                                            },
                                        ],
                                    ];
                                })}
                                onRowClick={(rowIndex) => {
                                    let sessionIndex = 0;
                                    let cursor = 0;

                                    for (let i = 0; i < sortedSessions.length; i += 1) {
                                        if (cursor === rowIndex) {
                                            sessionIndex = i;
                                            break;
                                        }
                                        cursor += 1;
                                        if (expandedId === sortedSessions[i].id) {
                                            if (cursor === rowIndex) return;
                                            cursor += 1;
                                        }
                                    }

                                    const session = sortedSessions[sessionIndex];
                                    if (!session) return;
                                    setExpandedId((prev) =>
                                        prev === session.id ? null : session.id,
                                    );
                                }}
                                hover
                                striped
                            />
                        </Card>
                    )}
                </section>

                <footer className="ec__footer">
                    <div className="ec__footer-copy">
                        {!canRequestPayout && (
                            <p className="body3-txt ec__threshold-note">
                                Early payout requires at least {formatCurrency(EARLY_PAYOUT_THRESHOLD)}{' '}
                                in pending earnings.
                            </p>
                        )}
                    </div>
                    <Button
                        text="Request early payout"
                        style="primary"
                        fill="filled"
                        disabled={!canRequestPayout}
                        onClick={openModal}
                    />
                </footer>
            </div>

            <Modal
                show={showModal}
                onClose={closeModal}
                title="Request early payout?"
                width={480}
                showBottomButtons={false}
                body={
                    <div className="ec-modal">
                        <p className="body1-txt ec-modal__lead">
                            You are requesting an early payout of{' '}
                            <strong>{formatCurrency(pending)}</strong> from your pending balance.
                            Funds typically arrive within 2–3 business days.
                        </p>
                        <Checkbox
                            id="payout-ack"
                            label="I understand this payout is subject to PLUS review."
                            checked={acknowledged}
                            onChange={(event) => setAcknowledged(event.target.checked)}
                        />
                        <div className="ec-modal__actions">
                            <Button
                                text="Cancel"
                                style="secondary"
                                fill="tonal"
                                onClick={closeModal}
                            />
                            <Button
                                text="Confirm request"
                                style="primary"
                                fill="filled"
                                disabled={!acknowledged}
                                onClick={confirmPayout}
                            />
                        </div>
                    </div>
                }
            />
        </PageLayout>
    );
}
