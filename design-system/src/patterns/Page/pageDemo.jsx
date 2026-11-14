import React from 'react';
import PropTypes from 'prop-types';
import {
    Banner,
    Breadcrumb,
    Button,
    IconButton,
    PageHeader,
    Select,
    StatusTag,
    Tabs,
    Heading,
} from '@/components';
import { Frame, PatternCard, PatternSection } from '@/patterns';
import { ReflowStage } from '@/storybook-docs/lib/fit-stage.jsx';

/**
 * Page-template docs helpers: the page header assembled from its parts, a
 * Frame with no sidebar to hold it, the type card, and the parts the anatomy
 * figure numbers (its markers are the shared `LiveAnatomy`).
 */

/** The width the Page stories lay out at: wide enough that the 1232 cap shows against full width. Docs geometry, not a design value. */
export const PAGE_STAGE = 1440;

/** The width the type cards lay out at: wide enough that the content cap shows against full width. Docs geometry. */
export const TYPE_STAGE = 1920;

/** The width the scenario and state stories lay out at: no sidebar, so the page fills it. Docs geometry. */
export const SCENARIO_STAGE = 800;

/** The height of the frame box a Page story fills, so the page runs to a fixed floor. Docs geometry. */
const STAGE_HEIGHT = 360;

const row = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', minWidth: 0 };

/**
 * The page header from its slots. `PageHeader` has no `description` or `status`
 * slot yet (both planned), so the title block holds them: the h1 with the
 * StatusTag after its text, then one description line.
 */
export const DemoPageHeader = ({ breadcrumb, title, status, description, actions, tabs }) => (
    <PageHeader
        disableTitleStyles
        breadcrumbs={breadcrumb ? <Breadcrumb label="Breadcrumb" items={breadcrumb} /> : undefined}
        title={(
            <div data-part="title-block" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <div style={row}>
                    <Heading size="large" as="h1">{title}</Heading>
                    {status && <StatusTag appearance={status.appearance} spacing="spacious">{status.text}</StatusTag>}
                </div>
                {description && <p data-part="description" style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{description}</p>}
            </div>
        )}
        actions={actions}
        bottomBar={tabs}
    />
);

/** Page tabs: they switch the whole page. */
export const PageTabs = ({ active = 'overview' }) => (
    <Tabs defaultActiveKey={active} aria-label="Student pages">
        <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
        <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
        <Tabs.Tab eventKey="notes">Notes</Tabs.Tab>
    </Tabs>
);

/** Two page actions, about the page only. */
export const PageActions = () => (
    <>
        <Button text="Share" onClick={() => {}} />
        <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
    </>
);

/** A Section's body: three session cards. */
export const SessionCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
        {[['Lincoln Middle', 'Tue 4:30 PM · 6 students'], ['Roosevelt K-8', 'Wed 3:00 PM · 4 students'], ['North High', 'Thu 5:00 PM · 5 students']].map(([t, d]) => (
            <PatternCard key={t} title={t} description={d} />
        ))}
    </div>
);

/** A Section holding the cards under its own title. */
export const CardsSection = ({ title, actions, description }) => (
    <PatternSection title={title} description={description} actions={actions}>
        <SessionCards />
    </PatternSection>
);

/** The collection's view bar: one pill at the start, the labeled Primary that adds a row at the end. */
export const ViewBarWithAdd = () => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        <Tabs appearance="pill" defaultActiveKey="all" aria-label="Views">
            <Tabs.Tab eventKey="all">All students</Tabs.Tab>
        </Tabs>
        <div style={{ marginInlineStart: 'auto' }}>
            <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
        </div>
    </div>
);

/** The view bar's views as one labeled Select at the start, the form under page tabs. */
export const ViewSelect = () => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        <div style={{ inlineSize: 'var(--card-min-width-sm)' }}>
            <Select
                aria-label="Status"
                spacing="compact"
                clearable={false}
                defaultValue="upcoming"
                options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]}
            />
        </div>
    </div>
);

/**
 * The Frame with no sidebar at the stage width, holding a page. `full` lifts the
 * 1232 cap (`width="full"` is planned on the Frame; the story sets the cap
 * token to none on the content box).
 */
export const PageStage = ({ full = false, width = SCENARIO_STAGE, height = STAGE_HEIGHT, children }) => (
    <ReflowStage width={width}>
        {(layout) => (
            <div data-page-stage style={{ inlineSize: layout, height }}>
                <Frame style={full ? { '--content-max-width': 'none' } : undefined}>
                    {children}
                </Frame>
            </div>
        )}
    </ReflowStage>
);

PageStage.propTypes = { full: PropTypes.bool, width: PropTypes.number, height: PropTypes.number, children: PropTypes.node };

/** The banner slot, under the header. */
export const PageBanner = () => <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>;

/** The record page's parts, as the anatomy figure and its play name them, in Parts-list order. */
export const ANATOMY_PARTS = [
    { selector: '.plus-page-header-breadcrumbs', label: 'Breadcrumb' },
    { selector: '[data-part="title-block"] > div', label: 'Title with its StatusTag' },
    { selector: '[data-part="description"]', label: 'Description' },
    { selector: '.plus-page-header-actions', label: 'Page actions' },
    { selector: '.plus-page-header-bottom-bar', label: 'Page tabs' },
    { selector: '.plus-banner', label: 'Banner' },
    { selector: '.plus-pattern-section', label: 'Content' },
];
