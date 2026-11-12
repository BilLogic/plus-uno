import React, { useState } from 'react';

import { Button, IconButton, ProgressTracker, Skeleton } from '@/components';
import { Frame } from '@/patterns';
import { BrowserWindow } from './template-page.jsx';

/**
 * The focused Frame type, shared by the Frame and Form template pages: one
 * task in the whole window, Close and the task's name above, a step tracker
 * (five or more down the left, four or fewer across the top), the body, and the
 * bottom bar with Cancel at the start and Back and Next at the end.
 */

/** The browser body's height on the docs page: docs geometry, in px. */
export const WINDOW_HEIGHT = 440; // docs-literal
/** The focused type's step rail, 256 wide (320 for long labels): the Section side's width. */
export const STEPS_RAIL = 256; // docs-literal
/** The focused bottom bar's height in the ledger: the 32 button plus 16 of padding, `--space-300`. */
export const BAR_TOKEN = '--space-300';
/** Four or fewer steps run across the top; five or more go down the left. */
export const STEPS_ACROSS_MAX = 4;

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
    const down = labels.length > STEPS_ACROSS_MAX;
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
                        {children ?? <Skeleton preset="text" lines={4} />}
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
                    background: 'var(--ds-surface)',
                    borderBlockStart: 'var(--border-default) solid var(--ds-border)',
                }}
            >
                <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                <div style={{ display: 'flex' }}>
                    <Button text="Back" isDisabled={at === 0} onClick={() => setAt(at - 1)} />
                    <Button text={last ? 'Finish' : 'Next'} appearance="primary" onClick={() => setAt(Math.min(at + 1, labels.length - 1))} />
                </div>
            </div>
        </div>
    );
};

export const FocusedType = ({ address = 'app.plus.org/terms/new', ...props }) => (
    <BrowserWindow address={address} height={WINDOW_HEIGHT}>
        <FocusedTask {...props} />
    </BrowserWindow>
);
