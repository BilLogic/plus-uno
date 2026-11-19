import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Banner, Button, Link, Tabs } from '@/components';
import { Frame, Card, Section, Page } from '@/templates';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { SlideViews } from '@/lib/navigationMotion';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { ScreenStage, ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/multi-step-task.jsx';
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
    RecordTabSection,
    SessionsTable,
    StudentViews,
    AddStudentAction,
    ViewSelect,
} from './pageDemo.jsx';
import { probe, px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { RECORD_CRUMBS, slotContent } from '@/storybook-docs/lib/template-demo.jsx';
import { StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';

export default {
    title: 'Templates/Page',
    id: 'templates-page',
    component: Page,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        as: { table: { disable: true } },
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
    <Page>
        {slotContent('Content slot')}
    </Page>
);

/** title: the page's one h1, above the content. */
export const WithTitle = {
    name: 'With title',
    render: () => (
        <Page title="Sessions">
            {slotContent('Content slot')}
        </Page>
    ),
};

/** The Page owns the gaps when a page message appears below its header. */
export const HeaderAndBanner = {
    render: () => {
        const [showBanner, setShowBanner] = useState(true);
        return (
            <Page
                header={<DemoPageHeader title="Sessions" actions={<Button text="Toggle banner" onClick={() => setShowBanner((show) => !show)} />} />}
                banner={showBanner && <Banner>Sessions move to the new calendar on Friday.</Banner>}
            >
                <Section title="Upcoming sessions">{slotContent('Sessions')}</Section>
            </Page>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const header = canvas.getByRole('heading', { level: 1, name: 'Sessions' }).closest('header');
        const content = canvas.getByRole('heading', { level: 2, name: 'Upcoming sessions' }).closest('.plus-template-section');
        const gap = px(probe(canvasElement, 'marginTop', 'var(--page-stack-md)'));
        const banner = canvas.getByRole('status');
        await expect(banner.getBoundingClientRect().top - header.getBoundingClientRect().bottom).toBeCloseTo(gap, 0);
        await expect(content.getBoundingClientRect().top - banner.getBoundingClientRect().bottom).toBeCloseTo(gap, 0);
        await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await userEvent.click(canvas.getByRole('button', { name: 'Toggle banner' }));
        await expect(canvas.queryByRole('status')).toBeNull();
        await expect(content.getBoundingClientRect().top - header.getBoundingClientRect().bottom).toBeCloseTo(gap, 0);
        await userEvent.click(canvas.getByRole('button', { name: 'Toggle banner' }));
        await expect(canvas.getByRole('status')).toBeVisible();
    },
};

/** Optional slots leave no empty regions, and children-only Pages keep their layout. */
export const OptionalSlots = {
    render: () => (
        <>
            <Page data-testid="legacy" title="Legacy title"><p>Legacy content</p></Page>
            <Page data-testid="header-only" title="Fallback title" header={<DemoPageHeader title="Header title" />} />
            <Page data-testid="banner-only" banner={<Banner>Page message</Banner>}><p>Banner content</p></Page>
            <Page data-testid="title-banner" title="Title with message" banner={<Banner>Another message</Banner>} />
        </>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const legacy = canvas.getByTestId('legacy');
        await expect([...legacy.children].map((el) => el.tagName)).toEqual(['H1', 'P']);
        const headerOnly = canvas.getByTestId('header-only');
        await expect(within(headerOnly).getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expect(within(headerOnly).queryByText('Fallback title')).toBeNull();
        await expect(headerOnly.children).toHaveLength(1);
        const bannerOnly = canvas.getByTestId('banner-only');
        await expect(bannerOnly.firstElementChild).toHaveClass('plus-template-page-banner');
        const titleBanner = canvas.getByTestId('title-banner');
        const gap = px(probe(canvasElement, 'marginTop', 'var(--page-stack-md)'));
        await expect(titleBanner.lastElementChild.getBoundingClientRect().top - titleBanner.firstElementChild.getBoundingClientRect().bottom).toBeCloseTo(gap, 0);
        await expect(titleBanner.children).toHaveLength(2);
    },
};

/** In every color mode, the Page paints `--ds-surface` with text in `--ds-text`, and no shadow, border, or radius. */
export const ColorModes = {
    render: () => (
        <Page>
            {slotContent('Content slot')}
        </Page>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        await inEveryColorMode(async (mode) => {
            const el = canvasElement.querySelector('.plus-template-page');
            const style = getComputedStyle(el);
            await expect(style.backgroundColor, `${mode}: fill`).toBe(tokenColor(canvasElement, '--ds-surface'));
            await expect(style.boxShadow, `${mode}: no shadow`).toBe('none');
            await expect(style.borderTopWidth, `${mode}: no border`).toBe('0px');
            await expect(style.borderTopLeftRadius, `${mode}: no border radius`).toBe('0px');
            await expect(style.color, `${mode}: text`).toBe(tokenColor(canvasElement, '--ds-text'));
        });
    },
};

/** The Page pads `--page-pad` (24) on every side with no border radius, border, or shadow. */
export const MediumPad = {
    render: () => (
        <Page>
            {slotContent('Content slot')}
        </Page>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const style = getComputedStyle(canvasElement.querySelector('.plus-template-page'));
        const pad = px(probe(canvasElement, 'paddingTop', 'var(--page-pad)', { display: 'block' }));
        await expect(pad).toBe(24);
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            await expect(px(style[`padding${side}`]), `pad ${side.toLowerCase()}`).toBe(24);
        }
        for (const corner of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) {
            await expect(style[`border${corner}Radius`], `no ${corner} radius`).toBe('0px');
        }
        await expect(style.boxShadow, 'Page has no shadow').toBe('none');
        await expect(style.borderTopWidth, 'Page has no border').toBe('0px');
    },
};

export const Interactive = {
    args: {
        title: 'Sessions',
    },
    render: (args) => (
        <Page {...args}>
            {slotContent('Content slot')}
        </Page>
    ),
};

/* The template's types, anatomy, key scenarios and states: live stories of the real header, Sections and Frame. */

const DEEP_CRUMBS = [{ text: 'Students', href: '#' }, { text: 'Maya Rodriguez', href: '#' }, { text: 'Session on Oct 14' }];

/** The page's content box: the Frame's content element, which carries the cap. */
const contentBox = (root) => root.querySelector('.plus-frame__content');

/** A tutor's area page: the title alone over Sections. */
const AreaPage = ({ type = 'default' }) => (
    <PageStage scrollable type={type} width={TYPE_STAGE} height={300}>
        <DemoPageHeader title="Sessions" />
        <CardsSection title="Upcoming sessions" description="Next 7 days" actions={<Button text="View calendar" onClick={() => {}} />} />
    </PageStage>
);

/** Default: the content grid, centered and capped at 1232. */
export const TypeDefault = {
    name: 'Type: Default',
    render: () => <AreaPage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const cap = parseFloat(getComputedStyle(canvasElement).getPropertyValue('--content-max-width')) || FRAME_LAYOUT.contentCap;
        await expect(contentBox(canvasElement).getBoundingClientRect().width, 'the content box stops at the cap').toBe(cap);
        const btn = canvas.getByRole('button', { name: 'View calendar' });
        btn.focus();
        await expect(btn).toHaveFocus();
    },
};

/** Full width: the content runs to the pad, with no cap. */
export const TypeFullWidth = {
    name: 'Type: Full width',
    render: () => <AreaPage type="full" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(contentBox(canvasElement).getBoundingClientRect().width, 'the content runs past the cap').toBeGreaterThan(FRAME_LAYOUT.contentCap);
        await expect(canvasElement.querySelector('[data-page-stage]').offsetWidth, 'at the stage width').toBe(TYPE_STAGE);
        const btn = canvas.getByRole('button', { name: 'View calendar' });
        btn.focus();
        await expect(btn).toHaveFocus();
    },
};

/** Reading: the content grid capped at 864, the readable measure for a lesson, an article or a policy. */
export const TypeReading = {
    name: 'Type: Reading',
    render: () => <AreaPage type="reading" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const cap = parseFloat(getComputedStyle(canvasElement).getPropertyValue('--content-max-width-reading')) || 864;
        await expect(contentBox(canvasElement).getBoundingClientRect().width, 'the content box stops at the reading cap').toBe(cap);
        const btn = canvas.getByRole('button', { name: 'View calendar' });
        btn.focus();
        await expect(btn).toHaveFocus();
    },
};

