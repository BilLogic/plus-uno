import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button, Input, Textarea } from '@/components';
import { FocusedPage, PatternSection } from '@/patterns';
import { computedShadow, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { SURFACE_EDGE } from '@/patterns/Surface';

/**
 * `FocusedPage` — the page template for one task: no sidebar, a Back · title ·
 * Close topbar, the surface at reading width, and the actions in a footer row.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, because
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: the three rows, the 864 column, the actions lined up with it.
 * Every expected length and color is read from its token through a probe.
 */

const HEIGHT = 900;

const NoteForm = () => (
    <>
        <PatternSection title="Session details" description="What the student worked on today.">
            <Input label="Topic" placeholder="e.g. Solving two-step equations" />
            <Textarea label="Notes" placeholder="What went well, and what to try next time" rows={6} />
        </PatternSection>
        <PatternSection title="Follow-up">
            <Input label="Next step" placeholder="e.g. Practice set 4" />
        </PatternSection>
    </>
);

const Actions = () => (
    <>
        <Button style="secondary" fill="outline" text="Save draft" />
        <Button style="primary" fill="filled" text="Submit note" />
    </>
);

const FocusedPageStory = (args) => (
    <div style={{ height: '100vh' }}>
        <FocusedPage actions={<Actions />} {...args}>
            <NoteForm />
        </FocusedPage>
    </div>
);

export default {
    title: 'Foundations/Patterns/Focused page',
    component: FocusedPage,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: FocusedPageStory,
    args: {
        title: 'Add a session note',
        onBack: fn(),
        onClose: fn(),
    },
    argTypes: {
        title: { control: 'text', table: { category: 'Content' } },
        backLabel: { control: 'text', table: { category: 'Content' } },
        closeLabel: { control: 'text', table: { category: 'Content' } },
        actionsLabel: { control: 'text', table: { category: 'Content' } },
        backHref: { control: 'text', table: { category: 'Behavior' } },
        onBack: { control: false, table: { category: 'Behavior' } },
        onClose: { control: false, table: { category: 'Behavior' } },
        children: { table: { disable: true } },
        actions: { table: { disable: true } },
        style: { table: { disable: true } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

/* ------------------------------------------------------------- probes */

const rect = (el) => el.getBoundingClientRect();

const parts = (canvasElement) => {
    const canvas = within(canvasElement);
    const frame = canvasElement.querySelector('.plus-focused-page');
    return {
        canvas,
        frame,
        banner: canvas.getByRole('banner'),
        main: canvas.getByRole('main'),
        footer: canvas.getByRole('contentinfo', { name: 'Page actions' }),
        back: canvas.getByRole('button', { name: 'Back' }),
        close: canvas.getByRole('button', { name: 'Close' }),
        title: canvas.getByRole('heading', { level: 1 }),
        surface: frame.querySelector('.plus-frame__surface'),
        actions: frame.querySelector('.plus-focused-page__actions'),
    };
};

/** The page at one width: three rows 8 apart, the reading column, the actions over it. */
const expectLayout = async (canvasElement, width) => {
    const { frame, banner, back, close, surface, main, footer, actions } = parts(canvasElement);
    const pad = tokenLength(frame, '--surface-container-pad');
    const stack = tokenLength(frame, '--surface-container-stack');
    const reading = tokenLength(frame, '--layout-max-width-reading');
    const minimum = tokenLength(frame, '--layout-min-width-content');
    const surfacePad = tokenLength(frame, '--surface-pad');

    await expect(rect(banner).height, 'topbar height').toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
    await expect(rect(back).left - rect(frame).left, 'Back sits at the container pad').toBeCloseTo(pad, 0);
    await expect(rect(frame).right - rect(close).right, 'Close sits at the container pad').toBeCloseTo(pad, 0);
    await expect(canvasElement.querySelector('aside'), 'no sidebar').toBeNull();
    await expect(rect(surface).left - rect(frame).left, 'the surface starts at the container pad').toBeCloseTo(pad, 0);

    // The column is 864, or the surface less its pads, never under 720.
    const room = rect(surface).width - 2 * surfacePad;
    const expected = Math.max(minimum, Math.min(reading, room));
    await expect(rect(main).width, `reading column at ${width}`).toBeCloseTo(expected, 0);
    await expect(rect(actions).width, `the actions column at ${width}`).toBeCloseTo(expected, 0);
    await expect(rect(actions).left, 'the actions line up with the content').toBeCloseTo(rect(main).left, 0);

    // Three rows, 8 apart: the footer under the surface, at the frame's foot.
    await expect(rect(footer).top - rect(surface).bottom, 'the footer sits a stack under the surface').toBeCloseTo(stack, 0);
    await expect(rect(frame).bottom - rect(footer).bottom, 'the footer ends at the container pad').toBeCloseTo(pad, 0);
};

/* ------------------------------------------------------------- stories */

export const Overview = {};

/** Back, Close and the footer actions, in that order, with the page's landmarks. */
export const KeyboardAndLandmarks = {
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement, args }) => {
        const { canvas, banner, main, footer, back, close, title } = parts(canvasElement);

        // One banner, one main, one named footer; the title is the page's one h1, in the banner.
        await expect(canvas.getAllByRole('banner')).toHaveLength(1);
        await expect(canvas.getAllByRole('main')).toHaveLength(1);
        await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expect(banner).toContainElement(title);
        await expect(title).toHaveTextContent(args.title);
        await expect(banner).toContainElement(back);
        await expect(banner).toContainElement(close);
        await expect(main).not.toContainElement(footer);

        // Focus order: Back, Close, the fields in the content, then the actions.
        document.body.focus();
        await userEvent.tab();
        await expect(back).toHaveFocus();
        await userEvent.tab();
        await expect(close).toHaveFocus();
        await userEvent.tab();
        await expect(canvas.getByLabelText('Topic')).toHaveFocus();
        await userEvent.tab();
        await expect(canvas.getByLabelText('Notes')).toHaveFocus();
        await userEvent.tab();
        await expect(canvas.getByLabelText('Next step')).toHaveFocus();
        await userEvent.tab();
        await expect(within(footer).getByRole('button', { name: 'Save draft' })).toHaveFocus();
        await userEvent.tab();
        await expect(within(footer).getByRole('button', { name: 'Submit note' })).toHaveFocus();

        // Back and Close call their handlers, from a click and from the keyboard.
        await userEvent.click(back);
        await expect(args.onBack).toHaveBeenCalledTimes(1);
        await userEvent.click(close);
        await expect(args.onClose).toHaveBeenCalledTimes(1);
        back.focus();
        await userEvent.keyboard('{Enter}');
        await expect(args.onBack).toHaveBeenCalledTimes(2);
        close.focus();
        await userEvent.keyboard(' ');
        await expect(args.onClose).toHaveBeenCalledTimes(2);
    },
};

/**
 * In every color mode the frame is the sunken backdrop, the surface the default
 * surface edged by the surface border, and the title the body text color.
 */
export const ColorModes = {
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const { frame, surface, title } = parts(canvasElement);
        const lightSunken = tokenColor(canvasElement, '--ds-surface-sunken');
        await inEveryColorMode(async (mode) => {
            await expect(getComputedStyle(frame).backgroundColor, `${mode}: the frame is sunken`).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
            await expect(getComputedStyle(surface).backgroundColor, `${mode}: the surface`).toBe(tokenColor(canvasElement, '--ds-surface'));
            await expect(getComputedStyle(surface).boxShadow, `${mode}: the surface edge`).toBe(computedShadow(canvasElement, SURFACE_EDGE));
            await expect(getComputedStyle(title).color, `${mode}: the title`).toBe(tokenColor(canvasElement, '--ds-text'));
            if (mode.startsWith('dark')) {
                await expect(getComputedStyle(frame).backgroundColor, `${mode}: the frame moves with the mode`).not.toBe(lightSunken);
            }
        });
    },
};

/** At 768 a long title truncates on one line, and Back and Close keep their size. */
export const LongTitle = {
    args: { title: 'Reflection on the session with Jordan about two-step equations, word problems and the practice set we planned for next week' },
    play: async ({ canvasElement }) => withTestViewport(768, HEIGHT, async () => {
        const { frame, title, back, close } = parts(canvasElement);
        const style = getComputedStyle(title);
        await expect(style.whiteSpace).toBe('nowrap');
        await expect(style.textOverflow).toBe('ellipsis');
        await expect(title.scrollWidth, 'the title overflows and truncates').toBeGreaterThan(title.clientWidth);
        await expect(rect(close).height, 'Close keeps its 32').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
        await expect(rect(back).height, 'Back keeps its 32').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
        await expect(rect(frame).right - rect(close).right, 'Close stays on screen').toBeCloseTo(tokenLength(frame, '--surface-container-pad'), 0);
    }),
};

/** Without actions there is no footer; without handlers there is no Back or Close. */
export const Bare = {
    args: { onBack: undefined, onClose: undefined },
    render: (args) => (
        <div style={{ height: '100vh' }}>
            <FocusedPage {...args}><NoteForm /></FocusedPage>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('contentinfo')).toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Back' })).toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Close' })).toBeNull();
        await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
    },
};

