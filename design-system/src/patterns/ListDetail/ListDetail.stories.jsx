import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, StatusTag } from '@/components';
import { PANEL_STORAGE_KEY, PatternSection, usePanelControl } from '@/patterns';
import ListDetail, { LIST_DETAIL_FLOOR } from '@/patterns/ListDetail';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';

/**
 * List and detail: a Compliance queue with the selected flag beside it. Each
 * width story sets the viewport first, then reads what a person sees: the
 * columns the list and the detail take, whether the Sidebar gave way to the
 * Panel, and what replaces what below 960.
 */

const HEIGHT = 900;
const atViewport = (width, run) => withTestViewport(width, HEIGHT, run);

const FLAGS = [
    { id: 'f1', tutor: 'Maya Chen', reason: 'Session ended early', status: 'Open' },
    { id: 'f2', tutor: 'Jordan Reyes', reason: 'Missing reflection', status: 'Open' },
    { id: 'f3', tutor: 'Priya Nair', reason: 'Late start', status: 'In review' },
    { id: 'f4', tutor: 'Sam Okafor', reason: 'No student check-in', status: 'Open' },
];

const ChatPanel = () => {
    const panel = usePanelControl();
    return (
        <PanelContainer>
            <PanelHeader title="AI chat" actions={<PanelCloseAction onClick={() => panel?.setOpen(false)} />} />
            <PanelBody>Ask about this flag.</PanelBody>
        </PanelContainer>
    );
};

const ComplianceQueue = ({ withPanel = false, ...frameArgs }) => {
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(true);
    const flag = FLAGS[index];
    const select = (i) => { setIndex(i); setOpen(true); };

    const list = (
        <PatternSection title="Compliance queue" description={`${FLAGS.length} flags to review`}>
            <ul className="list-unstyled m-0" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                {FLAGS.map((f, i) => (
                    <li key={f.id}>
                        <Button
                            text={`${f.tutor}: ${f.reason}`}
                            appearance={i === index && open ? 'default' : 'subtle'}
                            isSelected={i === index && open}
                            onClick={() => select(i)}
                        />
                    </li>
                ))}
            </ul>
        </PatternSection>
    );

    return (
        <InAppFrame
            listDetail
            panel={withPanel ? <ChatPanel /> : undefined}
            defaultPanelOpen={withPanel}
            panelStorageKey={null}
            {...frameArgs}
        >
            <ListDetail
                list={list}
                hasSelection={open}
                detail={(
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <StatusTag appearance={flag.status === 'Open' ? 'warning' : 'info'}>{flag.status}</StatusTag>
                        <p className="m-0">{flag.reason}. Review the session notes, then decide.</p>
                    </div>
                )}
                detailTitle={`Flag: ${flag.tutor}`}
                detailDescription={flag.reason}
                detailFooter={<Button text="Open full review" appearance="subtle" iconAfter="arrow-up-right-from-square" onClick={() => {}} />}
                onBack={() => setOpen(false)}
                backLabel="Back to queue"
                onPrevious={() => select(index - 1)}
                onNext={() => select(index + 1)}
                previousDisabled={index === 0}
                nextDisabled={index === FLAGS.length - 1}
            />
        </InAppFrame>
    );
};

export default {
    title: 'Foundations/Patterns/List and detail',
    id: 'foundations-patterns-list-and-detail',
    component: ListDetail,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    beforeEach: () => { window.sessionStorage.removeItem(PANEL_STORAGE_KEY); },
    render: (args) => <ComplianceQueue {...args} />,
    argTypes: {
        list: { table: { disable: true } },
        detail: { table: { disable: true } },
        detailFooter: { table: { disable: true } },
        className: { table: { disable: true } },
    },
};

/* ------------------------------------------------------------- probes */

const rect = (el) => el.getBoundingClientRect();
const probes = (canvasElement) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('.plus-list-detail');
    return {
        canvas,
        root,
        list: () => root.querySelector('.plus-list-detail__list'),
        detail: () => root.querySelector('.plus-list-detail__detail'),
        sidebar: () => canvas.queryByRole('navigation', { name: 'Main' })?.closest('.plus-frame__sidebar') ?? null,
    };
};

