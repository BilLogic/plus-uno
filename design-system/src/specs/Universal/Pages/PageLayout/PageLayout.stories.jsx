/**
 * PageLayout - Universal Page
 * 
 * App Outer Layout per Figma specs.
 * 
 * Figma Specs:
 * - 112-597: Collapsed sidebar (bars icon)
 * - 112-596: Expanded sidebar (angles-left icon)
 * 
 * Container tokens:
 * - Background: surface-container (#edeef0)
 * - Gap: surface-container/gap-sm (16px)
 * - Padding: pad-x-sm (16px), pad-y-sm (12px)
 */

import React from 'react';
import PageLayout from './PageLayout';
import Card from '@/components/layout-and-structure/Card/Card';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button, Input, Textarea } from '@/components';
import { PatternDrawer, PatternSection } from '@/patterns';
import { SURFACE_EDGE } from '@/patterns/Surface';
import { computedShadow, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { setTestViewport, withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

export default {
    title: 'Specs/Universal/Pages/Page Layout',
    component: PageLayout,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.globals?.plusBreakpoint || context.args.breakpoint || 'native'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    args: {
        breakpoint: 'native',
    },
    argTypes: {
        breakpoint: {
            control: 'select',
            options: ['native', 'md', 'lg', 'xl'],
            description: 'Simulated viewport width — Native fills available space; MD/LG/XL set a minimum width',
            table: { category: 'Layout' },
        },
    },
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `App Outer Layout that wraps the entire application.

**Container Structure:**
- Outer: surface-container bg, gap-sm (16px), pad-x-sm (16px), pad-y-sm (12px)
- Inner row: Sidebar + Content area
- TopBar: Sidebar control button + Breadcrumb + UserAvatar`
            }
        }
    }
};

/**
 * Overview
 * Shows page layout using the PageLayout component
 */
export const Overview = {
    render: () => (
        <PageLayout
            title="Page Layout"
            style={{ height: '100%', minHeight: '100%' }}
            sidebarConfig={{
                user: 'tutor',
            }}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Dashboard' },
                ],
                user: { name: 'John Doe', counter: true, counterValue: 2 },
            }}
        >
            <h2 className="h3">Page Title</h2>
            <p className="body2-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                This demonstrates the PageLayout component with TopBar, Sidebar, and content area.
                The sidebar docks from 1024px; below that, hover the menu control to peek it and click to dock it.
            </p>

            <div
                className="mt-4"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                }}
            >
                {Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="p-3">
                        <h3 className="h6">Card {i + 1}</h3>
                    </Card>
                ))}
            </div>
        </PageLayout>
    ),
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * The page sits in `Frame`: a 32 topbar the avatar fits in,
 * the toggle at (8, 8), and the sidebar docked from 1024 and closed below.
 */
export const Frame = {
    ...Overview,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sidebar = () => canvas.queryByRole('complementary', { name: 'Sidebar' });
        const check = async (width, docked) => {
            await setTestViewport(width, 900);
            const frame = canvasElement.querySelector('.plus-frame');
            const topbar = frame.querySelector('.plus-frame__topbar');
            const toggle = canvas.getByRole('button', { name: /sidebar/i });
            const pad = tokenLength(frame, '--surface-container-pad');
            await expect(topbar.getBoundingClientRect().height).toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
            await expect(toggle.getBoundingClientRect().left - frame.getBoundingClientRect().left).toBeCloseTo(pad, 0);
            await expect(toggle.getBoundingClientRect().top - frame.getBoundingClientRect().top).toBeCloseTo(pad, 0);
            const avatar = frame.querySelector('.plus-user-avatar');
            await expect(avatar.getBoundingClientRect().height, 'the avatar fits the topbar')
                .toBeLessThanOrEqual(topbar.getBoundingClientRect().height + 0.5);
            await waitFor(() => expect(Boolean(sidebar()), `sidebar at ${width} (found ${sidebar()?.className})`).toBe(docked));
            await expect(canvas.getByRole('main')).toBeInTheDocument();
        };
        await withTestViewport(1024, 900, async () => {
            await check(1024, true);
            await check(768, false);
            await userEvent.click(canvas.getByRole('button', { name: /sidebar/i }));
            await waitFor(() => expect(sidebar()).toBeInTheDocument());
        });
    },
};