/** A long body scrolls inside the surface; the topbar and the footer stay put. */
export const LongBody = {
    render: (args) => (
        <div style={{ height: '100vh' }}>
            <FocusedPage actions={<Actions />} {...args}>
                <NoteForm />
                <NoteForm />
                <NoteForm />
            </FocusedPage>
        </div>
    ),
    play: async ({ canvasElement }) => withTestViewport(1024, 600, async () => {
        const { surface, footer, banner, frame } = parts(canvasElement);
        await waitFor(() => expect(surface.scrollHeight, 'the body overflows').toBeGreaterThan(surface.clientHeight));
        const footerTop = rect(footer).top;
        const bannerTop = rect(banner).top;
        surface.scrollTop = surface.scrollHeight;
        await expect(surface.scrollTop, 'the surface scrolled').toBeGreaterThan(0);
        await expect(rect(footer).top, 'the footer did not move').toBeCloseTo(footerTop, 0);
        await expect(rect(banner).top, 'the topbar did not move').toBeCloseTo(bannerTop, 0);
        await expect(rect(frame).bottom - rect(footer).bottom, 'the footer stays at the foot').toBeCloseTo(tokenLength(frame, '--surface-container-pad'), 0);
    }),
};

export const Medium768 = {
    play: async ({ canvasElement }) => withTestViewport(768, HEIGHT, () => expectLayout(canvasElement, 768)),
};

export const Large1024 = {
    play: async ({ canvasElement }) => withTestViewport(1024, HEIGHT, () => expectLayout(canvasElement, 1024)),
};

export const XLarge1440 = {
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, () => expectLayout(canvasElement, 1440)),
};
