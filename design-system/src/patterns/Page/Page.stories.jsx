import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, Link, Tabs } from '@/components';
import { Frame, PatternCard, PatternSection } from '@/patterns';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { SlideViews } from '@/lib/navigationMotion';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { ScreenStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import {
    CardsSection,
    DemoPageHeader,
    PAGE_STAGE,
    TYPE_STAGE,
    ANATOMY_PARTS,
    PageActions,
    PageBanner,
    PageStage,
    PageTabs,
    ViewBarWithAdd,
    ViewSelect,
} from './pageDemo.jsx';
import Page, { PAGE_EDGE, PAGE_LEVELS } from '@/patterns/Page';
import { computedShadow, probe, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { DemoLabel, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';

const col = { display: 'flex', flexDirection: 'column', gap: '24px' };

/** What each level must draw: its fill and its shadow, as a pair. */
const LEVEL_PAIRS = {
    sunken: ['--ds-surface-sunken', 'none'],
    default: ['--ds-surface', PAGE_EDGE],
    raised: ['--ds-surface-raised', 'var(--ds-shadow-raised)'],
    overlay: ['--ds-surface-overlay', 'var(--ds-shadow-overlay)'],
};

/** A level's pair, as its slot names it. */
const pairLabel = (level) => {
    const [fill, shadow] = LEVEL_PAIRS[level];
    if (shadow === 'none') return `${fill}, no shadow`;
    if (shadow === PAGE_EDGE) return `${fill}, edged by --ds-border-surface`;
    return `${fill} + ${shadow.slice('var('.length, -1)}`;
};

/** Every elevation level, lowest to highest, on the frame's sunken backdrop — docs section only */
function PageLevelsDemo() {
    return (
        <div style={{ ...col, padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            {PAGE_LEVELS.map((level) => (
                <div key={level}>
                    <DemoLabel>{level}</DemoLabel>
                    <Page level={level} padding="sm" radius="md">
                        {slotContent(pairLabel(level))}
                    </Page>
                </div>
            ))}
        </div>
    );
}

export default {
    title: 'Templates/Page',
    id: 'templates-page',
    component: Page,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
        level: {
            control: 'select',
            options: PAGE_LEVELS,
            table: { category: 'Design' },
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        radius: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
            table: { category: 'Design' },
        },
        border: {
            control: 'boolean',
            table: { category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <Page padding="md" radius="lg">
        {slotContent('Content slot')}
    </Page>
);

/** One level on the frame's sunken backdrop, labeled with its fill and shadow. */
const OneLevel = ({ level }) => (
    <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        <Page level={level} padding="sm" radius="md">
            {slotContent(pairLabel(level))}
        </Page>
    </div>
);

/** sunken: the frame's backdrop, with no shadow. */
export const Sunken = { render: () => <OneLevel level="sunken" /> };
/** default: the page, edged by `--ds-border-surface`. */
export const DefaultLevel = { name: 'Default', render: () => <OneLevel level="default" /> };
/** raised: a card, with the raised shadow. */
export const Raised = { render: () => <OneLevel level="raised" /> };
/** overlay: anything over the UI, with the overlay shadow. */
export const Overlay = { render: () => <OneLevel level="overlay" /> };

/** One padding and radius step on a default Page, on the sunken backdrop. */
const OneStep = ({ step }) => (
    <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
        <Page padding={step} radius={step}>
            {slotContent(`padding ${step}, radius ${step}`)}
        </Page>
    </div>
);

/** padding and radius none: the content runs to the edge. */
export const StepNone = { name: 'None', render: () => <OneStep step="none" /> };
/** padding and radius sm. */
export const StepSmall = { name: 'Small', render: () => <OneStep step="sm" /> };
/** padding and radius md: the frame's own pad. */
export const StepMedium = { name: 'Medium', render: () => <OneStep step="md" /> };
/** padding and radius lg. */
export const StepLarge = { name: 'Large', render: () => <OneStep step="lg" /> };

/** border: a bold 2px border, drawn in place of the default level's edge ring. */
export const Bordered = {
    render: () => (
        <div style={{ padding: 'var(--page-pad)', backgroundColor: 'var(--ds-surface-sunken)' }}>
            <Page padding="md" radius="md" border>
                {slotContent('border')}
            </Page>
        </div>
    ),
};

/** title: the page's one h1, above the content. */
export const WithTitle = {
    name: 'With title',
    render: () => (
        <Page padding="md" radius="lg" title="Sessions">
            {slotContent('Content slot')}
        </Page>
    ),
};

/** In every color mode, each level draws its fill with its own shadow, and text in the body color. */
export const ColorModes = {
    render: () => <PageLevelsDemo />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        await inEveryColorMode(async (mode) => {
            for (const level of PAGE_LEVELS) {
                const el = canvasElement.querySelector(`.plus-pattern-page-level-${level}`);
                const [fill, shadow] = LEVEL_PAIRS[level];
                const style = getComputedStyle(el);
                await expect(style.backgroundColor, `${mode}: ${level} fill`).toBe(tokenColor(canvasElement, fill));
                await expect(style.boxShadow, `${mode}: ${level} shadow`).toBe(computedShadow(canvasElement, shadow));
                await expect(style.color, `${mode}: ${level} text`).toBe(tokenColor(canvasElement, '--ds-text'));
            }
        });
    },
};

/** A Page used alone pads as the content box inside the frame does: the frame's `--page-pad`, on every side. */
export const MediumPad = {
    render: () => (
        <Page padding="md">
            {slotContent('Content slot')}
        </Page>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const style = getComputedStyle(canvasElement.querySelector('.plus-pattern-page'));
        const pad = px(probe(canvasElement, 'paddingTop', 'var(--page-pad)', { display: 'block' }));
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            await expect(px(style[`padding${side}`]), `pad ${side.toLowerCase()}`).toBe(pad);
        }
        await expect(style.borderTopLeftRadius, 'Page is flush in the Frame: radius 0').toBe('0px');
    },
};

export const Interactive = {
    args: {
        level: 'default',
        padding: 'md',
        radius: 'lg',
        border: false,
    },
    render: (args) => (
        <Page {...args}>
            {slotContent('Content slot')}
        </Page>
    ),
};

/* The template's types, anatomy, key scenarios and states: live stories of the real header, Sections and Frame. */

const RECORD_CRUMBS = [{ text: 'Students', href: '#' }, { text: 'Maya Rodriguez' }];
const DEEP_CRUMBS = [{ text: 'Students', href: '#' }, { text: 'Maya Rodriguez', href: '#' }, { text: 'Session on Oct 14' }];

/** The page's content box: the Frame's content element, which carries the cap. */
const contentBox = (root) => root.querySelector('.plus-frame__content');

/** A tutor's area page: the title alone over Sections. */
const AreaPage = ({ full = false }) => (
    <PageStage full={full} width={TYPE_STAGE} height={300}>
        <DemoPageHeader title="Sessions" />
        <CardsSection title="Upcoming sessions" description="Next 7 days" actions={<PageActions />} />
    </PageStage>
);

/** Default: the content grid, centered and capped at 1232. */
export const TypeDefault = {
    name: 'Type: Default',
    render: () => <AreaPage />,
    play: async ({ canvasElement }) => {
        const cap = parseFloat(getComputedStyle(canvasElement).getPropertyValue('--content-max-width')) || FRAME_LAYOUT.contentCap;
        await expect(contentBox(canvasElement).getBoundingClientRect().width, 'the content box stops at the cap').toBe(cap);
    },
};

/** Full width: the content runs to the pad, with no cap. */
export const TypeFullWidth = {
    name: 'Type: Full width',
    render: () => <AreaPage full />,
    play: async ({ canvasElement }) => {
        await expect(contentBox(canvasElement).getBoundingClientRect().width, 'the content runs past the cap').toBeGreaterThan(FRAME_LAYOUT.contentCap);
        await expect(canvasElement.querySelector('[data-page-stage]').offsetWidth, 'at the stage width').toBe(TYPE_STAGE);
    },
};

/** The record page with everything the header can carry. */
const RecordPage = ({ banner = false }) => (
    <PageStage width={PAGE_STAGE} height={480}>
        <DemoPageHeader
            breadcrumb={RECORD_CRUMBS}
            title="Maya Rodriguez"
            status={{ appearance: 'success', text: 'Active' }}
            description="Grade 8 · Math · Lincoln Middle School"
            actions={<PageActions />}
            tabs={<PageTabs />}
        />
        {banner && <PageBanner />}
        <CardsSection title="Upcoming sessions" />
    </PageStage>
);

/** Every part once: breadcrumb, title with its StatusTag, description, actions, page tabs, banner, content. Markers sit in the nearest gutter. */
export const AnatomyRecord = {
    name: 'Anatomy',
    render: () => (
        <LiveAnatomy width={PAGE_STAGE} parts={ANATOMY_PARTS} title="A record page with its parts numbered">
            <RecordPage banner />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
    },
};

/** The same figure at the docs column's width, where the story scales down and the title and description rows sit closer than a marker is tall. */
export const AnatomyRecordScaledDown = {
    name: 'Anatomy, scaled down',
    render: () => (
        <div style={{ width: 880 }}>
            <LiveAnatomy width={PAGE_STAGE} parts={ANATOMY_PARTS} title="A record page with its parts numbered">
                <RecordPage banner />
            </LiveAnatomy>
        </div>
    ),
    play: AnatomyRecord.play,
};

/** Area page, one collection: the title alone; the collection's Primary ends its view bar. */
export const ScenarioArea = {
    name: 'Area page, one collection',
    render: () => (
        <PageStage>
            <DemoPageHeader title="Students" />
            <PatternSection title="Students" type="tabs-only" tabs={<ViewBarWithAdd />}>
                {slotContent('Students table')}
            </PatternSection>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('heading', { level: 1 }), 'one h1').toHaveLength(1);
        await expect(canvasElement.querySelector('.plus-page-header-actions'), 'no page actions on an area page').toBeNull();
        const add = canvas.getByRole('button', { name: 'Add student' });
        await expect(add.closest('.plus-section-view-bar'), '"Add student" ends the view bar, not the header').not.toBeNull();
    },
};

/** Area page, several Sections: each takes a title and its own actions. */
export const ScenarioSeveralSections = {
    name: 'Area page, several Sections',
    render: () => (
        <PageStage height={420}>
            <DemoPageHeader title="Home" />
            <CardsSection title="Upcoming sessions" description="Next 7 days" actions={<Button text="View calendar" onClick={() => {}} />} />
            <PatternSection title="Needs follow-up" actions={<Button text="Review all" onClick={() => {}} />}>
                {slotContent('Reflections table')}
            </PatternSection>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expect(canvas.getAllByRole('heading', { level: 2 }).map((h) => h.textContent), 'Sections open at h2').toEqual(['Upcoming sessions', 'Needs follow-up']);
    },
};

/** Record page under page tabs: the Section's views become one labeled Select. */
export const ScenarioRecordTabs = {
    name: 'Record page under page tabs',
    render: () => (
        <PageStage height={420}>
            <DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" actions={<PageActions />} tabs={<PageTabs active="sessions" />} />
            <PatternSection title="Sessions" type="tabs-only" tabs={<ViewSelect />}>
                {slotContent('Sessions table')}
            </PatternSection>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('tablist'), 'one tab system: the page tabs').toHaveLength(1);
        await expect(canvas.getByRole('tab', { name: 'Sessions' })).toHaveAttribute('aria-selected', 'true');
    },
};

/** Two levels down: every parent in order, each a link. */
export const ScenarioTwoLevels = {
    name: 'Two levels down',
    render: () => (
        <PageStage>
            <DemoPageHeader breadcrumb={DEEP_CRUMBS} title="Session on Oct 14" actions={<PageActions />} />
            <CardsSection title="Notes" />
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const nav = within(canvasElement).getByRole('navigation', { name: 'Breadcrumb' });
        await expect(within(nav).getAllByRole('link').map((a) => a.textContent), 'every parent, each a link').toEqual(['Students', 'Maya Rodriguez']);
    },
};

/** Page banner: under the header, one at a time, scrolling with the content. */
export const KeyBanner = {
    name: 'Page banner',
    render: () => (
        <PageStage>
            <DemoPageHeader title="Sessions" />
            <PageBanner />
            <CardsSection title="Upcoming sessions" />
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const banner = canvasElement.querySelector('.plus-banner');
        const header = canvasElement.querySelector('.plus-page-header');
        await expect(canvasElement.querySelectorAll('.plus-banner'), 'one banner at a time').toHaveLength(1);
        await expect(banner.getBoundingClientRect().top, 'under the header').toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    },
};

/** The Page's own width, as a control: drag through the content cap. */
export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: PAGE_STAGE },
    parameters: { controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 720, max: 1600, step: 8 }, description: "The page's own width, in px.", table: { category: 'Docs' } },
    },
    render: ({ width }) => (
        <div style={{ overflowX: 'auto' }}>
            <div data-probe="stage" style={{ inlineSize: width }}>
                <div style={{ height: 480 }}>
                    <Frame>
                        <DemoPageHeader title="Sessions" actions={<PageActions />} />
                        <CardsSection title="Upcoming sessions" />
                    </Frame>
                </div>
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const stage = canvasElement.querySelector('[data-probe="stage"]');
        const box = () => contentBox(canvasElement).getBoundingClientRect().width;
        stage.style.inlineSize = `${FRAME_LAYOUT.contentCap + 160}px`;
        await waitFor(() => expect(box(), 'past the cap the content stops at it').toBe(FRAME_LAYOUT.contentCap));
        stage.style.inlineSize = `${FRAME_LAYOUT.contentCap - 160}px`;
        await waitFor(() => expect(box(), 'under the cap the content takes the width').toBeLessThan(FRAME_LAYOUT.contentCap));
        await expect(within(canvasElement).getAllByRole('heading', { level: 1 }), 'one h1 at every width').toHaveLength(1);
    },
};