/** The record page with everything the header can carry. */
const RecordPage = ({ banner = false, scrollable = false }) => {
    const [tab, setTab] = useState('overview');
    const [status, setStatus] = useState('upcoming');
    return (
        <PageStage scrollable={scrollable} width={PAGE_STAGE} height={480}>
            <DemoPageHeader
                breadcrumb={RECORD_CRUMBS}
                title="Maya Rodriguez"
                status={{ appearance: 'success', text: 'Active' }}
                description="Grade 8 · Math · Lincoln Middle School"
                actions={<PageActions />}
                tabs={<PageTabs active={tab} onSelect={setTab} />}
            />
            {banner && <PageBanner />}
            <RecordTabSection tab={tab} status={status} onStatusChange={setStatus} />
        </PageStage>
    );
};

const playRecordAnatomy = async (canvasElement) => {
    const canvas = within(canvasElement);
    await expectNotInert(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: 'Sessions' }));
    await expect(canvas.getByRole('table', { name: 'Sessions' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: 'Notes' }));
    await expect(canvas.getByRole('heading', { name: 'Tutor notes' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
    await expect(canvas.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument();

    await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
    leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
};

/** Every part once: breadcrumb, title with its StatusTag, description, actions, page tabs, banner, content. Markers sit in the nearest gutter. */
export const AnatomyRecord = {
    name: 'Anatomy',
    render: () => (
        <LiveAnatomy live scrollable width={PAGE_STAGE} parts={ANATOMY_PARTS} title="A record page with its parts numbered">
            <RecordPage banner scrollable />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await expectFullScale(canvasElement);
        await playRecordAnatomy(canvasElement);
    },
};

/** Area page, one collection: the title alone; the collection's Primary sits in the Section's title row. */
export const ScenarioArea = {
    name: 'Area page, one collection',
    render: () => (
        <PageStage scrollable>
            <DemoPageHeader title="Students" />
            <Section title="Students" views={<StudentViews />} actions={<AddStudentAction />}>
                <StudentsTable count={4} />
            </Section>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getAllByRole('heading', { level: 1 }), 'one h1').toHaveLength(1);
        await expect(canvasElement.querySelector('.plus-page-header-actions'), 'no page actions on an area page').toBeNull();
        const add = canvas.getByRole('button', { name: 'Add student' });
        await expect(add.closest('.plus-template-section-actions'), '"Add student" sits in the Section title row, not the page header').not.toBeNull();
        await expect(Math.round(add.getBoundingClientRect().height), 'the action draws 32').toBe(32);
        await expect(canvasElement.querySelectorAll('.plus-section-rows > .plus-section-row'), 'views row only; no search or filter row').toHaveLength(1);
    },
};

const REFLECTION_ROWS = [
    ['Ava Thompson', 'Oct 24 · Fractions', 'Paused on mixed-number word problems.'],
    ['Marcus Lee', 'Oct 23 · Ratios', 'Asked for extra unit-rate practice before Friday.'],
    ['Noah Williams', 'Oct 18 · Equations', 'Missed warm-up; needs a quick check-in.'],
];

/** Area page, several Sections: each takes a title and its own actions. */
export const ScenarioSeveralSections = {
    name: 'Area page, several Sections',
    render: () => (
        <PageStage scrollable height={420}>
            <DemoPageHeader title="Home" />
            <CardsSection title="Upcoming sessions" description="Next 7 days" actions={<Button text="View calendar" onClick={() => {}} />} />
            <Section title="Needs follow-up" actions={<Button text="Review all" onClick={() => {}} />}>
                <StudentsTable columns={['Student', 'Session', 'Reflection']} rows={REFLECTION_ROWS} label="Reflections" />
            </Section>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        await expect(canvas.getAllByRole('heading', { level: 2 }).map((h) => h.textContent), 'Sections open at h2').toEqual(['Upcoming sessions', 'Needs follow-up']);
    },
};

/** Record page under page tabs: the Section's views become one labeled PopupSelect. */
const ScenarioRecordTabsDemo = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <PageStage scrollable height={420}>
            <DemoPageHeader breadcrumb={RECORD_CRUMBS} title="Maya Rodriguez" description="Grade 8 · Math" actions={<PageActions />} tabs={<PageTabs active={tab} onSelect={setTab} />} />
            <RecordTabSection tab={tab} status={status} onStatusChange={setStatus} />
        </PageStage>
    );
};

