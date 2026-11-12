import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button, TextField, TextArea } from '@/components';
import { PatternCard, PatternDrawer, PatternSection } from '@/patterns';
import { FocusedFrame, InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import BrowserFrame from '@/storybook-docs/chrome/BrowserFrame';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

/**
 * Templates: the page every screen starts from. The frame (a 240
 * sidebar docked from 1024, the Page on a 12-column grid under its breadcrumb) with content
 * in the surface. The stories here are the examples the docs page shows, each
 * composed from `Frame` with the PLUS `Sidebar` and a `Breadcrumb` (the default
 * template) or with no sidebar (the focused one), filled with `PatternSection`
 * and `PatternCard`.
 */

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Sessions' }];

const fullHeight = (node) => <div style={{ height: '100vh' }}>{node}</div>;

const METRICS = [
    { title: 'Sessions this week', value: '12', note: '2 more than last week' },
    { title: 'Students', value: '8', note: '3 in Algebra I' },
    { title: 'Notes to write', value: '3', note: 'Due Friday' },
    { title: 'Hours tutored', value: '14', note: 'This term' },
];

/** A metric card: one number, one note. */
const Metric = ({ title, value, note }) => (
    <PatternCard title={title} padding="sm">
        <p style={{ margin: 0, font: 'var(--heading-large)', color: 'var(--ds-text)' }}>{value}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{note}</p>
    </PatternCard>
);

/** Cards reflow to the most per row that keeps their minimum width. */
const cardRow = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-md), 1fr))',
    gap: 'var(--grid-gutter)',
};

/** The dashboard template's content: a page header, a row of metric cards, a section. */
const DashboardContent = () => (
    <>
        <PatternSection
            level="page"
            title="Sessions"
            description="This week at a glance."
            actions={<Button text="Add a session" appearance="primary" spacing="compact" iconBefore="plus" />}
        >
            <div style={cardRow}>
                {METRICS.map((metric) => <Metric key={metric.title} {...metric} />)}
            </div>
        </PatternSection>
        <PatternSection title="Next up" description="Your sessions for the next three days.">
            <PatternCard title="Thursday" description="4:00–5:00 PM · Ana Ruiz · Algebra I" padding="sm" />
        </PatternSection>
    </>
);

/** The reading template's content: one column of long-form sections. */
const ReadingContent = () => (
    <>
        <PatternSection level="page" title="Tutor handbook" description="What to know before your first session." />
        <PatternSection title="Before the session">
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                Read the student's last note, open the practice set you assigned, and check the session link five minutes ahead. Keep the first minutes for a check-in, so the student starts with what is on their mind.
            </p>
        </PatternSection>
        <PatternSection title="During the session">
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                Ask the student to explain a step in their own words before you explain it. Name one thing that went well and one thing to try next time.
            </p>
        </PatternSection>
    </>
);

/** The default template: the app frame with the Sidebar and the breadcrumb, filling the box it sits in. */
const AppPage = ({ children, ...frameProps }) => (
    <InAppFrame breadcrumbs={BREADCRUMBS} height="100%" {...frameProps}>{children}</InAppFrame>
);

export default {
    title: 'Templates/Overview',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    // The preview's `^on[A-Z]` actions rule skips an arg that is already a key, so naming
    // these keeps an ordinary page from getting a Back or Close. Focused stories pass their own.
    args: { onBack: undefined, onClose: undefined },
    argTypes: {
        frame: {
            control: 'select',
            options: ['default', 'focused'],
            table: { category: 'Design', defaultValue: { summary: 'default' } },
        },
        title: {
            control: 'text',
            table: { category: 'Slots' },
        },
        backLabel: {
            control: 'text',
            table: { category: 'Slots', defaultValue: { summary: 'Back' } },
        },
        closeLabel: {
            control: 'text',
            table: { category: 'Slots', defaultValue: { summary: 'Close' } },
        },
        sidebarHidden: {
            control: 'boolean',
            table: { category: 'Design', defaultValue: { summary: 'false' } },
        },
        onBack: { control: false, table: { disable: true } },
        onClose: { control: false, table: { disable: true } },
    },
};

/* ------------------------------------------------------------- templates */

/**
 * The docs browser frame leaves a template's geometry alone: the sidebar's
 * left edge and the page's width match the same template with no chrome.
 * Hidden from the sidebar.
 */
