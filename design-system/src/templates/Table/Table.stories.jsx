import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import Table, { TABLE_KINDS } from './Table';
import { Button, EmptyState as PlusEmptyState, StaticTable } from '@/components';

const MEMBERS = [
    { id: 'jordan', name: 'Jordan Blake', role: 'Tutor', status: 'Active', sessions: 12 },
    { id: 'casey', name: 'Casey Rivera', role: 'Coach', status: 'Invited', sessions: 6 },
    { id: 'morgan', name: 'Morgan Lee', role: 'Tutor', status: 'Active', sessions: 15 },
];

const staticProps = {
    headers: ['Name', 'Role', 'Status'],
    rows: MEMBERS.map((member) => [member.name, member.role, member.status]),
    titleColumn: 0,
};

const dynamicProps = {
    label: 'Team members',
    head: {
        cells: [
            { key: 'name', content: 'Name', isSortable: true },
            { key: 'role', content: 'Role', isSortable: true },
            { key: 'sessions', content: 'Sessions', isSortable: true, align: 'number' },
        ],
    },
    rows: MEMBERS.map((member) => ({
        key: member.id,
        cells: [
            { key: 'name', content: member.name },
            { key: 'role', content: member.role },
            { key: 'sessions', content: String(member.sessions) },
        ],
    })),
    defaultSortKey: 'name',
    rowsPerPage: 25,
    totalRows: 340,
    noun: 'members',
};

const leaf = (id, name, type, sessions) => ({ id, cells: [{ content: name }, { content: type }, { content: String(sessions) }] });

const treeProps = {
    label: 'Schools',
    head: {
        cells: [
            { key: 'name', content: 'Name' },
            { key: 'type', content: 'Type' },
            { key: 'sessions', content: 'Sessions', align: 'number' },
        ],
    },
    items: [
        {
            ...leaf('lincoln', 'Lincoln Middle', 'School', 54),
            count: 2,
            children: [leaf('g7', 'Grade 7 · Math', 'Class', 27), leaf('g8', 'Grade 8 · Math', 'Class', 19)],
        },
        { ...leaf('roosevelt', 'Roosevelt K-8', 'School', 31), count: 1, children: [] },
    ],
    defaultExpandedIds: ['lincoln'],
};

const KIND_PROPS = { static: staticProps, dynamic: dynamicProps, tree: treeProps };

const addMember = <Button text="Add member" appearance="primary" spacing="compact" onClick={() => {}} />;

const rangeFooter = (
    <span className="body-sm" style={{ color: 'var(--ds-text-subtle)' }}>1–3 of 3 members</span>
);

const emptyStateSlot = (
    <PlusEmptyState
        spacing="compact"
        icon="folder"
        header="No members yet"
        description="Members you invite show up here."
        primaryAction={<Button text="Add member" appearance="default" spacing="compact" onClick={() => {}} />}
    />
);

