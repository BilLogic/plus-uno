import React from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';

import { Button, Input, Textarea } from '@/components';
import { Frame, PatternCard, PatternDrawer, PatternSection, Topbar } from '@/patterns';
import { PageLayout } from '@/specs/Universal/Pages';
import { InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

/**
 * Page templates: the page every screen starts from. The frame (a 32 topbar, a
 * 240 sidebar docked from 1024, the surface on a 12-column grid) with content
 * in the surface. The stories here are the examples the docs page shows, each
 * built from `PageLayout`, `Frame`, `PatternSection` and `PatternCard`.
 */

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Sessions' }];
const USER = { name: 'John Doe', type: 'lead tutor' };

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
    gap: 'var(--layout-gutter)',
};

/** The dashboard template's content: a page header, a row of metric cards, a section. */
const DashboardContent = () => (
    <>
        <PatternSection
            level="page"
            title="Sessions"
            description="This week at a glance."
            actions={<Button text="Add a session" style="primary" fill="filled" size="small" leadingVisual="plus" />}
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

const pageProps = {
    sidebarConfig: { user: 'tutor', activeTabId: 'home' },
    topBarConfig: { breadcrumbs: BREADCRUMBS, user: USER },
    style: { height: '100%' },
};

export default {
    title: 'Foundations/Patterns/Page templates',
    component: PageLayout,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        frame: {
            control: 'select',
            options: ['default', 'focused'],
            description: 'default: the app frame with the topbar and the sidebar. focused: one task, with no sidebar.',
            table: { category: 'Design', defaultValue: { summary: 'default' } },
        },
        title: {
            control: 'text',
            description: 'The page title. In a focused page it is the visible title in the topbar.',
            table: { category: 'Slots' },
        },
        backLabel: {
            control: 'text',
            description: 'Focused: the Back button label.',
            table: { category: 'Slots', defaultValue: { summary: 'Back' } },
        },
        closeLabel: {
            control: 'text',
            description: 'Focused: the accessible name of the Close button.',
            table: { category: 'Slots', defaultValue: { summary: 'Close' } },
        },
        sidebarHidden: {
            control: 'boolean',
            description: 'Leaves out the sidebar and its toggle.',
            table: { category: 'Design', defaultValue: { summary: 'false' } },
        },
        children: { table: { disable: true } },
        actions: { table: { disable: true } },
        onBack: { table: { disable: true } },
        onClose: { table: { disable: true } },
        backHref: { table: { disable: true } },
        actionsLabel: { table: { disable: true } },
        sidebarConfig: { table: { disable: true } },
        topBarConfig: { table: { disable: true } },
        footerConfig: { table: { disable: true } },
        floatingContent: { table: { disable: true } },
        mainClassName: { table: { disable: true } },
        contentDirect: { table: { disable: true } },
        shellLoading: { table: { disable: true } },
        shellEntered: { table: { disable: true } },
        sidebarExpanded: { table: { disable: true } },
        style: { table: { disable: true } },
        className: { table: { disable: true } },
        id: { table: { disable: true } },
    },
};

/* ------------------------------------------------------------- templates */

/** content=dashboard: a page header, metric cards that reflow, and a section. */
export const Dashboard = {
    render: () => fullHeight(<PageLayout title="Sessions" {...pageProps}><DashboardContent /></PageLayout>),
};

/** content=blank: the template with one empty slot. */
export const Blank = {
    render: () => fullHeight(
        <PageLayout title="Page title" {...pageProps}>{slotContent('Content slot: Sections')}</PageLayout>,
    ),
};

/** content=reading: the surface capped at 864. */
export const Reading = {
    render: () => fullHeight(
        <InAppFrame breadcrumbs={BREADCRUMBS} user={USER} width="reading"><ReadingContent /></InAppFrame>,
    ),
};

