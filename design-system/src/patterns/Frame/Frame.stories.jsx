import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Modal, Sidebar } from '@/components';
import { Frame, Topbar } from '@/patterns';
import { computedShadow, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { PAGE_EDGE } from '@/patterns/Page';

/**
 * Frame — the app frame: a full-width 32 topbar over a row holding the Sidebar
 * and the Page.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, because
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: where the toggle sits, whether the sidebar docks or floats,
 * where the page starts, and how wide the content is. Every expected length
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
            border: 'var(--border-default) dashed var(--ds-border-bold)',
            borderRadius: 'var(--radius-md)',
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
    id: 'foundations-patterns-frame',
    component: Frame,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: FrameWithSlots,
    argTypes: {
        children: { table: { disable: true } },
        topbar: { table: { disable: true } },
        sidebar: { table: { disable: true } },
        style: { table: { disable: true } },
        sidebarDocked: {
            control: 'select',
            options: [undefined, true, false],
            description: "Sets the Sidebar's default request: true opens it, false closes it. Under 1024 it never docks. Unset opens it where it fits.",
            table: { category: 'Design' },
        },
        surfaceDirect: {
            control: 'boolean',
            description: 'Renders children straight into the surface, with no content box or grid.',
            table: { category: 'Design' },
        },
        contentAs: { control: false, table: { disable: true } },
        contentClassName: { control: false, table: { disable: true } },
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
        // The Sidebar's `nav` is the navigation landmark; the box around it is what docks or floats.
        sidebar: () => canvas.queryByRole('navigation', { name: 'Main' })?.closest('.plus-frame__sidebar') ?? null,
        // Under an open modal the page is hidden from assistive tech, so the
        // Sidebar is found among the hidden roles: still there, still docked.
        coveredSidebar: () => canvas.queryByRole('navigation', { name: 'Main', hidden: true })?.closest('.plus-frame__sidebar') ?? null,
        edge: () => frame.querySelector('.plus-frame__edge'),
    };
};

const rect = (el) => el.getBoundingClientRect();

/** Where `el` sits relative to the frame's top-left corner. */
const offset = (frame, el) => ({ x: rect(el).left - rect(frame).left, y: rect(el).top - rect(frame).top });

/** The surface's padding in pixels (all four sides share one token). */
const surfacePad = (surface) => px(getComputedStyle(surface).paddingLeft);

/** The toggle sits 8 from the left and flush to the top at every width and in every sidebar state. */
const expectToggleHome = async (frame, toggle) => {
    const pad = tokenLength(frame, '--pad-x-sm');
    const at = offset(frame, toggle);
    await expect(at.x, 'toggle x').toBeCloseTo(pad, 0);
    await expect(at.y, 'toggle y').toBeCloseTo(0, 0);
    await expect(rect(toggle).height, 'toggle height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
};

const expectTopbar = async (frame) => {
    const topbar = frame.querySelector('.plus-frame__topbar');
    await expect(rect(topbar).height, 'topbar height').toBeCloseTo(tokenLength(frame, '--frame-topbar-height'), 0);
};

/** A peeked sidebar floats: shadow, over the page, and no Blanket under it. */
const expectFloating = async (frame, aside, surface, surfaceLeftBefore) => {
    await expect(getComputedStyle(aside).position).toBe('absolute');
    await expect(getComputedStyle(aside).boxShadow, 'floating sidebar shadow')
        .toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(aside).width, 'sidebar width').toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
    await expect(rect(surface).left, 'the surface did not move').toBeCloseTo(surfaceLeftBefore, 0);
    // No Blanket: a point on the page beside the sidebar still hits the page.
    const s = rect(surface);
    const hit = document.elementFromPoint(s.right - 40, s.top + 40);
    await expect(surface.contains(hit), 'nothing covers the page beside the floating sidebar').toBe(true);
};

const atViewport = (width, run) => withTestViewport(width, HEIGHT, run);

/**
 * No seams: the Topbar spans the full width, the Page starts where it ends and
 * runs to the right and bottom edges, and a hairline closes the Topbar.
 */
const expectNoSeam = async (frame, surface) => {
    const topbar = frame.querySelector('.plus-frame__topbar');
    await expect(rect(topbar).width, 'the topbar spans the full width').toBeCloseTo(rect(frame).width, 0);
    await expect(rect(surface).top - rect(topbar).bottom, 'no gap between the rows').toBeCloseTo(0, 0);
    await expect(rect(frame).right - rect(surface).right, 'no seam on the right').toBeCloseTo(0, 0);
    await expect(rect(frame).bottom - rect(surface).bottom, 'no seam at the bottom').toBeCloseTo(0, 0);
    const line = getComputedStyle(topbar, '::after');
    await expect(px(line.height), 'a hairline under the topbar').toBeCloseTo(tokenLength(frame, '--stroke-1'), 1);
    await expect(line.backgroundColor, 'in the border color').toBe(tokenColor(frame, '--ds-border'));
    await expect(px(getComputedStyle(topbar).paddingRight), 'the topbar pads its end').toBeCloseTo(tokenLength(frame, '--pad-x-sm'), 0);
};

/** The Page's top-left corner: rounded (`--page-radius`) while docked, square otherwise; the other three never round. */
const expectCorner = async (frame, surface, rounded) => {
    const style = getComputedStyle(surface);
    const radius = rounded ? tokenLength(frame, '--page-radius') : 0;
    await expect(px(style.borderTopLeftRadius), rounded ? 'top-left is rounded while docked' : 'top-left is square when not docked').toBeCloseTo(radius, 0);
    await expect(px(style.borderTopRightRadius), 'top-right is square').toBeCloseTo(0, 0);
    await expect(px(style.borderBottomRightRadius), 'bottom-right is square').toBeCloseTo(0, 0);
    await expect(px(style.borderBottomLeftRadius), 'bottom-left is square').toBeCloseTo(0, 0);
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
            .toBeGreaterThanOrEqual(tokenLength(frame, '--stroke-1'));
        await inEveryColorMode(async (mode) => {
            const frameStyle = getComputedStyle(frame);
            const surfaceStyle = getComputedStyle(surface);
            const asideStyle = getComputedStyle(aside);
            await expect(frameStyle.backgroundColor, `${mode}: the frame is sunken`).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
            await expect(frameStyle.color, `${mode}: frame text`).toBe(tokenColor(canvasElement, '--ds-text'));
            await expect(surfaceStyle.backgroundColor, `${mode}: the surface`).toBe(tokenColor(canvasElement, '--ds-surface'));
            await expect(surfaceStyle.boxShadow, `${mode}: the surface edge`)
                .toBe(computedShadow(canvasElement, PAGE_EDGE));
            await expect(asideStyle.borderRightStyle, `${mode}: the docked sidebar's divider`).toBe('solid');
            await expect(px(asideStyle.borderRightWidth), `${mode}: a 1px divider`).toBeCloseTo(tokenLength(frame, '--stroke-1'), 1);
            await expect(asideStyle.borderRightColor, `${mode}: in the border color`).toBe(tokenColor(canvasElement, '--ds-border'));
            if (mode.startsWith('dark')) {
                await expect(frameStyle.backgroundColor, `${mode}: the frame moves with the mode`).not.toBe(lightSunken);
            }
        });
    }),
};

