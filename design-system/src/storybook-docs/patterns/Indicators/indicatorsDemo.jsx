import React, { useState } from 'react';

import {
    Breadcrumb,
    Button,
    ChangeTag,
    CountTag,
    DynamicTable,
    Heading,
    Icon,
    IconButton,
    ProgressBar,
    Sidebar,
    StatusTag,
} from '@/components';
import { Frame, PatternCard, PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';

/**
 * The Indicators pattern's examples: the three tags in the places they sit,
 * each a real component with the state its heading names set through props,
 * and the Checklist key case in its three layouts (card on Home, card in a
 * page, compact at the foot of the sidebar).
 *
 *   Tags                Status, Count and Change, side by side
 *   InARow              one Status tag per table row, at the default spacing
 *   BesideTitle         a spacious Status tag after a page title
 *   OnNavigation        counts on items: quiet, bold, nothing at zero, a cap
 *   NotColorOnly        an icon joined to the color on a status told apart at a glance
 *   UpIsBad             a rise that is bad, in danger
 *   RollUp              a group showing the worst state among its children
 *   ChecklistCard       PatternCard checklist with aligned progress and 128 action column
 *   ChecklistOnHome     dismissible checklist card in a Home PatternSection
 *   ChecklistInPage     persistent checklist card in a page PatternSection (no X)
 *   ChecklistInSidebar  compact checklist at the foot of the Sidebar that opens the full list
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 640; // docs-literal

/** The width the narrow pictures lay out at, in px: docs geometry. */
export const NARROW = 320; // docs-literal

/** The width the roll-up picture lays out at, in px: docs geometry. */
export const ROLL_UP_STAGE = 480; // docs-literal

/** The width the framed sidebar checklist lays out at so the Sidebar docks inside BrowserWindow's border, in px: docs geometry. */
export const CHECKLIST_FRAME_STAGE = 1080; // docs-literal

/** Window height for the framed sidebar checklist, in px: docs geometry. */
export const CHECKLIST_WINDOW_HEIGHT = 540; // docs-literal

/** How long a completed dismissible checklist stays as a one-line summary before disappearing (24h). */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const frame = { padding: 'var(--page-pad)' };
const line = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', flexWrap: 'wrap' };
const text = { font: 'var(--body-default)', color: 'var(--ds-text)' };
const subtle = { font: 'var(--body-default)', color: 'var(--ds-text-subtle)' };

/** The six appearances, each with its fixed meaning. */
export const STATUSES = [
    ['neutral', 'Not started'],
    ['info', 'In progress'],
    ['success', 'Completed'],
    ['warning', 'Needs review'],
    ['danger', 'Missed'],
    ['discovery', 'New'],
];

/** The three tags, one job each: a state, how many, how much it moved. */
export const Tags = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
        <div style={line}>
            <span style={subtle}>State</span>
            {STATUSES.map(([appearance, label]) => <StatusTag key={appearance} appearance={appearance}>{label}</StatusTag>)}
        </div>
        <div style={line}>
            <span style={subtle}>How many</span>
            <CountTag value={4} label="4 unread" />
            <CountTag value={12} isBold label="12 to review" />
            <CountTag value={120} label="99 or more" />
        </div>
        <div style={line}>
            <span style={subtle}>How much it moved</span>
            <ChangeTag value={3} goodDirection="up" comparison="vs last week" />
            <ChangeTag value={-12} format="percent" goodDirection="down" comparison="vs last month" />
            <ChangeTag value={2} goodDirection="none" comparison="vs last week" />
        </div>
    </div>
);

const SESSIONS = [
    ['Thursday, 4:00 PM', 'Ana Ruiz', 'info', 'Scheduled'],
    ['Wednesday, 3:30 PM', 'Marcus Lee', 'warning', 'Needs review'],
    ['Tuesday, 4:00 PM', 'Sofia Ramirez', 'danger', 'Missed'],
    ['Monday, 4:00 PM', 'Jordan Patel', 'success', 'Completed'],
];

