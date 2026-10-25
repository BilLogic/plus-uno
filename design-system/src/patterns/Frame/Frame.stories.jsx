import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Modal, Sidebar } from '@/components';
import { Frame, Topbar } from '@/patterns';
import { computedShadow, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { SURFACE_EDGE } from '@/patterns/Surface';

/**
 * `Frame` — the app frame: a 32 topbar over a row holding the
 * sidebar and the surface.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, because
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: where the toggle sits, whether the sidebar docks or floats,
 * where the surface starts, and how wide the content is. Every expected length
 * is read from its token through a probe, never typed in.
 */

const HEIGHT = 900;

const slot = (label, minHeight = 'var(--height-500)') => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight,
            border: 'var(--size-element-border) dashed var(--ds-border-bold)',
            borderRadius: 'var(--element-radius-md)',
            color: 'var(--ds-text-subtle)',
            font: 'var(--body-default)',
        }}
    >
        {label}
    </div>
);

const FrameWithSlots = (args) => (
    <InAppFrame {...args}>
        {slot('Content slot')}
        {slot('Content slot')}
    </InAppFrame>
);

export default {
    title: 'Foundations/Patterns/Frame',
    component: Frame,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: FrameWithSlots,
    argTypes: {
        children: { table: { disable: true } },
        topbar: { table: { disable: true } },
        sidebar: { table: { disable: true } },
        style: { table: { disable: true } },
        width: {
            control: 'select',
            options: ['content', 'reading'],
            description: 'Content cap: content 1232, reading 864',
            table: { category: 'Design' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

/* ------------------------------------------------------------- probes */

const parts = (canvasElement) => {
    const frame = canvasElement.querySelector('.plus-frame');
    const canvas = within(canvasElement);
    return {
        frame,
        canvas,
        toggle: canvas.getByRole('button', { name: /sidebar/i }),
        surface: frame.querySelector('.plus-frame__surface'),
        content: frame.querySelector('.plus-frame__content'),
        sidebar: () => canvas.queryByRole('complementary', { name: 'Sidebar' }),
        edge: () => frame.querySelector('.plus-frame__edge'),
    };
};

const rect = (el) => el.getBoundingClientRect();

/** Where `el` sits relative to the frame's top-left corner. */
const offset = (frame, el) => ({ x: rect(el).left - rect(frame).left, y: rect(el).top - rect(frame).top });

/** The surface's padding in pixels (all four sides share one token). */
const surfacePad = (surface) => px(getComputedStyle(surface).paddingLeft);

/** The toggle sits at (8, 8) at every width and in every sidebar state. */
const expectToggleHome = async (frame, toggle) => {
    const pad = tokenLength(frame, '--surface-container-pad');
    const at = offset(frame, toggle);
    await expect(at.x, 'toggle x').toBeCloseTo(pad, 0);
    await expect(at.y, 'toggle y').toBeCloseTo(pad, 0);
    await expect(rect(toggle).height, 'toggle height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
};

const expectTopbar = async (frame) => {
    const topbar = frame.querySelector('.plus-frame__topbar');
    await expect(rect(topbar).height, 'topbar height').toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
};

/** A peeked sidebar floats: shadow, over the page, and no scrim under it. */
const expectFloating = async (frame, aside, surface, surfaceLeftBefore) => {
    await expect(getComputedStyle(aside).position).toBe('absolute');
    await expect(getComputedStyle(aside).boxShadow, 'floating sidebar shadow')
        .toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(aside).width, 'sidebar width').toBeCloseTo(tokenLength(frame, '--layout-width-sidebar'), 0);
    await expect(rect(surface).left, 'the surface did not move').toBeCloseTo(surfaceLeftBefore, 0);
    // No scrim: a point on the page beside the sidebar still hits the page.
    const s = rect(surface);
    const hit = document.elementFromPoint(s.right - 40, s.top + 40);
    await expect(surface.contains(hit), 'nothing covers the page beside the floating sidebar').toBe(true);
};

const atViewport = (width, run) => withTestViewport(width, HEIGHT, run);

/** The topbar row and the sidebar-and-surface row stack 8 apart. */
const expectRowStack = async (frame, surface) => {
    const topbar = frame.querySelector('.plus-frame__topbar');
    await expect(rect(surface).top - rect(topbar).bottom, 'stack between the rows')
        .toBeCloseTo(tokenLength(frame, '--surface-container-stack'), 0);
};

/* ------------------------------------------------------------- stories */

export const Overview = {};

/**
 * In every color mode the frame is the sunken backdrop in the body text color,
 * and the surface is the default surface edged by the surface border, so the
 * pair moves together. Docked, the sidebar ends in a 1px border-color divider,
 * flush against the surface, so the surface edge (where increased contrast
 * draws one) lies over the divider instead of beside it.
 */
export const ColorModes = {
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(1024, HEIGHT, async () => {
        const { frame, surface, sidebar } = parts(canvasElement);
        const lightSunken = tokenColor(canvasElement, '--ds-surface-sunken');
        await waitFor(() => expect(getComputedStyle(sidebar()).position, 'docked at 1024').toBe('static'));
        const aside = sidebar();
        await expect(rect(aside).right, 'the sidebar sits flush against the surface').toBeCloseTo(rect(surface).left, 0);
        await expect(tokenLength(frame, '--size-surface-border'), 'the surface edge covers the divider')
            .toBeGreaterThanOrEqual(tokenLength(frame, '--size-element-stroke-sm'));
        await inEveryColorMode(async (mode) => {
            const frameStyle = getComputedStyle(frame);
            const surfaceStyle = getComputedStyle(surface);
            const asideStyle = getComputedStyle(aside);
            await expect(frameStyle.backgroundColor, `${mode}: the frame is sunken`).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
            await expect(frameStyle.color, `${mode}: frame text`).toBe(tokenColor(canvasElement, '--ds-text'));
            await expect(surfaceStyle.backgroundColor, `${mode}: the surface`).toBe(tokenColor(canvasElement, '--ds-surface'));
            await expect(surfaceStyle.boxShadow, `${mode}: the surface edge`)
                .toBe(computedShadow(canvasElement, SURFACE_EDGE));
            await expect(asideStyle.borderRightStyle, `${mode}: the docked sidebar's divider`).toBe('solid');
            await expect(px(asideStyle.borderRightWidth), `${mode}: a 1px divider`).toBeCloseTo(tokenLength(frame, '--size-element-stroke-sm'), 1);
            await expect(asideStyle.borderRightColor, `${mode}: in the border color`).toBe(tokenColor(canvasElement, '--ds-border'));
            if (mode.startsWith('dark')) {
                await expect(frameStyle.backgroundColor, `${mode}: the frame moves with the mode`).not.toBe(lightSunken);
            }
        });
    }),
};

export const Reading = { args: { width: 'reading' } };

/** 768: the sidebar is closed; hover peeks it, an outside click closes it, a click docks it. */
export const Medium768 = {
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const { frame, toggle, surface, content, sidebar, edge } = parts(canvasElement);
        await expectTopbar(frame);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar(), `closed below 1024 (found ${sidebar()?.className}, viewport ${window.innerWidth})`).toBeNull());
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');

        const pad = tokenLength(frame, '--surface-container-pad');
        await expect(offset(frame, surface).x, 'surface starts after the container pad').toBeCloseTo(pad, 0);
        await expect(surfacePad(surface), 'surface pad').toBeCloseTo(tokenLength(frame, '--surface-pad'), 0);
        await expect(surfacePad(surface), 'surface pad below 1440').toBeCloseTo(tokenLength(frame, '--space-100'), 0);
        await expect(rect(content).width, 'content width').toBeCloseTo(tokenLength(frame, '--layout-width-content'), 0);
        await expectRowStack(frame, surface);

        // Hover the toggle: the sidebar peeks, floating.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
        await expectToggleHome(frame, toggle);

        // An outside click closes it.
        await userEvent.click(surface);
        await waitFor(() => expect(sidebar()).toBeNull());

        // Hovering the left edge peeks it too.
        await userEvent.hover(edge());
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);

        // Escape closes a peek.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(sidebar()).toBeNull());

        // A click docks it: the page moves over and scrolls sideways under 720.
        await userEvent.click(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expect(getComputedStyle(sidebar()).position).toBe('static');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(offset(frame, surface).x, 'docked: the surface starts after the sidebar')
            .toBeCloseTo(tokenLength(frame, '--layout-width-sidebar'), 0);
        await expect(rect(content).width, 'content never goes under its minimum')
            .toBeCloseTo(tokenLength(frame, '--layout-min-width-content'), 0);
        await expect(surface.scrollWidth, 'the surface scrolls sideways').toBeGreaterThan(surface.clientWidth);
        // Scrolled sideways, the topbar stays put.
        const topbarLeft = rect(frame.querySelector('.plus-frame__topbar')).left;
        surface.scrollLeft = surface.scrollWidth;
        await expect(rect(frame.querySelector('.plus-frame__topbar')).left, 'the topbar stays put')
            .toBeCloseTo(topbarLeft, 0);
        await expectToggleHome(frame, toggle);

        // Docked, an outside click leaves it docked.
        await userEvent.click(surface);
        await expect(sidebar()).not.toBeNull();
    }),
};