export const Reading = { args: { width: 'reading' } };

/**
 * Docs examples. They render inline at a fixed height, so they follow the
 * toolbar's color mode like the rest of the page. Hidden from the sidebar.
 */
const DOCS_HEIGHT = '420px';
const DocsFrame = (args) => <FrameWithSlots {...args} height={DOCS_HEIGHT} />;

export const DocsOverview = { render: DocsFrame, parameters: { layout: 'padded' } };

export const DocsReading = { render: DocsFrame, args: { width: 'reading' }, parameters: { layout: 'padded' } };

/**
 * The sidebar floating: a closed sidebar peeked over the page. The story
 * hovers the toggle once it mounts, which is what a pointer does.
 */
const FrameDemo = ({ peek = false, ...args }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!peek) return;
        const toggle = ref.current?.querySelector('.plus-topbar__toggle');
        toggle?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    }, [peek]);
    return (
        <div ref={ref}>
            <FrameWithSlots {...args} sidebarDocked={peek ? false : args.sidebarDocked} height={DOCS_HEIGHT} />
        </div>
    );
};

const PeekedFrame = (args) => <FrameDemo {...args} peek />;

/**
 * One frame per layout mode, one story each: a page holds one landmark of each
 * kind. The frame docks by the mode it is in; the pads follow the browser width.
 */
