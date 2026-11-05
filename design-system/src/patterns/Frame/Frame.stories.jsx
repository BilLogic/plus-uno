import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Modal, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, Sidebar } from '@/components';
import { Frame, PANEL_STORAGE_KEY, Topbar, usePanelControl } from '@/patterns';
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
    // Each story starts with nothing remembered for the Panel.
    beforeEach: () => { window.sessionStorage.removeItem(PANEL_STORAGE_KEY); },
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
        panel: { table: { disable: true } },
        panelLabel: { control: false, table: { disable: true } },
        panelOpen: { control: false, table: { disable: true } },
        onPanelOpenChange: { control: false, table: { disable: true } },
        panelStorageKey: { control: false, table: { disable: true } },
        panelDefaultWidth: { control: false, table: { disable: true } },
        defaultPanelOpen: {
            control: 'boolean',
            description: 'Whether the Panel starts open when the tab has nothing remembered.',
            table: { category: 'Design' },
        },
        panelPeek: {
            control: 'boolean',
            description: 'Hovering the right edge peeks a closed Panel over the Page, with no Blanket. Off by default.',
            table: { category: 'Design' },
        },
        listDetail: {
            control: 'boolean',
            description: 'A List and detail layout is on the Page: the Sidebar collapses first to keep the 960 split.',
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
    // Below the topbar, like the Panel and its Blanket: the topbar row stays clear.
    await expect(rect(aside).top, 'the raised sidebar starts under the topbar').toBeCloseTo(rect(frame.querySelector('.plus-frame__topbar')).bottom, 0);
    await expect(rect(aside).bottom, 'the raised sidebar runs to the foot').toBeCloseTo(rect(frame).bottom, 0);
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

/* ------------------------------------------------------------- panel */

/**
 * The Panel area: the Frame's right-hand area, under the Topbar. The layout
 * resolver decides whether it docks beside the Page at a hairline or opens
 * over it on a Blanket. Each story sets the viewport first, then opens the
 * Panel the way a person does, from a button on the Page.
 */
const ChatToggle = () => {
    const panel = usePanelControl();
    return (
        <div>
            <Button
                appearance="primary"
                text={panel?.open ? 'Close chat' : 'Open chat'}
                onClick={() => panel?.setOpen(!panel.open)}
            />
        </div>
    );
};

const ChatPanel = ({ onSettings }) => {
    const panel = usePanelControl();
    return (
        <PanelContainer>
            <PanelHeader title="AI chat" actions={<PanelCloseAction onClick={() => panel?.setOpen(false)} />} />
            <PanelBody>
                Ask about this page.
                <AskField />
                {onSettings ? <div><Button text="Chat settings" onClick={onSettings} /></div> : null}
            </PanelBody>
        </PanelContainer>
    );
};

/** A field in the Panel that keeps its own Escape: with text in it, Escape clears the text and nothing else. */
const AskField = () => {
    const [value, setValue] = useState('');
    return (
        <input
            aria-label="Ask"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key !== 'Escape' || !value) return;
                e.preventDefault();
                setValue('');
            }}
        />
    );
};

/** A Sidebar whose own button opens the Panel, so opening it can collapse the Sidebar that held focus. */
const ChatSidebar = () => {
    const panel = usePanelControl();
    return (
        <nav aria-label="Main">
            <Button text="Ask AI" onClick={() => panel?.setOpen(true)} />
        </nav>
    );
};

/** A Topbar button that controls the Panel, the way an app's chat button sits in its Topbar. */
const TopbarChatTrigger = () => {
    const panel = usePanelControl();
    return (
        <Button
            text="Chat"
            aria-controls={panel?.panelId}
            aria-expanded={panel?.open}
            onClick={() => panel?.setOpen(!panel.open)}
        />
    );
};