/* ------------------------------------------------------- navigation motion */

const motionOn = (Story) => <MotionPreferenceContext.Provider value={false}><Story /></MotionPreferenceContext.Provider>;
const motionOff = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

const RECORD_TABS = ['overview', 'sessions', 'notes'];

const SwitchViewsDemo = () => {
    const [tab, setTab] = useState('overview');
    const views = {
        overview: (
            <PatternSection title="Current goals">
                <PatternCard title="Multi-step equations" description="Target 80% accuracy by Friday." />
            </PatternSection>
        ),
        sessions: (
            <PatternSection title="Sessions" type="tabs-only" tabs={<ViewSelect />}>
                <CardsSection title="This month" />
            </PatternSection>
        ),
        notes: (
            <PatternSection title="Tutor notes">
                <PatternCard title="Oct 14 reflection" description="Worked through distributive property together." />
            </PatternSection>
        ),
    };
    return (
        <ScreenStage width={FRAME_LAYOUT.dockMin} fluid>
            <BrowserWindow address="app.plus.org/students/maya-rodriguez" height={WINDOW_HEIGHT}>
                <Frame>
                    <Page padding="none">
                        <DemoPageHeader
                            breadcrumb={[{ text: 'Students', href: '#students' }, { text: 'Maya Rodriguez' }]}
                            title="Maya Rodriguez"
                            description="Grade 8 · Math"
                            actions={<PageActions />}
                            tabs={(
                                <Tabs activeKey={tab} onSelect={setTab} aria-label="Student views">
                                    <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
                                    <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
                                    <Tabs.Tab eventKey="notes">Notes</Tabs.Tab>
                                </Tabs>
                            )}
                        />
                        <SlideViews activeKey={tab} keys={RECORD_TABS} size="page">
                            {views[tab]}
                        </SlideViews>
                    </Page>
                </Frame>
            </BrowserWindow>
        </ScreenStage>
    );
};

