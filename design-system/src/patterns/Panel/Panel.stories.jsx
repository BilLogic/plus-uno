import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { fitsCanvas, leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { BAR_TOKEN, WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { computedShadow, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { FRAME_LAYOUT } from '@/patterns/Frame/frameLayout';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { DetailsFrame, DetailsPanel, FLOAT_STAGE, GoneFrame, InboxFrame, PanelFrame, SessionsBehind } from './panelDemo.jsx';

/**
 * Panel: the template page's examples, run in the Storybook tests. They compose
 * the real Frame, Panel parts, Table and EmptyState. Each type asserts the
 * ruling that defines it: a floating Panel sits on the overlay fill and shadow,
 * draws no Backdrop, and leaves the page reachable.
 *
 * Run: npx vitest run --project=storybook design-system/src/patterns/Panel/Panel.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Templates/Panel (Panel.mdx).
    title: 'Templates/Panel/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();

/** The stage under which the Panel cannot dock beside 720 of content, so it floats. */
const sized = (story, width = FLOAT_STAGE) => <FitStage width={width}>{story}</FitStage>;

const frameParts = (canvasElement) => {
    const frame = canvasElement.querySelector('.plus-frame');
    return {
        frame,
        panel: () => frame.querySelector('.plus-frame__panel'),
        surface: frame.querySelector('.plus-frame__surface'),
        canvas: within(canvasElement),
    };
};

/** A floating Panel: the overlay fill and shadow over the page, full height at the right edge, and no Backdrop layer anywhere. */
const expectFloating = async (canvasElement) => {
    const { frame, panel, surface } = frameParts(canvasElement);
    await waitFor(() => expect(panel(), 'the Panel is open').not.toBeNull());
    const el = panel();
    await expect(getComputedStyle(el).position, 'over the page').toBe('absolute');
    await expect(getComputedStyle(el).backgroundColor, 'the overlay fill').toBe(tokenColor(frame, '--ds-surface-overlay'));
    await expect(getComputedStyle(el).boxShadow, 'the overlay shadow').toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(el).top, 'full height, from the top').toBeCloseTo(rect(frame).top, 0);
    await expect(rect(el).right, 'at the right edge').toBeCloseTo(rect(frame).right, 0);
    await expect(canvasElement.querySelector('.plus-frame__backdrop, .plus-pattern-backdrop'), 'a Panel never has a Backdrop').toBeNull();
    // The page under it is not covered by a layer of its own: only the Panel stands over it.
    const hit = document.elementFromPoint(rect(surface).left + 40, rect(surface).top + 40);
    await expect(frame.contains(hit) && !hit.closest('.plus-frame__panel'), 'a point on the page lands on the page').toBe(true);
    await fitsCanvas(canvasElement);
};

/* ------------------------------------------------------------------ types */

/** Details: a quick look at a row, floating over the right of the page. */
export const TypeDetails = {
    name: 'Type: Details',
    render: () => sized(<DetailsFrame />),
    play: async ({ canvasElement }) => {
        await expectFloating(canvasElement);
        const { frame, panel } = frameParts(canvasElement);
        await expect(panel(), 'named for the record').toHaveAccessibleName('Session details');
        const splitter = within(panel()).getByRole('separator', { name: /resize/i });
        await expect(Number(splitter.getAttribute('aria-valuemin')), 'it resizes from no narrower than 320').toBeGreaterThanOrEqual(FRAME_LAYOUT.panelMin);
        await expect(Number(splitter.getAttribute('aria-valuemax')), 'to no wider than 640').toBeLessThanOrEqual(FRAME_LAYOUT.panelMax);
        const row = frame.querySelector('tbody tr:nth-child(2)');
        await expect(row.className, 'the picked row stays highlighted').toMatch(/highlighted/);
    },
};

/** Notifications: the Inbox, drawn in the same right-hand slot until its own left placement is built. */
export const TypeNotifications = {
    name: 'Type: Notifications',
    render: () => sized(<InboxFrame />),
    play: async ({ canvasElement }) => {
        await expectFloating(canvasElement);
        const { panel } = frameParts(canvasElement);
        await expect(panel(), 'named Inbox').toHaveAccessibleName('Inbox');
        const unread = within(panel()).getAllByText('unread');
        await expect(unread.length, 'each unread dot is paired with the word').toBe(canvasElement.querySelectorAll('[data-probe="unread"]').length);
    },
};

/* ---------------------------------------------------------------- anatomy */

const ANATOMY_DETAILS_PARTS = [
    { selector: '.plus-frame__splitter', label: 'Splitter', side: 'top', at: 'start' },
    { selector: '[data-probe="head"]', label: 'Header', side: 'end', at: 'middle' },
    { selector: '[data-probe="body"]', label: 'Body', side: 'end', at: 'middle' },
];

export const AnatomyDetails = {
    name: 'Anatomy: Details',
    render: () => (
        <LiveAnatomy width={FLOAT_STAGE} title="Details with its parts numbered" parts={ANATOMY_DETAILS_PARTS}>
            <DetailsFrame />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_DETAILS_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_DETAILS_PARTS);
    },
};

const ANATOMY_INBOX_PARTS = [
    { selector: '.plus-panel-header', label: 'Header', side: 'end', at: 'middle' },
    { selector: '[data-probe="body"] ul', label: 'Items', side: 'end', at: 'middle' },
];

export const AnatomyNotifications = {
    name: 'Anatomy: Notifications',
    render: () => (
        <LiveAnatomy width={FLOAT_STAGE} title="Notifications with its parts numbered" parts={ANATOMY_INBOX_PARTS}>
            <InboxFrame />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_INBOX_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_INBOX_PARTS);
    },
};