const WithPanel = ({ withModal = false, withTopbarTrigger = false, ...args }) => {
    const [modal, setModal] = useState(false);
    const topbar = withTopbarTrigger ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Topbar />
            <TopbarChatTrigger />
        </div>
    ) : undefined;
    return (
        <>
            <InAppFrame
                panel={<ChatPanel onSettings={withModal ? () => setModal(true) : undefined} />}
                panelLabel="AI chat"
                {...(topbar ? { topbar } : {})}
                {...args}
            >
                <ChatToggle />
                {withModal ? <div><Button text="Page settings" onClick={() => setModal(true)} /></div> : null}
                {slot('Content slot')}
            </InAppFrame>
            {withModal ? (
                <Modal
                    show={modal}
                    width="6-col"
                    title="Settings"
                    body="The Panel stays open under this Modal."
                    primaryButton={{ text: 'Done', onClick: () => setModal(false) }}
                    onClose={() => setModal(false)}
                />
            ) : null}
        </>
    );
};

const panelParts = (canvasElement) => {
    const p = parts(canvasElement);
    return {
        ...p,
        panel: () => p.frame.querySelector('.plus-frame__panel'),
        landmark: () => p.canvas.queryByRole('complementary', { name: 'AI chat' }),
        splitter: () => p.canvas.queryByRole('separator', { name: /resize/i }),
        blanket: () => p.frame.querySelector('.plus-frame__blanket'),
        openButton: () => p.canvas.getByRole('button', { name: /chat/i }),
    };
};

const openPanel = async (p) => {
    await userEvent.click(p.canvas.getByRole('button', { name: 'Open chat' }));
    await waitFor(() => expect(p.panel(), 'the Panel opens').not.toBeNull());
};

/** Docs example: the Panel open, inline at a fixed height. Nothing is remembered, so it always opens. */
export const DocsPanel = {
    render: (args) => <WithPanel {...args} height={DOCS_HEIGHT} />,
    args: { defaultPanelOpen: true, panelStorageKey: null },
    parameters: { layout: 'padded' },
};

/** 1440 with a 400 Panel: both fit at the 720 floor, so the Sidebar and the Panel dock, and the Page meets the Panel at a hairline. */
export const PanelDockedAt1440 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'docked at 1440').not.toBeNull());
        await expect(p.panel(), 'closed by default').toBeNull();
        await openPanel(p);
        const panel = p.panel();
        await expect(p.landmark(), 'a complementary landmark named for its content').toBe(panel);
        await expect(getComputedStyle(panel).position, 'docked, in flow').not.toBe('absolute');
        await expect(rect(panel).width, 'the default width').toBeCloseTo(tokenLength(p.frame, '--panel-width-default'), 0);
        await expect(rect(panel).right, 'flush to the window edge').toBeCloseTo(rect(p.frame).right, 0);
        await expect(rect(panel).top, 'under the Topbar').toBeCloseTo(rect(p.frame.querySelector('.plus-frame__topbar')).bottom, 0);
        await expect(rect(p.surface).right, 'the Page meets the Panel').toBeCloseTo(rect(panel).left, 0);
        await expect(px(getComputedStyle(panel).borderLeftWidth), 'at a hairline').toBeCloseTo(tokenLength(p.frame, '--stroke-1'), 1);
        await expect(getComputedStyle(panel).backgroundColor, 'docked, the Panel is the Page fill').toBe(tokenColor(p.frame, '--ds-surface'));
        await expect(p.sidebar(), 'the Sidebar stays docked').not.toBeNull();
        await expect(rect(p.content).width, 'content 1440 - 240 - 400 - 48').toBeCloseTo(752, 0);
        await expect(p.blanket(), 'docked has no Blanket').toBeNull();
        // Landmark order: topbar, nav, main, panel.
        const main = p.canvas.getByRole('main');
        await expect(main.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel(), 'Close closes it').toBeNull());
    }),
};

