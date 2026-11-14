import React, { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Breadcrumb, Button, IconButton, Logo, Modal, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, ProgressTracker, Sidebar, Skeleton, TextField } from '@/components';
import { Frame, PANEL_STORAGE_KEY, PatternSection, usePanelControl, useSidebarControl } from '@/patterns';
import { FRAME_LAYOUT } from './frameLayout';
import { BrowserWindow, LiveAnatomy, ScaledStory } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { BAR_TOKEN, FocusedType, STEPS_RAIL, WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { computedShadow, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { PAGE_EDGE } from '@/patterns/Page';
import { MotionPreferenceContext } from '@/lib/motionPreference';

/**
 * Frame — the app frame: the Sidebar beside the Page (and the Panel), with no
 * top bar. Open, the Sidebar's own toggle ends its logo row; closed, the
 * Frame draws the toggle at the Page's top left.
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
    title: 'Templates/Frame',
    id: 'templates-frame',
    component: Frame,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    // Each story starts with nothing remembered for the Panel.
    beforeEach: () => { window.sessionStorage.removeItem(PANEL_STORAGE_KEY); },
    render: FrameWithSlots,
    decorators: [
        // The geometry stories read settled layouts after clicks, so they hold motion off; the Space
        // motion stories below pin it on or off explicitly.
        (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>,
        // A width story renders at its stated width whatever the preview is. The
        // Frame sizes itself from its own box, so a box of that width makes it dock
        // or float as it does there. The runner also resizes the viewport to match.
        (Story, { parameters }) => (parameters.frameWidth
            ? <div style={{ width: parameters.frameWidth, minWidth: parameters.frameWidth }}><Story /></div>
            : <Story />),
    ],
    // The preview's `^on[A-Z]` actions rule skips an arg that is already a key, so naming
    // these keeps an ordinary page from getting a Back or Close. Focused stories pass their own.
    args: { onBack: undefined, onClose: undefined },
    argTypes: {
        onBack: { control: false, table: { disable: true } },
        onClose: { control: false, table: { disable: true } },
        children: { table: { disable: true } },
        header: { table: { disable: true } },
        sidebar: { table: { disable: true } },
        style: { table: { disable: true } },
        sidebarDocked: {
            control: 'select',
            options: [undefined, true, false],
            table: { category: 'Design' },
        },
        surfaceDirect: {
            control: 'boolean',
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
            table: { category: 'Design' },
        },
        panelPeek: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        sectionDetail: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        contentAs: { control: false, table: { disable: true } },
        contentClassName: { control: false, table: { disable: true } },
        width: {
            control: 'select',
            options: ['content', 'reading'],
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
        // The toggle that shows: the Page's (Open sidebar) while the Sidebar is
        // closed, else the Sidebar's own (Close sidebar). Read it when needed.
        get toggle() {
            return canvas.queryByRole('button', { name: 'Open sidebar' }) ?? canvas.queryByRole('button', { name: 'Close sidebar' });
        },
        pageToggle: () => canvas.queryByRole('button', { name: 'Open sidebar' }),
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

/**
 * The toggle sits on the logo row's center line (y 28): closed, at the Page's
 * top left on the icon column (x 32); open, at the end of the Sidebar's logo
 * row on the trailing column (x 208).
 */
const expectToggleHome = async (frame, toggle) => {
    const at = offset(frame, toggle);
    const r = rect(toggle);
    const open = toggle.getAttribute('aria-label') === 'Close sidebar';
    await expect(at.x + r.width / 2, open ? 'toggle on the trailing column' : 'toggle on the icon column').toBeCloseTo(open ? 208 : 32, 0);
    await expect(at.y + r.height / 2, 'toggle on the logo row\'s center line').toBeCloseTo(28, 0);
    await expect(r.height, 'toggle height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
};

/** No top bar: nothing sits above the Sidebar and the Page. */
const expectNoTopbar = async (frame) => {
    await expect(frame.querySelector('.plus-frame__topbar'), 'no top bar').toBeNull();
};

/** A floating sidebar (peek or under 1024): overlay fill and shadow, over the page, and no Backdrop under it. */
const expectFloating = async (frame, aside, surface, surfaceLeftBefore) => {
    await expect(getComputedStyle(aside).position).toBe('absolute');
    await expect(getComputedStyle(aside).boxShadow, 'floating sidebar shadow')
        .toBe(computedShadow(frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(aside).width, 'sidebar width').toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
    await inEveryColorMode(async (mode) => {
        await expect(getComputedStyle(aside).backgroundColor, `${mode}: on the overlay fill`).toBe(tokenColor(frame, '--ds-surface-overlay'));
    });
    await expect(rect(aside).top, 'the raised sidebar runs from the top').toBeCloseTo(rect(frame).top, 0);
    await expect(rect(aside).bottom, 'the raised sidebar runs to the foot').toBeCloseTo(rect(frame).bottom, 0);
    await expect(rect(surface).left, 'the surface did not move').toBeCloseTo(surfaceLeftBefore, 0);
    // No Backdrop: a point on the page beside the sidebar still hits the page.
    const s = rect(surface);
    const hit = document.elementFromPoint(s.right - 40, s.top + 40);
    await expect(surface.contains(hit), 'nothing covers the page beside the floating sidebar').toBe(true);
};

const atViewport = (width, run) => withTestViewport(width, HEIGHT, run);

/** No seams: there is no top bar, and the Page runs to the top, right and bottom edges. */
const expectNoSeam = async (frame, surface) => {
    await expectNoTopbar(frame);
    await expect(rect(surface).top - rect(frame).top, 'the Page runs to the top').toBeCloseTo(0, 0);
    await expect(rect(frame).right - rect(surface).right, 'no seam on the right').toBeCloseTo(0, 0);
    await expect(rect(frame).bottom - rect(surface).bottom, 'no seam at the bottom').toBeCloseTo(0, 0);
};

/** The Page is flush: no corner rounds, docked or not. */
const expectCorner = async (frame, surface) => {
    const style = getComputedStyle(surface);
    await expect(px(style.borderTopLeftRadius), 'top-left is square').toBeCloseTo(0, 0);
    await expect(px(style.borderTopRightRadius), 'top-right is square').toBeCloseTo(0, 0);
    await expect(px(style.borderBottomRightRadius), 'bottom-right is square').toBeCloseTo(0, 0);
    await expect(px(style.borderBottomLeftRadius), 'bottom-left is square').toBeCloseTo(0, 0);
};

/* ------------------------------------------------------------- stories */

export const Overview = {
    // An ordinary page: no Back, no Close. Only a focused page shows them.
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: 'Back' }), 'no Back on an ordinary page').toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Close' }), 'no Close on an ordinary page').toBeNull();
        await expect(canvasElement.querySelector('.plus-frame__back, .plus-frame__close'), 'no Back or Close in the header row').toBeNull();
    },
};

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
        await waitFor(() => expect(getComputedStyle(sidebar()).position, 'docked at 1024, in flow').not.toBe('absolute'));
        const aside = sidebar();
        await expect(rect(aside).right, 'the sidebar sits flush against the surface').toBeCloseTo(rect(surface).left, 0);
        const edgeLine = 'var(--border-default) 0 0 0 var(--ds-border)';
        await expect(tokenLength(frame, '--stroke-2'), 'the surface edge covers the divider')
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
            await expect(asideStyle.backgroundColor, `${mode}: the docked sidebar stays sunken`).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
            await expect(asideStyle.boxShadow, `${mode}: the docked sidebar's 1px edge in the border color`)
                .toBe(computedShadow(canvasElement, edgeLine));
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

/** The content grid at the docs height: a full-width child, then a 4 and an 8. */
export const DocsContentGrid = {
    render: (args) => (
        <InAppFrame {...args} height={DOCS_HEIGHT}>
            {slot('Full width')}
            <div style={{ gridColumn: 'span 4' }}>{slot('4 columns')}</div>
            <div style={{ gridColumn: 'span 8' }}>{slot('8 columns')}</div>
        </InAppFrame>
    ),
    parameters: { layout: 'padded' },
};

/*
 * The do and don't pairs on the docs page draw these in an iframe at a real
 * screen width (`ModeFrame`), since the Frame sizes itself from its own box.
 * No play: they are pictures.
 */

/** Do: an app page supplies its Sidebar, its breadcrumb and its content. */
export const PairWithSidebar = {};

/** Don't: the same page with no Sidebar, so there is no navigation and no toggle. */
export const PairWithoutSidebar = { args: { sidebar: undefined } };