export default {
    title: 'Templates/Table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        tableProps: { table: { disable: true } },
        footer: { table: { disable: true } },
        emptyState: { table: { disable: true } },
        actions: { table: { disable: true } },
        style: { table: { disable: true } },
        kind: {
            control: 'inline-radio',
            options: TABLE_KINDS,
            table: { category: 'Design' },
        },
        empty: {
            control: 'boolean',
            table: { category: 'State' },
        },
        title: { control: 'text', table: { category: 'Design' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

/** A Static table: people only read it. The footer sits under the rows. */
export const StaticKind = {
    name: 'Static table',
    render: () => (
        <Table title="Team members" actions={addMember} kind="static" tableProps={staticProps} footer={rangeFooter} />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvasElement.querySelector('.plus-browser-frame'), 'a Table renders without browser chrome').toBeNull();
        const template = canvasElement.querySelector('.plus-table-template');
        await expect(template, 'the template wraps the table').not.toBeNull();
        await expect(template).toHaveAttribute('data-kind', 'static');
        await expect(canvas.getByRole('heading', { name: 'Team members' }), 'the Section header carries the title').toBeVisible();
        await expect(canvas.getByRole('button', { name: 'Add member' }), 'and the action').toBeVisible();
        await expect(canvas.getAllByRole('columnheader')).toHaveLength(3);
        await expect(canvas.getAllByRole('row')).toHaveLength(4);
        const table = canvas.getByRole('table');
        const footer = canvas.getByText('1–3 of 3 members');
        await expect(
            table.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
            'the footer follows the table',
        ).toBeTruthy();
        await expect(template.querySelector('.plus-static-table'), 'a Static table rests with no hover').not.toBeNull();
    },
};

/** A Dynamic table: people sort, page or act on it. It draws its own footer. */
export const DynamicKind = {
    name: 'Dynamic table',
    render: () => (
        <Table
            title="Team members"
            description="340 members"
            actions={addMember}
            kind="dynamic"
            tableProps={dynamicProps}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const template = canvasElement.querySelector('.plus-table-template');
        await expect(template).toHaveAttribute('data-kind', 'dynamic');
        await expect(canvas.getByText('340 members'), 'the count sits in the Section header').toBeVisible();
        await expect(canvas.getByRole('table', { name: 'Team members' })).toBeVisible();
        await expect(canvas.getByText(/of 340 members/), 'the table draws its range footer').toBeVisible();
        await expect(template.querySelector('.plus-dynamic-table')).not.toBeNull();
        const sortable = canvas.getAllByRole('columnheader')[0].querySelector('button');
        await expect(sortable, 'sortable heads are controls').not.toBeNull();
        await userEvent.click(sortable);
        await expect(canvas.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort');
    },
};

/** A Tree table: rows nest under a parent. */
export const TreeKind = {
    name: 'Tree table',
    render: () => (
        <Table title="Schools" kind="tree" tableProps={treeProps} />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const template = canvasElement.querySelector('.plus-table-template');
        await expect(template).toHaveAttribute('data-kind', 'tree');
        await expect(canvas.getByRole('treegrid', { name: 'Schools' })).toBeVisible();
        await expect(canvas.getByText('Lincoln Middle')).toBeVisible();
        await expect(canvas.getByText('Grade 7 · Math'), 'an open parent shows its children').toBeVisible();
        await expect(canvas.getByText('Grade 7 · Math').closest('tr')).toHaveAttribute('aria-level', '2');
    },
};

/** Pass the table itself instead of a kind; the template arranges it the same way. */
export const TableAsChild = {
    parameters: { docs: { disable: true } },
    render: () => (
        <Table title="Team members">
            <StaticTable {...staticProps} />
        </Table>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('table')).toBeVisible();
        await expect(canvas.getAllByRole('row')).toHaveLength(4);
    },
};

/**
 * The empty state sits in a sunken, card-rounded box replacing the table and
 * its footer; the Section header above stays usable. Held in all four modes.
 */
export const EmptyState = {
    name: 'Empty',
    render: () => (
        <Table
            title="Team members"
            actions={addMember}
            kind="static"
            tableProps={staticProps}
            footer={rangeFooter}
            empty
            emptyState={emptyStateSlot}
            label="Team members"
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await inEveryColorMode(async (mode) => {
            await expect(canvas.queryByRole('table'), `${mode}: the table is replaced`).toBeNull();
            await expect(canvas.queryAllByRole('columnheader'), `${mode}: no column headers`).toHaveLength(0);
            await expect(canvas.queryByText('Jordan Blake'), `${mode}: no body rows`).toBeNull();
            await expect(canvas.queryByText('1–3 of 3 members'), `${mode}: no footer without rows`).toBeNull();
            const box = canvasElement.querySelector('.plus-table-shell-empty');
            await expect(box, `${mode}: empty box present`).not.toBeNull();
            await expect(box, `${mode}: the box keeps the table's name`).toHaveAccessibleName('Team members');
            await expect(getComputedStyle(box).backgroundColor, `${mode}: empty box uses the sunken surface`)
                .toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
            await expect(px(getComputedStyle(box).borderTopLeftRadius), `${mode}: empty box uses its radius token`)
                .toBe(tokenLength(canvasElement, '--table-empty-radius'));
            await expect(canvas.getByRole('heading', { name: 'No members yet' }), `${mode}: heading visible`).toBeVisible();
            const boxButton = within(box).getByRole('button', { name: 'Add member' });
            await expect(boxButton.className, `${mode}: the box action is default, not primary`).not.toContain('primary');
            await expect(canvas.getAllByRole('button', { name: 'Add member' })[0], `${mode}: the Section action stays usable`).toBeEnabled();
        });
    },
};

const FilteredMembers = () => {
    const [filtered, setFiltered] = React.useState(true);
    const visible = filtered ? [] : MEMBERS;
    return (
        <Table
            title="Team members"
            filters={[{
                key: 'role',
                label: 'Role',
                text: filtered ? 'Admin' : 'All',
                isSelected: filtered,
                onClick: () => setFiltered((prev) => !prev),
            }]}
            count={`${visible.length} members`}
            empty={visible.length === 0}
            emptyState={(
                <PlusEmptyState
                    spacing="compact"
                    icon="magnifying-glass"
                    header="No members match this filter"
                    description="Nothing matches Role: Admin. Clear the filter to see every member."
                    primaryAction={<Button text="Clear filter" appearance="default" spacing="compact" onClick={() => setFiltered(false)} />}
                />
            )}
        >
            <StaticTable {...staticProps} />
        </Table>
    );
};

/** Empty because a filter hides every row: the Section header and filter stay, and the box's button clears it. */
export const EmptyHiddenByFilter = {
    name: 'Empty: Hidden by filter',
    render: () => <FilteredMembers />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvasElement.querySelector('.plus-table-shell-empty');
        await expect(box, 'empty box rendered').not.toBeNull();
        await expect(getComputedStyle(box).backgroundColor, 'empty box uses the sunken surface')
            .toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(canvas.getByRole('button', { name: 'Role: Admin' }), 'the filter stays above').toBeVisible();
        const clear = within(box).getByRole('button', { name: 'Clear filter' });
        await expect(clear.className, 'the box action is default, not primary').not.toContain('primary');
        await userEvent.click(clear);
        await expect(canvas.getByRole('table'), 'clearing the filter shows the rows').toBeVisible();
        await expect(canvas.getByText('Jordan Blake')).toBeVisible();
    },
};

/** Empty when there is nothing to create: the title and one line, no action. */
export const EmptyNothingToCreate = {
    name: 'Empty: Nothing to create',
    render: () => (
        <Table
            title="Activity"
            empty
            emptyState={(
                <PlusEmptyState
                    spacing="compact"
                    icon="clock"
                    header="No activity yet"
                    description="Completed sessions appear here automatically."
                />
            )}
        >
            <StaticTable {...staticProps} />
        </Table>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const box = canvasElement.querySelector('.plus-table-shell-empty');
        await expect(box, 'empty box rendered').not.toBeNull();
        await expect(getComputedStyle(box).backgroundColor, 'empty box uses the sunken surface')
            .toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(canvas.getByRole('heading', { name: 'No activity yet' })).toBeVisible();
        await expect(within(box).queryAllByRole('button'), 'no box action when there is nothing to create').toHaveLength(0);
        await expect(canvas.queryAllByRole('button'), 'no action when there is nothing to create').toHaveLength(0);
    },
};

export const Interactive = {
    args: { kind: 'static', title: 'Team members', empty: false },
    render: ({ kind, title, empty }) => (
        <Table
            title={title}
            kind={kind}
            tableProps={KIND_PROPS[kind]}
            empty={empty}
            emptyState={emptyStateSlot}
            footer={kind === 'static' ? rangeFooter : undefined}
        />
    ),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-table-template')).not.toBeNull();
    },
};