const atMode = (breakpoint, peek) => ({
    render: (args) => (
        <div data-plus-breakpoint={breakpoint}>
            <FrameDemo {...args} peek={peek} />
        </div>
    ),
    parameters: { layout: 'padded' },
});

/** sidebar = auto: closed at Medium, docked at Large and X-Large. */
export const DocsAuto768 = atMode('md', false);
export const DocsAuto1024 = atMode('lg', false);
export const DocsAuto1440 = atMode('xl', false);

/** sidebar = floating: a closed sidebar peeked over the page. */
export const DocsPeeking768 = atMode('md', true);
export const DocsPeeking1024 = atMode('lg', true);
export const DocsPeeking1440 = atMode('xl', true);

export const Floating = {
    render: PeekedFrame,
    parameters: { layout: 'padded' },
    play: async ({ canvasElement }) => {
        const { frame, sidebar } = parts(canvasElement);
        await waitFor(() => expect(sidebar(), 'the sidebar peeks').not.toBeNull());
        await expect(getComputedStyle(sidebar()).position).toBe('absolute');
        await expect(getComputedStyle(sidebar()).boxShadow, 'floating sidebar shadow')
            .toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    },
};

/** 768: the Sidebar is collapsed; hover peeks it, an outside click closes it, a click opens it as an overlay (it never docks under 1024). */
export const Medium768 = {
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const { frame, toggle, surface, content, sidebar, edge } = parts(canvasElement);
        await expectTopbar(frame);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar(), `closed below 1024 (found ${sidebar()?.className}, viewport ${window.innerWidth})`).toBeNull());
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');

        await expect(offset(frame, surface).x, 'surface starts at the window edge').toBeCloseTo(0, 0);
        await expect(surfacePad(surface), 'surface pad').toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface), 'surface pad is 24 at every width').toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width, 'content width').toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectNoSeam(frame, surface);

        // Hover the toggle: the sidebar peeks, floating.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
        await expectToggleHome(frame, toggle);
        // Peeking is not docking: the corner stays square.
        await expectCorner(frame, surface, false);

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

        // A click opens it by hand. Under 1024 it never docks: it floats over the Page as an overlay.
        await userEvent.click(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await userEvent.unhover(toggle);
        await new Promise((resolve) => { setTimeout(resolve, 400); });
        await expect(sidebar(), 'it stays open once the pointer leaves').not.toBeNull();
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(rect(content).width, 'the Page keeps its width').toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectCorner(frame, surface, false);
        await expectToggleHome(frame, toggle);

        // An outside click closes an overlay Sidebar.
        await userEvent.click(surface);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }),
};

/** 1024: the sidebar docks; the toggle closes it and does not move. */
export const Large1024 = {
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = parts(canvasElement);
        const { frame, toggle, surface, content, sidebar } = p;
        await expectTopbar(frame);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar(), 'docked from 1024').not.toBeNull());
        await expect(getComputedStyle(sidebar()).position).toBe('static');
        await expect(offset(frame, surface).x).toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface), 'surface pad is 24 at every width').toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectNoSeam(frame, surface);
        await expectCorner(frame, surface, true);

        // Landmarks: the Page is the main, the Sidebar's nav is the navigation, and nothing is a bare "sidebar" aside.
        await expect(p.canvas.getByRole('main')).toBe(content);
        await expect(p.canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        await expect(frame.querySelector('aside'), 'no aside landmark').toBeNull();

        // The sidebar's rows are the 32 item height.
        const tab = within(sidebar()).getAllByRole('button')[0];
        await expect(rect(tab).height, 'sidebar row height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);

        await userEvent.click(toggle);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expect(offset(frame, surface).x, 'closed: the surface runs to the window edge').toBeCloseTo(0, 0);
        await expectCorner(frame, surface, false);
        await expectToggleHome(frame, toggle);

        // Closed at 1024, a hover still peeks without pushing.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
    }),
};