/** Don't: a page title in the header row in place of the breadcrumb. */
export const PairTitleInHeader = {
    args: { header: <span style={{ font: 'var(--heading-large)', color: 'var(--ds-text)' }}>Dashboard</span> },
};

/** The playground: the frame at the docs height, with its layout props live. */
export const Interactive = {
    render: DocsFrame,
    args: { width: 'content', sectionDetail: false, surfaceDirect: false },
    parameters: { layout: 'padded' },
};

/**
 * The sidebar floating: a closed sidebar peeked over the page. The story
 * hovers the frame's left edge once it mounts, which is what a pointer does.
 */
const FrameDemo = ({ peek = false, ...args }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (!peek) return;
        const edge = ref.current?.querySelector('.plus-frame__edge');
        edge?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    }, [peek]);
    return (
        <div ref={ref}>
            <FrameWithSlots {...args} sidebarDocked={peek ? false : args.sidebarDocked} height={DOCS_HEIGHT} />
        </div>
    );
};

const PeekedFrame = (args) => <FrameDemo {...args} peek />;

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

/** 768: the Sidebar is collapsed; the left edge peeks it, an outside click closes it, the toggle opens it as an overlay (it never docks under 1024). */
export const Medium768 = {
    parameters: { frameWidth: 768 },
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        const { frame, surface, content, sidebar, edge } = p;
        await waitFor(() => expect(sidebar(), `closed below 1024 (found ${sidebar()?.className}, viewport ${window.innerWidth})`).toBeNull());
        const toggle = p.toggle;
        await expectToggleHome(frame, toggle);
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');

        await expect(offset(frame, surface).x, 'surface starts at the window edge').toBeCloseTo(0, 0);
        await expect(surfacePad(surface), 'surface pad').toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface), 'surface pad is 24 at every width').toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width, 'content width').toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectNoSeam(frame, surface);

        // Hovering the toggle peeks nothing: the toggle is a button, not a hover zone.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(toggle);
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        await expect(sidebar(), 'no peek from the toggle').toBeNull();
        await userEvent.unhover(toggle);

        // Hovering the left edge peeks it, floating.
        await userEvent.hover(edge());
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
        await expectCorner(frame, surface);

        // An outside click closes it.
        await userEvent.click(surface);
        await waitFor(() => expect(sidebar()).toBeNull());

        // Hovering the left edge again peeks it again.
        await userEvent.hover(edge());
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);

        // Escape closes a peek.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(sidebar()).toBeNull());

        // A click opens it by hand. Under 1024 it never docks: it floats over the Page as an overlay.
        await userEvent.click(p.toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await new Promise((resolve) => { setTimeout(resolve, 400); });
        await expect(sidebar(), 'it stays open once the pointer leaves').not.toBeNull();
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
        await expect(p.toggle, 'the Sidebar\'s own toggle now').toHaveAttribute('aria-label', 'Close sidebar');
        await expect(p.toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(rect(content).width, 'the Page keeps its width').toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectCorner(frame, surface);
        await expectToggleHome(frame, p.toggle);

        // An outside click closes an overlay Sidebar.
        await userEvent.click(surface);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expect(p.toggle).toHaveAttribute('aria-expanded', 'false');
    }),
};

/** 1024: the sidebar docks; the toggle closes it and does not move. */
export const Large1024 = {
    parameters: { frameWidth: 1024 },
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = parts(canvasElement);
        const { frame, surface, content, sidebar } = p;
        await waitFor(() => expect(sidebar(), 'docked from 1024').not.toBeNull());
        await expectToggleHome(frame, p.toggle);
        await expect(getComputedStyle(sidebar()).position).not.toBe('absolute');
        await expect(offset(frame, surface).x).toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface), 'surface pad is 24 at every width').toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-width'), 0);
        await expectNoSeam(frame, surface);
        await expectCorner(frame, surface);

        // Landmarks: the Page is the main, the Sidebar's nav is the navigation, and nothing is a bare "sidebar" aside.
        await expect(p.canvas.getByRole('main')).toBe(content);
        await expect(p.canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        await expect(frame.querySelector('aside'), 'no aside landmark').toBeNull();

        // The sidebar's rows are the 32 item height.
        const tab = within(sidebar()).getAllByRole('button')[0];
        await expect(rect(tab).height, 'sidebar row height').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);

        await userEvent.click(p.toggle);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expect(offset(frame, surface).x, 'closed: the surface runs to the window edge').toBeCloseTo(0, 0);
        await expectCorner(frame, surface);
        await expectToggleHome(frame, p.toggle);
        await waitFor(() => expect(p.toggle, 'focus follows to the Page\'s toggle').toHaveFocus());

        // Closed at 1024, the left edge still peeks without pushing.
        const surfaceLeft = rect(surface).left;
        await userEvent.hover(p.edge());
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectFloating(frame, sidebar(), surface, surfaceLeft);
    }),
};

/** Ctrl+[ toggles the Sidebar, and the corner follows it in the same frame. */
export const CtrlBracketToggle = {
    parameters: { frameWidth: 1440 },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = parts(canvasElement);
        const { frame, surface, sidebar } = p;
        await waitFor(() => expect(sidebar(), 'docked at 1440').not.toBeNull());
        await expectCorner(frame, surface);
        await expect(p.toggle).toHaveAttribute('aria-keyshortcuts', 'Control+[ Meta+[');

        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ closes it').toBeNull());
        await expect(offset(frame, surface).x, 'the Page runs to the window edge').toBeCloseTo(0, 0);
        await expectCorner(frame, surface);

        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ opens it again').not.toBeNull());
        await expect(offset(frame, surface).x).toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
        await expectCorner(frame, surface);
    }),
};

/** Ctrl+[ under 1024 opens the Sidebar as an overlay, since it never docks there, and closes it again. */
export const CtrlBracketAt768 = {
    parameters: { frameWidth: 768 },
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const { frame, surface, sidebar } = parts(canvasElement);
        await expect(sidebar()).toBeNull();
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ opens it').not.toBeNull());
        await expect(getComputedStyle(sidebar()).position, 'as an overlay, not docked').toBe('absolute');
        await expectCorner(frame, surface);
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(sidebar(), 'Ctrl+[ closes it').toBeNull());
    }),
};

/** The Page meets the Sidebar at a hairline: the Sidebar's 1px edge lies on the Page's first pixel, with no gap. */
export const SidebarMeetsPage = {
    parameters: { frameWidth: 1440 },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, surface, sidebar } = parts(canvasElement);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expect(rect(sidebar()).right, 'no gap between the Sidebar and the Page').toBeCloseTo(rect(surface).left, 0);
        await expect(getComputedStyle(sidebar()).boxShadow, 'a 1px edge in the border color')
            .toBe(computedShadow(frame, 'var(--border-default) 0 0 0 var(--ds-border)'));
        await expectNoSeam(frame, surface);
    }),
};

/** 1440: the surface pads 24. */
export const XLarge1440 = {
    parameters: { frameWidth: 1440 },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = parts(canvasElement);
        const { frame, surface, content, sidebar } = p;
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectToggleHome(frame, p.toggle);
        await expect(surfacePad(surface), 'surface pad from 1440').toBeCloseTo(tokenLength(frame, '--page-pad'), 0);
        await expect(surfacePad(surface)).toBeCloseTo(tokenLength(frame, '--space-150'), 0);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-width'), 0);
    }),
};

/** 1600: content caps at 1232 and centers in the surface. */
export const Wide1600 = {
    parameters: { frameWidth: 1600 },
    play: async ({ canvasElement }) => atViewport(1600, async () => {
        const p = parts(canvasElement);
        const { frame, surface, content } = p;
        await waitFor(() => expect(p.toggle).not.toBeNull());
        await expectToggleHome(frame, p.toggle);
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
    parameters: { frameWidth: 1440 },
    args: { width: 'reading' },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const { frame, content } = parts(canvasElement);
        await expect(rect(content).width).toBeCloseTo(tokenLength(frame, '--content-max-width-reading'), 0);
    }),
};