/** One Status tag per row, a word or two, at the default spacing. */
export const InARow = () => (
    <div style={frame}>
        <DynamicTable
            label="Sessions"
            isFixedSize
            head={{ cells: [{ key: 'when', content: 'Session' }, { key: 'who', content: 'Student' }, { key: 'status', content: 'Status' }] }}
            rows={SESSIONS.map(([when, who, appearance, status]) => ({
                key: when,
                cells: [
                    { key: `${when}-w`, content: when },
                    { key: `${when}-s`, content: who },
                    { key: `${when}-t`, content: <StatusTag appearance={appearance}>{status}</StatusTag> },
                ],
            }))}
        />
    </div>
);

/** A spacious Status tag after the page title. */
export const BesideTitle = () => (
    <div style={{ ...frame, ...line }}>
        <Heading size="large">Session with Ana Ruiz</Heading>
        <StatusTag appearance="warning" spacing="spacious">Needs review</StatusTag>
    </div>
);

/** An item's count: quiet by default, bold when it asks for action now, nothing at zero, a cap past max. */
export const OnNavigation = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-md)' }}>
        {[
            ['Inbox', <CountTag key="a" value={3} label="3 unread" />],
            ['Reflections', <CountTag key="b" value={5} isBold label="5 reflections to write" />],
            ['Archive', <CountTag key="c" value={0} label="No items" />],
            ['Messages', <CountTag key="d" value={120} label="99 or more messages" />],
        ].map(([name, count]) => (
            <div key={name} data-nav-item={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={text}>{name}</span>
                {count}
            </div>
        ))}
    </div>
);

/** A status told apart at a glance: the color is joined by a leading icon. */
export const NotColorOnly = ({ icon = true }) => (
    <div style={{ ...frame, ...line }}>
        <StatusTag appearance="danger" iconBefore={icon ? 'circle-exclamation' : undefined}>Missed</StatusTag>
        <StatusTag appearance="success" iconBefore={icon ? 'circle-check' : undefined}>Completed</StatusTag>
    </div>
);

/** Absences rose by 3: up, and in danger, because the good direction is down. */
export const UpIsBad = ({ goodDirection = 'down' }) => (
    <div style={{ ...frame, ...line }}>
        <span style={text}>Absences</span>
        <ChangeTag value={3} goodDirection={goodDirection} comparison="vs last week" />
    </div>
);

/** A group shows the worst state among its children: danger over warning over information. */
export const RollUp = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
        <div style={{ ...line, justifyContent: 'space-between' }}>
            <span style={{ ...text, font: 'var(--heading-xsmall)' }}>Group: Fractions</span>
            <StatusTag appearance="danger">Missed</StatusTag>
        </div>
        {SESSIONS.slice(0, 3).map(([when, , appearance, status]) => (
            <div key={when} style={{ ...line, justifyContent: 'space-between', paddingInlineStart: 'var(--inline-lg)' }}>
                <span style={subtle}>{when}</span>
                <StatusTag appearance={appearance}>{status}</StatusTag>
            </div>
        ))}
    </div>
);

/* --------------------------------------------------------------- checklist */

export const HOME_CHECKLIST_STEPS = [
    { id: 'calendar', title: 'Connect your calendar', fact: 'Google Calendar · 2 min', action: 'Connect', done: false },
    { id: 'email', title: 'Verify school email', fact: 'a.ruiz@state.edu', action: 'Verify email', done: true },
    { id: 'background', title: 'Upload background check', fact: 'PDF or photo · renewed yearly', action: 'Upload file', done: false },
    { id: 'subjects', title: 'Choose tutoring subjects', fact: 'Grades 6–8 · Algebra', action: 'Choose subjects', done: true },
    { id: 'safeguarding', title: 'Complete safeguarding check-in', fact: '10 min module', action: 'Start check-in', done: false },
];

