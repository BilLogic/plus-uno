import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { Flag, FlagGroup } from '@/components';
import { FLOAT_STAGE, InboxFrame } from '../../../patterns/Panel/panelDemo.jsx';
import { Acknowledge, ModalStage } from '../../../patterns/PatternModal/modalDemo.jsx';
import {
    FlagOnPage,
    FlagStack,
    FlagTopRight,
    FlagUndo,
    FlagWithActions,
    MustStay,
    PLACE_STAGE,
    SeverityRow,
    STAGE,
    TierFrame,
    TierPage,
    TierSection,
} from './notificationsDemo.jsx';

/**
 * Notifications: the pattern page's examples, run in the Storybook tests. Each
 * is drawn in the state its heading names, from initial-state props, and
 * asserts the ruling it shows: a Flag is a passing notice with its title and a
 * next step, a Banner is one line with no dismiss, a SectionMessage that must
 * stay has dismiss off, and the words carry the severity.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Notifications/Notifications.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Notifications (Notifications.mdx).
    title: 'Patterns/Notifications/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

/* ---------------------------------------------------------------- carriers */

/** A Flag: a passing notice at the top right, its title naming the event and one line for the next step. */
export const CarrierFlag = {
    name: 'Carrier: Flag',
    render: () => staged(<FlagTopRight />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Session logged'), 'the title names the event').toBeInTheDocument();
        await expect(canvas.getByText(/supervisor will see it Friday/), 'one line gives the next step').toBeInTheDocument();
        await expect(canvas.getByRole('status'), 'a success Flag is a polite status').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A Banner: one line for a condition, no dismiss. */
export const CarrierBanner = {
    name: 'Carrier: Banner',
    render: () => staged(<TierPage />, STAGE),
    play: async ({ canvasElement }) => {
        const banner = canvasElement.querySelector('.plus-banner');
        await expect(banner, 'a Banner').toBeInTheDocument();
        await expect(within(banner).queryByRole('button'), 'a Banner has no dismiss').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A SectionMessage: something to read or act on that stays until resolved or dismissed. */
export const CarrierSectionMessage = {
    name: 'Carrier: SectionMessage',
    render: () => staged(<MustStay />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('alert'), 'announced when it appears').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** The Inbox: what arrived over time, in the Panel template's Notifications type. */
export const CarrierInbox = {
    name: 'Carrier: The Inbox',
    render: () => staged(<InboxFrame />, FLOAT_STAGE),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-frame__panel'), 'the Inbox Panel').toHaveAccessibleName('Inbox');
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- tiers */

/** The Frame tier: system news across the whole width. */
export const TierFrameStory = {
    name: 'Tier: Frame',
    render: () => staged(<TierFrame />),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelectorAll('.plus-banner'), 'one Banner at a time').toHaveLength(1);
        await fitsCanvas(canvasElement);
    },
};

/** The Page tier: under the page header. */
export const TierPageStory = {
    name: 'Tier: Page',
    render: () => staged(<TierPage />),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelectorAll('.plus-banner'), 'one Banner at a time').toHaveLength(1);
        await fitsCanvas(canvasElement);
    },
};

/** The Section tier: at the top of one collection. */
export const TierSectionStory = {
    name: 'Tier: Section',
    render: () => staged(<TierSection />),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelectorAll('.plus-banner'), 'one Banner at a time').toHaveLength(1);
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------------------- severity */

/** Four statuses, the words first. */
export const Severity = {
    name: 'Severity: four statuses',
    render: () => staged(<SeverityRow />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const title of ['Schedule updated', 'Session logged', 'Notes are due Friday', "Couldn't save your note"]) {
            await expect(canvas.getByRole('heading', { name: title }), 'the title says it in words').toBeInTheDocument();
        }
        await expect(canvasElement.querySelectorAll('.plus-section-message').length, 'four messages').toBe(4);
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** A stack of Flags: newest on top, each its own message. */
export const KeyFlagStack = {
    name: 'Key case: A stack of Flags',
    render: () => staged(<FlagStack />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Note saved')).toBeInTheDocument();
        await expect(canvas.getAllByRole('status'), 'default Flags are polite statuses').toHaveLength(2);
        await expect(canvas.getAllByRole('button', { name: 'Dismiss flag' }), 'each default Flag has its ×').toHaveLength(2);
        await fitsCanvas(canvasElement);
    },
};

/** A Flag with an action: up to two verbs. */
export const KeyFlagWithAction = {
    name: 'Key case: A Flag with an action',
    render: () => staged(<FlagWithActions />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'View sessions' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Undo: a timed Flag, then the plain Flag that replaces it. */
export const KeyFlagUndo = {
    name: 'Key case: Undo with a timer',
    render: () => staged(<FlagUndo />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('.plus-flag-timer')).toHaveLength(1);
        await expect(canvas.getByText('Session restored')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A message that must stay: a SectionMessage with dismiss turned off. */
export const KeyMustStay = {
    name: 'Key case: A message that must stay',
    render: () => staged(<MustStay />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: /dismiss|close/i }), 'dismiss is off').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Something to answer first: a Modal of the Acknowledge type. */
export const KeyAcknowledge = {
    name: 'Key case: Something to answer first',
    render: () => staged(<Acknowledge />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('dialog', { name: 'Your session was moved' }), 'one Modal').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Got it' }), 'the one answer').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** The Flag finds the person at the top right of the page they moved to. */
export const KeyFlagOnPage = {
    name: 'Key case: A Flag on the page',
    render: () => staged(<FlagOnPage />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('Session logged')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- tests */

/** A Flag that dismisses itself on its timer, and one that stays; both from a clean start. */
const Timers = () => {
    const [gone, setGone] = React.useState([]);
    const drop = (id) => () => setGone((g) => [...g, id]);
    return (
        <div>
            <FlagGroup position="top-end" containerPosition="static">
                <Flag appearance="success" title="Saved" delay={50} show={!gone.includes('ok')} onDismiss={drop('ok')} />
                <Flag appearance="error" title="Couldn't save" delay={50} show={!gone.includes('bad')} onDismiss={drop('bad')} />
            </FlagGroup>
        </div>
    );
};

/** Test: routine Flags leave on their own; warning and danger never close themselves. */
export const TestFlagsLeave = {
    name: 'Test: routine Flags leave, danger stays',
    render: () => <Timers />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.queryByText('Saved'), 'the routine Flag left on its own').toBeNull(), { timeout: 3000 });
        await expect(canvas.getByText("Couldn't save"), 'the danger Flag stays').toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: /dismiss/i }), 'a bold Flag has no ×').toBeNull();
    },
};
