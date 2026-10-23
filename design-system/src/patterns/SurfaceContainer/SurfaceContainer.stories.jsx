import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Sidebar } from '@/components';
import { SurfaceContainer, Topbar } from '@/patterns';
import { computedShadow, px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

/**
 * `SurfaceContainer` — the app frame: a 32 topbar over a row holding the
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
            border: 'var(--size-element-border) dashed var(--color-outline)',
            borderRadius: 'var(--element-radius-md)',
            color: 'var(--color-on-surface-variant)',
            font: 'var(--body-default)',
        }}
    >
        {label}
    </div>
);

const Frame = (args) => (
    <div style={{ height: '100vh' }}>
        <SurfaceContainer
            topbar={<Topbar breadcrumbs={[{ text: 'Home', href: '#' }, { text: 'Dashboard' }]} user={{ name: 'John Doe', type: 'lead tutor' }} />}
            sidebar={<Sidebar user="tutor" activeTabId="home" />}
            {...args}
        >
            {slot('Content slot')}
            {slot('Content slot')}
        </SurfaceContainer>
    </div>
);

export default {
    title: 'Foundations/Patterns/Surface container',
    component: SurfaceContainer,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: Frame,
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
    const frame = canvasElement.querySelector('.plus-surface-container');
    const canvas = within(canvasElement);
    return {
        frame,
        canvas,
        toggle: canvas.getByRole('button', { name: /sidebar/i }),
        surface: frame.querySelector('.plus-surface-container__surface'),
        content: frame.querySelector('.plus-surface-container__content'),
        sidebar: () => canvas.queryByRole('complementary', { name: 'Sidebar' }),
        edge: () => frame.querySelector('.plus-surface-container__edge'),
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
    const topbar = frame.querySelector('.plus-surface-container__topbar');
    await expect(rect(topbar).height, 'topbar height').toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
};

/** A peeked sidebar floats: shadow, over the page, and no scrim under it. */
const expectFloating = async (frame, aside, surface, surfaceLeftBefore) => {
    await expect(getComputedStyle(aside).position).toBe('absolute');
    await expect(getComputedStyle(aside).boxShadow, 'floating sidebar shadow')
        .toBe(computedShadow(frame, 'var(--surface-overlay-shadow)'));
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
    const topbar = frame.querySelector('.plus-surface-container__topbar');
    await expect(rect(surface).top - rect(topbar).bottom, 'stack between the rows')
        .toBeCloseTo(tokenLength(frame, '--surface-container-stack'), 0);
};

/* ------------------------------------------------------------- stories */

export const Overview = {};

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
        const topbarLeft = rect(frame.querySelector('.plus-surface-container__topbar')).left;
        surface.scrollLeft = surface.scrollWidth;
        await expect(rect(frame.querySelector('.plus-surface-container__topbar')).left, 'the topbar stays put')
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
            <SurfaceContainer sidebar={<Sidebar user="tutor" />} {...args}>
                {slot('Full width')}
                <div style={{ gridColumn: 'span 4' }}>{slot('4 columns')}</div>
                <div style={{ gridColumn: 'span 8' }}>{slot('8 columns')}</div>
            </SurfaceContainer>
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