export const PAGE_CHECKLIST_STEPS = [
    { id: 'ferpa', title: 'Complete student privacy module', fact: 'Required annually · 15 min', action: 'Start module', done: false },
    { id: 'conduct', title: 'Sign tutor code of conduct', fact: 'Signed Oct 12', action: 'Review', done: true },
    { id: 'mandated', title: 'Pass mandated reporter quiz', fact: '8 questions · 80% to pass', action: 'Take quiz', done: false },
    { id: 'identity', title: 'Confirm government ID', fact: 'Verified Oct 10', action: 'Confirm', done: true },
    { id: 'recording', title: 'Acknowledge recording policy', fact: '2 min read', action: 'Acknowledge', done: false },
];

/** Open steps keep their relative order on top; done steps sit below them. */
export const orderChecklistSteps = (list) => [
    ...list.filter((step) => !step.done),
    ...list.filter((step) => step.done),
];

const completeInList = (list, id) => {
    const target = list.find((step) => step.id === id);
    if (!target || target.done) return list;
    const rest = list.filter((step) => step.id !== id);
    return [
        ...rest.filter((step) => !step.done),
        ...rest.filter((step) => step.done),
        { ...target, done: true },
    ];
};

/**
 * Checklist card built from PatternCard: title at the start, count and
 * ProgressBar aligned to the 128 action column (96 when the 32 dismiss
 * IconButton takes the end), open steps on top with full-width buttons, and
 * done steps below with centered "Completed" text.
 */