const switchViewsPlay = (reduced) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const breadcrumb = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('heading', { name: 'Current goals' })).toBeInTheDocument();

    const sessionsTab = canvas.getByRole('tab', { name: 'Sessions' });
    await userEvent.click(sessionsTab);
    const stage = canvasElement.querySelector('[data-slide-views]');
    const tabsRoot = canvasElement.querySelector('.plus-tabs');

    if (reduced) {
        await expect(stage, 'reduced motion never slides').not.toHaveAttribute('data-view-phase', 'sliding');
        await expect(tabsRoot, 'indicator does not glide under reduced motion').not.toHaveAttribute('data-gliding', 'true');
    } else {
        await expect(tabsRoot, 'tab indicator glides on spatial.fast').toHaveAttribute('data-gliding', 'true');
        await expect(stage, 'both peer bodies slide together').toHaveAttribute('data-view-phase', 'sliding');
        const current = stage.querySelector('[data-view-role="current"]');
        const previous = stage.querySelector('[data-view-role="previous"]');
        await expect(previous, 'previous body stays mounted while sliding').not.toBeNull();
        await expect(getComputedStyle(current).opacity, 'peer views never fade while sliding').toBe('1');
        await expect(getComputedStyle(previous).opacity, 'outgoing peer view never fades while sliding').toBe('1');
    }

    await waitFor(() => expect(stage).toHaveAttribute('data-view-phase', 'settled'));
    await expect(sessionsTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('heading', { name: 'This month' })).toBeInTheDocument();
    await expect(within(breadcrumb).getAllByRole('link').map((a) => a.textContent), 'breadcrumb stays unchanged').toEqual(['Students']);

    sessionsTab.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(stage).toHaveAttribute('data-view-phase', 'settled'));
    await expect(canvas.getByRole('heading', { name: 'Tutor notes' })).toBeInTheDocument();
};

