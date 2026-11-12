import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '@/components';
import { Frame, PatternSection } from '@/patterns';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import {
    CardsSection,
    DemoPageHeader,
    PAGE_STAGE,
    TYPE_STAGE,
    ANATOMY_PARTS,
    PageActions,
    PageAnatomy,
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
    title: 'Templates/Page/Page',
    id: 'templates-page-page',
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
        <PageAnatomy width={PAGE_STAGE} parts={ANATOMY_PARTS} title="A record page with its parts numbered">
            <RecordPage banner />
        </PageAnatomy>
    ),
    play: async ({ canvasElement }) => {
        const figure = canvasElement.querySelector('[data-anatomy-figure]');
        const origin = figure.getBoundingClientRect();
        const rect = (el) => el.getBoundingClientRect();
        await waitFor(() => expect(figure.querySelectorAll('[data-anatomy-marker]'), 'a marker for every part').toHaveLength(ANATOMY_PARTS.length));
        const markers = [...figure.querySelectorAll('[data-anatomy-marker]')].map(rect);
        markers.forEach((a, i) => markers.slice(i + 1).forEach((b, j) => {
            const touch = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            expect(touch, `markers ${i + 1} and ${i + j + 2} share no space`).toBe(false);
        }));
        const outlines = [...figure.querySelectorAll('[data-anatomy-outline]')].map(rect);
        for (const [i, part] of ANATOMY_PARTS.entries()) {
            const marker = rect(figure.querySelector(`[data-anatomy-marker="${i + 1}"]`));
            const leader = rect(figure.querySelector(`[data-leader="${i + 1}"]`));
            const target = outlines[i];
            const centerY = marker.top + marker.height / 2;
            await expect(centerY, `${part.label}: marker level with its part`).toBeGreaterThanOrEqual(target.top);
            await expect(centerY, `${part.label}: marker level with its part`).toBeLessThanOrEqual(target.bottom);
            await expect(marker.right <= origin.left + 1 || marker.left >= origin.right - 1, `${part.label}: marker in a gutter, over no content`).toBe(true);
            outlines.forEach((other, j) => {
                if (j === i) return;
                const crosses = leader.left < other.right && leader.right > other.left && leader.top < other.bottom && leader.bottom > other.top;
                expect(crosses, `the leader of ${part.label} crosses ${ANATOMY_PARTS[j].label}`).toBe(false);
            });
        }
    },
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
