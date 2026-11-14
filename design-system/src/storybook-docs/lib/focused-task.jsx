import React, { useState } from 'react';

import { Button, IconButton, ProgressTracker, Skeleton } from '@/components';
import { Frame } from '@/patterns';
import { StepStage, resolveStepAxis } from '@/lib/navigationMotion';
import { BrowserWindow } from './template-page.jsx';
import { ScreenStage } from './fit-stage.jsx';

/**
 * The focused Frame type, shared by the Frame and Form template pages: one
 * task in the whole window, Close and the task's name above, a step tracker
 * (five or more down the left, four or fewer across the top), the body, and the
 * bottom bar with Cancel at the start and Back and Next at the end.
 */

/** The browser body's height on the docs page: docs geometry, in px. */
export const WINDOW_HEIGHT = 440; // docs-literal
/** The widest the focused window lays out at on a docs page: the docs' stand-in screen. */
const FOCUSED_SCREEN = 1024; // docs-literal
/** The focused type's step rail, 256 wide (320 for long labels): the Section side's width. */
export const STEPS_RAIL = 256; // docs-literal
/** The focused bottom bar's height in the ledger: the 32 button plus 16 of padding, `--space-300`. */
export const BAR_TOKEN = '--space-300';
/** Four or fewer steps run across the top; five or more go down the left. */
export const STEPS_ACROSS_MAX = 4;

/** The Page's reading column, as the Frame caps its header row and content: the bar's actions share its edges. */
const READING_COLUMN = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    inlineSize: '100%',
    maxInlineSize: 'var(--content-max-width-reading)',
    marginInline: 'auto',
};

export const TASK_STEPS = ['Student', 'Schedule', 'Goals', 'Materials', 'Review'];

/** One step list for the focused type: visited steps come back, the rest wait. */
export const stepItems = (labels, at, go) => labels.map((label, i) => ({
    id: label.toLowerCase(),
    label,
    status: i < at ? 'visited' : i === at ? 'current' : 'unvisited',
    ...(i < at ? { onClick: () => go(i) } : {}),
}));

/**
 * The focused type: one task in the whole window. Close leads the title row
 * beside the task's name, there is no Sidebar and no breadcrumb. Five steps or
 * more go down a left side 256 wide; four or fewer run across the top. The bar
 * along the bottom is Cancel at the start, then Back and Next at the end.
 */
export const FocusedTask = ({ count = 5, start = 1, labels: given, title = 'Plan a tutoring term', children }) => {
    const labels = given ?? TASK_STEPS.slice(0, count);
    const [at, setAt] = useState(start);
    const [placement] = useState(() => resolveStepAxis({ maxSteps: labels.length, labels }));
    const down = placement === 'down';
    const last = at === labels.length - 1;
    const tracker = (
        <ProgressTracker
            label="Steps"
            orientation={down ? 'vertical' : 'horizontal'}
            items={stepItems(labels, at, setAt)}
        />
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', blockSize: '100%' }}>
            <Frame
                header={(
                    <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', gap: 'var(--space-100)', minInlineSize: 0 }}>
                        <IconButton appearance="subtle" icon="xmark" label="Close" onClick={() => {}} />
                        <h1 style={{ margin: 0, font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{title}</h1>
                    </div>
                )}
                width="reading"
                style={{ flex: '1 1 auto', minBlockSize: 0 }}
            >
                <div data-probe="steps-layout" data-steps={down ? 'down' : 'across'} style={{ display: 'flex', flexDirection: down ? 'row' : 'column', gap: 'var(--space-200)' }}>
                    <div data-probe="steps" style={down ? { flex: `0 0 ${STEPS_RAIL}px`, inlineSize: STEPS_RAIL } : undefined}>{tracker}</div>
                    <div style={{ flex: '1 1 auto', minInlineSize: 0 }}>
                        <StepStage step={at} axis={placement} maxSteps={labels.length} labels={labels}>
                            {children ?? <Skeleton preset="text" lines={4} />}
                        </StepStage>
                    </div>
                </div>
            </Frame>
            <div
                role="group"
                aria-label="Task actions"
                data-probe="bar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    blockSize: `var(${BAR_TOKEN})`,
                    flex: '0 0 auto',
                    boxSizing: 'border-box',
                    paddingInline: 'var(--page-pad)',
                    background: 'var(--ds-surface)',
                    borderBlockStart: 'var(--border-default) solid var(--ds-border)',
                }}
            >
                {/* The bar's actions sit on the Page's reading column, the same edges as Close, the title and the body. */}
                <div data-probe="bar-column" style={READING_COLUMN}>
                    <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                    <div style={{ display: 'flex', gap: 'var(--stack-md)' }}>
                        <Button text="Back" isDisabled={at === 0} onClick={() => setAt(at - 1)} />
                        <Button text={last ? 'Finish' : 'Next'} appearance="primary" onClick={() => setAt(Math.min(at + 1, labels.length - 1))} />
                    </div>
                </div>
            </div>
        </div>
    );
};

/** The focused type in its window: on a docs page it reflows with the canvas and scales below the Page's floor. */
export const FocusedType = ({ address = 'app.plus.org/terms/new', ...props }) => (
    <ScreenStage width={FOCUSED_SCREEN} fluid>
        <BrowserWindow address={address} height={WINDOW_HEIGHT}>
            <FocusedTask {...props} />
        </BrowserWindow>
    </ScreenStage>
);