export const ScenarioRecordTabs = {
    name: 'Record page under page tabs',
    render: () => <ScenarioRecordTabsDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getAllByRole('tablist'), 'one tab system: the page tabs').toHaveLength(1);
        await expect(canvas.getByRole('tab', { name: 'Sessions' })).toHaveAttribute('aria-selected', 'true');
        const trigger = canvas.getByRole('button', { name: 'Status: Upcoming' });
        await expect(trigger).toBeInTheDocument();
        await userEvent.click(trigger);
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.click(await body.findByRole('option', { name: 'Past' }));
        await expect(canvas.getByRole('button', { name: 'Status: Past' })).toBeInTheDocument();
        await expect(canvas.getByRole('cell', { name: 'Two-step equations' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
        await expect(canvas.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Notes' }));
        await expect(canvas.getByRole('heading', { name: 'Tutor notes' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Sessions' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Status: Past' }));
        await userEvent.click(await body.findByRole('option', { name: 'Upcoming' }));
    },
};

/** Two levels down: every parent in order, each a link. */
export const ScenarioTwoLevels = {
    name: 'Two levels down',
    render: () => (
        <PageStage scrollable>
            <DemoPageHeader breadcrumb={DEEP_CRUMBS} title="Session on Oct 14" actions={<PageActions />} />
            <Section title="Notes">
                <Card title="Oct 14 reflection" description="Worked through distributive property and two-step equations together." />
            </Section>
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
        await expect(within(nav).getAllByRole('link').map((a) => a.textContent), 'every parent, each a link').toEqual(['Students', 'Maya Rodriguez']);
    },
};

/** Page banner: under the header, one at a time, scrolling with the content. */
export const KeyBanner = {
    name: 'Page banner',
    render: () => (
        <PageStage scrollable>
            <DemoPageHeader title="Sessions" />
            <PageBanner />
            <CardsSection title="Upcoming sessions" />
        </PageStage>
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
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
        <ScrollStage width={width} data-probe="stage">
            <div style={{ height: 'var(--width-3000)' }}>
                <Frame>
                    <DemoPageHeader title="Sessions" />
                    <CardsSection title="Upcoming sessions" />
                </Frame>
            </div>
        </ScrollStage>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const stage = canvasElement.querySelector('[data-probe="stage"]');
        const box = () => contentBox(canvasElement).getBoundingClientRect().width;
        stage.style.inlineSize = `${FRAME_LAYOUT.contentCap + 160}px`;
        await waitFor(() => expect(box(), 'past the cap the content stops at it').toBe(FRAME_LAYOUT.contentCap));
        stage.style.inlineSize = `${FRAME_LAYOUT.contentCap - 160}px`;
        await waitFor(() => expect(box(), 'under the cap the content takes the width').toBeLessThan(FRAME_LAYOUT.contentCap));
        await expect(canvas.getAllByRole('heading', { level: 1 }), 'one h1 at every width').toHaveLength(1);
    },
};

/* ------------------------------------------------------- navigation motion */

const motionOn = (Story) => <MotionPreferenceContext.Provider value={false}><Story /></MotionPreferenceContext.Provider>;
const motionOff = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

const RECORD_TABS = ['overview', 'sessions', 'notes'];

const SwitchViewsDemo = () => {
    const [tab, setTab] = useState('overview');
    const [status, setStatus] = useState('upcoming');
    const views = {
        overview: (
            <Section title="Current goals">
                <Card title="Multi-step equations" description="Target 80% accuracy by Friday." />
            </Section>
        ),
        sessions: (
            <Section title="Sessions" views={<ViewSelect value={status} onChange={setStatus} />}>
                <SessionsTable status={status} />
            </Section>
        ),
        notes: (
            <Section title="Tutor notes">
                <Card title="Oct 14 reflection" description="Worked through distributive property together." />
            </Section>
        ),
    };
    return (
        <ScreenStage width={FRAME_LAYOUT.dockMin} fluid>
            <BrowserWindow address="app.plus.org/students/maya-rodriguez" height={WINDOW_HEIGHT}>
                <Frame>
                    <Page
                        header={(
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
                        )}
                    >
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
    await expect(canvas.getByRole('table', { name: 'Sessions' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();
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
                <Page>
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
                        <Section id="spot-overview" title="Overview">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', minBlockSize: 'var(--height-500)' }}>
                                <Card title="Goal check-in" description="Started with two warm-up problems on linear expressions." />
                                <Card title="Attendance" description="Arrived on time and stayed for the full hour." />
                            </div>
                        </Section>
                        <Section id="spot-practice" title="Practice">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', minBlockSize: 'var(--height-500)' }}>
                                <Card title="Guided set" description="Completed four of five word problems independently." />
                                <Card title="Exit check" description="Paused on negative coefficients." />
                            </div>
                        </Section>
                        <Section id="spot-escalation" title="Escalation">
                            <Card title="Supervisor follow-up" description="Share curriculum packet for negative rational numbers before Tuesday." />
                        </Section>
                        <Section id="spot-next" title="Next steps">
                            <div style={{ minBlockSize: 'var(--height-500)' }}>
                                <Card title="Thursday plan" description="Revisit two-step inequalities with number lines." />
                            </div>
                        </Section>
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
