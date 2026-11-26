import React from 'react';
import { expect, within } from 'storybook/test';
import { Button, DynamicTable, FilterMenu, Heading, IconButton, SearchField, Tabs } from '@/components';
import { Section } from '@/templates';
import { DemoPageHeader, PageTabs } from '../Page/pageDemo.jsx';

/**
 * Every Section header combination, drawn from the real Page header and
 * Section. Each case says which rows it expects, and the play reads them back.
 *
 * - Several Sections on a page: every Section shows its title.
 * - One Section with no actions: the title is hidden and the header keeps only
 *   the rows it needs.
 * - One Section with actions: the title row shows, since actions live only there.
 * - Under page tabs there is no views row; Status is a quick filter after Search.
 */

const head = { cells: ['Name', 'School', 'Grade'].map((content) => ({ key: content, content })) };
const rows = [['Ava Thompson', 'Lincoln Middle', '7'], ['Marcus Lee', 'North High', '8']].map((cells) => ({
    key: cells[0],
    cells: cells.map((content, i) => ({ key: String(i), content })),
}));
const table = <DynamicTable head={head} rows={rows} label="Students" isFixedSize />;

const actions = (label = 'Add students') => (
    <>
        <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
        <Button text={label} iconBefore="plus" appearance="primary" onClick={() => {}} />
    </>
);
const views = (
    <Tabs appearance="pill" defaultActiveKey="Active" aria-label="Views">
        <Tabs.Tab eventKey="Active">Active</Tabs.Tab>
        <Tabs.Tab eventKey="Inactive">Inactive</Tabs.Tab>
        <Tabs.Tab eventKey="All">All</Tabs.Tab>
    </Tabs>
);
const search = <SearchField mode="active" spacing="compact" placeholder="Search students" />;
const quick = (label, text, isSelected) => ({ key: label, label, text, isSelected, onClick: () => {} });
const filters = [quick('School', 'All'), quick('Grade', 'All')];
const tabFilters = [quick('Status', 'Active'), quick('School', 'All')];
const categories = ['Status', 'School', 'Grade', 'Group'].map((label) => ({ id: label, label, options: ['A', 'B'] }));

const pageTabs = (active = 'all') => (
    <PageTabs active={active} labels={[['all', 'All students'], ['requests', 'Roster requests']]} aria-label="Student pages" />
);

/** One page: the page header (with page tabs when asked) and the Sections under it. Docs geometry, not a design value. */
const DemoPage = ({ withTabs = false, tab, width = 1000, children }) => (
    <div
        style={{
            inlineSize: width,
            maxInlineSize: '100%',
            boxSizing: 'border-box',
            padding: 'var(--page-pad)',
            background: 'var(--ds-surface)',
            border: '1px solid var(--ds-border)',
            borderRadius: 'var(--card-radius)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--page-stack-md)',
        }}
    >
        <DemoPageHeader title="Students" tabs={withTabs ? pageTabs(tab) : undefined} />
        {children}
    </div>
);

const Second = () => <Section title="Everyone else">{table}</Section>;