/* ------------------------------------------------------------ width story */

/** The docs canvas is narrower than a desktop Frame, so the stage is laid out at `width` and drawn to fit: the Panel is always in view. Details is open on Ben Okafor's row. */
const WidthStage = ({ width }) => (
    <FitStage width={width}>
        <div data-probe="stage" style={{ inlineSize: '100%', blockSize: WINDOW_HEIGHT }}>
            <InAppFrame height="100%" panel={<DetailsPanel />} panelLabel="Session details" panelStorageKey={null} panelOpen>
                <SessionsBehind />
            </InAppFrame>
        </div>
    </FitStage>
);

/** Lay the stage out at `px`: the Frame measures its own box, so resizing the holder is what a width drag does. */
const setStageWidth = (canvasElement, px) => {
    canvasElement.querySelector('[data-fit-stage] > div').style.inlineSize = `${px}px`;
};

const panelMode = (canvasElement, mode) => waitFor(() => expect(
    canvasElement.querySelector('.plus-frame__panel')?.className ?? '',
    `the Panel is ${mode}`,
).toContain(`plus-frame__panel--${mode}`));

const expectNoBackdrop = (canvasElement) => expect(
    canvasElement.querySelector('.plus-frame__backdrop, .plus-pattern-backdrop'),
    'no Backdrop at any width',
).toBeNull();

/** Docked: an edge line, the Page's own fill and no shadow. */
const expectDocked = async (canvasElement) => {
    const { frame, panel } = frameParts(canvasElement);
    await panelMode(canvasElement, 'docked');
    await expect(getComputedStyle(panel()).boxShadow, 'docked: no shadow').toBe('none');
    await expect(parseFloat(getComputedStyle(panel()).borderInlineStartWidth), 'docked: an edge line').toBeGreaterThan(0);
    await expect(getComputedStyle(panel()).position, 'beside the Page, not over it').not.toBe('absolute');
    await expect(frame.querySelector('tbody tr:nth-child(2)').className, 'Ben Okafor\'s row is the picked one').toMatch(/highlighted/);
    await expectNoBackdrop(canvasElement);
};

/** Floating: over the Page on the overlay fill and shadow. */
const expectOverlay = async (canvasElement) => {
    const { frame, panel } = frameParts(canvasElement);
    await panelMode(canvasElement, 'overlay');
    await expect(getComputedStyle(panel()).boxShadow, 'floating: the overlay shadow').toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(getComputedStyle(panel()).backgroundColor, 'floating: the overlay fill').toBe(tokenColor(frame, '--ds-surface-overlay'));
    await expectNoBackdrop(canvasElement);
};

