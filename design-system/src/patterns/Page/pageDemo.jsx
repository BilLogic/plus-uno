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
import { Frame, PatternCard, PatternSection } from '@/patterns';
import { ReflowStage, ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';

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
                    <Heading size="large">{title}</Heading>
                    {status && <StatusTag appearance={status.appearance} spacing="spacious">{status.text}</StatusTag>}
                </div>
                {description && <p data-part="description" style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{description}</p>}
            </div>
        )}
        actions={actions}
        bottomBar={tabs}
    />
);

const DEFAULT_TAB_LABELS = ['Overview', 'Sessions', 'Notes'];

/** Page tabs: they switch the whole page. */
export const PageTabs = ({ active = 'overview', onSelect, labels = DEFAULT_TAB_LABELS, 'aria-label': ariaLabel = 'Student pages' }) => (
    <Tabs
        {...(onSelect ? { activeKey: active, onSelect } : { defaultActiveKey: active })}
        aria-label={ariaLabel}
    >
        {labels.map((entry) => {
            const [key, label] = Array.isArray(entry) ? entry : [entry.toLowerCase(), entry];
            return <Tabs.Tab key={key} eventKey={key}>{label}</Tabs.Tab>;
        })}
    </Tabs>
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
            <PatternCard key={t} title={t} description={d} />
        ))}
    </div>
);

/** A Section holding the cards under its own title. */
export const CardsSection = ({ title, actions, description, items }) => (
    <PatternSection title={title} description={description} actions={actions}>
        <SessionCards items={items} />
    </PatternSection>
);

const SESSION_HEAD = { cells: ['Time', 'Tutor', 'Subject'].map((content) => ({ key: content, content, isSortable: true })) };
export const UPCOMING_SESSIONS = [
    ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
    ['Thu 5:30 PM', 'Mr. Patel', 'Geometry'],
    ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ['Sat 10:00 AM', 'Ms. Kim', 'Linear equations'],
];
export const PAST_SESSIONS = [
    ['Tue 4:00 PM', 'Ms. Ortiz', 'Two-step equations'],
    ['Mon 3:30 PM', 'Mr. Patel', 'Angles and proofs'],
    ['Fri 4:00 PM', 'Ms. Kim', 'Ratios and rates'],
];

/** A Dynamic table of sessions, filtered by status (`upcoming` or `past`). */
export const SessionsTable = ({ status = 'upcoming' }) => {
    const rows = status === 'past' ? PAST_SESSIONS : UPCOMING_SESSIONS;
    return (
        <DynamicTable
            head={SESSION_HEAD}
            rows={rows.map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
            label="Sessions"
            isFixedSize
        />
    );
};

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

const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
];

/** The view bar's views as one labeled PopupSelect at the start, the form under page tabs. */
export const ViewSelect = ({ value, defaultValue = 'upcoming', onChange, actions }) => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        <PopupSelect
            label="Status"
            options={STATUS_OPTIONS}
            {...(value !== undefined ? { value, onChange } : { defaultValue })}
            isSearchable={false}
        />
        {actions ? <div style={{ marginInlineStart: 'auto' }}>{actions}</div> : null}
    </div>
);

/** The Section content under `PageTabs` (`overview`, `sessions`, `notes`). */
export const RecordTabSection = ({ tab = 'sessions', status = 'upcoming', onStatusChange, overviewItems = STUDENT_SESSION_CARDS }) => {
    if (tab === 'overview') {
        return <CardsSection title="Upcoming sessions" items={overviewItems} />;
    }
    if (tab === 'notes') {
        return (
            <PatternSection title="Tutor notes">
                <PatternCard title="Oct 14 reflection" description="Worked through distributive property and two-step equations together." />
            </PatternSection>
        );
    }
    return (
        <PatternSection title="Sessions" type="tabs-only" tabs={<ViewSelect value={status} onChange={onStatusChange} />}>
            <SessionsTable status={status} />
        </PatternSection>
    );
};

/**
 * The Frame with no sidebar at the stage width, holding a page. `full` lifts the
 * 1232 cap (`width="full"` is planned on the Frame; the story sets the cap
 * token to none on the content box).
 */
export const PageStage = ({ full = false, scrollable = false, width = SCENARIO_STAGE, height = STAGE_HEIGHT, children }) => {
    const frame = (
        <Frame style={full ? { '--content-max-width': 'none' } : undefined}>
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

PageStage.propTypes = { full: PropTypes.bool, scrollable: PropTypes.bool, width: PropTypes.number, height: PropTypes.number, children: PropTypes.node };

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