/** The Blanket covers the Page and the Sidebar's column but starts under the Topbar. */
const expectBlanket = async (p) => {
    const blanket = p.blanket();
    await expect(blanket, 'an overlay Panel has a Blanket').not.toBeNull();
    const topbar = p.frame.querySelector('.plus-frame__topbar');
    await expect(rect(blanket).top, 'the Blanket leaves the Topbar uncovered').toBeCloseTo(rect(topbar).bottom, 0);
    await expect(rect(blanket).left, 'it covers the Sidebar column').toBeCloseTo(rect(p.frame).left, 0);
    await expect(getComputedStyle(blanket).backgroundColor).toBe(tokenColor(p.frame, '--ds-blanket'));
    const s = rect(p.surface);
    const hit = document.elementFromPoint(s.left + 40, s.top + 40);
    await expect(hit, 'a press on the Page lands on the Blanket').toBe(blanket);
};

const expectOverlayPanel = async (p, width) => {
    const panel = p.panel();
    await expect(getComputedStyle(panel).position, 'over the Page').toBe('absolute');
    await expect(getComputedStyle(panel).boxShadow).toBe(computedShadow(p.frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(panel).width, 'overlay width').toBeCloseTo(width, 0);
    await expect(rect(panel).right).toBeCloseTo(rect(p.frame).right, 0);
    await expect(rect(panel).top).toBeCloseTo(rect(p.frame.querySelector('.plus-frame__topbar')).bottom, 0);
};

/** 1200 with a 400 Panel: both would leave 512, the Panel alone 752, so the default Sidebar collapses and comes back when the Panel closes. */
export const PanelAutoCollapsesSidebarAt1200 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1200, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'docked at 1200').not.toBeNull());
        await expectCorner(p.frame, p.surface, true);
        await openPanel(p);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses to keep 720').toBeNull());
        await expect(getComputedStyle(p.panel()).position).not.toBe('absolute');
        await expect(offset(p.frame, p.surface).x, 'the Page runs to the left edge').toBeCloseTo(0, 0);
        await expect(rect(p.content).width, '1200 - 400 - 48').toBeCloseTo(752, 0);
        await expectCorner(p.frame, p.surface, false);
        await expect(p.toggle).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(within(p.panel()).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        await waitFor(() => expect(p.sidebar(), 'restored when the Panel closes').not.toBeNull());
        await expectCorner(p.frame, p.surface, true);
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus goes back to what opened it')
            .toBe(p.canvas.getByRole('button', { name: 'Open chat' })));
    }),
};

/** 1100 with a 400 Panel: even the Panel alone leaves 652, so it opens over the Page on a Blanket; a press outside closes it. */
export const PanelOverlayAt1100 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        await expect(p.coveredSidebar(), 'the Sidebar stays docked under the Blanket, out of reach').not.toBeNull();
        await expect(rect(p.content).width, 'the Page keeps its width').toBeCloseTo(1100 - 240 - 48, 0);
        await expectBlanket(p);

        // A press on the Blanket closes it.
        await userEvent.click(p.blanket());
        await waitFor(() => expect(p.panel(), 'a press outside closes it').toBeNull());
        await expect(p.blanket()).toBeNull();

        // Escape closes it too.
        await openPanel(p);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel(), 'Escape closes it').toBeNull());
    }),
};

/** 1300: the Panel docks by collapsing the default Sidebar; opening the Sidebar by hand wins, so the Panel moves to overlay. */
export const SidebarByHandWinsAt1300 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1300, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await waitFor(() => expect(p.sidebar()).toBeNull());
        const panel = p.panel();
        await expect(getComputedStyle(panel).position).not.toBe('absolute');
        // The Topbar is above the Blanket, so the toggle stays pressable.
        await userEvent.click(p.toggle);
        // The Panel moves to overlay, so the docked Sidebar is under its Blanket, out of reach.
        await waitFor(() => expect(p.coveredSidebar(), 'opened by hand, it docks').not.toBeNull());
        await expect(getComputedStyle(p.coveredSidebar()).position).toBe('static');
        await expect(p.panel(), 'the same Panel, not remounted').toBe(panel);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        await expectBlanket(p);
        // Now an overlay, it is modal: focus moves in and the Page goes inert.
        await waitFor(() => expect(panel.contains(canvasElement.ownerDocument.activeElement), 'focus moves into the Panel').toBe(true));
        await expect(p.surface.inert).toBe(true);
    }),
};