export const InBrowserFrame = {
    parameters: { docs: { disable: true }, a11y: { test: 'off' } },
    render: () => (
        <div>
            <div data-case="bare">{fullHeight(<AppPage><DashboardContent /></AppPage>)}</div>
            {['chrome', 'safari', 'edge'].map((browser) => (
                <div key={browser} data-case={browser}>
                    <BrowserFrame browser={browser}>
                        {fullHeight(<AppPage><DashboardContent /></AppPage>)}
                    </BrowserFrame>
                </div>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => withTestViewport(1280, 900, async () => {
        const measure = (name) => {
            const box = canvasElement.querySelector(`[data-case="${name}"]`);
            const frame = box.querySelector('.plus-frame');
            const aside = frame.querySelector('.plus-frame__sidebar');
            return {
                box,
                sidebarLeft: aside.getBoundingClientRect().left - box.getBoundingClientRect().left,
                pageWidth: frame.querySelector('.plus-frame__surface').getBoundingClientRect().width,
                frameWidth: frame.getBoundingClientRect().width,
            };
        };
        await inEveryColorMode(async (mode) => {
            const bare = measure('bare');
            await expect(bare.box.querySelector('[data-browser]'), `no chrome without the browser (${mode})`).toBeNull();
            for (const name of ['chrome', 'safari', 'edge']) {
                const framed = measure(name);
                await expect(framed.box.querySelector('[data-browser]'), `${name} chrome is drawn (${mode})`).not.toBeNull();
                await expect(framed.sidebarLeft, `${name}: sidebar left edge (${mode})`).toBeCloseTo(bare.sidebarLeft, 0);
                await expect(framed.pageWidth, `${name}: page width (${mode})`).toBeCloseTo(bare.pageWidth, 0);
                await expect(framed.frameWidth, `${name}: frame width (${mode})`).toBeCloseTo(bare.frameWidth, 0);
            }
        });
    }),
};

/** The dashboard in the Chrome window: a template is the container the app is dropped into. */
export const InBrowser = {
    parameters: { browserFrame: 'chrome', docs: { disable: true } },
    render: () => fullHeight(<AppPage><DashboardContent /></AppPage>),
};

/** content=dashboard: a page header, metric cards that reflow, and a section. */
export const Dashboard = {
    render: () => fullHeight(<AppPage><DashboardContent /></AppPage>),
    // An ordinary page: no Back, no Close.
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: 'Back' }), 'no Back on an ordinary page').toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Close' }), 'no Close on an ordinary page').toBeNull();
    },
};

/** content=blank: the template with one empty slot. */
export const Blank = {
    render: () => fullHeight(
        <AppPage>{slotContent('Content slot: Sections')}</AppPage>,
    ),
};

/** content=reading: the surface capped at 864. */
export const Reading = {
    render: () => fullHeight(
        <InAppFrame breadcrumbs={BREADCRUMBS} width="reading"><ReadingContent /></InAppFrame>,
    ),
};

/** 768: the sidebar is closed, and the frame's left edge is hovered, so it floats over the page. */
export const SidebarOverPage = {
    render: () => fullHeight(<AppPage><DashboardContent /></AppPage>),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const peek = async () => {
            await canvas.findByRole('button', { name: 'Open sidebar' });
            // A pointer entering the frame's left edge, as the page's reader would; React reads it from `pointerover`.
            // It is sent again until the frame has taken it, because the frame settles its width after the first paint.
            await waitFor(() => {
                canvasElement.querySelector('.plus-frame__edge')
                    ?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
                expect(canvas.queryByRole('navigation', { name: 'Main' })).not.toBeNull();
            }, { timeout: 4000 });
        };
        if (window.innerWidth < 1024) {
            await peek();
            return;
        }
        await withTestViewport(768, 900, async () => {
            await peek();
            const aside = canvas.getByRole('navigation', { name: 'Main' }).closest('.plus-frame__sidebar');
            const frame = canvasElement.querySelector('.plus-frame');
            await expect(getComputedStyle(aside).position, 'the sidebar floats over the page').toBe('absolute');
            await expect(aside.getBoundingClientRect().width).toBeCloseTo(tokenLength(frame, '--frame-sidebar-width'), 0);
        });
    },
};

/* ------------------------------------------------------------- focused page */

/** Stacked fields sit Element/gap-md apart (forms.md § Spacing rules). */
const fieldStack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' };

const NoteForm = () => (
    <>
        <PatternSection title="Session details" description="What the student worked on today.">
            <div style={fieldStack}>
                <TextField label="Topic" placeholder="e.g. Solving two-step equations" />
                <TextArea label="Notes" placeholder="What went well, and what to try next time" rows={6} />
            </div>
        </PatternSection>
        <PatternSection title="Follow-up">
            <TextField label="Next step" placeholder="e.g. Practice set 4" />
        </PatternSection>
    </>
);

const NoteActions = () => (
    <>
        <Button text="Save draft" />
        <Button appearance="primary" text="Submit note" />
    </>
);

