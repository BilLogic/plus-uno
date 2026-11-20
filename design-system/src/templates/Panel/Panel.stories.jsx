import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/components';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { fitsCanvas, leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { FitStage, ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { BAR_TOKEN, WINDOW_HEIGHT } from '@/storybook-docs/lib/multi-step-task.jsx';
import { computedShadow, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { InAppFrame } from '@/storybook-docs/lib/template-demo.jsx';
import { FormInPanel } from '@/storybook-docs/patterns/Forms/formHosts.jsx';
import { DetailsFrame, DetailsPanel, FLOAT_STAGE, GoneFrame, InboxFrame, PanelFrame, SessionsBehind } from './panelDemo.jsx';
import { INBOX_STAGE } from '@/storybook-docs/lib/inbox-demo.jsx';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { PanelActionGroup, PanelBackAction, PanelBody, PanelCloseAction, PanelContainer, PanelDisclaimer, PanelFooter, PanelHeader, PanelMoreAction, PanelProvider, PanelSubheader } from './Panel';

/**
 * Panel: the template page's examples, run in the Storybook tests. They compose
 * the real Frame, Panel parts, Table and EmptyState. Each type asserts the
 * ruling that defines it: a floating Panel sits on the overlay material and shadow,
 * draws no Blanket, and leaves the page reachable.
 *
 * Run: npx vitest run --project=storybook design-system/src/templates/Panel/Panel.stories.jsx
 */
/** These stories read settled layouts, so the Frame's space motion is held off; its own motion stories live in Frame.stories. */
const settledLayout = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

export default {
    decorators: [settledLayout],
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Templates/Panel (Panel.mdx).
    title: 'Templates/Panel/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();

/** The stage under which the Panel cannot dock beside 720 of content, so it floats. */
const sized = (story, width = FLOAT_STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;

const frameParts = (canvasElement) => {
    const frame = canvasElement.querySelector('.plus-frame');
    return {
        frame,
        panel: () => frame.querySelector('.plus-frame__panel'),
        surface: frame.querySelector('.plus-frame__surface'),
        canvas: within(canvasElement),
    };
};

/** A floating Panel: the overlay material and shadow over the page, full height at the right edge, and no Blanket layer anywhere. */
const expectFloating = async (canvasElement) => {
    await expectNotInert(canvasElement);
    await expectFullScale(canvasElement);
    const { frame, panel, surface } = frameParts(canvasElement);
    await waitFor(() => expect(panel(), 'the Panel is open').not.toBeNull());
    const el = panel();
    await expect(getComputedStyle(el).position, 'over the page').toBe('absolute');
    await expect(getComputedStyle(el).backgroundColor, 'the overlay material').toBe(tokenColor(frame, '--ds-surface-material-overlay'));
    await expect(getComputedStyle(el).borderInlineStartColor, 'the material edge').toBe(tokenColor(frame, '--ds-border-material'));
    await expect(getComputedStyle(el).boxShadow, 'the overlay shadow').toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(el).top, 'full height, from the top').toBeCloseTo(rect(frame).top, 0);
    await expect(rect(el).right, 'at the right edge').toBeCloseTo(rect(frame).right, 0);
    await expect(canvasElement.querySelector('.plus-frame__blanket, .plus-modal-blanket'), 'a Panel never has a Blanket').toBeNull();
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
        await userEvent.click(within(panel()).getByRole('button', { name: 'Edit' }));
        await expect(within(panel()).getByRole('button', { name: 'Save' })).toBeInTheDocument();
        await userEvent.click(within(panel()).getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(within(panel()).queryByRole('button', { name: 'Save' })).toBeNull());
    },
};

/** Notifications: the Inbox, a start-side `PanelOverlay` opened from the bell beside the account name: beside the Sidebar, 360 wide, over the page with no Blanket. Escape and an outside press close it and focus returns to the bell. */
export const TypeNotifications = {
    name: 'Type: Notifications',
    render: () => sized(<InboxFrame />, INBOX_STAGE),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        const inbox = canvas.getByRole('complementary', { name: 'Inbox' });
        const sidebar = canvasElement.querySelector('.plus-frame__sidebar');
        await expect(rect(inbox).width, '360 wide (--inbox-width)').toBeCloseTo(tokenLength(canvasElement, '--inbox-width'), 0);
        await expect(rect(inbox).left, 'docked beside the Sidebar, on its end edge').toBeCloseTo(rect(sidebar).right, 0);
        await expect(canvasElement.querySelector('.plus-frame__blanket, .plus-modal-blanket'), 'no Blanket').toBeNull();
        const page = canvasElement.querySelector('.plus-frame__surface');
        await expect(rect(inbox).left < rect(page).right && rect(inbox).right > rect(page).left, 'over the page, not beside it').toBe(true);
        const bell = canvas.getByRole('button', { name: /^Inbox/ });
        await expect(bell, 'the bell is pressed while the Inbox is open').toHaveAttribute('aria-pressed', 'true');

        const p = within(inbox);
        await expect(p.getByRole('tab', { name: /Unread/ })).toBeInTheDocument();
        await expect(p.getByRole('tab', { name: 'All' })).toBeInTheDocument();
        await expect(p.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
        await expect(p.queryByRole('button', { name: /^Show/ }), 'no Show filter').toBeNull();
        await expect(p.queryByRole('button', { name: 'Archive all' }), 'no Archive all').toBeNull();
        await expect(p.getByRole('button', { name: /settings/i }), 'the settings gear stays').toBeInTheDocument();

        // Escape closes it and returns focus to the bell.
        p.getByRole('tab', { name: /Unread/ }).focus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Inbox' })).toBeNull());
        await expect(bell, 'Escape returns focus to the bell').toHaveFocus();

        // A press on the bell opens it again; a press outside closes it and leaves focus where it landed.
        await userEvent.click(bell);
        await expect(canvas.getByRole('complementary', { name: 'Inbox' })).toBeInTheDocument();
        await expect(bell, 'the bell is its own toggle, not an outside press').toHaveAttribute('aria-pressed', 'true');
        await userEvent.click(canvas.getByRole('heading', { name: 'Sessions' }));
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Inbox' })).toBeNull());
        await expect(bell, 'an outside press does not pull focus back').not.toHaveFocus();

        // From the keyboard it opens with no animation, and Close returns focus to the bell.
        bell.focus();
        await userEvent.keyboard('{Enter}');
        const opened = await canvas.findByRole('complementary', { name: 'Inbox' });
        await expect(opened, 'a keyboard open is unanimated').toHaveAttribute('data-instant', 'keyboard');
        await userEvent.click(within(opened).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Inbox' })).toBeNull());
        await expect(bell, 'Close returns focus to the bell').toHaveFocus();
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
        <LiveAnatomy live scrollable width={FLOAT_STAGE} title="Details with its parts numbered" parts={ANATOMY_DETAILS_PARTS}>
            <DetailsFrame />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await markersLevelWithParts(canvasElement, ANATOMY_DETAILS_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_DETAILS_PARTS);
        const { panel } = frameParts(canvasElement);
        await userEvent.click(within(panel()).getByRole('button', { name: 'Edit' }));
        await expect(within(panel()).getByRole('button', { name: 'Save' })).toBeInTheDocument();
        await userEvent.click(within(panel()).getByRole('button', { name: 'Discard' }));
        await waitFor(() => expect(within(panel()).queryByRole('button', { name: 'Save' })).toBeNull());
    },
};

const ANATOMY_INBOX_PARTS = [
    { selector: '.plus-panel-header', label: 'Header', side: 'end', at: 'middle' },
    { selector: '.plus-tabs-list', label: 'Tabs', side: 'end', at: 'middle' },
    { selector: '.plus-panel-body', label: 'Items', side: 'end', at: 'middle' },
];

export const AnatomyNotifications = {
    name: 'Anatomy: Notifications',
    render: () => (
        <LiveAnatomy live scrollable width={INBOX_STAGE} title="Notifications with its parts numbered" parts={ANATOMY_INBOX_PARTS}>
            <InboxFrame />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await markersLevelWithParts(canvasElement, ANATOMY_INBOX_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_INBOX_PARTS);
        const inbox = within(canvasElement).getByRole('complementary', { name: 'Inbox' });
        const p = within(inbox);
        await userEvent.click(p.getByRole('tab', { name: 'All' }));
        await expect(inbox.querySelectorAll('.plus-notification-item')).toHaveLength(4);
        await userEvent.click(p.getByRole('tab', { name: /Unread/ }));
        await expect(inbox.querySelectorAll('.plus-notification-item')).toHaveLength(3);
        await userEvent.click(p.getByRole('button', { name: 'Mark all as read' }));
        await expect(p.getByRole('heading', { name: 'You are all caught up.' })).toBeInTheDocument();
    },
};

/* ------------------------------------------------------------ width story */

/** The stage renders full size at `width` and scrolls horizontally if wider than the docs column: the Panel is always in view. Details is open on Ben Okafor's row. */
const WidthStage = ({ width }) => (
    <ScrollStage width={width} height={WINDOW_HEIGHT} data-probe="stage">
        <InAppFrame height="100%" panel={<DetailsPanel />} panelLabel="Session details" panelStorageKey={null} panelOpen>
            <SessionsBehind />
        </InAppFrame>
    </ScrollStage>
);

/** Lay the stage out at `px`: the Frame measures its own box, so resizing the holder is what a width drag does. */
const setStageWidth = (canvasElement, px) => {
    canvasElement.querySelector('[data-probe="stage"]').style.inlineSize = `${px}px`;
};

const panelMode = (canvasElement, mode) => waitFor(() => expect(
    canvasElement.querySelector('.plus-frame__panel')?.className ?? '',
    `the Panel is ${mode}`,
).toContain(`plus-frame__panel--${mode}`));

const expectNoBlanket = (canvasElement) => expect(
    canvasElement.querySelector('.plus-frame__blanket, .plus-modal-blanket'),
    'no Blanket at any width',
).toBeNull();

/** Docked: an edge line, the Page's own fill and no shadow. */
const expectDocked = async (canvasElement) => {
    await expectNotInert(canvasElement);
    await expectFullScale(canvasElement);
    const { frame, panel } = frameParts(canvasElement);
    await panelMode(canvasElement, 'docked');
    await expect(getComputedStyle(panel()).boxShadow, 'docked: no shadow').toBe('none');
    await expect(parseFloat(getComputedStyle(panel()).borderInlineStartWidth), 'docked: an edge line').toBeGreaterThan(0);
    await expect(getComputedStyle(panel()).position, 'beside the Page, not over it').not.toBe('absolute');
    await expect(frame.querySelector('tbody tr:nth-child(2)').className, 'Ben Okafor\'s row is the picked one').toMatch(/highlighted/);
    await expectNoBlanket(canvasElement);
};

/** Floating: over the Page on the overlay material and shadow. */
const expectOverlay = async (canvasElement) => {
    await expectNotInert(canvasElement);
    await expectFullScale(canvasElement);
    const { frame, panel } = frameParts(canvasElement);
    await panelMode(canvasElement, 'overlay');
    await expect(getComputedStyle(panel()).boxShadow, 'floating: the overlay shadow').toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(getComputedStyle(panel()).backgroundColor, 'floating: the overlay material').toBe(tokenColor(frame, '--ds-surface-material-overlay'));
    await expectNoBlanket(canvasElement);
};

/** Width behavior: Details is open; from 1168 up the Panel docks at an edge line, under it it floats on the overlay pair; never a Blanket. */
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
        await expectNoBlanket(canvasElement);
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

/** At 1000 the Panel floats on the overlay material and shadow, with no Blanket. */
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

/** Editing: the same Panel with the form open and its 4-track footer; Save returns to reading with no footer. */
export const KeyEditing = {
    name: 'Key state: Editing',
    render: () => sized(<DetailsFrame editing />),
    play: async ({ canvasElement }) => {
        await expectFloating(canvasElement);
        const { panel } = frameParts(canvasElement);
        await expect(panel().offsetWidth, 'narrow Panel is 400 wide').toBeCloseTo(FRAME_LAYOUT.panelDefault, 0);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        await expect(rect(footer).height, 'the footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(within(footer).queryByRole('button', { name: 'Cancel' }), 'no Cancel in footers').toBeNull();
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const save = within(footer).getByRole('button', { name: 'Save' });
        await expect(rect(discard).left, 'Discard starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(discard).right, 'Discard ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(save).left, 'Save starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(save).right, 'Save ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await userEvent.click(save);
        await waitFor(() => expect(canvasElement.querySelector('[data-probe="footer"]'), 'reading shows no footer').toBeNull());
    },
};

/** With a form: a short edit of a row, the page still in view, the Panel's own footer under the fields. */
export const KeyWithForm = {
    name: 'Key state: With a form',
    render: () => <FitStage width={1024} scrollable><FormInPanel /></FitStage>, // docs-literal
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const save = within(footer).getByRole('button', { name: 'Save' });
        await expect(rect(footer).height, 'the Panel’s footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(within(footer).queryByRole('button', { name: 'Cancel' }), 'Close in the header dismisses, so no Cancel').toBeNull();
        await expect(rect(discard).left, 'Discard starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(save).right, 'Save ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await expect(canvas.getByText('Sessions'), 'the page stays in view beside the edit').toBeVisible();
        const student = canvas.getByLabelText(/Student/);
        await userEvent.type(student, 'Ana Ruiz');
        await expect(student).toHaveValue('Ana Ruiz');
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

/** Under 1024: too narrow to float beside the table, so the Panel is capped at its narrowest, still with no Blanket. */
export const KeyUnder1024 = {
    name: 'Key state: Under 1024',
    render: () => sized(<PanelFrame label="Session details" panel={<DetailsPanel />} />, FRAME_LAYOUT.dockMin - 124),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const { frame, panel } = frameParts(canvasElement);
        await waitFor(() => expect(panel()).not.toBeNull());
        const narrowest = tokenLength(frame, '--panel-min-width');
        await waitFor(() => expect(panel().offsetWidth, 'capped at its narrowest').toBeCloseTo(narrowest, 0));
        await expect(canvasElement.querySelector('.plus-frame__blanket, .plus-modal-blanket'), 'no Blanket').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------- the parts alone */

/** The parts on their own, outside a Frame: a standalone Panel sits on the page ground at the width it is given. */
const SESSION_NOTE = "Review warm-up problems and practice goals before Thursday's math session.";

/** Full composition: back, title and actions in the header, a subheader, the body, and a footer with its disclaimer. */
export const FullComposition = () => (
    <PanelContainer width="var(--panel-width-default)" id="panel-full">
        <PanelHeader
            backAction={<PanelBackAction />}
            title="Session details"
            actions={<PanelActionGroup><PanelMoreAction /><PanelCloseAction /></PanelActionGroup>}
        />
        <PanelSubheader>Thursday, 4:00 PM</PanelSubheader>
        <PanelBody>{SESSION_NOTE}</PanelBody>
        <PanelFooter>
            <PanelDisclaimer>Changes save automatically.</PanelDisclaimer>
            <Button appearance="primary" text="Done" />
        </PanelFooter>
    </PanelContainer>
);

FullComposition.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-full');
    await expect(getComputedStyle(panel).width, 'opens at the default width').toBe(`${tokenLength(panel, '--panel-width-default')}px`);
    const canvas = within(panel);
    await expect(canvas.getByRole('heading', { name: 'Session details' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'More actions' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Close' })).toBeVisible();
    await expect(canvas.getByText('Thursday, 4:00 PM')).toBeVisible();
    await expect(canvas.getByText('Changes save automatically.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Done' })).toBeVisible();
};

/** The smallest Panel: a header and a body. */
export const MinimalHeaderAndBody = () => (
    <PanelContainer id="panel-minimal">
        <PanelHeader title="Quick notes" />
        <PanelBody>Worked through two-step equations and checked three exit-ticket problems.</PanelBody>
    </PanelContainer>
);

MinimalHeaderAndBody.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-minimal');
    await expect(within(panel).getByRole('heading', { name: 'Quick notes' })).toBeVisible();
    await expect(panel.querySelector('.plus-panel-footer'), 'no footer unless one is given').toBeNull();
    await expect(getComputedStyle(panel).width, 'with no width given, the default').toBe(`${tokenLength(panel, '--panel-width-default')}px`);
};

/** Width from the provider: a Panel with no width of its own takes `PanelProvider`'s, shared by every Panel under it. */
export const WidthFromProvider = () => (
    <PanelProvider defaultWidth="480px" /* demo frame */>
        <PanelContainer id="panel-provider-width">
            <PanelHeader title="Wide Panel" />
            <PanelBody>Session notes and lesson materials follow the PanelProvider width.</PanelBody>
        </PanelContainer>
    </PanelProvider>
);

WidthFromProvider.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-provider-width');
    await expect(getComputedStyle(panel).width).toBe(`${tokenLength(panel, '--width-3000')}px`);
};

const PLAYGROUND_WIDTHS = ['var(--panel-min-width)', 'var(--panel-width-default)', 'var(--panel-max-width)'];

/** Playground: set the width from the table, then change the title and the body. */
export const Playground = {
    args: {
        width: 'var(--panel-width-default)',
        title: 'Session details',
        body: SESSION_NOTE,
    },
    argTypes: {
        width: { control: 'select', options: PLAYGROUND_WIDTHS, description: 'The Panel\'s width: the narrowest, the default or the widest its splitter allows.' },
        title: { control: 'text', table: { disable: true } },
        body: { control: 'text', table: { disable: true } },
    },
    render: ({ width, title, body }) => (
        <PanelContainer width={width} id="panel-playground">
            <PanelHeader title={title} actions={<PanelActionGroup><PanelCloseAction /></PanelActionGroup>} />
            <PanelBody>{body}</PanelBody>
        </PanelContainer>
    ),
    play: async ({ canvasElement, args }) => {
        const panel = canvasElement.querySelector('#panel-playground');
        await expect(getComputedStyle(panel).width).toBe(`${tokenLength(panel, '--panel-width-default')}px`);
        await expect(within(panel).getByRole('heading', { name: args.title })).toBeVisible();
    },
};

/* ------------------------------------------------------------------- states */

const Subject = () => (
    <PanelContainer width="var(--panel-width-default)">
        <PanelHeader title="Session details" actions={<PanelActionGroup><PanelCloseAction /></PanelActionGroup>} />
        <PanelBody>{SESSION_NOTE}</PanelBody>
    </PanelContainer>
);
const root = (canvasElement) => canvasElement.querySelector('.plus-panel');

/** Rest: the Panel at its width, named by its title. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(root(canvasElement)).width).toBe(`${tokenLength(root(canvasElement), '--panel-width-default')}px`);
        await expect(within(canvasElement).getByText('Session details')).toBeVisible();
    },
};

/** Hovered: a Panel has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'panel');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'panel');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'panel');
    },
};
