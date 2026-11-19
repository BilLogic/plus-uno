import React, { useState } from 'react';

import { Button, FooterActions, LinkButton, Sidebar, Skeleton } from '@/components';
import { Frame } from '@/templates';
import { StepStage } from '@/lib/navigationMotion';
import { BrowserWindow } from './template-page.jsx';
import { ScreenStage } from './fit-stage.jsx';

/**
 * The multi-step task, shared by the Frame, Form and Common actions pages: one
 * task in the Frame's inner sidebar. Its steps are the rows (done ones tick and
 * stay pressable; steps past the answers are off), the Page holds the task's
 * name and the step's body, and the footer along the bottom holds Save and exit
 * as a link at the left edge, with Back and Next (Finish on the last step) in
 * tracks 3 and 4, on one 32 line.
 */

/** The browser body's height on the docs page: docs geometry, in px. */
export const WINDOW_HEIGHT = 440; // docs-literal
/** The width the window lays out at on a docs page, wide enough that the Sidebar docks. */
export const TASK_STAGE = 1100; // docs-literal: keeps the Frame at or above 1024 inside the window's border
/** The page footer's height: 48px (--footer-height, one spacious button). */
export const BAR_TOKEN = '--footer-height';

export const TASK_STEPS = ['Student', 'Schedule', 'Goals', 'Materials', 'Review'];

const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

/** One step list for a stepper in a Modal: visited steps come back, the rest wait. */
export const stepItems = (labels, at, go) => labels.map((label, i) => ({
    id: label.toLowerCase(),
    label,
    status: i < at ? 'visited' : i === at ? 'current' : 'unvisited',
    ...(i < at ? { onClick: () => go(i) } : {}),
}));

/** The inner sidebar's rows for a task: done steps tick, steps past the answers are off. */
export const taskRows = (labels, at, furthest) => labels.map((label, i) => ({
    id: label.toLowerCase(),
    text: label,
    done: i < furthest,
    disabled: i > furthest,
    disabledText: 'Answer the steps before it first.',
}));

/**
 * One task in the Frame: the Sidebar's inner mode lists the steps, the Page
 * holds the title and the body, and the footer holds Save and exit with Back
 * and Next. `onSaveAndExit` and `onBack` (the inner sidebar's Back) are called
 * when pressed; nothing here leaves the task.
 */
export const MultiStepTask = ({
    count = 5,
    start = 1,
    labels: given,
    title = 'Plan a tutoring term',
    areaLabel = 'Home',
    onSaveAndExit,
    onLeave,
    children,
}) => {
    const labels = given ?? TASK_STEPS.slice(0, count);
    const [at, setAt] = useState(start);
    const [furthest, setFurthest] = useState(start);
    const last = at === labels.length - 1;
    const go = (index) => {
        setAt(index);
        setFurthest((f) => Math.max(f, index));
    };
    return (
        <div style={{ blockSize: '100%' }}>
            <Frame
                surfaceDirect
                sidebarDocked
                sidebar={(
                    <Sidebar
                        user="tutor"
                        account={ACCOUNT}
                        storageKey={null}
                        activeId={labels[at].toLowerCase()}
                        onSelect={(id) => go(labels.findIndex((label) => label.toLowerCase() === id))}
                        inner={{ areaLabel, rows: taskRows(labels, at, furthest), label: 'Steps' }}
                        onBack={onLeave ?? (() => {})}
                    />
                )}
            >
                <div data-probe="task-page" style={{ display: 'flex', flexDirection: 'column', blockSize: '100%', minBlockSize: 0 }}>
                    <div
                        data-probe="task-body"
                        style={{
                            flex: '1 1 auto',
                            minBlockSize: 0,
                            overflowY: 'auto',
                            padding: 'var(--page-pad)',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div style={{ maxInlineSize: 'var(--content-max-width-reading)', marginInline: 'auto' }}>
                            <h1 style={{ margin: 0, marginBlockEnd: 'var(--stack-md)', font: 'var(--heading-xs)', color: 'var(--ds-text)' }}>{title}</h1>
                            <StepStage step={at} axis="down" maxSteps={labels.length} labels={labels}>
                                {(typeof children === 'function' ? children(at) : children) ?? <Skeleton preset="text" lines={4} />}
                            </StepStage>
                        </div>
                    </div>
                    <div
                        role="group"
                        aria-label="Task actions"
                        data-probe="bar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            blockSize: `var(${BAR_TOKEN})`,
                            flex: '0 0 auto',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            paddingInline: 'var(--page-pad)',
                            background: 'var(--ds-surface)',
                            borderBlockStart: 'var(--border-width-default) solid var(--ds-border)',
                        }}
                    >
                        <FooterActions
                            data-probe="bar-column"
                            style={{ inlineSize: '100%', maxInlineSize: 'var(--content-max-width-reading)', marginInline: 'auto' }}
                            leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="subtle" spacing="default" onClick={(event) => { event.preventDefault(); onSaveAndExit?.(); }} />}
                        >
                            <Button text="Back" spacing="default" isDisabled={at === 0} onClick={() => go(at - 1)} />
                            <Button text={last ? 'Finish' : 'Next'} spacing="default" appearance="primary" onClick={() => go(Math.min(at + 1, labels.length - 1))} />
                        </FooterActions>
                    </div>
                </div>
            </Frame>
        </div>
    );
};

/** The task in its window: on a docs page it reflows with the canvas and scales below the Page's floor (or scrolls horizontally when `scrollable`). */
export const MultiStepTaskType = ({ address = 'app.plus.org/terms/new', scrollable = false, ...props }) => (
    <ScreenStage width={TASK_STAGE} fluid scrollable={scrollable}>
        <BrowserWindow address={address} height={WINDOW_HEIGHT}>
            <MultiStepTask {...props} />
        </BrowserWindow>
    </ScreenStage>
);