/** 1440: a Modal over a docked Panel leaves it open; closing the Modal finds it still there. */
export const ModalLeavesPanelOpen = {
    render: (args) => <WithPanel {...args} withModal />,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await userEvent.click(p.canvas.getByRole('button', { name: 'Page settings' }));
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await expect(p.frame.querySelector('.plus-frame__panel'), 'the Panel stays open under the Modal').not.toBeNull();
        await userEvent.click(within(dialog(canvasElement)).getByRole('button', { name: 'Done' }));
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.panel(), 'still open after the Modal').not.toBeNull();
    }),
};

/** 1100: a Modal raised from an overlay Panel leaves it open, and a press inside the Modal does not count as outside. */
export const ModalOverOverlayPanelAt1100 = {
    render: (args) => <WithPanel {...args} withModal />,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        // The Page is inert under the Blanket, so the Modal is raised from inside the Panel.
        const settings = within(p.panel()).getByRole('button', { name: 'Chat settings' });
        settings.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await userEvent.click(within(dialog(canvasElement)).getByText('The Panel stays open under this Modal.'));
        await expect(p.panel(), 'a press inside the Modal is not outside the Panel').not.toBeNull();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.panel(), 'Escape closed the Modal only').not.toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on what raised the Modal').toBe(settings));
    }),
};

/**
 * 1100: an overlay Panel is modal. Opening it moves focus in, the Page and the
 * Sidebar under the Blanket are inert, Tab stays inside it, and closing it
 * hands focus back to the opener.
 */
export const OverlayPanelIsModalAt1100 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        const opener = p.canvas.getByRole('button', { name: 'Open chat' });
        opener.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(p.panel(), 'the Panel opens').not.toBeNull());
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        const panel = p.panel();
        await expect(panel, 'a modal dialog').toHaveAttribute('role', 'dialog');
        await expect(panel).toHaveAttribute('aria-modal', 'true');
        await expect(panel).toHaveAccessibleName('AI chat');
        await waitFor(() => expect(panel.contains(doc.activeElement), 'focus moves into the Panel').toBe(true));
        await expect(p.surface.inert, 'the Page under the Blanket is inert').toBe(true);
        await expect(p.coveredSidebar().inert, 'the Sidebar under the Blanket is inert').toBe(true);
        await expect(p.sidebar(), 'and out of the accessibility tree').toBeNull();
        await expect(p.frame.querySelector('.plus-frame__topbar').inert, 'the Topbar stays live').toBe(false);
        // Tab and Shift+Tab stay inside the Panel.
        for (let i = 0; i < 4; i += 1) {
            await userEvent.tab();
            // Tabbing past either end lands on a focus guard, which sends focus back in.
            await waitFor(() => expect(panel.contains(doc.activeElement), 'Tab stays in the Panel').toBe(true));
        }
        await userEvent.tab({ shift: true });
        await waitFor(() => expect(panel.contains(doc.activeElement), 'Shift+Tab stays in the Panel').toBe(true));

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel(), 'Escape closes it').toBeNull());
        await waitFor(() => expect(doc.activeElement, 'focus goes back to the opener').toBe(opener));
        await expect(p.surface.inert, 'the Page is live again').toBe(false);
        await expect(p.sidebar().inert, 'and the Sidebar').toBe(false);

        // Closed from inside, by its Close button, focus goes back to the opener too.
        await openPanel(p);
        await userEvent.click(within(p.panel()).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        await waitFor(() => expect(doc.activeElement, 'Close hands focus back').toBe(opener));
    }),
};

/** 1440: a docked Panel is not modal. Opening it leaves focus where it was, and nothing goes inert. */
export const DockedPanelIsNotModalAt1440 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        const opener = p.canvas.getByRole('button', { name: 'Open chat' });
        opener.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(p.panel(), 'the Panel opens').not.toBeNull());
        const panel = p.panel();
        await expect(p.landmark(), 'still the complementary landmark').toBe(panel);
        await expect(panel).not.toHaveAttribute('aria-modal');
        await expect(doc.activeElement, 'focus stays on the opener').toBe(p.canvas.getByRole('button', { name: 'Close chat' }));
        await expect(p.surface.inert, 'the Page stays live').toBe(false);
        await expect(p.sidebar().inert, 'and the Sidebar').toBe(false);
        // Escape and a press on the Page leave a docked Panel open.
        await userEvent.keyboard('{Escape}');
        await userEvent.click(p.content);
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        await expect(p.panel(), 'a docked Panel stays open').toBe(panel);
    }),
};