/** 768: the sidebar is closed, and the menu control is hovered, so it floats over the page. */
export const SidebarOverPage = {
    render: () => fullHeight(<PageLayout title="Sessions" {...pageProps}><DashboardContent /></PageLayout>),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const peek = async () => {
            const toggle = await canvas.findByRole('button', { name: /sidebar/i });
            // A pointer entering the toggle, as the page's reader would; React reads it from `pointerover`.
            // It is sent again until the frame has taken it, because the frame settles its width after the first paint.
            await waitFor(() => {
                toggle.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
                expect(canvas.queryByRole('complementary', { name: 'Sidebar' })).not.toBeNull();
            }, { timeout: 4000 });
            return toggle;
        };
        if (window.innerWidth < 1024) {
            await peek();
            return;
        }
        await withTestViewport(768, 900, async () => {
            await peek();
            const aside = canvas.getByRole('complementary', { name: 'Sidebar' });
            const frame = canvasElement.querySelector('.plus-frame');
            await expect(getComputedStyle(aside).position, 'the sidebar floats over the page').toBe('absolute');
            await expect(aside.getBoundingClientRect().width).toBeCloseTo(tokenLength(frame, '--layout-width-sidebar'), 0);
        });
    },
};

/* ------------------------------------------------------------- focused page */

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

/** frame="focused": Back, the title and Close in the topbar, the sections at reading width, the actions in a footer. */
export const Focused = {
    args: { title: 'Add a session note', onBack: fn(), onClose: fn() },
    render: (args) => fullHeight(
        <PageLayout frame="focused" style={{ height: '100%' }} actions={<NoteActions />} {...args}>
            <NoteForm />
        </PageLayout>,
    ),
};

/** A read-only task drops the footer; with no way back, Close alone leaves the task. */
export const FocusedReadOnly = {
    args: { title: 'Session report · Jordan · Oct 24', onClose: fn() },
    render: (args) => fullHeight(
        <PageLayout frame="focused" style={{ height: '100%' }} {...args}>
            <PatternSection title="Summary" description="What the student worked on today.">
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                    Jordan solved two-step equations and started word problems.
                </p>
            </PatternSection>
        </PageLayout>,
    ),
};

/* ------------------------------------------------------------- drawer */

const PageWithDrawer = () => {
    const [open, setOpen] = React.useState(true);
    return (
        <>
            <PageLayout title="Sessions" {...pageProps}>
                <DashboardContent />
                <div>
                    <Button text="Open session details" style="secondary" fill="outline" size="small" onClick={() => setOpen(true)} />
                </div>
            </PageLayout>
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

/** A drawer open over the page: the scrim covers the frame and the drawer runs the full height at the end edge. */
export const WithDrawer = {
    render: () => fullHeight(<PageWithDrawer />),
    play: async ({ canvasElement }) => {
        const drawer = await within(canvasElement).findByRole('dialog', { name: 'Session details' });
        const overlay = drawer.parentElement;
        await expect(drawer.getBoundingClientRect().height, 'full height').toBeCloseTo(overlay.getBoundingClientRect().height, 0);
        await expect(drawer.getBoundingClientRect().right, 'at the end edge').toBeCloseTo(overlay.getBoundingClientRect().right, 0);
    },
};

/* ------------------------------------------------------------- playground */

/** The page with its props live: the default frame or the focused one. */
export const Interactive = {
    args: { frame: 'default', title: 'Sessions', backLabel: 'Back', closeLabel: 'Close', sidebarHidden: false },
    render: ({ frame, ...args }) => (
        <div style={{ height: 520 }}>
            {frame === 'focused' ? (
                <PageLayout
                    frame="focused"
                    style={{ height: '100%' }}
                    actions={<NoteActions />}
                    onBack={() => {}}
                    onClose={() => {}}
                    {...args}
                >
                    <NoteForm />
                </PageLayout>
            ) : (
                <PageLayout {...pageProps} {...args}><DashboardContent /></PageLayout>
            )}
        </div>
    ),
};