export const MotionSwitchViews = {
    name: 'Navigation motion: Switch views',
    decorators: [motionOn],
    render: () => <SwitchViewsDemo />,
    play: switchViewsPlay(false),
};

export const MotionSwitchViewsReduced = {
    name: 'Navigation motion: Switch views, reduced',
    decorators: [motionOff],
    render: () => <SwitchViewsDemo />,
    play: switchViewsPlay(true),
};

const ScrollSpotDemo = () => (
    <ScreenStage width={FRAME_LAYOUT.dockMin} fluid>
        <BrowserWindow address="app.plus.org/sessions/oct-14" height={WINDOW_HEIGHT}>
            <Frame>
                <Page padding="none">
                    <DemoPageHeader
                        breadcrumb={[{ text: 'Sessions', href: '#sessions' }, { text: 'Oct 14 · Maya Rodriguez' }]}
                        title="Oct 14 · Maya Rodriguez"
                        description="Grade 8 · Math · 60 minutes"
                    />
                    <nav aria-label="On this page" style={{ display: 'flex', gap: 'var(--inline-lg)', paddingBlock: 'var(--stack-sm)' }}>
                        <Link href="#spot-overview">Overview</Link>
                        <Link href="#spot-practice">Practice</Link>
                        <Link href="#spot-escalation">Escalation</Link>
                    </nav>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-stack-md)' }}>
                        <PatternSection id="spot-overview" title="Overview">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', minBlockSize: 'var(--height-500)' }}>
                                <PatternCard title="Goal check-in" description="Started with two warm-up problems on linear expressions." />
                                <PatternCard title="Attendance" description="Arrived on time and stayed for the full hour." />
                            </div>
                        </PatternSection>
                        <PatternSection id="spot-practice" title="Practice">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', minBlockSize: 'var(--height-500)' }}>
                                <PatternCard title="Guided set" description="Completed four of five word problems independently." />
                                <PatternCard title="Exit check" description="Paused on negative coefficients." />
                            </div>
                        </PatternSection>
                        <PatternSection id="spot-escalation" title="Escalation">
                            <PatternCard title="Supervisor follow-up" description="Share curriculum packet for negative rational numbers before Tuesday." />
                        </PatternSection>
                        <PatternSection id="spot-next" title="Next steps">
                            <div style={{ minBlockSize: 'var(--height-500)' }}>
                                <PatternCard title="Thursday plan" description="Revisit two-step inequalities with number lines." />
                            </div>
                        </PatternSection>
                    </div>
                </Page>
            </Frame>
        </BrowserWindow>
    </ScreenStage>
);