/** The content grid: 12 columns with a 16 gutter, children span the whole row by default. */
export const ContentGrid = {
    parameters: { frameWidth: 1440 },
    render: (args) => (
        <div style={{ height: '100vh' }}>
            <Frame sidebar={<Sidebar user="tutor" account={{ id: 'story', name: 'John Doe', role: 'Tutor' }} />} {...args}>
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
 * sidebar, so focus goes to the Page's toggle instead.
 */
const WithModal = (args) => {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    return (
        <div style={{ height: '100vh' }}>
            <Frame
                header={<Breadcrumb items={[{ text: 'Home', href: '#' }, { text: 'Dashboard' }]} />}
                sidebar={(
                    <>
                        <Sidebar user="tutor" activeTabId="home" account={{ id: 'story', name: 'John Doe', role: 'Tutor' }} />
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

/** Hover the frame's left edge until the sidebar floats over the page. */
const peekSidebar = async ({ edge, sidebar }) => {
    await waitFor(() => expect(edge()).not.toBeNull());
    await userEvent.hover(edge());
    await waitFor(() => expect(sidebar()).not.toBeNull());
    await expect(getComputedStyle(sidebar()).position, 'floating').toBe('absolute');
};

/** 768: a modal opened from the page closes the floating sidebar; Escape closes the modal only. */
export const ModalClosesFloatingSidebar = {
    parameters: { frameWidth: 768 },
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
    parameters: { frameWidth: 768 },
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
    parameters: { frameWidth: 1024 },
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'docked from 1024').not.toBeNull());

        const trigger = p.canvas.getByRole('button', { name: 'Page settings' });
        await userEvent.click(trigger);
        await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
        await expect(p.sidebar(), 'hidden from assistive tech under the modal').toBeNull();
        await expect(p.coveredSidebar(), 'still docked').not.toBeNull();
        await expect(getComputedStyle(p.coveredSidebar()).position).not.toBe('absolute');

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(dialog(canvasElement)).toBeNull());
        await expect(p.sidebar(), 'still docked after Escape').not.toBeNull();
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus is back on the trigger').toBe(trigger));
    }),
};

/** 768: a Sidebar the user opened is an overlay under 1024, so a modal closes it like a peek. */
export const ModalClosesOverlaySidebarAt768 = {
    parameters: { frameWidth: 768 },
    render: WithModal,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.toggle);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
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
 * The Panel area: the Frame's right-hand area, full height. The layout
 * resolver decides whether it docks beside the Page at a hairline or opens
 * over it with no Backdrop. Each story sets the viewport first, then opens the
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
    const control = useSidebarControl();
    return (
        <nav aria-label="Main">
            {/* A sidebar of its own still draws the Frame's toggle, as the Sidebar pattern does. */}
            <IconButton appearance="subtle" icon="angles-left" label="Close sidebar" {...control?.closeProps} />
            <Button text="Ask AI" onClick={() => panel?.setOpen(true)} />
        </nav>
    );
};

/** A button in the Page's header row that controls the Panel, the way an app's chat button sits beside its breadcrumb. */
const HeaderChatTrigger = () => {
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

const WithPanel = ({ withModal = false, withHeaderTrigger = false, ...args }) => {
    const [modal, setModal] = useState(false);
    const header = withHeaderTrigger ? (
        <div style={{ display: 'flex', flex: '1 1 auto', alignItems: 'center', justifyContent: 'space-between' }}>
            <Breadcrumb items={[{ text: 'Home', href: '#' }, { text: 'Dashboard' }]} />
            <HeaderChatTrigger />
        </div>
    ) : undefined;
    return (
        <>
            <InAppFrame
                panel={<ChatPanel onSettings={withModal ? () => setModal(true) : undefined} />}
                panelLabel="AI chat"
                {...(header ? { header } : {})}
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
        // Spreading reads the toggle once; keep it a live getter.
        get toggle() { return p.toggle; },
        panel: () => p.frame.querySelector('.plus-frame__panel'),
        landmark: () => p.canvas.queryByRole('complementary', { name: 'AI chat' }),
        splitter: () => p.canvas.queryByRole('separator', { name: /resize/i }),
        backdrop: () => p.frame.querySelector('.plus-frame__backdrop'),
        openButton: () => p.canvas.getByRole('button', { name: /chat/i }),
    };
};

const openPanel = async (p) => {
    await userEvent.click(p.canvas.getByRole('button', { name: 'Open chat' }));
    await waitFor(() => expect(p.panel(), 'the Panel opens').not.toBeNull());
};

/** 1440 with a 400 Panel: both fit at the 720 floor, so the Sidebar and the Panel dock, and the Page meets the Panel at a hairline. */
export const PanelDockedAt1440 = {
    parameters: { frameWidth: 1440 },
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
        await expect(rect(panel).top, 'full height, from the top').toBeCloseTo(rect(p.frame).top, 0);
        await expect(rect(p.surface).right, 'the Page meets the Panel').toBeCloseTo(rect(panel).left, 0);
        await expect(px(getComputedStyle(panel).borderLeftWidth), 'at a hairline').toBeCloseTo(tokenLength(p.frame, '--stroke-1'), 1);
        await expect(getComputedStyle(panel).borderLeftColor, 'the start edge draws in the border color').toBe(tokenColor(p.frame, '--ds-border'));
        await expect(getComputedStyle(panel).backgroundColor, 'docked, the Panel is the Page fill').toBe(tokenColor(p.frame, '--ds-surface'));
        await expect(p.sidebar(), 'the Sidebar stays docked').not.toBeNull();
        await expect(rect(p.content).width, 'content 1440 - 240 - 400 - 48').toBeCloseTo(752, 0);
        await expect(p.backdrop(), 'docked has no Backdrop').toBeNull();
        // Landmark order: nav, main, panel.
        const main = p.canvas.getByRole('main');
        await expect(main.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel(), 'Close closes it').toBeNull());
    }),
};

/** An overlay Panel floats: no Backdrop is drawn, and a point on the Page lands on the Page, not on a layer over it. */
const expectNoBackdrop = async (p) => {
    await expect(p.backdrop(), 'an overlay Panel has no Backdrop').toBeNull();
    await expect(p.frame.querySelector('.plus-pattern-backdrop'), 'and no shared Backdrop either').toBeNull();
    const s = rect(p.surface);
    const hit = document.elementFromPoint(s.left + 40, s.top + 40);
    await expect(p.frame.contains(hit), 'a point on the Page lands inside the Frame').toBe(true);
    await expect(hit.closest('.plus-frame__panel'), 'and not on the Panel').toBeNull();
};

const expectOverlayPanel = async (p, width) => {
    const panel = p.panel();
    await expect(getComputedStyle(panel).position, 'over the Page').toBe('absolute');
    await expect(getComputedStyle(panel).boxShadow).toBe(computedShadow(p.frame, 'var(--ds-shadow-overlay)'));
    await expect(rect(panel).width, 'overlay width').toBeCloseTo(width, 0);
    await expect(rect(panel).right).toBeCloseTo(rect(p.frame).right, 0);
    await expect(rect(panel).top).toBeCloseTo(rect(p.frame).top, 0);
};

/** 1200 with a 400 Panel: both would leave 512, the Panel alone 752, so the default Sidebar collapses and comes back when the Panel closes. */
export const PanelAutoCollapsesSidebarAt1200 = {
    parameters: { frameWidth: 1200 },
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1200, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'docked at 1200').not.toBeNull());
        await expectCorner(p.frame, p.surface);
        await openPanel(p);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses to keep 720').toBeNull());
        await expect(getComputedStyle(p.panel()).position).not.toBe('absolute');
        await expect(offset(p.frame, p.surface).x, 'the Page runs to the left edge').toBeCloseTo(0, 0);
        await expect(rect(p.content).width, '1200 - 400 - 48').toBeCloseTo(752, 0);
        await expectCorner(p.frame, p.surface);
        await expect(p.toggle).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(within(p.panel()).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        await waitFor(() => expect(p.sidebar(), 'restored when the Panel closes').not.toBeNull());
        await expectCorner(p.frame, p.surface);
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement, 'focus goes back to what opened it')
            .toBe(p.canvas.getByRole('button', { name: 'Open chat' })));
    }),
};

/** 1100 with a 400 Panel: even the Panel alone leaves 652, so it floats over the Page with no Backdrop; a press outside closes it. */
export const PanelOverlayAt1100 = {
    parameters: { frameWidth: 1100 },
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        await expect(p.coveredSidebar(), 'the Sidebar stays docked under the Panel, out of reach').not.toBeNull();
        await expect(rect(p.content).width, 'the Page keeps its width').toBeCloseTo(1100 - 240 - 48, 0);
        await expectNoBackdrop(p);

        // A press on the Page, outside the Panel, closes it.
        await userEvent.click(p.surface);
        await waitFor(() => expect(p.panel(), 'a press outside closes it').toBeNull());
        await expect(p.backdrop()).toBeNull();

        // Escape closes it too.
        await openPanel(p);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel(), 'Escape closes it').toBeNull());
    }),
};