/** Each case: its id and label, the rows its first Section draws, and the page. */
const HEADER_CASES = [
    { group: 'Several Sections: every Section shows its title' },
    { id: 'S1', label: 'Title only', rows: { title: true }, node: <DemoPage><Section title="Needs a check-in">{table}</Section><Second /></DemoPage> },
    { id: 'S2', label: 'Title and actions', rows: { title: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()}>{table}</Section><Second /></DemoPage> },
    { id: 'S3', label: 'Title and views', rows: { title: true, views: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()} views={views}>{table}</Section><Second /></DemoPage> },
    { id: 'S4', label: 'Title, search and filters', rows: { title: true, filters: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()} search={search} filters={filters}>{table}</Section><Second /></DemoPage> },
    { id: 'S5', label: 'Full: title, views, search and filters', rows: { title: true, views: true, filters: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()} views={views} search={search} filters={filters}>{table}</Section><Second /></DemoPage> },
    { id: 'S6', label: 'Under page tabs: Status is a filter after Search', rows: { title: true, filters: true }, node: <DemoPage withTabs><Section title="Needs a check-in" actions={actions()} search={search} filters={tabFilters}>{table}</Section><Second /></DemoPage> },
    { group: 'One Section, no actions: the title is hidden' },
    { id: 'O1', label: 'Nothing in the header', rows: {}, node: <DemoPage><Section title="Students" isTitleHidden>{table}</Section></DemoPage> },
    { id: 'O2', label: 'Search and filters', rows: { filters: true }, node: <DemoPage><Section title="Students" isTitleHidden search={search} filters={filters}>{table}</Section></DemoPage> },
    { id: 'O3', label: 'Views', rows: { views: true }, node: <DemoPage><Section title="Students" isTitleHidden views={views}>{table}</Section></DemoPage> },
    { id: 'O4', label: 'Views, search and filters', rows: { views: true, filters: true }, node: <DemoPage><Section title="Students" isTitleHidden views={views} search={search} filters={filters}>{table}</Section></DemoPage> },
    { id: 'O5', label: 'Under page tabs: search and filters', rows: { filters: true }, node: <DemoPage withTabs><Section title="All students" isTitleHidden search={search} filters={tabFilters}>{table}</Section></DemoPage> },
    { group: 'One Section with actions: the title row shows, since actions live only there' },
    { id: 'O6', label: 'Actions only', rows: { title: true }, node: <DemoPage withTabs tab="requests"><Section title="Roster requests" actions={actions('Request a change')}>{table}</Section></DemoPage> },
    { id: 'O7', label: 'Actions, search and filters', rows: { title: true, filters: true }, node: <DemoPage><Section title="Student list" actions={actions()} search={search} filters={filters}>{table}</Section></DemoPage> },
    { id: 'O8', label: 'Actions, views, search and filters', rows: { title: true, views: true, filters: true }, node: <DemoPage><Section title="Student list" actions={actions()} views={views} search={search} filters={filters}>{table}</Section></DemoPage> },
    { id: 'O9', label: 'Under page tabs: actions, search and filters', rows: { title: true, filters: true }, node: <DemoPage withTabs><Section title="All students" actions={actions()} search={search} filters={tabFilters}>{table}</Section></DemoPage> },
    { group: 'Modifiers' },
    { id: 'M1', label: 'Filtered: the count and Reset filters at the row end', rows: { title: true, filters: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()} search={search} filters={[quick('School', 'Lincoln Middle', true), quick('Grade', 'All')]} count="12 of 340 students" onClearAll={() => {}}>{table}</Section><Second /></DemoPage> },
    { id: 'M2', label: 'Four or more categories: one Filter menu', rows: { title: true, filters: true }, node: <DemoPage><Section title="Needs a check-in" actions={actions()} search={search} filterMenu={<FilterMenu categories={categories} value={{}} onApply={() => {}} layout="stacked" />}>{table}</Section><Second /></DemoPage> },
    { id: 'M3', label: 'Narrow, 375: the Primary is icon-only and the filters fold into one Filter button', rows: { title: true, views: true, filters: true }, node: <DemoPage width={375}><Section title="Needs a check-in" actions={actions()} views={views} search={search} filters={filters}>{table}</Section></DemoPage> },
];

export default {
    title: 'Templates/Section/Header combinations',
    tags: ['!dev', '!autodocs'],
};

const caseList = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)', padding: 'var(--page-pad)', background: 'var(--ds-surface-sunken)' };
const caseItem = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' };

/** Every combination: S1–S6 with several Sections, O1–O9 with one, and the modifiers M1–M3. */
export const Catalog = {
    name: 'Header combinations',
    render: () => (
        <div style={caseList}>
            {HEADER_CASES.map((item) => (item.group ? (
                <Heading key={item.group} as="div" size="md">{item.group}</Heading>
            ) : (
                <div key={item.id} data-case={item.id} style={caseItem}>
                    <Heading as="div" size="xs">{`${item.id} · ${item.label}`}</Heading>
                    {item.node}
                </div>
            )))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        for (const item of HEADER_CASES.filter((entry) => entry.id)) {
            const box = canvasElement.querySelector(`[data-case="${item.id}"]`);
            const section = box.querySelector('.plus-template-section');
            const has = (selector) => Boolean(section.querySelector(selector));
            await expect(has('.plus-template-section-title-row'), `${item.id}: title row`).toBe(Boolean(item.rows.title));
            await expect(has('.plus-section-row--views'), `${item.id}: views row`).toBe(Boolean(item.rows.views));
            await expect(has('.plus-section-row--filters'), `${item.id}: search and filters row`).toBe(Boolean(item.rows.filters));
            if (item.rows.title) {
                await expect(within(section).getAllByRole('heading')[0], `${item.id}: the title shows`).toBeVisible();
            }
        }

        const tabsCases = ['S6', 'O5', 'O9'].map((id) => canvasElement.querySelector(`[data-case="${id}"]`));
        tabsCases.forEach((box) => expect(within(box).getByRole('button', { name: 'Status: Active' }).closest('.plus-section-row__filters'), 'under page tabs Status is a filter after Search').not.toBeNull());

        const m1 = within(canvasElement.querySelector('[data-case="M1"] .plus-template-section'));
        await expect(m1.getByText('12 of 340 students')).toBeInTheDocument();
        await expect(m1.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();

        const m2 = canvasElement.querySelector('[data-case="M2"] .plus-section-row--filters');
        await expect(within(m2).getAllByRole('button'), 'one Filter menu trigger after Search').toHaveLength(1);
        await expect(within(m2).queryByRole('button', { name: /More filters/ })).toBeNull();

        const m3 = within(canvasElement.querySelector('[data-case="M3"] .plus-template-section'));
        const primary = m3.getByRole('button', { name: 'Add students' });
        await expect(primary.textContent.trim(), 'under 768 the Primary is icon-only').toBe('');
        await expect(primary).toHaveClass('plus-btn--primary');
        await expect(m3.getAllByRole('button', { name: /^Filter/ }), 'the filters fold into one Filter button').toHaveLength(1);
    },
};