const scrollSpotPlay = (reduced) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = canvasElement.querySelector('.plus-frame__surface');
    const target = canvasElement.querySelector('#spot-escalation');
    await expect(surface.scrollTop).toBe(0);
    await expect(target).not.toHaveAttribute('data-call-attention');

    await userEvent.click(canvas.getByRole('link', { name: 'Escalation' }));

    if (reduced) {
        await expect(surface, 'reduced motion does not travel through intermediate scroll positions').not.toHaveAttribute('data-scroll-phase', 'scrolling');
        await expect(surface.scrollTop, 'lands immediately at the spot').toBeGreaterThan(100);
        await expect(target, 'reduced motion marks the destination too').toHaveAttribute('data-call-attention');
    } else {
        await expect(surface, 'scrolls smoothly on spatial.slow').toHaveAttribute('data-scroll-phase', 'scrolling');
        await waitFor(() => expect(surface).not.toHaveAttribute('data-scroll-phase'), { timeout: 4000 });
        await expect(surface.scrollTop, 'arrived at the spot').toBeGreaterThan(100);
        await expect(target, 'Call attention marks the destination on arrival').toHaveAttribute('data-call-attention');
    }

    await expect(canvasElement.ownerDocument.activeElement, 'focus moves to the destination').toBe(target);
    await waitFor(() => expect(target, 'Call attention plays once and ends unmarked').not.toHaveAttribute('data-call-attention'), { timeout: 4000 });
};

export const MotionScrollToSpot = {
    name: 'Navigation motion: Scroll to a spot',
    decorators: [motionOn],
    render: () => <ScrollSpotDemo />,
    play: scrollSpotPlay(false),
};

export const MotionScrollToSpotReduced = {
    name: 'Navigation motion: Scroll to a spot, reduced',
    decorators: [motionOff],
    render: () => <ScrollSpotDemo />,
    play: scrollSpotPlay(true),
};