/** 1300: the Panel docks by collapsing the default Sidebar; opening the Sidebar by hand wins, so the Panel moves to overlay. */
export const SidebarByHandWinsAt1300 = {
    parameters: { frameWidth: 1300 },
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(1300, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await waitFor(() => expect(p.sidebar()).toBeNull());
        const panel = p.panel();
        await expect(getComputedStyle(panel).position).not.toBe('absolute');
        // Docked, the Panel has no Backdrop, so the Page's toggle is pressable.
        await userEvent.click(p.toggle);
        // The Panel moves to overlay, so the docked Sidebar is under it, out of reach.
        await waitFor(() => expect(p.coveredSidebar(), 'opened by hand, it docks').not.toBeNull());
        await expect(getComputedStyle(p.coveredSidebar()).position).not.toBe('absolute');
        await expect(p.panel(), 'the same Panel, not remounted').toBe(panel);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        await expectNoBackdrop(p);
        // Now an overlay, it is modal: focus moves in and the Page goes inert.
        await waitFor(() => expect(panel.contains(canvasElement.ownerDocument.activeElement), 'focus moves into the Panel').toBe(true));
        await expect(p.surface.inert).toBe(true);
    }),
};

/** 1440: a Modal over a docked Panel leaves it open; closing the Modal finds it still there. */
export const ModalLeavesPanelOpen = {
    parameters: { frameWidth: 1440 },
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
    parameters: { frameWidth: 1100 },
    render: (args) => <WithPanel {...args} withModal />,
    play: async ({ canvasElement }) => atViewport(1100, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-width-default'));
        // The Page is inert under the Panel, so the Modal is raised from inside the Panel.
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
 * Sidebar under it are inert, Tab stays inside it, and closing it
 * hands focus back to the opener.
 */
export const OverlayPanelIsModalAt1100 = {
    parameters: { frameWidth: 1100 },
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
        await expect(p.surface.inert, 'the Page under the Panel is inert').toBe(true);
        await expect(p.coveredSidebar().inert, 'the Sidebar under the Panel is inert').toBe(true);
        await expect(p.sidebar(), 'and out of the accessibility tree').toBeNull();
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
    parameters: { frameWidth: 1440 },
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
    parameters: { frameWidth: 1100 },
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
    parameters: { frameWidth: 1200 },
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
    parameters: { frameWidth: 1200 },
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

/** 1100: a header button that controls the Panel toggles it itself; its press is not an outside press that would close and reopen it. */
export const HeaderTriggerTogglesOverlayAt1100 = {
    parameters: { frameWidth: 1100 },
    render: (args) => <WithPanel {...args} withHeaderTrigger />,
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
    parameters: { frameWidth: 1100 },
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
    parameters: { frameWidth: 768 },
    render: WithPanel,
    play: async ({ canvasElement }) => atViewport(768, async () => {
        const p = panelParts(canvasElement);
        await openPanel(p);
        await expectOverlayPanel(p, tokenLength(p.frame, '--panel-min-width'));
        await expectNoBackdrop(p);
        await expect(p.splitter(), 'no splitter under 1024').toBeNull();
        // Hovering the left edge under the Panel does not peek the Sidebar.
        await userEvent.hover(p.edge());
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        await expect(p.sidebar(), 'no second overlay').toBeNull();
        // Opening the Sidebar by hand (the toggle is inert under the Panel, so Ctrl+[) closes the Panel.
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(p.sidebar(), 'the Sidebar opens as an overlay').not.toBeNull());
        await waitFor(() => expect(p.panel(), 'and the Panel closes').toBeNull());
        // Opening the Panel closes the overlay Sidebar.
        p.canvas.getByRole('button', { name: 'Open chat' }).focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(p.panel()).not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the Sidebar gives way').toBeNull());
    }),
};

/** 600: under 768 the Panel opens full width. */
export const FullWidthUnder768 = {
    parameters: { frameWidth: 600 },
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
    parameters: { frameWidth: 1440 },
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
    parameters: { frameWidth: 1440 },
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
    parameters: { frameWidth: 1440 },
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

/** The peek is off by default; turned on, hovering the right edge peeks a closed Panel over the Page with no Backdrop. */
export const PanelPeek = {
    parameters: { frameWidth: 1440 },
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
        await expect(p.backdrop(), 'a peek has no Backdrop').toBeNull();
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

/** 1440 with Section detail: both docked would leave 752, under the 960 split, so the default Sidebar collapses to keep it (992). */
export const SectionDetailKeepsSplitAt1440 = {
    parameters: { frameWidth: 1440 },
    render: WithPanel,
    args: { sectionDetail: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = panelParts(canvasElement);
        await waitFor(() => expect(p.sidebar()).not.toBeNull());
        await openPanel(p);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapses first').toBeNull());
        await expect(getComputedStyle(p.panel()).position).not.toBe('absolute');
        await expect(rect(p.content).width, '1440 - 400 - 48').toBeCloseTo(992, 0);
    }),
};

/** 1440 with Section detail: the splitter's limit keeps 960 of content, so dragging to it never breaks the split. */
export const SectionDetailSplitterKeepsSplitAt1440 = {
    parameters: { frameWidth: 1440 },
    render: WithPanel,
    args: { sectionDetail: true },
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

/* ------------------------------------------------------------- states */

/**
 * Every Frame state, one story each, for the docs page's state gallery. The
 * docs page draws each one in an iframe at its stated width (`ModeFrame`), so
 * the Frame measures a real width and the layout tokens read a real viewport.
 * `frameWidth` holds the same width in the test runner, where each play reads
 * the resolved state a person sees.
 *
 * `act` does once, after mount, what a person does: hover the left edge
 * (`peek-sidebar`), press the toggle (`open-sidebar`) or hover the right edge
 * (`peek-panel`). The Panel is controlled open where a state needs it. A
 * modal opens after `act`, so it meets the Sidebar the act left.
 */
const STATE_PEEK = 'peek-sidebar';
const STATE_OPEN = 'open-sidebar';
const STATE_PEEK_PANEL = 'peek-panel';

const hoverEdge = (el) => el?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));

const FrameState = ({ act, overlay, ...args }) => {
    const ref = useRef(null);
    const [overlayOpen, setOverlayOpen] = useState(false);
    useEffect(() => {
        const root = ref.current;
        const timers = [setTimeout(() => {
            if (act === STATE_PEEK) hoverEdge(root?.querySelector('.plus-frame__edge'));
            if (act === STATE_OPEN) root?.querySelector('.plus-frame__toggle')?.click();
            if (act === STATE_PEEK_PANEL) hoverEdge(root?.querySelector('.plus-frame__panel-edge'));
        }, 100)];
        if (overlay) timers.push(setTimeout(() => setOverlayOpen(true), 300));
        return () => timers.forEach(clearTimeout);
    }, [act, overlay]);
    const close = () => setOverlayOpen(false);
    return (
        <div ref={ref}>
            <InAppFrame panelLabel="AI chat" panelStorageKey={null} {...args}>
                {slot('Content slot')}
                {slot('Content slot')}
            </InAppFrame>
            {overlay === 'modal' ? (
                <Modal
                    show={overlayOpen}
                    width="6-col"
                    title="Settings"
                    body="Choose how this page shows your sessions."
                    primaryButton={{ text: 'Done', onClick: close }}
                    onClose={close}
                />
            ) : null}
        </div>
    );
};

const statePanel = <ChatPanel />;

/** One state at `width`: rendered by `FrameState`, left out of the docs page's inline canvases. */
const frameState = (width, args = {}, play) => ({
    render: FrameState,
    args,
    parameters: { frameWidth: width, docs: { disable: true } },
    ...(play ? { play: async (ctx) => atViewport(width, () => play(panelParts(ctx.canvasElement), ctx)) } : {}),
});

const sidebarIs = async (p, state) => waitFor(() => {
    const box = p.sidebar();
    if (state === 'closed') return expect(box, 'the Sidebar is closed').toBeNull();
    return expect(box?.className ?? '', `the Sidebar is ${state}`).toContain(`plus-frame__sidebar--${state}`);
});
const panelIs = async (p, mode) => waitFor(() => expect(p.panel()?.className ?? '', `the Panel is ${mode}`).toContain(`plus-frame__panel--${mode}`));
const backdropShows = (p) => p.frame.querySelector('.plus-frame__backdrop');

/** Sidebar docked: in flow beside the Page from 1024. */
export const StateSidebarDocked = frameState(1440, {}, async (p) => sidebarIs(p, 'docked'));

/** Sidebar closed: no rail, and the toggle at the Page's top left. */
export const StateSidebarClosed = frameState(1440, { sidebarDocked: false }, async (p) => {
    await sidebarIs(p, 'closed');
    await expect(p.pageToggle()).not.toBeNull();
});

/** Sidebar peek: hovering the left edge floats a closed Sidebar over the Page, with no Backdrop. */
export const StateSidebarPeek = frameState(1440, { sidebarDocked: false, act: STATE_PEEK }, async (p) => {
    await sidebarIs(p, 'raised');
    await expect(backdropShows(p), 'no Backdrop under a peek').toBeNull();
});

/** Sidebar floating: under 1024 the toggle opens it over the Page, since it never docks there. */
export const StateSidebarFloating = frameState(768, { act: STATE_OPEN }, async (p) => {
    await sidebarIs(p, 'raised');
    await expect(p.toggle).toHaveAttribute('aria-expanded', 'true');
});

/** Panel docked: beside the Page at a hairline, with the Sidebar closed by hand. */
export const StatePanelDocked = frameState(1440, { sidebarDocked: false, panel: statePanel, panelOpen: true }, async (p) => {
    await panelIs(p, 'docked');
    await expect(backdropShows(p)).toBeNull();
});

/** Panel peek: with `panelPeek`, hovering the right edge floats a closed Panel over the Page. */
export const StatePanelPeek = frameState(1440, { panel: statePanel, panelPeek: true, act: STATE_PEEK_PANEL }, async (p) => {
    await panelIs(p, 'peek');
    await expect(backdropShows(p), 'no Backdrop under a peek').toBeNull();
});

/** Panel overlay: under 1024 the Panel floats over the Page with no Backdrop, capped at 320. */
export const StatePanelOverlay = frameState(768, { panel: statePanel, panelOpen: true }, async (p) => {
    await panelIs(p, 'overlay');
    await expect(rect(p.panel()).width).toBeCloseTo(320, 0);
    await expect(backdropShows(p), 'no Backdrop').toBeNull();
});

/** Panel full width: under 768 the overlay Panel takes the whole Frame. */
export const StatePanelFullWidth = frameState(600, { panel: statePanel, panelOpen: true }, async (p) => {
    await panelIs(p, 'overlay');
    await expect(rect(p.panel()).width).toBeCloseTo(rect(p.frame).width, 0);
});

/** Panel resized to its narrowest, 320, beside a docked Sidebar. */
export const StatePanelNarrowest = frameState(1440, { panel: statePanel, panelOpen: true, panelDefaultWidth: 320 }, async (p) => {
    await sidebarIs(p, 'docked');
    await panelIs(p, 'docked');
    await expect(rect(p.panel()).width).toBeCloseTo(320, 0);
});

/** Panel resized to its widest, 640, with the Sidebar closed. */
export const StatePanelWidest = frameState(1440, { sidebarDocked: false, panel: statePanel, panelOpen: true, panelDefaultWidth: 640 }, async (p) => {
    await panelIs(p, 'docked');
    await expect(rect(p.panel()).width).toBeCloseTo(640, 0);
});

/** Sidebar and Panel together: at 1440 a 400 Panel docks beside the docked Sidebar and keeps 720. */
export const StateSidebarAndPanel = frameState(1440, { panel: statePanel, panelOpen: true }, async (p) => {
    await sidebarIs(p, 'docked');
    await panelIs(p, 'docked');
});

/** At 1200 both would not fit, so the Panel collapses the Sidebar left open by default. */
export const StatePanelCollapsesSidebar = frameState(1200, { panel: statePanel, panelOpen: true }, async (p) => {
    await sidebarIs(p, 'closed');
    await panelIs(p, 'docked');
});

/** At 1100 even the Panel alone leaves under 720, so it floats over the Page and the Sidebar, with no Backdrop. */
export const StatePanelOnBackdrop = frameState(1100, { panel: statePanel, panelOpen: true }, async (p) => {
    await panelIs(p, 'overlay');
    await expect(backdropShows(p), 'no Backdrop').toBeNull();
    // Under the overlay Panel the Sidebar is inert, so it is read among the hidden roles.
    await waitFor(() => expect(p.coveredSidebar()?.className ?? '').toContain('plus-frame__sidebar--docked'));
});

/** A modal over a docked Sidebar and Panel: both stay where they are. */
export const StateWithModal = frameState(1440, { panel: statePanel, panelOpen: true, overlay: 'modal' }, async (p, { canvasElement }) => {
    await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
    await expect(p.coveredSidebar()?.className ?? '').toContain('plus-frame__sidebar--docked');
});

/** Under 1024 a modal closes the floating Sidebar it opens over. */
export const StateModalClosesFloating = frameState(768, { act: STATE_OPEN, overlay: 'modal' }, async (p, { canvasElement }) => {
    await waitFor(() => expect(dialog(canvasElement)).not.toBeNull());
    await waitFor(() => expect(p.coveredSidebar(), 'the floating Sidebar closed').toBeNull());
});

/** The Frame at each layout mode. */
export const StateAt768 = frameState(768, {}, async (p) => sidebarIs(p, 'closed'));
export const StateAt1024 = frameState(1024, {}, async (p) => sidebarIs(p, 'docked'));
export const StateAt1440 = frameState(1440, {}, async (p) => sidebarIs(p, 'docked'));


/* ------------------------------------------------------------------ types
 * The docs page's examples: the three Frame types, each live in a browser
 * window, then the pieces a type adds. They compose real Frame, Sidebar,
 * Section, ProgressTracker and Button; nothing here is redrawn.
 */


/** A page body made of placeholder bars, so the Frame's own structure is what reads. */
const SkeletonSection = ({ title }) => (
    <PatternSection title={title}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
            <Skeleton preset="text" lines={3} />
        </div>
    </PatternSection>
);

/** The default type: the Sidebar, the Page, and the AI panel as its own region. */
const DefaultType = ({ withPanel = false, ...args }) => (
    <BrowserWindow address="app.plus.org/dashboard" height={WINDOW_HEIGHT}>
        <InAppFrame
            height="100%"
            panelLabel="AI chat"
            panelStorageKey={null}
            {...(withPanel ? { panel: <ChatPanel />, panelOpen: true } : {})}
            {...args}
        >
            <SkeletonSection title="Upcoming sessions" />
            <SkeletonSection title="Students" />
        </InAppFrame>
    </BrowserWindow>
);

/** Default: Sidebar, Page and the AI panel region, docked at 1440. */
export const TypeDefault = {
    name: 'Type: Default',
    parameters: { layout: 'padded' },
    render: () => <div style={{ inlineSize: 1440 /* docs-literal: the X-Large stage, wide enough to dock the Sidebar and the AI panel */ }}><DefaultType withPanel /></div>,
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.sidebar(), 'the Sidebar docks').not.toBeNull());
        await expect(p.frame.querySelector('.plus-frame__panel'), 'the AI panel docks beside the Page').not.toBeNull();
    },
};