export const ChecklistCard = ({
    title = 'Get ready for your first session',
    defaultSteps = HOME_CHECKLIST_STEPS,
    steps: controlledSteps,
    onCompleteStep,
    dismissible = false,
    onDismiss,
    completedAt: controlledCompletedAt,
    now,
}) => {
    const initialList = controlledSteps ?? defaultSteps;
    const [internalSteps, setInternalSteps] = useState(() => orderChecklistSteps(defaultSteps));
    const [dismissed, setDismissed] = useState(false);
    const [internalCompletedAt, setInternalCompletedAt] = useState(() =>
        initialList.length > 0 && initialList.every((step) => step.done) ? (now ?? Date.now()) : null
    );

    const steps = controlledSteps ? orderChecklistSteps(controlledSteps) : internalSteps;
    const totalCount = steps.length;
    const doneCount = steps.filter((step) => step.done).length;
    const allDone = totalCount > 0 && doneCount === totalCount;
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const completedAt = controlledCompletedAt !== undefined ? controlledCompletedAt : internalCompletedAt;
    const currentNow = now ?? Date.now();

    if (dismissed) return null;
    if (dismissible && allDone && completedAt !== null && currentNow - completedAt >= ONE_DAY_MS) {
        return null;
    }

    const handleDismiss = (event) => {
        setDismissed(true);
        onDismiss?.(event);
    };

    const handleComplete = (id) => {
        const next = completeInList(steps, id);
        if (!controlledSteps) setInternalSteps(next);
        if (next.length > 0 && next.every((step) => step.done) && completedAt === null) {
            setInternalCompletedAt(now ?? Date.now());
        }
        onCompleteStep?.(id, next);
    };

    if (dismissible && allDone) {
        return (
            <PatternCard padding="sm" data-checklist-completed-banner="">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--card-inline-md)',
                    }}
                >
                    <Icon name="circle-check" iconStyle="solid" size={16} color="success" />
                    <span
                        style={{
                            flex: '1 1 auto',
                            minInlineSize: 0,
                            font: 'var(--body-default)',
                            color: 'var(--ds-text)',
                        }}
                    >
                        {`${title} · All ${totalCount} steps completed`}
                    </span>
                    <IconButton
                        icon="xmark"
                        appearance="subtle"
                        spacing="compact"
                        label="Dismiss checklist"
                        onClick={handleDismiss}
                    />
                </div>
            </PatternCard>
        );
    }

    const headerActions = (
        <>
            <span
                className="body-small"
                data-checklist-count=""
                style={{
                    color: 'var(--ds-text-subtle)',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                }}
            >
                {`${doneCount} of ${totalCount} done`}
            </span>
            <div
                data-checklist-header-end=""
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    inlineSize: 'var(--checklist-action-width)',
                    minInlineSize: 'var(--checklist-action-min-width)',
                    flexShrink: 0,
                }}
            >
                <div data-checklist-bar="" style={{ flex: '1 1 auto', minInlineSize: 0 }}>
                    <ProgressBar
                        value={percent}
                        appearance={allDone ? 'success' : 'default'}
                        ariaLabel={`${title}: ${doneCount} of ${totalCount} done`}
                    />
                </div>
                {dismissible && (
                    <IconButton
                        icon="xmark"
                        appearance="subtle"
                        label="Dismiss checklist"
                        onClick={handleDismiss}
                    />
                )}
            </div>
        </>
    );

    let openOrder = 0;

    return (
        <PatternCard title={title} actions={headerActions}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {steps.map((step, index) => {
                    const isFirstOpen = !step.done && openOrder === 0;
                    if (!step.done) openOrder += 1;
                    return (
                        <div
                            key={step.id}
                            data-checklist-step={step.title}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--card-inline-lg)',
                                paddingBlockStart: index === 0 ? 0 : 'var(--card-stack-md)',
                                paddingBlockEnd: index === steps.length - 1 ? 0 : 'var(--card-stack-md)',
                                borderTop: index === 0 ? 'none' : 'var(--border-default) solid var(--ds-border)',
                            }}
                        >
                            <Icon
                                name={step.done ? 'circle-check' : 'circle'}
                                iconStyle={step.done ? 'solid' : 'regular'}
                                size={16}
                                color={step.done ? 'success' : 'subtlest'}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: '1 1 auto',
                                    gap: 'var(--card-stack-sm)',
                                    minInlineSize: 0,
                                }}
                            >
                                <span
                                    style={{
                                        font: 'var(--body-default)',
                                        color: step.done ? 'var(--ds-text-subtle)' : 'var(--ds-text)',
                                    }}
                                >
                                    {step.title}
                                </span>
                                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                                    {step.fact}
                                </span>
                            </div>
                            <div
                                data-checklist-action=""
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    inlineSize: 'var(--checklist-action-width)',
                                    minInlineSize: 'var(--checklist-action-min-width)',
                                    flexShrink: 0,
                                }}
                            >
                                {step.done ? (
                                    <span
                                        data-checklist-completed=""
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 'var(--inline-sm)',
                                            font: 'var(--body-small)',
                                            color: 'var(--ds-text-subtle)',
                                        }}
                                    >
                                        <Icon name="check" iconStyle="solid" size={12} color="subtle" />
                                        <span>Completed</span>
                                    </span>
                                ) : (
                                    <Button
                                        appearance={isFirstOpen ? 'primary' : 'default'}
                                        spacing="compact"
                                        shouldFitContainer
                                        onClick={() => handleComplete(step.id)}
                                    >
                                        {step.action}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </PatternCard>
    );
};

/**
 * Compact checklist card at the foot of the Sidebar: count, ProgressBar and
 * the next open step; pressing it opens the full list.
 */
export const CompactChecklist = ({
    title = 'First session',
    steps = HOME_CHECKLIST_STEPS,
    onOpen,
}) => {
    const ordered = orderChecklistSteps(steps);
    const totalCount = ordered.length;
    const doneCount = ordered.filter((step) => step.done).length;
    const allDone = totalCount > 0 && doneCount === totalCount;
    const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    const nextStep = ordered.find((step) => !step.done);

    return (
        <PatternCard padding="sm" gap="sm" onClick={onOpen} data-checklist-compact="">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 'var(--card-inline-sm)',
                    }}
                >
                    <span style={{ font: 'var(--body-small)', color: 'var(--ds-text)' }}>{title}</span>
                    <span
                        className="body-small"
                        style={{
                            color: 'var(--ds-text-subtle)',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {`${doneCount} of ${totalCount} done`}
                    </span>
                </div>
                <ProgressBar
                    value={percent}
                    appearance={allDone ? 'success' : 'default'}
                    ariaLabel={`${title}: ${doneCount} of ${totalCount} done`}
                />
                <Button
                    appearance="subtle"
                    spacing="compact"
                    shouldFitContainer
                    iconAfter="angle-right"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen?.(event);
                    }}
                >
                    {nextStep ? nextStep.title : 'All steps completed'}
                </Button>
            </div>
        </PatternCard>
    );
};