/** 1100: a field in the Panel keeps its own Escape; the next Escape closes the Panel. */
export const PanelFieldKeepsEscapeAt1100 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        const field = within(p.panel()).getByRole('textbox', { name: 'Ask' });
        await userEvent.click(field);
        await userEvent.type(field, 'hello');
        await userEvent.keyboard('{Escape}');
        await expect(field, 'Escape cleared the field').toHaveValue('');
        await expect(p.panel(), 'and left the Panel open').not.toBeNull();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel(), 'the next Escape closes it').toBeNull());
    }),
};

/** 1200: a docked Panel does not take Escape, so Escape still closes a Sidebar peek. */
export const DockedPanelLeavesEscapeAt1200 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1200, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses beside the docked Panel').toBeNull());
        await peekSidebar(p);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.sidebar(), 'Escape closes the peek').toBeNull());
        await expect(p.panel(), 'the docked Panel stays open').not.toBeNull();
    }),
};

/** 1200: opened from the Sidebar it collapses, the docked Panel takes focus; closed, focus goes to the toggle, since its opener left. */
export const DockedPanelTakesLostFocusAt1200 = {
    render: (args) => <WithPanel {...args} sidebar={<ChatSidebar />} />,
    play: async ({ canvasElement }) => atViewport(1200, async () => {
        const p = panelParts(canvasElement);
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        p.canvas.getByRole('button', { name: 'Ask AI' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(p.panel()).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses').toBeNull());
        await expect(getComputedStyle(p.panel()).position, 'docked').not.toBe('absolute');
        await waitFor(() => expect(doc.activeElement, 'focus moves into the Panel').toBe(p.panel()));
        await expect(p.surface.inert, 'docked, nothing goes inert').toBe(false);
        await userEvent.click(within(p.panel()).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        await waitFor(() => expect(doc.activeElement, 'focus goes to the toggle').toBe(p.toggle));
    }),
};

/** 1100: a Topbar button that controls the Panel toggles it itself; its press is not an outside press that would close and reopen it. */
export const TopbarTriggerTogglesOverlayAt1100 = {
    render: (args) => <WithPanel {...args} withTopbarTrigger />,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        const trigger = p.canvas.getByRole('button', { name: 'Chat' });
        await userEvent.click(trigger);
        await waitFor(() => expect(p.panel(), 'the trigger opens it').not.toBeNull());
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        await userEvent.click(trigger);
        await waitFor(() => expect(p.panel(), 'and closes it').toBeNull());
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        await expect(p.panel(), 'not closed and reopened').toBeNull();
    }),
};

/** 1100: resizing an overlay Panel never collapses the default Sidebar: the narrowest it goes still leaves the Panel too wide to dock alone. */
export const OverlaySplitterKeepsSidebarAt1100 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        const splitter = p.splitter();
        // 1100 - 48 - 720 = 332 would let the Panel dock alone, so the floor is one above it.
        await expect(splitter).toHaveAttribute('aria-valuemin', '333');
        splitter.focus();
        await userEvent.keyboard('{Home}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '333'));
        await expect(p.coveredSidebar(), 'the Sidebar stays docked').not.toBeNull();
        await expect(getComputedStyle(p.panel()).position, 'still an overlay').toBe('absolute');
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '640'));
        await expectOverlayPanel(p, 640);
    }),
};