/** The focused template: Back, the title and Close in the Page header row, the sections at reading width, the actions at the foot. */
export const Focused = {
    args: { title: 'Add a session note', onBack: fn(), onClose: fn() },
    render: (args) => fullHeight(
        <FocusedFrame actions={<NoteActions />} {...args}>
            <NoteForm />
        </FocusedFrame>,
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const head = canvasElement.querySelector('.plus-frame__head');
        await expect(canvas.queryByRole('banner'), 'no top bar').toBeNull();
        const back = canvas.getByRole('button', { name: 'Back' });
        const close = canvas.getByRole('button', { name: 'Close' });
        const title = canvas.getByRole('heading', { level: 1 });
        // Back left of the title, Close at the right end, all in the Page header row.
        await expect(head).toContainElement(back);
        await expect(head).toContainElement(title);
        await expect(head).toContainElement(close);
        await expect(back.getBoundingClientRect().right, 'Back is left of the title').toBeLessThanOrEqual(title.getBoundingClientRect().left + 1);
        await expect(close.getBoundingClientRect().left, 'Close is right of the title').toBeGreaterThanOrEqual(title.getBoundingClientRect().left);
        await expect(close.getBoundingClientRect().right, 'Close ends the row').toBeCloseTo(head.getBoundingClientRect().right, 0);
        await expect(back.querySelector('.fa-arrow-left')).not.toBeNull();
        await expect(close.querySelector('.fa-xmark')).not.toBeNull();
        // Keyboard: both take focus with the ring, and fire their callbacks.
        await userEvent.tab();
        await expect(back).toHaveFocus();
        await userEvent.tab();
        await expect(close).toHaveFocus();
        for (const el of [back, close]) {
            el.focus();
            const style = getComputedStyle(el);
            await expect(parseFloat(style.outlineWidth), 'a 2px focus ring').toBeCloseTo(tokenLength(canvasElement, '--focus-ring-width'), 0);
            await expect(style.outlineColor, 'the focus ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
        }
        back.focus();
        await userEvent.keyboard('{Enter}');
        await expect(args.onBack).toHaveBeenCalledTimes(1);
        close.focus();
        await userEvent.keyboard(' ');
        await expect(args.onClose).toHaveBeenCalledTimes(1);
    },
};

/** The focused page with no play, for the docs page's frames: the play above moves focus and presses Back and Close. Hidden from the sidebar. */
export const FocusedStill = {
    args: Focused.args,
    render: Focused.render,
    parameters: { docs: { disable: true } },
};

/** A read-only task drops the footer; with no way back, Close alone leaves the task. */
export const FocusedReadOnly = {
    args: { title: 'Session report · Jordan · Oct 24', onClose: fn() },
    render: (args) => fullHeight(
        <FocusedFrame {...args}>
            <PatternSection title="Summary" description="What the student worked on today.">
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                    Jordan solved two-step equations and started word problems.
                </p>
            </PatternSection>
        </FocusedFrame>,
    ),
};

/* ------------------------------------------------------------- drawer */

const PageWithDrawer = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <>
            <AppPage>
                <DashboardContent />
                <div>
                    <Button text="Open session details" spacing="compact" onClick={() => setOpen(true)} />
                </div>
            </AppPage>
            {/* The Drawer pattern over the template; it places itself at the edge in its own Overlay. */}
            <PatternDrawer
                open={open}
                width="md"
                title="Session details"
                description="Thursday · 4:00–5:00 PM"
                onClose={() => setOpen(false)}
                footer={(
                    <>
                        <Button text="Cancel" spacing="compact" onClick={() => setOpen(false)} />
                        <Button text="Save changes" appearance="primary" spacing="compact" onClick={() => setOpen(false)} />
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

/** A drawer open over the page. The backdrop covers the frame and the drawer runs the full height at the end edge. */
export const WithDrawer = {
    render: () => fullHeight(<PageWithDrawer />),
    play: async ({ canvasElement }) => {
        const drawer = await within(canvasElement).findByRole('dialog', { name: 'Session details' });
        const overlay = drawer.parentElement;
        await expect(drawer.getBoundingClientRect().height, 'full height').toBeCloseTo(overlay.getBoundingClientRect().height, 0);
        await expect(drawer.getBoundingClientRect().right, 'at the end edge').toBeCloseTo(overlay.getBoundingClientRect().right, 0);
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(within(canvasElement).queryByRole('dialog'), 'closed through the page\'s own state').toBeNull());
    },
};

/** The same open drawer with no play, for the docs page's frame: the play above closes it. Hidden from the sidebar. */
export const WithDrawerStill = {
    render: WithDrawer.render,
    parameters: { docs: { disable: true } },
};

/** With no drawer the template draws none. */
export const WithoutDrawer = {
    render: () => fullHeight(<AppPage><DashboardContent /></AppPage>),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByRole('main');
        await expect(within(canvasElement).queryByRole('dialog')).toBeNull();
    },
};

/* ------------------------------------------------------------- playground */

/** The page with its props live: the default frame or the focused one. */
export const Interactive = {
    args: { frame: 'default', title: 'Add a session note', backLabel: 'Back', closeLabel: 'Close', sidebarHidden: false },
    render: ({ frame, title, backLabel, closeLabel, sidebarHidden }) => (
        <div style={{ height: 520 }}>
            {frame === 'focused' ? (
                <FocusedFrame
                    title={title}
                    backLabel={backLabel}
                    closeLabel={closeLabel}
                    actions={<NoteActions />}
                    onBack={() => {}}
                    onClose={() => {}}
                >
                    <NoteForm />
                </FocusedFrame>
            ) : sidebarHidden ? (
                <InAppFrame breadcrumbs={BREADCRUMBS} height="100%" sidebar={null}><DashboardContent /></InAppFrame>
            ) : (
                <AppPage><DashboardContent /></AppPage>
            )}
        </div>
    ),
};