/** Ctrl+[ toggles the Sidebar, and the corner follows it in the same frame. */
export const CtrlBracketToggle = {
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, surface, sidebar, toggle } = parts(canvasElement);
        await waitFor(() => expect(sidebar(), 'docked at 1440').not.toBeNull());
        await expectCorner(frame, surface, true);
        await expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Control+[');

        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ closes it').toBeNull());
        await expect(offset(frame, surface).x, 'the Page runs to the window edge').toBeCloseTo(0, 0);
        await expectCorner(frame, surface, false);

        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ opens it again').not.toBeNull());
        await expect(offset(frame, surface).x).toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
        await expectCorner(frame, surface, true);
    }),
};

/** Ctrl+[ under 1024 opens the Sidebar as an overlay, since it never docks there, and closes it again. */
export const CtrlBracketAt768 = {
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const { frame, surface, sidebar } = parts(canvasElement);
        await expect(sidebar()).toBeNull();
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ opens it').not.toBeNull());
        await expect(getComputedStyle(sidebar()).position, 'as an overlay, not docked').toBe('absolute');
        await expectCorner(frame, surface, false);
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ closes it').toBeNull());
    }),
};

/** The Page meets the Sidebar at a hairline: the Sidebar's 1px border sits flush against the Page, with no gap. */
export const SidebarMeetsPage = {
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, surface, sidebar } = parts(canvasElement);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expect(rect(sidebar()).right, 'no gap between the Sidebar and the Page').toBeCloseTo(rect(surface).left, 0);
        await expect(px(getComputedStyle(sidebar()).borderRightWidth)).toBeCloseTo(tokenLength(frame, '--stroke-1'), 1);
        await expectNoSeam(frame, surface);
    }),
};

/** 1440: the surface pads 24. */
export const XLarge1440 = {
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, toggle, surface, content, sidebar } = parts(canvasElement);
        await expectToggleHome(frame, toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expect(surfacePad(surface), 'surface pad from 1440').toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-width'), 0);
    }),
};

/** 1600: content caps at 1232 and centers in the surface. */
export const Wide1600 = {
    play: async ({ canvasElement }) => atViewport(1600, async () => {
        const { frame, toggle, surface, content } = parts(canvasElement);
        await expectToggleHome(frame, toggle);
        const max = tokenLength(frame, '--content-max-width');
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
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-max-width-reading'), 0);
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
        await expect(px(style.columnGap), 'gutter').toBeCloseTo(tokenLength(frame, '--grid-gutter'), 0);
        const [full, four, eight] = content.children;
        await expect(rect(full).width).toBeCloseTo(rect(content).width, 0);
        const column = tokenLength(frame, '--grid-width-column');
        const gutter = tokenLength(frame, '--grid-gutter');
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
                        <Button text="Preferences" onClick={() => setOpen(true)} />
                    </>
                )}
                {...args}
            >
                <div>
                    <Button appearance="primary" text="Page settings" onClick={() => setOpen(true)} />
                </div>
                {slot('Content slot')}
            </Frame>
            <Modal
                show={open}
                width="6-col"
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
        await expect(p.sidebar(), 'hidden from assistive tech under the modal').toBeNull();
        await expect(p.coveredSidebar(), 'still docked').not.toBeNull();
        await expect(getComputedStyle(p.coveredSidebar()).position).toBe('static');

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar(), 'still docked after Escape').not.toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on the trigger').toBe(trigger));
    }),
};

/** 768: a Sidebar the user opened is an overlay under 1024, so a modal closes it like a peek. */
export const ModalClosesOverlaySidebarAt768 = {
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.toggle);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await userEvent.unhover(p.toggle);
        await expect(getComputedStyle(p.sidebar()).position, 'an overlay, not docked').toBe('absolute');

        const trigger = p.canvas.getByRole('button', { name: 'Page settings' });
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the overlay Sidebar closed').toBeNull());

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar()).toBeNull();
    }),
};