/** A md drawer open over the page: Figma's Pattern/Page template with its drawer? boolean on. */
const DrawerOverPage = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <>
            {Overview.render()}
            <PatternDrawer
                open={open}
                width="md"
                title="Session details"
                description="Thursday · 4:00–5:00 PM"
                onClose={() => setOpen(false)}
                footer={(
                    <>
                        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => setOpen(false)} />
                        <Button text="Save changes" style="primary" fill="filled" size="small" onClick={() => setOpen(false)} />
                    </>
                )}
            >
                <p style={{ margin: 0, font: 'var(--body-default)' }}>
                    Ana Ruiz · Algebra I · Grade 9. Last session: reviewed factoring and assigned practice set 3.
                </p>
            </PatternDrawer>
        </>
    );
};

/**
 * A drawer open over the page: the scrim covers the whole frame, and the md
 * drawer runs the full height at the right edge (677 at 1024). Escape closes
 * it and leaves the page.
 */
export const WithDrawer = {
    render: () => <DrawerOverPage />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await withTestViewport(1024, 900, async () => {
            const drawer = await canvas.findByRole('dialog', { name: 'Session details' });
            const overlay = drawer.parentElement;
            const box = overlay.getBoundingClientRect();
            const panel = drawer.getBoundingClientRect();
            await expect(box.width, 'the scrim covers the screen').toBeCloseTo(window.innerWidth, 0);
            await expect(box.height, 'the scrim covers the screen').toBeCloseTo(window.innerHeight, 0);
            await expect(panel.right, 'at the right edge').toBeCloseTo(box.right, 0);
            await expect(panel.height, 'full height').toBeCloseTo(box.height, 0);
            await expect(panel.width, 'width md at 1024').toBeCloseTo(677, 0);
            await expect(within(drawer).getByRole('button', { name: 'Close' }), 'focus is in the drawer').toHaveFocus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
            await expect(canvas.getByRole('main'), 'the page stays').toBeInTheDocument();
        });
    },
};

/**
 * Interactive
 * Full interactive page layout with responsive controls
 */
export const Interactive = {
    render: (args) => (
        <PageLayout
            title="Page Layout"
            style={{ height: '100%', minHeight: '100%' }}
            sidebarConfig={{
                user: args.userType,
            }}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Dashboard' },
                ],
                user: {
                    name: args.userName,
                    counter: true,
                    counterValue: args.notificationCount,
                },
            }}
        >
            <div style={{ padding: '24px' }}>
                <h1 className="h2">Page Title</h1>
                <p className="body1-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Use the MD / LG / XL toolbar above to simulate viewport width. The sidebar docks from
                    1024px; below that, hover the menu control to peek it over the page and click to dock it.
                </p>

                <div
                    className="mt-4"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="p-3">
                            <h2 className="h5">Card {i + 1}</h2>
                            <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Content
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </PageLayout>
    ),
    args: {
        userType: 'tutor',
        userName: 'Jane Doe',
        notificationCount: 3,
    },
    argTypes: {
        userType: {
            control: { type: 'select' },
            options: ['tutor', 'supervisor'],
            table: { category: 'Design' },
        },
        userName: {
            control: 'text',
            table: { category: 'Content' },
        },
        notificationCount: {
            control: 'number',
            table: { category: 'Content' },
        },
    },
};

/* ------------------------------------------------------------- frame="focused" */

/**
 * `frame="focused"` — the page for one task: no sidebar, a Back · title · Close
 * topbar, the surface at reading width, and the actions in a footer row. The
 * focused stories below set the viewport first, because the layout tokens
 * switch on `@media (min-width: …)`, and read every expected length and color
 * from its token through a probe.
 */

const FOCUSED_HEIGHT = 900;

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

const NoteActions = () => (
    <>
        <Button style="secondary" fill="outline" text="Save draft" />
        <Button style="primary" fill="filled" text="Submit note" />
    </>
);

const focusedArgs = { title: 'Add a session note', onBack: fn(), onClose: fn() };