/** Focused: five steps down the left, the bottom bar, no Sidebar. */
export const TypeFocused = {
    name: 'Type: Focused',
    parameters: { layout: 'padded' },
    render: () => <FocusedType count={5} />,
};

/** Bare: sign-in, errors and welcome: one centered column, no Sidebar and no header row. */
export const TypeBare = {
    name: 'Type: Bare',
    parameters: { layout: 'padded' },
    render: () => (
        <BrowserWindow address="app.plus.org/sign-in" height={WINDOW_HEIGHT}>
            <Frame surfaceDirect>
                <div data-probe="bare-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-150)', maxInlineSize: 'var(--panel-min-width)', marginInline: 'auto', paddingBlock: 'var(--space-300)' }}>
                    <Logo />
                    <TextField label="Email" type="email" value="" onChange={() => {}} />
                    <Button text="Sign in" appearance="primary" onClick={() => {}} />
                </div>
            </Frame>
        </BrowserWindow>
    ),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await expect(p.sidebar(), 'no Sidebar').toBeNull();
        await expect(p.toggle, 'so no toggle').toBeNull();
        const column = canvasElement.querySelector('[data-probe="bare-column"]');
        const page = rect(p.surface);
        await expect(rect(column).left - page.left, 'one column, centered in the Page').toBeCloseTo(page.right - rect(column).right, 0);
    },
};

/** The default anatomy's parts, in the Parts list's order: the figure and its play read this one list. */
const ANATOMY_DEFAULT_PARTS = [
    { selector: '.plus-frame__sidebar', label: 'Sidebar', at: 'middle' },
    { selector: '.plus-frame__head', label: 'Header row', side: 'top', at: 'start' },
    { selector: '.plus-frame__content', label: 'Content', side: 'top', at: 'end' },
    { selector: '.plus-frame__panel', label: 'AI panel', side: 'end' },
];

