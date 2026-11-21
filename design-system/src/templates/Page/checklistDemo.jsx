import React, { useState } from 'react';

import { Button, Icon, IconButton, ProgressBar, Sidebar } from '@/components';
import { Frame, Card, Section } from '@/templates';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { typeStyle } from '../../storybook-docs/lib/type-style.js';

/**
 * The checklist: setup or compliance steps in three layouts (a
 * dismissible card on Home, a persistent card in a page, and a compact card at
 * the foot of the Sidebar), each built from Card, Section and ProgressBar.
 *
 *   ChecklistCard       Card checklist with aligned progress and 128 action column
 *   ChecklistOnHome     dismissible checklist card in a Home Section
 *   ChecklistInPage     persistent checklist card in a page Section (no X)
 *   ChecklistInSidebar  compact checklist at the foot of the Sidebar that opens the full list
 */

/** The width the framed sidebar checklist lays out at so the Sidebar docks inside BrowserWindow's border, in px: docs geometry. */
export const CHECKLIST_FRAME_STAGE = 1080; // docs-literal

/** Window height for the framed sidebar checklist, in px: docs geometry. */
export const CHECKLIST_WINDOW_HEIGHT = 540; // docs-literal

/** How long a completed dismissible checklist stays as a one-line summary before disappearing (24h). */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const frame = { padding: 'var(--page-pad)' };
const subtle = { ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' };

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
 * Checklist card built from Card: title at the start, count and
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
            <Card data-checklist-completed-banner="">
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
                            ...typeStyle('body-default'),
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
            </Card>
        );
    }

    const headerActions = (
        <>
            <span
                className="body-sm"
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
        <Card title={title} actions={headerActions}>
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
                                borderTop: index === 0 ? 'none' : 'var(--border-width-default) solid var(--ds-border)',
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
                                        ...typeStyle('body-default'),
                                        color: step.done ? 'var(--ds-text-subtle)' : 'var(--ds-text)',
                                    }}
                                >
                                    {step.title}
                                </span>
                                <span style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' }}>
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
                                            ...typeStyle('body-sm'),
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
        </Card>
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
        <Card gap="sm" onClick={onOpen} data-checklist-compact="">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 'var(--card-inline-sm)',
                    }}
                >
                    <span style={{ ...typeStyle('body-sm'), color: 'var(--ds-text)' }}>{title}</span>
                    <span
                        className="body-sm"
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
                    iconAfter={<Icon name="angle-right" size={12} />}
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen?.(event);
                    }}
                >
                    {nextStep ? nextStep.title : 'All steps completed'}
                </Button>
            </div>
        </Card>
    );
};

/** Layout 1 — Card on Home: optional setup checklist inside a Home Section, dismissible. */
export const ChecklistOnHome = ({ defaultSteps = HOME_CHECKLIST_STEPS, now }) => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--page-stack-md)' }}>
        <Section title="Home" level="page">
            <ChecklistCard
                title="Get ready for your first session"
                defaultSteps={defaultSteps}
                dismissible
                now={now}
            />
        </Section>
    </div>
);

/** Layout 2 — Card in a page: required compliance checklist inside a page Section, persistent with no X. */
export const ChecklistInPage = ({ defaultSteps = PAGE_CHECKLIST_STEPS }) => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--page-stack-md)' }}>
        <Section
            title="Required before fall term"
            description="Complete every compliance step to unlock student assignments."
        >
            <ChecklistCard
                title="Annual safeguarding training"
                defaultSteps={defaultSteps}
                dismissible={false}
            />
        </Section>
    </div>
);

/** Layout 3 — Compact at the foot of the Sidebar: count, bar and next step on any page; pressing opens Home with the full list. */
export const ChecklistInSidebar = ({ defaultSteps = HOME_CHECKLIST_STEPS }) => {
    const [steps, setSteps] = useState(() => orderChecklistSteps(defaultSteps));
    const [activePage, setActivePage] = useState('sessions');
    const [dismissed, setDismissed] = useState(false);

    const isHome = activePage === 'home';

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
            <Frame sidebar={sidebarSlot}>
                {isHome ? (
                    <Section title="Home" level="page">
                        {!dismissed && (
                            <ChecklistCard
                                title="Get ready for your first session"
                                steps={steps}
                                onCompleteStep={(_, next) => setSteps(next)}
                                dismissible
                                onDismiss={() => setDismissed(true)}
                            />
                        )}
                    </Section>
                ) : (
                    <Section
                        title="Sessions"
                        level="page"
                        description="Your scheduled tutoring sessions appear here once onboarding is complete."
                    >
                        <Card title="Thursday · 4:00 PM" description="Lincoln Middle · Grade 7 Algebra">
                            <p style={{ margin: 0, ...subtle }}>
                                Finish your setup checklist in the sidebar before joining your first room.
                            </p>
                        </Card>
                    </Section>
                )}
            </Frame>
        </BrowserWindow>
    );
};