/** 1024: the sidebar docks; the toggle closes it and does not move. */
export const Large1024 = {
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const { frame, toggle, surface, content, sidebar } = parts(canvasElement);
        await expectTopbar(frame);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar(), 'docked from 1024').not.toBeNull());
        await expect(getComputedStyle(sidebar()).position).toBe('static');
        await expect(offset(frame, surface).x).toBeCloseTo(tokenLength(frame, '--layout-width-sidebar'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--surface-pad'), 0);
        await expect(surfacePad(surface), 'surface pad below 1440').toBeCloseTo(tokenLength(frame, '--space-100'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--layout-width-content'), 0);
        await expectRowStack(frame, surface);

        // The sidebar's rows are the 32 item height.
        const tab = within(sidebar()).getAllByRole('button')[0];
        await expect(rect(tab).height, 'sidebar row height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);

        await userEvent.click(toggle);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expect(offset(frame, surface).x, 'closed: the surface takes the container pad')
            .toBeCloseTo(tokenLength(frame, '--surface-container-pad'), 0);
        await expectToggleHome(frame, toggle);

        // Closed at 1024, a hover still peeks without pushing.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
    }),
};

/** 1440: the surface pads 24. */
export const XLarge1440 = {
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, toggle, surface, content, sidebar } = parts(canvasElement);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expect(surfacePad(surface), 'surface pad from 1440').toBeCloseTo(tokenLength(frame, '--surface-pad'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--layout-width-content'), 0);
    }),
};

/** 1600: content caps at 1232 and centers in the surface. */
export const Wide1600 = {
    play: async ({ canvasElement }) => atViewport(1600, async () => {
        const { frame, toggle, surface, content } = parts(canvasElement);
        await expectToggleHome(frame, toggle);
        const max = tokenLength(frame, '--layout-max-width-content');
        await expect(rect(content).width, 'content caps').toBeCloseTo(max, 0);
        const pad = surfacePad(surface);
        const left = rect(content).left - (rect(surface).left + pad);
        const right = (rect(surface).right - pad) - rect(content).right;
        await expect(left, 'content is centered').toBeGreaterThan(0);
        await expect(left).toBeCloseTo(right, 0);
    }),
};

/** Reading pages cap at 864. */
export const ReadingAt1440 = {
    args: { width: 'reading' },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, content } = parts(canvasElement);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--layout-max-width-reading'), 0);
    }),
};