/** 768: the Panel is an overlay capped at 320, and only one overlay is open at a time. */
export const OneOverlayAt768 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-min-width'));
        await expectBlanket(p);
        await expect(p.splitter(), 'no splitter under 1024').toBeNull();
        // Hovering the toggle under the Blanket does not peek the Sidebar.
        await userEvent.hover(p.toggle);
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        await expect(p.sidebar(), 'no second overlay').toBeNull();
        // Opening the Sidebar by hand closes the Panel.
        await userEvent.click(p.toggle);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar opens as an overlay').not.toBeNull());
        await waitFor(() => expect(p.panel(), 'and the Panel closes').toBeNull());
        await userEvent.unhover(p.toggle);
        // Opening the Panel closes the overlay Sidebar.
        p.canvas.getByRole('button', { name: 'Open chat' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(p.panel()).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the Sidebar gives way').toBeNull());
    }),
};

/** 600: under 768 the Panel opens full width. */
export const FullWidthUnder768 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(600, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, rect(p.frame).width);
    }),
};

const panelWidthNow = (p) => rect(p.panel()).width;

/** 1440: the splitter is a separator with its value; arrows step 16, Shift 64, Home and End go to the limits, and the limit keeps 720 beside the docked Sidebar. */
export const SplitterKeyboardAt1440 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        const splitter = p.splitter();
        await expect(splitter).toHaveAttribute('aria-orientation', 'vertical');
        await expect(splitter).toHaveAttribute('aria-controls', p.panel().id);
        await expect(splitter).toHaveAttribute('aria-valuenow', '400');
        await expect(splitter).toHaveAttribute('aria-valuetext', '400 pixels');
        await expect(splitter).toHaveAttribute('aria-valuemin', String(tokenLength(p.frame, '--panel-min-width')));
        // 1440 - 240 - 48 - 720: the widest Panel that keeps the floor beside the docked Sidebar.
        await expect(splitter).toHaveAttribute('aria-valuemax', '432');

        splitter.focus();
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '416'));
        await expect(panelWidthNow(p)).toBeCloseTo(416, 0);
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '384'));
        await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '320'));
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '432'));
        await expect(panelWidthNow(p)).toBeCloseTo(432, 0);
        await expect(p.sidebar(), 'resizing never collapses the Sidebar').not.toBeNull();
        await expect(rect(p.content).width, 'content holds the floor').toBeCloseTo(tokenLength(p.frame, '--content-min-width'), 0);
        await userEvent.keyboard('{Home}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '320'));
    }),
};

const pointer = (el, type, clientX) => {
    const r = rect(el);
    el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX, clientY: r.top + r.height / 2,
    }));
};

/** 1440: a drag past the limit resists (damped, never more than 48 over) and springs back to the limit on release; the Sidebar stays docked. */
export const SplitterDragAt1440 = {
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        const splitter = p.splitter();
        const x = rect(splitter).left + rect(splitter).width / 2;
        pointer(splitter, 'pointerdown', x);
        pointer(splitter, 'pointermove', x - 20);
        await waitFor(() => expect(panelWidthNow(p), 'inside the range it follows the pointer').toBeCloseTo(420, 0));
        pointer(splitter, 'pointermove', x - 300);
        await waitFor(() => expect(panelWidthNow(p), 'past the limit it stretches').toBeGreaterThan(432));
        await expect(panelWidthNow(p), 'but resists: far less than the pointer moved').toBeLessThan(432 + 48);
        await expect(p.sidebar(), 'mid-drag the Sidebar stays docked').not.toBeNull();
        pointer(splitter, 'pointerup', x - 300);
        await waitFor(() => expect(panelWidthNow(p), 'springs back to the limit').toBeCloseTo(432, 0));
        await expect(splitter).toHaveAttribute('aria-valuenow', '432');
        await expect(p.sidebar(), 'and the Sidebar never collapsed').not.toBeNull();

        // Past the minimum it resists the other way and settles at 320.
        const x2 = rect(splitter).left + rect(splitter).width / 2;
        pointer(splitter, 'pointerdown', x2);
        pointer(splitter, 'pointermove', x2 + 400);
        await waitFor(() => expect(panelWidthNow(p)).toBeLessThan(320));
        await expect(panelWidthNow(p)).toBeGreaterThan(320 - 48);
        pointer(splitter, 'pointerup', x2 + 400);
        await waitFor(() => expect(panelWidthNow(p)).toBeCloseTo(320, 0));
    }),
};