/** The focused anatomy's parts, in the Parts list's order. */
const ANATOMY_FOCUSED_PARTS = [
    { selector: '.plus-frame__head', label: 'Title row' },
    { selector: '[data-probe="steps"]', label: 'Steps' },
    { selector: '.plus-frame__content', label: 'Body', at: 'end' },
    { selector: '[data-probe="bar"]', label: 'Bar' },
];

/** Anatomy: the default type at 1440 with the AI panel docked, a marker on each part. */
export const AnatomyDefault = {
    name: 'Anatomy: Default',
    parameters: { layout: 'padded' },
    render: () => (
        <LiveAnatomy width={1440 /* docs-literal: the X-Large stage */} title="The default Frame with its parts numbered" parts={ANATOMY_DEFAULT_PARTS}>
            <DefaultType withPanel />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_DEFAULT_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_DEFAULT_PARTS);
    },
};

/** Anatomy: the focused type, five steps, a marker on each part. */
export const AnatomyFocused = {
    name: 'Anatomy: Focused',
    parameters: { layout: 'padded' },
    render: () => (
        <LiveAnatomy width={1024 /* docs-literal: the Large stage */} title="The focused Frame with its parts numbered" parts={ANATOMY_FOCUSED_PARTS}>
            <FocusedType count={5} />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_FOCUSED_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_FOCUSED_PARTS);
    },
};

/** Steps down the left: five or more, a rail 256 wide, the bar at 48 with Cancel, Back and Next. */
export const FocusedStepsDown = {
    name: 'Focused: five steps, down the left',
    parameters: { layout: 'padded' },
    render: () => <FocusedType count={5} start={0} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const layout = canvasElement.querySelector('[data-probe="steps-layout"]');
        const steps = canvasElement.querySelector('[data-probe="steps"]');
        const body = steps.nextElementSibling;
        await expect(layout, 'five steps run down the left').toHaveAttribute('data-steps', 'down');
        await expect(canvas.getByRole('navigation', { name: 'Steps' }), 'a vertical tracker').toHaveClass('plus-progress-tracker--vertical');
        await expect(rect(steps).right, 'the rail sits before the body').toBeLessThanOrEqual(rect(body).left);
        await expect(rect(steps).width, 'the rail is 256 wide').toBeCloseTo(STEPS_RAIL, 0);

        const bar = canvasElement.querySelector('[data-probe="bar"]');
        await expect(rect(bar).height, 'the bar is 48 high').toBeCloseTo(tokenLength(bar, BAR_TOKEN), 0);
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        const back = canvas.getByRole('button', { name: 'Back' });
        const next = canvas.getByRole('button', { name: 'Next' });
        await expect(rect(cancel).left, 'Cancel leads the bar').toBeLessThan(rect(back).left);
        await expect(rect(back).right, 'Back comes before Next').toBeLessThanOrEqual(rect(next).left);
        await expect(back, 'Back is disabled on the first step').toHaveAttribute('aria-disabled', 'true');
        await expect(canvas.getByRole('button', { name: 'Close' }), 'Close leads the title row').toBeInTheDocument();
        // One column: the title row, the body and the bar's actions share the Page's reading edges.
        const close = canvas.getByRole('button', { name: 'Close' });
        await expect(rect(close).left, 'Close starts on the body’s left edge').toBeCloseTo(rect(steps).left, 0);
        await expect(rect(cancel).left, 'Cancel starts on the body’s left edge').toBeCloseTo(rect(steps).left, 0);
        await expect(rect(next).right, 'Next ends on the body’s right edge').toBeCloseTo(rect(layout).right, 0);
        await expect(canvas.queryByRole('navigation', { name: 'Main' }), 'no Sidebar').toBeNull();
        await userEvent.click(next);
        await expect(back, 'Back works from the second step').not.toHaveAttribute('aria-disabled');
    },
};

/** Steps across the top: four or fewer, a horizontal tracker above the body. */
export const FocusedStepsAcross = {
    name: 'Focused: four steps, across the top',
    parameters: { layout: 'padded' },
    render: () => <FocusedType count={4} start={0} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const layout = canvasElement.querySelector('[data-probe="steps-layout"]');
        const steps = canvasElement.querySelector('[data-probe="steps"]');
        const body = steps.nextElementSibling;
        await expect(layout, 'four steps run across the top').toHaveAttribute('data-steps', 'across');
        await expect(canvas.getByRole('navigation', { name: 'Steps' }), 'a horizontal tracker').toHaveClass('plus-progress-tracker--horizontal');
        await expect(rect(steps).bottom, 'the steps sit above the body').toBeLessThanOrEqual(rect(body).top);
        await expect(canvas.getByRole('button', { name: 'Back' })).toHaveAttribute('aria-disabled', 'true');
    },
};

/** A stage whose own width the control sets, with the AI panel open. */
const WidthStage = ({ width, ...args }) => (
    <div style={{ overflowX: 'auto' }}>
        <div data-probe="stage" style={{ inlineSize: width, blockSize: WINDOW_HEIGHT }}>
            <InAppFrame height="100%" panel={<ChatPanel />} panelLabel="AI chat" panelStorageKey={null} defaultPanelOpen {...args}>
                <SkeletonSection title="Upcoming sessions" />
            </InAppFrame>
        </div>
    </div>
);

/** Width behavior: drag through 1408, 1168, 1024 and 768 and the Sidebar and the AI panel dock, collapse or float. */
export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: 1440 },
    parameters: { layout: 'padded', controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 600, max: 1600, step: 8 }, description: 'The Frame\'s own width, in px.', table: { category: 'Docs' } },
    },
    render: WidthStage,
    play: async ({ canvasElement }) => {
        const p = panelParts(canvasElement);
        const stage = canvasElement.querySelector('[data-probe="stage"]');
        const setWidth = (px) => { stage.style.inlineSize = `${px}px`; };
        const L = FRAME_LAYOUT;

        await sidebarIs(p, 'docked');
        await panelIs(p, 'docked');

        setWidth(L.sidebarWidth + L.panelDefault + L.contentFloor - 8);
        await sidebarIs(p, 'closed');
        await panelIs(p, 'docked');

        setWidth(L.contentFloor + L.panelDefault - 64);
        await panelIs(p, 'overlay');

        setWidth(L.dockMin - 64);
        await panelIs(p, 'overlay');
        await expect(p.sidebar(), 'under 1024 the Sidebar never docks').toBeNull();

        setWidth(L.sidebarWidth + L.panelDefault + L.contentFloor + 64);
        await sidebarIs(p, 'docked');
        await panelIs(p, 'docked');
    },
};

/** A key state drawn at its own width, scaled to the docs column. */
const AtWidth = ({ width }) => (
    <ScaledStory width={width}>
        <WidthStage width={width} />
    </ScaledStory>
);

/** The AI panel opens on a Frame too narrow for the Sidebar, the panel and 720 of content: the Sidebar collapses. */
export const KeyPanelCollapsesSidebar = {
    name: 'Key state: Panel collapses the Sidebar',
    parameters: { layout: 'padded' },
    render: () => <AtWidth width={1200 /* docs-literal: between the docked-alone and docked-both widths */} />,
    play: async ({ canvasElement }) => {
        const p = panelParts(canvasElement);
        await sidebarIs(p, 'closed');
        await panelIs(p, 'docked');
        await expect(p.frame.querySelector('.plus-frame__toggle'), 'the toggle moves to the Page\'s top left').not.toBeNull();
    },
};

/** Under 1024 the Sidebar never docks and the AI panel floats over the Page, with no Backdrop. */
export const KeyUnder1024 = {
    name: 'Key state: Under 1024',
    parameters: { layout: 'padded' },
    render: () => <AtWidth width={FRAME_LAYOUT.dockMin - 124} />,
    play: async ({ canvasElement }) => {
        const p = panelParts(canvasElement);
        await panelIs(p, 'overlay');
        await expect(p.sidebar(), 'the Sidebar is not docked').toBeNull();
        await expect(backdropShows(p), 'the panel floats with no Backdrop').toBeNull();
    },
};

/* ------------------------------------------------------------- space motion */

/**
 * Space motion: the Sidebar collapses and opens, the Panel docks and undocks, and the Page makes
 * room on the same clock. Each story runs with the motion setting pinned, and reads the spring
 * mid-flight by pausing its animation, never by sleeping.
 */
const motionOn = (Story) => <MotionPreferenceContext.Provider value={false}><Story /></MotionPreferenceContext.Provider>;
const motionOff = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

