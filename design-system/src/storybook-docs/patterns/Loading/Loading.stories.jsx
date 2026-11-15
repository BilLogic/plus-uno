import React from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { MotionPreferenceContext } from '@/lib/motionPreference';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { settleAnimations, withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import {
    BANDS,
    LoadingAction,
    LoadingList,
    LoadingMenu,
    LoadingPage,
    LoadingRevealDemo,
    LoadingTimeline,
    KIND_STAGE,
    STAGE,
    TIMELINE_MAX,
    bandOf,
} from './loadingDemo.jsx';

/**
 * Loading: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Skeleton, Button, DropdownMenu, Flag and ProgressBar, and
 * each asserts the ruling it shows: nothing new under 1 s, a skeleton in the
 * real shape from 1 s, a spinner inside the button that started the action,
 * an explanation past 10 s, and a menu that never takes a skeleton. The timing
 * story walks all four kinds through the bands from a clean start and keeps
 * the motion still under reduced motion.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Loading/Loading.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Loading (Loading.mdx).
    title: 'Patterns/States/Loading/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

/** The picture's shimmer is held explicitly: CI's Chromium reports reduced motion, and a docs picture must read the same everywhere. */
const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;
/** A kind card's story on the Page's pad, as the other patterns' type cards draw theirs. */
const kindCard = (story) => staged(<div style={{ padding: 'var(--page-pad)' }}>{story}</div>, KIND_STAGE);
const rect = (el) => el.getBoundingClientRect();

const bars = (root) => [...root.querySelectorAll('[aria-hidden="true"]')].filter((el) => el.className?.toString().includes('plus-skeleton'));
const busy = (root) => root.querySelector('[aria-busy="true"]');
const status = (canvasElement) => canvasElement.querySelector('[role="status"].visually-hidden');

/* ------------------------------------------------------------------- bands */

/** The bands are 1 s and 10 s, and each wait lands in exactly one of them. */
export const BandsAreOneAndTen = {
    name: 'Bands: 1 s and 10 s',
    tags: ['test-only'],
    render: () => <div />,
    play: async () => {
        await expect(BANDS).toEqual({ shape: 1, explain: 10 });
        await expect(bandOf(0.9)).toBe('under');
        await expect(bandOf(1)).toBe('shape');
        await expect(bandOf(9.9)).toBe('shape');
        await expect(bandOf(10)).toBe('over');
    },
};

/* ------------------------------------------------------------ by what loads */

/** A list or cards: a skeleton in the rows' own shape, the container busy, the label beside it. */
export const KindList = {
    name: 'Kind: A list',
    render: () => kindCard(<LoadingList band="shape" reduced={false} />),
    play: async ({ canvasElement }) => {
        const region = busy(canvasElement);
        await expect(region, 'the loading region is busy').not.toBeNull();
        await expect(bars(region).length, 'text bars in the table\'s shape: three columns, four rows').toBe(12);
        await expect(within(canvasElement).queryByRole('table'), 'no table yet').toBeNull();
        await waitFor(() => expect(status(canvasElement)).toHaveTextContent('Loading students…'));
        await expect(region.contains(status(canvasElement)), 'the label sits beside the busy region, not inside it').toBe(false);
        await fitsCanvas(canvasElement);
    },
};

/** A button action: a spinner inside the button that started it; the fields stay as they are. */
export const KindAction = {
    name: 'Kind: A button action',
    render: () => kindCard(<LoadingAction band="shape" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(save, 'the button that started it is busy').toHaveAttribute('aria-busy', 'true');
        await expect(save.querySelector('.plus-spinner, [class*="spinner"]'), 'with the spinner inside it').not.toBeNull();
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'Cancel stays live').toBeEnabled();
        await fitsCanvas(canvasElement);
    },
};

/** A whole page: the Frame and header draw at once; each Section holds a skeleton. */
export const KindPage = {
    name: 'Kind: A whole page',
    render: () => kindCard(<LoadingPage band="shape" reduced={false} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Roster' }), 'each Section\'s header is drawn').toBeInTheDocument();
        await expect(canvas.getByRole('heading', { name: 'Sessions' })).toBeInTheDocument();
        await expect(canvas.queryByRole('table'), 'the rows are skeleton, not data').toBeNull();
        await expect(bars(canvasElement).length).toBeGreaterThan(0);
        await fitsCanvas(canvasElement);
    },
};