/** Layout 1 — Card on Home: optional setup checklist inside a Home PatternSection, dismissible. */
export const ChecklistOnHome = ({ defaultSteps = HOME_CHECKLIST_STEPS, now }) => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--page-stack-md)' }}>
        <PatternSection title="Home" level="page" gap="md">
            <ChecklistCard
                title="Get ready for your first session"
                defaultSteps={defaultSteps}
                dismissible
                now={now}
            />
        </PatternSection>
    </div>
);

/** Layout 2 — Card in a page: required compliance checklist inside a page PatternSection, persistent with no X. */
export const ChecklistInPage = ({ defaultSteps = PAGE_CHECKLIST_STEPS }) => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--page-stack-md)' }}>
        <PatternSection
            title="Required before fall term"
            description="Complete every compliance step to unlock student assignments."
            gap="md"
        >
            <ChecklistCard
                title="Annual safeguarding training"
                defaultSteps={defaultSteps}
                dismissible={false}
            />
        </PatternSection>
    </div>
);

/** Layout 3 — Compact at the foot of the Sidebar: count, bar and next step on any page; pressing opens Home with the full list. */
export const ChecklistInSidebar = ({ defaultSteps = HOME_CHECKLIST_STEPS }) => {
    const [steps, setSteps] = useState(() => orderChecklistSteps(defaultSteps));
    const [activePage, setActivePage] = useState('sessions');
    const [dismissed, setDismissed] = useState(false);

    const isHome = activePage === 'home';
    const breadcrumbs = isHome
        ? [{ text: 'Home' }]
        : [{ text: 'Home', href: '#home' }, { text: 'Sessions' }];

    const sidebarSlot = (
        <div style={{ display: 'flex', flexDirection: 'column', blockSize: '100%', minBlockSize: 0 }}>
            <Sidebar
                user="tutor"
                activeTabId={activePage}
                onHomeClick={() => setActivePage('home')}
                onTabClick={(id) => setActivePage(id)}
                style={{ flex: '1 1 auto', blockSize: 'auto' }}
            />
            {!dismissed && (
                <div
                    data-checklist-sidebar-foot=""
                    style={{
                        paddingInline: 'var(--frame-sidebar-pad)',
                        paddingBlockEnd: 'var(--frame-sidebar-pad)',
                    }}
                >
                    <CompactChecklist
                        title="First session"
                        steps={steps}
                        onOpen={() => setActivePage('home')}
                    />
                </div>
            )}
        </div>
    );

    return (
        <BrowserWindow address={isHome ? 'app.plus.org/home' : 'app.plus.org/sessions'} height={CHECKLIST_WINDOW_HEIGHT}>
            <Frame header={<Breadcrumb items={breadcrumbs} />} sidebar={sidebarSlot}>
                {isHome ? (
                    <PatternSection title="Home" level="page" gap="md">
                        {!dismissed && (
                            <ChecklistCard
                                title="Get ready for your first session"
                                steps={steps}
                                onCompleteStep={(_, next) => setSteps(next)}
                                dismissible
                                onDismiss={() => setDismissed(true)}
                            />
                        )}
                    </PatternSection>
                ) : (
                    <PatternSection
                        title="Sessions"
                        level="page"
                        description="Your scheduled tutoring sessions appear here once onboarding is complete."
                        gap="md"
                    >
                        <PatternCard title="Thursday · 4:00 PM" description="Lincoln Middle · Grade 7 Algebra">
                            <p style={{ margin: 0, ...subtle }}>
                                Finish your setup checklist in the sidebar before joining your first room.
                            </p>
                        </PatternCard>
                    </PatternSection>
                )}
            </Frame>
        </BrowserWindow>
    );
};