/** Pause every running animation on `el` part-way and return how far in it was put. */
const pauseAt = (el, fraction = 0.2) => {
    const running = el.getAnimations().filter((a) => a.effect.getComputedTiming().iterations !== Infinity);
    running.forEach((a) => {
        a.pause();
        a.currentTime = Number(a.effect.getComputedTiming().duration) * fraction;
    });
    return running;
};
const finish = (animations) => animations.forEach((a) => a.finish());

const sidebarBox = (p) => p.frame.querySelector('.plus-frame__sidebar--docked');
const settled = async (el) => {
    await Promise.allSettled(el.getAnimations({ subtree: true })
        .filter((a) => a.effect.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished));
};

/** Nothing outside the moving region shifts: the Page keeps its top, foot and trailing edge. */
const expectOnlyTheRegionMoves = async (p, before) => {
    await expect(rect(p.surface).top, 'the Page keeps its top').toBeCloseTo(before.top, 0);
    await expect(rect(p.surface).bottom, 'and its foot').toBeCloseTo(before.bottom, 0);
    await expect(rect(p.surface).right, 'and its trailing edge').toBeCloseTo(before.right, 0);
};

const collapsePlay = (reduced) => async ({ canvasElement }) => atViewport(1440, async () => {
    const p = parts(canvasElement);
    await waitFor(() => expect(sidebarBox(p), 'docked at 1440').not.toBeNull());
    const box = sidebarBox(p);
    await expect(getComputedStyle(box).animationName, 'already docked on mount: does not slide in').toBe('none');
    await settled(p.frame);
    const width = tokenLength(p.frame, '--frame-sidebar-width');
    const before = { top: rect(p.surface).top, bottom: rect(p.surface).bottom, right: rect(p.surface).right };
    await expect(rect(p.surface).left - rect(p.frame).left).toBeCloseTo(width, 0);

    await userEvent.click(p.canvas.getByRole('button', { name: 'Close sidebar' }));
    if (reduced) {
        await waitFor(() => expect(sidebarBox(p), 'it is gone at once').toBeNull());
        await expect(rect(p.surface).left - rect(p.frame).left, 'the Page runs to the edge').toBeCloseTo(0, 0);
        await userEvent.click(p.canvas.getByRole('button', { name: 'Open sidebar' }));
        const back = await waitFor(() => { const el = sidebarBox(p); expect(el).not.toBeNull(); return el; });
        await expect(getComputedStyle(back).animationName).toBe('none');
        await expect(rect(p.surface).left - rect(p.frame).left).toBeCloseTo(width, 0);
        return;
    }
    await expect(box, 'it stays for its exit').toHaveAttribute('data-leaving', 'true');
    await expect(getComputedStyle(box).animationName, 'it moves on a spring').not.toBe('none');
    await expect(box, 'a leaving Sidebar is out of reach').toHaveAttribute('inert');
    const running = pauseAt(box);
    await expect(running.length, 'a spring is running').toBeGreaterThan(0);
    const left = rect(p.surface).left - rect(p.frame).left;
    await expect(left, 'the Page is part-way to the edge').toBeGreaterThan(0);
    await expect(left, 'and has left its first place').toBeLessThan(width);
    await expect(rect(box).width, 'the Sidebar keeps its width while it leaves').toBeCloseTo(width, 0);
    await expectOnlyTheRegionMoves(p, before);
    finish(running);
    await waitFor(() => expect(sidebarBox(p), 'it leaves once the spring ends').toBeNull());
    await expect(rect(p.surface).left - rect(p.frame).left).toBeCloseTo(0, 0);

    await userEvent.click(p.canvas.getByRole('button', { name: 'Open sidebar' }));
    const back = await waitFor(() => { const el = sidebarBox(p); expect(el).not.toBeNull(); return el; });
    await expect(getComputedStyle(back).animationName, 'opening moves on a spring too').not.toBe('none');
    const opening = pauseAt(back);
    const mid = rect(p.surface).left - rect(p.frame).left;
    await expect(mid, 'the Page narrows as it opens').toBeGreaterThan(0);
    await expect(mid).toBeLessThan(width);
    await expectOnlyTheRegionMoves(p, before);
    finish(opening);
    await waitFor(() => expect(rect(p.surface).left - rect(p.frame).left).toBeCloseTo(width, 0));
});

/** Collapse and open the docked Sidebar: it keeps its width, and the Page makes room on the same spring. */
export const SidebarCollapseMotion = {
    name: 'Space motion: Sidebar collapse',
    parameters: { frameWidth: 1440 },
    decorators: [motionOn],
    play: collapsePlay(false),
};

export const SidebarCollapseMotionReduced = {
    name: 'Space motion: Sidebar collapse, reduced',
    parameters: { frameWidth: 1440 },
    decorators: [motionOff],
    play: collapsePlay(true),
};

/** A peek slides over the Page on spatial.default and leaves on spatial.fast; the Page never moves. */
const peekPlay = (reduced) => async ({ canvasElement }) => atViewport(1440, async () => {
    const p = parts(canvasElement);
    await waitFor(() => expect(p.edge(), 'closed, with a hover strip').not.toBeNull());
    const left = rect(p.surface).left;
    p.edge().dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    p.edge().dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    const peek = await waitFor(() => { const el = p.frame.querySelector('.plus-frame__sidebar--raised'); expect(el).not.toBeNull(); return el; });
    if (reduced) {
        await expect(getComputedStyle(peek).animationName).toBe('none');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.frame.querySelector('.plus-frame__sidebar--raised')).toBeNull());
        return;
    }
    await expect(getComputedStyle(peek).animationName, 'the peek slides in').not.toBe('none');
    const running = pauseAt(peek);
    await expect(rect(peek).left, 'part-way in from the left').toBeLessThan(rect(p.frame).left);
    await expect(rect(p.surface).left, 'the Page does not move for a peek').toBeCloseTo(left, 0);
    finish(running);
    await settled(p.frame);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(peek).toHaveAttribute('data-leaving', 'true'));
    const leaving = pauseAt(peek);
    await expect(leaving.length, 'the peek slides back out').toBeGreaterThan(0);
    await expect(rect(p.surface).left, 'the Page stays put as the peek leaves').toBeCloseTo(left, 0);
    finish(leaving);
    await waitFor(() => expect(p.frame.querySelector('.plus-frame__sidebar--raised')).toBeNull());
});
export const SidebarPeekMotion = {
    name: 'Space motion: Sidebar peek',
    args: { sidebarDocked: false },
    parameters: { frameWidth: 1440 },
    decorators: [motionOn],
    play: peekPlay(false),
};
export const SidebarPeekMotionReduced = {
    name: 'Space motion: Sidebar peek, reduced',
    args: { sidebarDocked: false },
    parameters: { frameWidth: 1440 },
    decorators: [motionOff],
    play: peekPlay(true),
};

const dockPlay = (reduced) => async ({ canvasElement }) => atViewport(1440, async () => {
    const p = panelParts(canvasElement);
    await waitFor(() => expect(p.sidebar(), 'docked at 1440').not.toBeNull());
    await settled(p.frame);
    const before = { top: rect(p.surface).top, bottom: rect(p.surface).bottom };
    const fullPage = rect(p.surface).width;
    await userEvent.click(p.canvas.getByRole('button', { name: 'Open chat' }));
    const panel = await waitFor(() => { const el = p.panel(); expect(el, 'the Panel opens').not.toBeNull(); return el; });
    const full = tokenLength(p.frame, '--panel-width-default');
    await expect(rect(panel.querySelector('.plus-panel')).height, 'the Panel content fills the full height').toBeCloseTo(rect(panel).height, 0);
    if (reduced) {
        await expect(getComputedStyle(panel).animationName, 'reduced motion does not animate').toBe('none');
        await expect(rect(panel).width).toBeCloseTo(full, 0);
    } else {
        await expect(getComputedStyle(panel).animationName, 'it docks on a spring').not.toBe('none');
        const running = pauseAt(panel);
        await expect(running.length).toBeGreaterThan(0);
        await expect(rect(panel).width, 'the Panel is part-way open').toBeGreaterThan(0);
        await expect(rect(panel).width).toBeLessThan(full);
        await expect(rect(p.surface).width, 'the Page has narrowed on the same clock').toBeLessThan(fullPage);
        await expect(rect(p.surface).right, 'and meets the Panel').toBeCloseTo(rect(panel).left, 0);
        await expect(rect(p.surface).top).toBeCloseTo(before.top, 0);
        await expect(rect(p.surface).bottom).toBeCloseTo(before.bottom, 0);
        await expect(rect(within(panel).getByRole('button', { name: 'Close' })).width, 'the content keeps its size').toBeGreaterThan(0);
        finish(running);
        await settled(p.frame);
    }
    await expect(rect(p.surface).width).toBeCloseTo(fullPage - full, 0);

    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    if (reduced) {
        await waitFor(() => expect(p.panel(), 'it is gone at once').toBeNull());
    } else {
        await waitFor(() => expect(panel).toHaveAttribute('data-ending-style'));
        const leaving = pauseAt(panel);
        await expect(leaving.length, 'it leaves on a spring').toBeGreaterThan(0);
        await expect(p.panel(), 'it stays for its exit').not.toBeNull();
        await expect(rect(p.surface).width, 'the Page is part-way back').toBeGreaterThan(fullPage - full);
        finish(leaving);
        await waitFor(() => expect(p.panel()).toBeNull());
    }
    await expect(rect(p.surface).width, 'the Page has its width back').toBeCloseTo(fullPage, 0);
});