/** The content grid: 12 columns with a 16 gutter, children span the whole row by default. */
export const ContentGrid = {
    render: (args) => (
        <div style={{ height: '100vh' }}>
            <Frame sidebar={<Sidebar user="tutor" />} {...args}>
                {slot('Full width')}
                <div style={{ gridColumn: 'span 4' }}>{slot('4 columns')}</div>
                <div style={{ gridColumn: 'span 8' }}>{slot('8 columns')}</div>
            </Frame>
        </div>
    ),
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, content } = parts(canvasElement);
        const style = getComputedStyle(content);
        await expect(style.gridTemplateColumns.split(' ')).toHaveLength(12);
        await expect(px(style.columnGap), 'gutter').toBeCloseTo(tokenLength(frame, '--layout-gutter'), 0);
        const [full, four, eight] = content.children;
        await expect(rect(full).width).toBeCloseTo(rect(content).width, 0);
        const column = tokenLength(frame, '--layout-width-column');
        const gutter = tokenLength(frame, '--layout-gutter');
        await expect(rect(four).width, 'four columns and three gutters').toBeCloseTo(4 * column + 3 * gutter, 0);
        await expect(rect(eight).left - rect(four).right, 'one gutter between').toBeCloseTo(gutter, 0);
    }),
};

/* ------------------------------------------------------------- modals */