const FocusedNote = ({ breakpoint, body = 1, withActions = true, ...args }) => (
    <PageLayout
        frame="focused"
        style={{ height: '100%', minHeight: '100%' }}
        actions={withActions ? <NoteActions /> : undefined}
        {...args}
    >
        {Array.from({ length: body }, (_, i) => <NoteForm key={i} />)}
    </PageLayout>
);

const rect = (el) => el.getBoundingClientRect();

const focusedParts = (canvasElement) => {
    const canvas = within(canvasElement);
    const frame = canvasElement.querySelector('.plus-page-layout--focused .plus-frame');
    return {
        canvas,
        frame,
        banner: canvas.getByRole('banner'),
        main: canvas.getByRole('main'),
        footer: canvas.queryByRole('contentinfo', { name: 'Page actions' }),
        back: canvas.queryByRole('button', { name: 'Back' }),
        close: canvas.queryByRole('button', { name: 'Close' }),
        title: canvas.getByRole('heading', { level: 1 }),
        surface: frame.querySelector('.plus-frame__surface'),
        actions: frame.querySelector('.plus-page-focused__actions'),
    };
};

/** The focused page at one width: three rows 8 apart, the reading column, the actions over it. */
const expectFocusedLayout = async (canvasElement, width) => {
    const { frame, banner, back, close, surface, main, footer, actions } = focusedParts(canvasElement);
    const padX = tokenLength(frame, '--focused-page-pad-x');
    const padY = tokenLength(frame, '--focused-page-pad-y');
    const stack = tokenLength(frame, '--focused-page-stack-sm');
    const reading = tokenLength(frame, '--layout-max-width-reading');
    const minimum = tokenLength(frame, '--layout-min-width-content');
    const surfacePad = tokenLength(frame, '--surface-pad');

    await expect(rect(banner).height, 'topbar height').toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
    await expect(rect(banner).top - rect(frame).top, 'the frame pads the top').toBeCloseTo(padY, 0);
    await expect(rect(back).left - rect(frame).left, 'Back sits at the frame pad').toBeCloseTo(padX, 0);
    await expect(rect(frame).right - rect(close).right, 'Close sits at the frame pad').toBeCloseTo(padX, 0);
    await expect(canvasElement.querySelector('aside'), 'no sidebar').toBeNull();
    await expect(rect(surface).left - rect(frame).left, 'the surface starts at the frame pad').toBeCloseTo(padX, 0);
    await expect(rect(surface).top - rect(banner).bottom, 'a stack under the topbar').toBeCloseTo(stack, 0);

    // The column is 864, or the surface less its pads, never under 720.
    const expected = Math.max(minimum, Math.min(reading, rect(surface).width - 2 * surfacePad));
    await expect(rect(main).width, `reading column at ${width}`).toBeCloseTo(expected, 0);
    if (width >= 1440) await expect(rect(main).width, 'capped at the reading width').toBeCloseTo(reading, 0);
    await expect(rect(actions).width, `the actions column at ${width}`).toBeCloseTo(expected, 0);
    await expect(rect(actions).left, 'the actions line up with the content').toBeCloseTo(rect(main).left, 0);

    await expect(rect(footer).top - rect(surface).bottom, 'a stack under the surface').toBeCloseTo(stack, 0);
    await expect(rect(frame).bottom - rect(footer).bottom, 'the frame pads the foot').toBeCloseTo(padY, 0);
};

/** A focused page: a session note, with Save draft and Submit note in the footer. */
export const Focused = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
};