/** Dock and undock the Panel: it grows from its edge, the Page narrows with it, and it leaves the same way. */
export const PanelDockMotion = {
    name: 'Space motion: Panel dock and undock',
    parameters: { frameWidth: 1440 },
    render: WithPanel,
    decorators: [motionOn],
    play: dockPlay(false),
};
export const PanelDockMotionReduced = {
    name: 'Space motion: Panel dock and undock, reduced',
    parameters: { frameWidth: 1440 },
    render: WithPanel,
    decorators: [motionOff],
    play: dockPlay(true),
};

const overlayPlay = (reduced) => async ({ canvasElement }) => atViewport(1100, async () => {
    const p = panelParts(canvasElement);
    await waitFor(() => expect(p.frame).not.toBeNull());
    await settled(p.frame);
    const pageWidth = rect(p.surface).width;
    await userEvent.click(p.canvas.getByRole('button', { name: 'Open chat' }));
    const panel = await waitFor(() => { const el = p.panel(); expect(el).not.toBeNull(); return el; });
    await panelIs(p, 'overlay');
    if (reduced) {
        await expect(getComputedStyle(panel).animationName).toBe('none');
        await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(p.panel()).toBeNull());
        return;
    }
    await expect(getComputedStyle(panel).animationName, 'the overlay slides in').not.toBe('none');
    const running = pauseAt(panel);
    await expect(rect(panel).left, 'part-way in from the edge').toBeGreaterThan(rect(p.frame).right - tokenLength(p.frame, '--panel-width-default'));
    await expect(rect(p.surface).width, 'an overlay does not move the Page').toBeCloseTo(pageWidth, 0);
    finish(running);
    await settled(p.frame);

    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(panel).toHaveAttribute('data-ending-style'));
    const leaving = pauseAt(panel);
    await expect(leaving.length, 'the overlay slides back out').toBeGreaterThan(0);
    await expect(rect(p.surface).width, 'the Page stays put as the overlay leaves').toBeCloseTo(pageWidth, 0);
    finish(leaving);
    await waitFor(() => expect(p.panel()).toBeNull());
});
export const PanelOverlayMotion = {
    name: 'Space motion: Panel overlay',
    parameters: { frameWidth: 1100 },
    render: WithPanel,
    decorators: [motionOn],
    play: overlayPlay(false),
};
export const PanelOverlayMotionReduced = {
    name: 'Space motion: Panel overlay, reduced',
    parameters: { frameWidth: 1100 },
    render: WithPanel,
    decorators: [motionOff],
    play: overlayPlay(true),
};

const panelPeekPlay = (reduced) => async ({ canvasElement }) => atViewport(1440, async () => {
    const p = panelParts(canvasElement);
    const edge = await waitFor(() => { const el = p.frame.querySelector('.plus-frame__panel-edge'); expect(el).not.toBeNull(); return el; });
    await settled(p.frame);
    const pageWidth = rect(p.surface).width;
    await userEvent.hover(edge);
    const panel = await waitFor(() => { const el = p.panel(); expect(el).not.toBeNull(); return el; });
    await expect(p.splitter(), 'a peek does not show a splitter').toBeNull();
    if (reduced) {
        await expect(getComputedStyle(panel).animationName).toBe('none');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(p.panel()).toBeNull());
        return;
    }
    await expect(getComputedStyle(panel).animationName, 'the Panel peek slides in').not.toBe('none');
    const running = pauseAt(panel);
    await expect(rect(panel).left, 'part-way in from the right edge').toBeGreaterThan(rect(p.frame).right - tokenLength(p.frame, '--panel-width-default'));
    await expect(rect(p.surface).width, 'a Panel peek does not move the Page').toBeCloseTo(pageWidth, 0);
    finish(running);
    await settled(p.frame);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel).toHaveAttribute('data-ending-style'));
    const leaving = pauseAt(panel);
    await expect(leaving.length, 'the Panel peek slides back out').toBeGreaterThan(0);
    await expect(p.splitter(), 'leaving peek still shows no splitter').toBeNull();
    await expect(rect(p.surface).width, 'the Page stays put').toBeCloseTo(pageWidth, 0);
    finish(leaving);
    await waitFor(() => expect(p.panel()).toBeNull());
});
export const PanelPeekMotion = {
    name: 'Space motion: Panel peek',
    parameters: { frameWidth: 1440 },
    args: { panelPeek: true },
    render: WithPanel,
    decorators: [motionOn],
    play: panelPeekPlay(false),
};
export const PanelPeekMotionReduced = {
    name: 'Space motion: Panel peek, reduced',
    parameters: { frameWidth: 1440 },
    args: { panelPeek: true },
    render: WithPanel,
    decorators: [motionOff],
    play: panelPeekPlay(true),
};

/** Crossing the 1024 breakpoint: the Sidebar leaves and returns on its springs and the Page reflows with it, with no jump. */
const breakpointPlay = (reduced) => async ({ canvasElement }) => atViewport(1440, async () => {
    const p = panelParts(canvasElement);
    const stage = canvasElement.querySelector('[data-probe="stage"]');
    await sidebarIs(p, 'docked');
    await settled(p.frame);
    const box = sidebarBox(p);
    const width = tokenLength(p.frame, '--frame-sidebar-width');
    const edge = () => rect(p.surface).left - rect(p.frame).left;
    await expect(edge()).toBeCloseTo(width, 0);
    stage.style.inlineSize = `${FRAME_LAYOUT.dockMin - 64}px`;
    if (reduced) {
        await waitFor(() => expect(sidebarBox(p)).toBeNull());
        await expect(edge()).toBeCloseTo(0, 0);
        stage.style.inlineSize = '1200px';
        const back = await waitFor(() => { const el = sidebarBox(p); expect(el).not.toBeNull(); return el; });
        await expect(getComputedStyle(back).animationName).toBe('none');
        await expect(edge()).toBeCloseTo(width, 0);
        return;
    }
    await waitFor(() => expect(box).toHaveAttribute('data-leaving', 'true'));
    const running = pauseAt(box);
    await expect(running.length, 'the Sidebar leaves on a spring').toBeGreaterThan(0);
    await expect(edge(), 'the Page is part-way, not jumped').toBeGreaterThan(0);
    await expect(edge()).toBeLessThan(width);
    await expect(rect(box).width, 'the Sidebar is never squeezed').toBeCloseTo(width, 0);
    finish(running);
    await waitFor(() => expect(sidebarBox(p)).toBeNull());
    await expect(edge()).toBeCloseTo(0, 0);

    stage.style.inlineSize = '1200px';
    const back = await waitFor(() => { const el = sidebarBox(p); expect(el).not.toBeNull(); return el; });
    const returning = pauseAt(back);
    await expect(returning.length, 'widening docks the Sidebar on a spring').toBeGreaterThan(0);
    await expect(edge(), 'the Page narrows smoothly as the Sidebar docks').toBeGreaterThan(0);
    await expect(edge()).toBeLessThan(width);
    finish(returning);
    await waitFor(() => expect(edge()).toBeCloseTo(width, 0));
});
export const BreakpointReflowMotion = {
    name: 'Space motion: breakpoint reflow',
    args: { width: 1200 },
    parameters: { layout: 'padded' },
    render: (args) => <WidthStage {...args} defaultPanelOpen={false} />,
    decorators: [motionOn],
    play: breakpointPlay(false),
};
export const BreakpointReflowMotionReduced = {
    name: 'Space motion: breakpoint reflow, reduced',
    args: { width: 1200 },
    parameters: { layout: 'padded' },
    render: (args) => <WidthStage {...args} defaultPanelOpen={false} />,
    decorators: [motionOff],
    play: breakpointPlay(true),
};
