import React from 'react';
import PropTypes from 'prop-types';
import {
    Banner,
    Breadcrumb,
    Button,
    DynamicTable,
    IconButton,
    PageHeader,
    PopupSelect,
    StatusTag,
    Tabs,
    Heading,
} from '@/components';
import { Frame, Card, Section } from '@/templates';
import { ReflowStage, ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { typeStyle } from '../../storybook-docs/lib/type-style.js';
import { PageTabs, SessionsTable, UPCOMING_SESSIONS, PAST_SESSIONS } from '../../storybook-docs/lib/sessions-demo.jsx';

export { PageTabs, SessionsTable, UPCOMING_SESSIONS, PAST_SESSIONS };

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
                    <Heading size="lg">{title}</Heading>
                    {status && <StatusTag appearance={status.appearance} spacing="spacious">{status.text}</StatusTag>}
                </div>
                {description && <p data-part="description" style={{ margin: 0, ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' }}>{description}</p>}
            </div>
        )}
        actions={actions}
        bottomBar={tabs}
    />
);

/** Two page actions, about the page only. */
export const PageActions = () => (
    <>
        <Button text="Share" onClick={() => {}} />
        <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
    </>
);

export const GROUP_SESSION_CARDS = [
    ['Lincoln Middle', 'Tue 4:30 PM · 6 students'],
    ['Roosevelt K-8', 'Wed 3:00 PM · 4 students'],
    ['North High', 'Thu 5:00 PM · 5 students'],
];

export const STUDENT_SESSION_CARDS = [
    ['Thu 4:00 PM · Algebra', 'Ms. Ortiz · Linear equations'],
    ['Fri 3:30 PM · Fractions', 'Ms. Ortiz · Equivalent fractions'],
    ['Sat 10:00 AM · Algebra', 'Ms. Kim · Systems of equations'],
];

/** A Section's body: three session cards. */
export const SessionCards = ({ items = GROUP_SESSION_CARDS }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
        {items.map(([t, d]) => (
            <Card key={t} title={t} description={d} />
        ))}
    </div>
);

/** A Section holding the cards under its own title. */
export const CardsSection = ({ title, actions, description, items }) => (
    <Section title={title} description={description} actions={actions}>
        <SessionCards items={items} />
    </Section>
);

/** The collection's views: one pill, even with one view. */
export const StudentViews = () => (
    <Tabs appearance="pill" defaultActiveKey="all" aria-label="Views">
        <Tabs.Tab eventKey="all">All students</Tabs.Tab>
    </Tabs>
);

/** The Primary that adds a row: the Section's one action, in its title row. */
export const AddStudentAction = () => (
    <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
);

const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
];

/** The views as one labeled PopupSelect in the views row, the form under page tabs. */
export const ViewSelect = ({ value, defaultValue = 'upcoming', onChange }) => (
    <PopupSelect
        label="Status"
        options={STATUS_OPTIONS}
        {...(value !== undefined ? { value, onChange } : { defaultValue })}
        isSearchable={false}
    />
);

/** The Section content under `PageTabs` (`overview`, `sessions`, `notes`). */
export const RecordTabSection = ({ tab = 'sessions', status = 'upcoming', onStatusChange, overviewItems = STUDENT_SESSION_CARDS }) => {
    if (tab === 'overview') {
        return <CardsSection title="Upcoming sessions" items={overviewItems} />;
    }
    if (tab === 'notes') {
        return (
            <Section title="Tutor notes">
                <Card title="Oct 14 reflection" description="Worked through distributive property and two-step equations together." />
            </Section>
        );
    }
    return (
        <Section title="Sessions" views={<ViewSelect value={status} onChange={onStatusChange} />}>
            <SessionsTable status={status} />
        </Section>
    );
};

/**
 * The Frame with no sidebar at the stage width, holding a page. `type` is the Frame's `width`:
 * default caps the grid at 1232, full lifts the cap, reading caps it at 864.
 */
export const PageStage = ({ type = 'default', scrollable = false, width = SCENARIO_STAGE, height = STAGE_HEIGHT, children }) => {
    const frame = (
        <Frame width={type}>
            {children}
        </Frame>
    );
    return scrollable ? (
        <ScrollStage width={width} height={height} data-page-stage>{frame}</ScrollStage>
    ) : (
        <ReflowStage width={width}>
            {(layout) => (
                <div data-page-stage style={{ inlineSize: layout, height }}>
                    {frame}
                </div>
            )}
        </ReflowStage>
    );
};

PageStage.propTypes = { type: PropTypes.oneOf(['default', 'full', 'reading']), scrollable: PropTypes.bool, width: PropTypes.number, height: PropTypes.number, children: PropTypes.node };

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
    { selector: '.plus-template-section', label: 'Content' },
];