/** Back, Close, the content and the footer actions, in that order, with the page's landmarks. */
export const FocusedKeyboardAndLandmarks = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement, args }) => {
        const { canvas, banner, main, footer, back, close, title } = focusedParts(canvasElement);

        // One banner, one main, one named footer; the title is the page's one h1, in the banner.
        await expect(canvas.getAllByRole('banner')).toHaveLength(1);
        await expect(canvas.getAllByRole('main')).toHaveLength(1);
        await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expect(banner).toContainElement(title);
        await expect(title).toHaveTextContent(args.title);
        await expect(banner).toContainElement(back);
        await expect(banner).toContainElement(close);
        await expect(main).not.toContainElement(footer);
        await expect(canvas.queryByRole('complementary'), 'no sidebar').toBeNull();
        await expect(canvas.queryByRole('button', { name: /sidebar/i }), 'no sidebar toggle').toBeNull();

        // Focus order: Back first in the page, then Close, the fields, then the actions.
        const page = canvasElement.querySelector('.plus-page-layout--focused');
        const focusables = [...page.querySelectorAll('a[href], button, input, textarea')];
        await expect(focusables[0], 'Back is the first stop').toBe(back);
        back.focus();
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

/** In every color mode: the sunken frame, the default surface with its edge, the title in the body text color. */
export const FocusedColorModes = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const { frame, surface, title } = focusedParts(canvasElement);
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
export const FocusedLongTitle = {
    args: { ...focusedArgs, title: 'Reflection on the session with Jordan about two-step equations, word problems and the practice set we planned for next week' },
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(768, FOCUSED_HEIGHT, async () => {
        const { frame, title, back, close } = focusedParts(canvasElement);
        const style = getComputedStyle(title);
        await expect(style.whiteSpace).toBe('nowrap');
        await expect(style.textOverflow).toBe('ellipsis');
        await expect(title.scrollWidth, 'the title overflows and truncates').toBeGreaterThan(title.clientWidth);
        await expect(rect(close).height, 'Close keeps its 32').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
        await expect(rect(back).height, 'Back keeps its 32').toBeCloseTo(tokenLength(frame, '--item-height-md'), 0);
        await expect(rect(frame).right - rect(close).right, 'Close stays on screen').toBeCloseTo(tokenLength(frame, '--focused-page-pad-x'), 0);
    }),
};

/** Without actions there is no footer; without handlers there is no Back or Close. */
export const FocusedBare = {
    args: { title: 'Session report' },
    render: (args) => <FocusedNote {...args} withActions={false} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('contentinfo')).toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Back' })).toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Close' })).toBeNull();
        await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Session report');
    },
};

/** With `backHref`, Back is an anchor to that address (Button keeps its button role). */
export const FocusedBackAsLink = {
    args: { ...focusedArgs, onBack: undefined, backHref: '#sessions' },
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const { back, banner } = focusedParts(canvasElement);
        await expect(back.tagName).toBe('A');
        await expect(back).toHaveAttribute('href', '#sessions');
        await expect(banner).toContainElement(back);
    },
};

/** A long body scrolls inside the surface; the topbar and the footer stay put. */
export const FocusedLongBody = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} body={3} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(1024, 600, async () => {
        const { surface, footer, banner, frame } = focusedParts(canvasElement);
        await waitFor(() => expect(surface.scrollHeight, 'the body overflows').toBeGreaterThan(surface.clientHeight));
        const footerTop = rect(footer).top;
        const bannerTop = rect(banner).top;
        surface.scrollTop = surface.scrollHeight;
        await expect(surface.scrollTop, 'the surface scrolled').toBeGreaterThan(0);
        await expect(rect(footer).top, 'the footer did not move').toBeCloseTo(footerTop, 0);
        await expect(rect(banner).top, 'the topbar did not move').toBeCloseTo(bannerTop, 0);
        await expect(rect(frame).bottom - rect(footer).bottom, 'the footer stays at the foot').toBeCloseTo(tokenLength(frame, '--focused-page-pad-y'), 0);
    }),
};

/** 768: the column is the surface less its pads, 720; the actions line up with it. */
export const FocusedMedium768 = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(768, FOCUSED_HEIGHT, () => expectFocusedLayout(canvasElement, 768)),
};

/** 1024: still under the cap, so the column fills the padded surface. */
export const FocusedLarge1024 = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(1024, FOCUSED_HEIGHT, () => expectFocusedLayout(canvasElement, 1024)),
};

/** 1440: the column caps at 864, centered, and the actions cap with it. */
export const FocusedXLarge1440 = {
    args: focusedArgs,
    render: (args) => <FocusedNote {...args} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => withTestViewport(1440, FOCUSED_HEIGHT, () => expectFocusedLayout(canvasElement, 1440)),
};