/** Width behavior: Details is open; from 1168 up the Panel docks at an edge line, under it it floats on the overlay pair; never a Backdrop. */
export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: 1440 },
    parameters: { layout: 'padded', controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 600, max: 1600, step: 8 }, description: 'The Frame\'s own width, in px.', table: { category: 'Docs' } },
    },
    render: WidthStage,
    play: async ({ canvasElement }) => {
        const { frame } = frameParts(canvasElement);
        await expectDocked(canvasElement);

        setStageWidth(canvasElement, FRAME_LAYOUT.contentFloor + FRAME_LAYOUT.panelDefault - 64);
        await expectOverlay(canvasElement);

        setStageWidth(canvasElement, FRAME_LAYOUT.dockMin - 64);
        await panelMode(canvasElement, 'overlay');
        // Read the token once: a probe inside waitFor mutates the DOM, which re-runs waitFor forever.
        const narrowest = tokenLength(frame, '--panel-min-width');
        await waitFor(() => expect(frameParts(canvasElement).panel().offsetWidth, 'under 1024 the Panel is capped at its narrowest').toBeCloseTo(narrowest, 0));
        await expectNoBackdrop(canvasElement);
    },
};

/** At 1440 the Panel is docked: an edge line and no shadow. */
export const WidthDocked = {
    name: 'Width: 1440',
    args: { width: 1440 },
    render: WidthStage,
    play: async ({ canvasElement }) => {
        setStageWidth(canvasElement, 1440); // docs-literal
        await expectDocked(canvasElement);
    },
};

/** At 1000 the Panel floats on the overlay fill and shadow, with no Backdrop. */
export const WidthFloating = {
    name: 'Width: 1000',
    args: { width: 1000 },
    render: WidthStage,
    play: async ({ canvasElement }) => {
        setStageWidth(canvasElement, 1000); // docs-literal
        await expectOverlay(canvasElement);
    },
};

/* ------------------------------------------------------------- key states */

/** Editing: the same Panel with the form open and its full-bleed footer; Save returns to reading with no footer. */
export const KeyEditing = {
    name: 'Key state: Editing',
    render: () => sized(<DetailsFrame editing />),
    play: async ({ canvasElement }) => {
        await expectFloating(canvasElement);
        const { panel } = frameParts(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(rect(footer).height, 'the footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(rect(footer).left, 'full bleed to the start edge').toBeCloseTo(rect(panel()).left + 1, 0);
        const cancel = within(footer).getByRole('button', { name: 'Cancel' });
        const save = within(footer).getByRole('button', { name: 'Save' });
        await expect(rect(cancel).left, 'Cancel (Default) left of Save').toBeLessThan(rect(save).left);
        await userEvent.click(save);
        await waitFor(() => expect(canvasElement.querySelector('[data-probe="footer"]'), 'reading shows no footer').toBeNull());
    },
};

/** Record gone: the row no longer exists, so the body shows its empty state and a way back. */
export const KeyRecordGone = {
    name: 'Key state: Record gone',
    render: () => sized(<GoneFrame />),
    play: async ({ canvasElement }) => {
        await expectFloating(canvasElement);
        const { panel } = frameParts(canvasElement);
        await expect(within(panel()).getByText('This session no longer exists')).toBeVisible();
        await expect(within(panel()).getByRole('button', { name: 'Back to sessions' }), 'a way back').toBeVisible();
    },
};

/** Under 1024: too narrow to float beside the table, so the Panel is capped at its narrowest, still with no Backdrop. */
export const KeyUnder1024 = {
    name: 'Key state: Under 1024',
    render: () => sized(<PanelFrame label="Session details" panel={<DetailsPanel />} />, FRAME_LAYOUT.dockMin - 124),
    play: async ({ canvasElement }) => {
        const { frame, panel } = frameParts(canvasElement);
        await waitFor(() => expect(panel()).not.toBeNull());
        const narrowest = tokenLength(frame, '--panel-min-width');
        await waitFor(() => expect(panel().offsetWidth, 'capped at its narrowest').toBeCloseTo(narrowest, 0));
        await expect(canvasElement.querySelector('.plus-frame__backdrop, .plus-pattern-backdrop'), 'no Backdrop').toBeNull();
        await fitsCanvas(canvasElement);
    },
};