/**
 * A page with a modal. Opening a modal closes a floating sidebar and leaves a
 * docked one alone; Escape then closes the modal only, and focus goes back to
 * what opened it. A trigger inside the floating sidebar leaves with the
 * sidebar, so focus goes to the sidebar toggle instead.
 */
const WithModal = (args) => {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    return (
        <div style={{ height: '100vh' }}>
            <Frame
                topbar={<Topbar breadcrumbs={[{ text: 'Home', href: '#' }, { text: 'Dashboard' }]} />}
                sidebar={(
                    <>
                        <Sidebar user="tutor" activeTabId="home" />
                        <Button text="Preferences" fill="outline" onClick={() => setOpen(true)} />
                    </>
                )}
                {...args}
            >
                <div>
                    <Button text="Page settings" onClick={() => setOpen(true)} />
                </div>
                {slot('Content slot')}
            </Frame>
            <Modal
                show={open}
                width="sm"
                title="Settings"
                body="Opening this closed the floating sidebar."
                primaryButton={{ text: 'Done', onClick: close }}
                onClose={close}
            />
        </div>
    );
};

const dialog = (canvasElement) => within(canvasElement.ownerDocument.body).queryByRole('dialog', { name: 'Settings' });

/** Hover the toggle until the sidebar floats over the page. */
const peekSidebar = async ({ toggle, sidebar }) => {
    await userEvent.hover(toggle);
    await waitFor(() => expect(sidebar()).not.toBeNull());
    await expect(getComputedStyle(sidebar()).position, 'floating').toBe('absolute');
};

/** 768: a modal opened from the page closes the floating sidebar; Escape closes the modal only. */
export const ModalClosesFloatingSidebar = {
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        await peekSidebar(p);

        // A keyboard press on a page button, so no outside click closes the peek first.
        const trigger = p.canvas.getByRole('button', { name: 'Page settings' });
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the floating sidebar closed').toBeNull());

        // Escape closes the modal, and only the modal.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar(), 'the sidebar stays closed').toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on the trigger').toBe(trigger));
    }),
};

/** 768: a trigger inside the floating sidebar leaves with it; focus lands on the toggle. */
export const ModalFromFloatingSidebar = {
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        await peekSidebar(p);

        await userEvent.click(within(p.sidebar()).getByRole('button', { name: 'Preferences' }));
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the floating sidebar closed').toBeNull());

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar()).toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus goes to the toggle').toBe(p.toggle));
    }),
};

/** 1024: a docked sidebar stays docked under a modal. */
export const ModalLeavesDockedSidebar = {
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'docked from 1024').not.toBeNull());

        const trigger = p.canvas.getByRole('button', { name: 'Page settings' });
        await userEvent.click(trigger);
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await expect(p.sidebar(), 'still docked').not.toBeNull();
        await expect(getComputedStyle(p.sidebar()).position).toBe('static');

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar(), 'still docked after Escape').not.toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on the trigger').toBe(trigger));
    }),
};

/** 768: a sidebar the user docked stays docked under a modal too. */
export const ModalLeavesDockedSidebarAt768 = {
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.toggle);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await expect(getComputedStyle(p.sidebar()).position, 'docked').toBe('static');

        await userEvent.click(p.canvas.getByRole('button', { name: 'Page settings' }));
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await expect(p.sidebar(), 'still docked').not.toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar(), 'still docked after Escape').not.toBeNull();
    }),
};