/** `n` of the 12 columns across `total` pixels, with the 16 gutters between them. */
const spanWidth = (total, gutter, n) => ((total - 11 * gutter) / 12) * n + (n - 1) * gutter;

const expectSplit = async (p, contentWidth) => {
    const gutter = parseFloat(getComputedStyle(p.root).columnGap);
    const total = rect(p.root).width;
    await expect(total, 'content holds the split floor').toBeGreaterThanOrEqual(LIST_DETAIL_FLOOR);
    await expect(total, 'content is the Frame minus Sidebar, Panel and the 48 pad').toBeCloseTo(contentWidth, 0);
    await expect(rect(p.list()).width, 'list spans 7 columns').toBeCloseTo(spanWidth(total, gutter, 7), 0);
    await expect(rect(p.detail()).width, 'detail spans 5 columns').toBeCloseTo(spanWidth(total, gutter, 5), 0);
    await expect(rect(p.detail()).left - rect(p.list()).right, 'a gutter apart').toBeCloseTo(gutter, 0);
    const section = p.detail().querySelector('section');
    await expect(getComputedStyle(section).backgroundColor, 'the detail has a fill').not.toBe('rgba(0, 0, 0, 0)');
    await expect(p.canvas.queryByRole('button', { name: 'Back to queue' }), 'no back link at the split').toBeNull();
};

/** Overview, with the Panel closed. */
export const Overview = {};

/** The same layout with the Panel open, for the docs page. */
export const WithPanel = { args: { withPanel: true } };

/** 1440, no Panel: content is 1152, so the split holds with the Sidebar docked. */
export const SplitAt1440 = {
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(p.detail(), 'the detail opens beside the list').not.toBeNull());
        await expect(p.sidebar(), 'the Sidebar stays docked').not.toBeNull();
        await expectSplit(p, 1440 - 240 - 48);
        const detail = within(p.detail());
        await expect(detail.getByRole('button', { name: 'Previous' }), 'first flag: no previous').toBeDisabled();
        await userEvent.click(detail.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(within(p.detail()).getByRole('heading', { name: 'Flag: Jordan Reyes' })).toBeInTheDocument());
        await expect(p.list(), 'the list stays while the detail steps').not.toBeNull();
    }),
};

/** 1440 with the 400 Panel open: the Sidebar collapses to keep 960, and the split holds. */
export const SplitHoldsWithPanelAt1440 = {
    args: { withPanel: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(canvasElement.querySelector('.plus-frame__panel'), 'the Panel is open').not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapsed to keep 960').toBeNull());
        await waitFor(() => expect(rect(p.root).width).toBeGreaterThanOrEqual(LIST_DETAIL_FLOOR));
        await expectSplit(p, 1440 - 400 - 48);
        await expect(canvasElement.querySelector('.plus-frame__blanket'), 'the Panel stays docked').toBeNull();
    }),
};

/** 1024: content is 736, under 960, so the detail replaces the list behind a back link. */
export const DetailReplacesListBelow960 = {
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(p.list(), 'the list is replaced').toBeNull());
        await expect(rect(p.root).width, 'content under the floor').toBeLessThan(LIST_DETAIL_FLOOR);
        await expect(rect(p.detail()).width, 'the detail takes the row').toBeCloseTo(rect(p.root).width, 0);
        await userEvent.click(p.canvas.getByRole('button', { name: 'Back to queue' }));
        await waitFor(() => expect(p.list(), 'back to the list').not.toBeNull());
        await expect(p.detail(), 'the detail closes').toBeNull();
        await userEvent.click(p.canvas.getByRole('button', { name: /Maya Chen/ }));
        await waitFor(() => expect(p.list()).toBeNull());
        await expect(p.canvas.getByRole('heading', { name: 'Flag: Maya Chen' })).toBeInTheDocument();
    }),
};