/** The Panel's width and open state are kept in sessionStorage, so a reload in the same tab finds it as it was. */
const Remountable = (args) => {
    const [mount, setMount] = useState(0);
    return (
        <>
            <Button text="Reload" className="frame-story-reload" onClick={() => setMount((n) => n + 1)} />
            <WithPanel key={mount} {...args} />
        </>
    );
};

/** Remounts the Frame and waits for the new one. */
const reload = async (canvasElement, before) => {
    canvasElement.querySelector('.frame-story-reload').click();
    await waitFor(() => expect(canvasElement.querySelector('.plus-frame'), 'a fresh Frame').not.toBe(before));
    return panelParts(canvasElement);
};

export const PanelRememberedForTheTab = {
    render: Remountable,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        let p = panelParts(canvasElement);
        await openPanel(p);
        p.splitter().focus();
        await userEvent.keyboard('{Home}');
        await waitFor(() => expect(p.splitter()).toHaveAttribute('aria-valuenow', '320'));
        await expect(JSON.parse(window.sessionStorage.getItem(PANEL_STORAGE_KEY))).toEqual({ open: true, width: 320 });

        p = await reload(canvasElement, p.frame);
        await waitFor(() => expect(p.panel(), 'open after the reload').not.toBeNull());
        await expect(panelWidthNow(p), 'at the width it was left').toBeCloseTo(320, 0);

        await userEvent.click(within(p.panel()).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        p = await reload(canvasElement, p.frame);
        await expect(p.panel(), 'closed after the reload').toBeNull();
    }),
};

/** The peek is off by default; turned on, hovering the right edge peeks a closed Panel over the Page with no Blanket. */
export const PanelPeek = {
    render: WithPanel,
    args: { panelPeek: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        const edge = p.frame.querySelector('.plus-frame__panel-edge');
        await expect(edge, 'a hover strip on the right edge').not.toBeNull();
        const contentWidth = rect(p.content).width;
        await userEvent.hover(edge);
        await waitFor(() => expect(p.panel(), 'the Panel peeks').not.toBeNull());
        await expect(getComputedStyle(p.panel()).position, 'over the Page').toBe('absolute');
        await expect(p.blanket(), 'a peek has no Blanket').toBeNull();
        await expect(rect(p.content).width, 'the Page does not move').toBeCloseTo(contentWidth, 0);
        await expect(p.splitter(), 'a peek does not resize').toBeNull();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel(), 'Escape closes the peek').toBeNull());
    }),
};

export const NoPanelPeekByDefault = {
    render: WithPanel,
    play: async ({ canvasElement }) => {
        const p = panelParts(canvasElement);
        await expect(p.frame.querySelector('.plus-frame__panel-edge'), 'no hover strip').toBeNull();
    },
};

/** 1440 with List and detail: both docked would leave 752, under the 960 split, so the default Sidebar collapses to keep it (992). */
export const ListDetailKeepsSplitAt1440 = {
    render: WithPanel,
    args: { listDetail: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await openPanel(p);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses first').toBeNull());
        await expect(getComputedStyle(p.panel()).position).not.toBe('absolute');
        await expect(rect(p.content).width, '1440 - 400 - 48').toBeCloseTo(992, 0);
    }),
};

/** 1440 with List and detail: the splitter's limit keeps 960 of content, so dragging to it never breaks the split. */
export const ListDetailSplitterKeepsSplitAt1440 = {
    render: WithPanel,
    args: { listDetail: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        const splitter = p.splitter();
        // 1440 - 48 - 960, with the Sidebar collapsed to keep the split.
        await expect(splitter).toHaveAttribute('aria-valuemax', '432');
        splitter.focus();
        await userEvent.keyboard('{End}');
        await waitFor(() => expect(splitter).toHaveAttribute('aria-valuenow', '432'));
        await expect(rect(p.content).width, 'content keeps 960').toBeGreaterThanOrEqual(960 - 0.5);
    }),
};