/** A menu: one "Loading options" row, never a skeleton. */
export const KindMenu = {
    name: 'Kind: A menu',
    render: () => staged(<LoadingMenu band="shape" />, KIND_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText('Loading options')).toBeInTheDocument());
        await expect(bars(canvasElement), 'no skeleton on a menu').toHaveLength(0);
        await expect(canvas.queryByRole('menuitem', { name: 'Edit' }), 'the real rows wait').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** Under 1 s: the old rows stay; nothing new appears. */
export const KeyUnderOneSecond = {
    name: 'Key: Under 1 s',
    render: () => staged(<LoadingList band="under" />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('table'), 'the old rows stay').toBeInTheDocument();
        await expect(busy(canvasElement), 'nothing is marked busy yet').toBeNull();
        await expect(bars(canvasElement), 'no skeleton flashes').toHaveLength(0);
        await fitsCanvas(canvasElement);
    },
};

/** Past 10 s: the skeleton stays and a Flag explains the wait. */
export const KeyOverTenSeconds = {
    name: 'Key: Past 10 s, a Flag',
    render: () => staged(<LoadingList band="over" reduced={false} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(bars(canvasElement).length, 'the skeleton stays').toBeGreaterThan(0);
        await waitFor(() => expect(canvas.getByText('Still loading students')).toBeInTheDocument());
        await expect(canvas.getByText(/you can keep working/), 'it says the person can keep working').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A long job: a labeled progress bar that says what is happening and how far along. */
export const KeyLongJob = {
    name: 'Key: A long job',
    render: () => staged(<LoadingPage band="over" reduced={false} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = canvas.getByRole('progressbar', { name: 'Importing roster' });
        await expect(bar).toHaveAttribute('aria-valuenow', '33');
        await expect(canvas.getByText('Importing roster · 40 of 120 students'), 'the words say what and how far').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A menu that could not load: the spinner row becomes "Couldn't load options" with Retry, still one row. */
export const KeyMenuFailed = {
    name: 'Key: A menu that could not load',
    render: () => staged(<LoadingMenu band="over" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText("Couldn't load options")).toBeInTheDocument());
        await expect(canvas.getByRole('menuitem', { name: /Retry/ }), 'Retry is on offer').toBeInTheDocument();
        await expect(canvas.queryByText('Loading options')).toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------------------- timeline */

/** The timing story: pick what is loading and scrub the time; the docs picture opens at 2.5 s. */
export const Timeline = {
    name: 'Across time',
    args: { kind: 'list', seconds: 2.5 },
    parameters: { controls: { include: ['kind', 'seconds'] } },
    argTypes: {
        kind: { control: 'inline-radio', options: ['list', 'action', 'page', 'menu'], description: 'What is loading.', table: { category: 'Docs' } },
        seconds: { control: { type: 'range', min: 0, max: TIMELINE_MAX, step: 0.5 }, description: 'Time so far, in seconds.', table: { category: 'Docs' } },
    },
    render: ({ kind, seconds }) => staged(<LoadingTimeline kind={kind} seconds={seconds} reduced={false} />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('1 to 10 s'), 'it opens in the 1 to 10 s band').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

const setTime = (canvasElement, seconds) => fireEvent.change(within(canvasElement).getByRole('slider', { name: /Time so far/ }), { target: { value: String(seconds) } });

/** From a clean start, every kind reads the bands: under 1 s nothing new, 1 to 10 s its shape, past 10 s its explanation. */
export const TimelineWalksTheBands = {
    name: 'Timeline: walks the bands',
    tags: ['test-only'],
    render: () => staged(<LoadingTimeline kind="list" seconds={0} reduced />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const kind = (name) => userEvent.click(canvas.getByRole('button', { name }));

        // A list: old rows, then a skeleton, then a Flag.
        setTime(canvasElement, 0.5);
        await waitFor(() => expect(canvas.getByRole('table')).toBeInTheDocument());
        await expect(busy(canvasElement)).toBeNull();
        setTime(canvasElement, 2.5);
        await waitFor(() => expect(busy(canvasElement)).not.toBeNull());
        await expect(canvas.queryByRole('table')).toBeNull();
        setTime(canvasElement, 11);
        await waitFor(() => expect(canvas.getByText('Still loading students')).toBeInTheDocument());

        // A button action: the spinner arrives with the band and the button keeps its width.
        await kind('A button action');
        setTime(canvasElement, 0.5);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(save).not.toHaveAttribute('aria-busy');
        const before = rect(save).width;
        setTime(canvasElement, 2.5);
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Save session' })).toHaveAttribute('aria-busy', 'true'));
        await expect(rect(canvas.getByRole('button', { name: 'Save session' })).width, 'the button keeps its width').toBeCloseTo(before, 0);
        setTime(canvasElement, 11);
        await waitFor(() => expect(canvas.getByText('Still saving the session')).toBeInTheDocument());

        // A whole page: previous page, then skeleton Sections, then a labeled bar.
        await kind('A whole page');
        setTime(canvasElement, 0.5);
        await waitFor(() => expect(canvas.getByRole('table')).toBeInTheDocument());
        setTime(canvasElement, 2.5);
        await waitFor(() => expect(canvas.queryByRole('table')).toBeNull());
        setTime(canvasElement, 11);
        await waitFor(() => expect(canvas.getByRole('progressbar', { name: 'Importing roster' })).toBeInTheDocument());

        // A menu: complete, then one loading row, then one failure row with Retry.
        await kind('A menu');
        setTime(canvasElement, 0.5);
        await waitFor(() => expect(canvas.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument());
        setTime(canvasElement, 2.5);
        await waitFor(() => expect(canvas.getByText('Loading options')).toBeInTheDocument());
        setTime(canvasElement, 11);
        await waitFor(() => expect(canvas.getByText("Couldn't load options")).toBeInTheDocument());
    },
};

/**
 * Play runs the clock to the end and stops there; under reduced motion it steps a band at a time and the shimmer holds still.
 * The story passes `reduced` itself and never emulates the OS preference: that is page-wide and shared with story files running at the same time.
 */
export const TimelineReducedMotion = {
    name: 'Timeline: reduced motion',
    tags: ['test-only'],
    render: () => staged(<LoadingTimeline kind="list" seconds={0} reduced />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Play' }));
        await waitFor(() => expect(canvas.getByText('Still loading students')).toBeInTheDocument(), { timeout: 4000 });
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Play' }), 'Play stops at the end').toBeInTheDocument());
        await expect(canvas.getByText(`${TIMELINE_MAX.toFixed(1)} s`)).toBeInTheDocument();
        for (const bar of bars(canvasElement)) {
            await expect(getComputedStyle(bar).animationName, 'the shimmer holds still').toBe('none');
        }
    },
};

/* ------------------------------------------------------------------- motion */

const withProductiveMotion = (Story) => (
    <MotionPreferenceContext.Provider value={false}>
        <Story />
    </MotionPreferenceContext.Provider>
);

const playLoadReveal = (reduced = false) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stage = canvasElement.querySelector('[data-load-reveal]');
    await expect(stage, 'LoadThenReveal mounts').not.toBeNull();
    await expect(stage).toHaveAttribute('data-load-phase', 'loading');
    await expect(stage).toHaveAttribute('aria-busy', 'true');
    await expect(stage).toHaveAttribute('data-reduced', reduced ? 'true' : 'false');

    const skeletonBars = stage.querySelectorAll('.plus-skeleton');
    await expect(skeletonBars.length).toBeGreaterThan(0);
    if (reduced) {
        for (const bar of skeletonBars) {
            await expect(getComputedStyle(bar).animationName, 'shimmer holds still under reduced motion').toBe('none');
        }
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Finish loading' }));
    await expect(stage.getAttribute('data-load-phase')).toBe('revealing');
    await expect(stage.querySelector('[data-load-skeleton-exiting]'), 'skeleton cross-fades underneath arriving content').not.toBeNull();
    await expect(stage.querySelectorAll('[data-load-slot]').length, 'slots reveal in load order').toBeGreaterThanOrEqual(3);

    await waitFor(() => expect(stage).toHaveAttribute('data-load-phase', 'settled'), { timeout: 4000 });
    await settleAnimations(canvasElement);
    await expect(stage).not.toHaveAttribute('aria-busy');
    await expect(stage.querySelector('[data-load-skeleton-exiting]')).toBeNull();
    await expect(canvas.getByRole('table')).toBeVisible();
};

export const MotionLoadReveal = {
    name: 'Motion: Load then reveal',
    decorators: [withProductiveMotion],
    render: () => staged(<LoadingRevealDemo />),
    play: playLoadReveal(false),
};

export const MotionLoadRevealReduced = {
    name: 'Motion: Load then reveal (reduced)',
    decorators: [withReducedMotion],
    render: () => staged(<LoadingRevealDemo />),
    play: playLoadReveal(true),
};

