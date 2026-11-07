import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import { DynamicTable, HeadCell } from '@/components/text-and-data-display/Table';

/**
 * The Dynamic table: a table people sort, page or act on. `DynamicTable` is
 * built on the `PatternTable` shell (its pagination and empty-state slots), with sortable `HeadCell`s and the shared `TableRow` and
 * `TableCell` parts.
 */

export default {
    title: 'Components/Text and data display/Dynamic table',
    component: DynamicTable,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A table people sort, page or act on. `head.cells` names the columns and `rows` holds one `{ key, cells }` per row; a column sorts by its cells\' `key`. Left alone the table holds its own sort and page; pass `sortKey`/`sortOrder` or `page` and the page owns them. Every state but `default` and `refreshing` keeps the head row and swaps the body for one message row.'
            }
        }
    },
    argTypes: {
        head: { control: 'object', description: 'One `{ key, content, isSortable, width, align }` per column', table: { category: 'Content' } },
        rows: { control: 'object', description: 'One `{ key, cells, onClick }` per row; each cell `{ key, content }`', table: { category: 'Content' } },
        caption: { control: 'text', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        emptyView: { control: 'text', table: { category: 'Content' } },
        noResultsView: { control: 'text', table: { category: 'Content' } },
        errorView: { control: 'text', table: { category: 'Content' } },
        state: { control: 'select', options: ['default', 'empty', 'no results', 'loading', 'refreshing', 'error'], table: { category: 'State' } },
        isLoading: { control: 'boolean', table: { category: 'State' } },
        highlightedRowIndex: { control: 'number', table: { category: 'State' } },
        rowsPerPage: { control: 'number', table: { category: 'Paging' } },
        page: { control: false, table: { category: 'Paging' } },
        defaultPage: { control: 'number', table: { category: 'Paging' } },
        totalRows: { control: 'number', table: { category: 'Paging' } },
        onSetPage: { control: false, table: { category: 'Paging' } },
        sortKey: { control: false, table: { category: 'Sorting' } },
        sortOrder: { control: false, table: { category: 'Sorting' } },
        defaultSortKey: { control: 'text', table: { category: 'Sorting' } },
        defaultSortOrder: { control: 'inline-radio', options: ['ascending', 'descending'], table: { category: 'Sorting' } },
        onSort: { control: false, table: { category: 'Sorting' } },
        size: { control: 'inline-radio', options: [32, 40, 48], table: { category: 'Appearance' } },
        isFixedSize: { control: 'boolean', table: { category: 'Appearance' } },
        verticalLines: { control: 'boolean', table: { category: 'Appearance' } },
        wrap: { control: 'boolean', table: { category: 'Appearance' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        testId: { control: false, table: { disable: true, category: 'Development' } }
    }
};

const head = {
    cells: [
        { key: 'student', content: 'Student', isSortable: true },
        { key: 'tutor', content: 'Tutor', isSortable: true },
        { key: 'last', content: 'Last session', isSortable: true },
        { key: 'sessions', content: 'Sessions', isSortable: true, align: 'number' }
    ]
};

const ROSTER = [
    ['Ava Thompson', 'Priya Nair', 'Oct 24', 20261024, 12],
    ['Marcus Lee', 'Daniel Kim', 'Oct 23', 20261023, 9],
    ['Sofia Ramirez', 'Priya Nair', 'Oct 23', 20261023, 15],
    ['Jordan Patel', 'Grace Okafor', 'Oct 21', 20261021, 4],
    ['Emily Chen', 'Daniel Kim', 'Oct 20', 20261020, 11],
    ['Noah Williams', 'Grace Okafor', 'Oct 18', 20261018, 7],
    ['Lena Park', 'Priya Nair', 'Oct 17', 20261017, 3],
    ['Diego Ruiz', 'Daniel Kim', 'Oct 15', 20261015, 14]
];

const toRow = ([student, tutor, last, lastKey, sessions]) => ({
    key: student,
    cells: [
        { key: student, content: student },
        { key: tutor, content: tutor },
        { key: lastKey, content: last },
        { key: sessions, content: String(sessions) }
    ]
});

const rows = ROSTER.map(toRow);

const bodyRows = (canvas) => within(canvas.getByRole('table')).getAllByRole('row').slice(1);
const firstCells = (canvas) => bodyRows(canvas).map((row) => within(row).getAllByRole('cell')[0].textContent);

export const Default = {
    args: { head, rows, label: 'Students', rowsPerPage: 5 },
    parameters: { docs: { description: { story: 'Left alone the table holds its own sort and page. A head press sorts by the column\'s cell keys; the footer states the range and the pager moves through it.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(firstCells(canvas)).toHaveLength(5);
        await expect(canvas.getByText('1–5 of 8')).toBeVisible();
        const sessions = canvas.getByRole('columnheader', { name: /Sessions/ });
        await userEvent.click(within(sessions).getByRole('button'));
        await expect(sessions).toHaveAttribute('aria-sort', 'ascending');
        await expect(firstCells(canvas)[0]).toBe('Lena Park');
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await expect(canvas.getByText('6–8 of 8')).toBeVisible();
        await expect(firstCells(canvas)).toHaveLength(3);
    }
};

const StatelessRoster = (args) => {
    const [sort, setSort] = React.useState({ key: 'student', order: 'ascending' });
    const [page, setPage] = React.useState(1);
    return (
        <DynamicTable
            {...args}
            sortKey={sort.key}
            sortOrder={sort.order}
            onSort={({ key, sortOrder }) => setSort({ key, order: sortOrder })}
            page={page}
            onSetPage={setPage}
        />
    );
};

export const Stateless = {
    render: (args) => <StatelessRoster {...args} />,
    args: { head, rows: rows.slice(0, 4), label: 'Students', rowsPerPage: 25, totalRows: 8500 },
    parameters: { docs: { description: { story: 'The page owns the sort and the page. With `totalRows`, `rows` is already the current page — paged on a server — and the footer counts against the total: 340 pages here.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('1–25 of 8500')).toBeVisible();
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await expect(canvas.getByText('26–50 of 8500')).toBeVisible();
    }
};

const STATES = ['empty', 'no results', 'loading', 'error'];

export const States = {
    render: (args) => (
        <div style={{ display: 'grid', gap: 'var(--section-stack-lg)' }}>
            {STATES.map((state) => (
                <DynamicTable key={state} {...args} state={state} label={`Students, ${state}`} testId={`state-${state}`} />
            ))}
            <DynamicTable {...args} isLoading label="Students, refreshing" testId="state-refreshing" />
        </div>
    ),
    args: { head, rows: rows.slice(0, 3) },
    parameters: { docs: { description: { story: 'Each state keeps the head row so the columns still say what will appear. Empty, no results, loading and error swap the body for one message row; refreshing keeps the rows at the loading opacity under a spinner.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const state of STATES) {
            const root = canvas.getByTestId(`state-${state}`);
            await expect(root).toHaveAttribute('data-state', state);
            const message = root.querySelector('.plus-pattern-table-message');
            await expect(message, `${state}: one message row`).not.toBeNull();
            await expect(message.colSpan).toBe(4);
            await expect(within(root).getAllByRole('columnheader')).toHaveLength(4);
        }
        const refreshing = canvas.getByTestId('state-refreshing');
        await expect(refreshing).toHaveAttribute('aria-busy', 'true');
        const body = refreshing.querySelector('tbody');
        await expect(getComputedStyle(body).opacity).toBe('0.2');
    }
};

export const Empty = {
    args: { head, rows: [], label: 'Students', emptyView: 'No students yet' },
    parameters: {
        docs: { description: { story: 'With no rows the header stays and `emptyView` takes the body as one message row spanning every column.' } }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No students yet').closest('td').colSpan).toBe(4);
        await expect(canvas.getByRole('columnheader', { name: /Student/ })).toBeVisible();
    }
};

const LONG = 'Alexandria Montgomery-Vasquez, transferred from Roosevelt K-8 in the spring term';

export const Widths = {
    render: (args) => (
        <div style={{ display: 'grid', gap: 'var(--section-stack-lg)' }}>
            {[480, 768, 1024, 1920].map((width) => (
                <div key={width} data-testid={`width-${width}`} style={{ width: `${width}px` }}>
                    <DynamicTable {...args} label={`Students at ${width}`} />
                </div>
            ))}
        </div>
    ),
    args: {
        head,
        rows: [toRow([LONG, 'Priya Nair', 'Oct 24', 20261024, 12]), ...rows.slice(1, 4)],
        rowsPerPage: 25,
        totalRows: 8500
    },
    parameters: { docs: { description: { story: 'Under the content minimum (720) the table scrolls sideways instead of squeezing. Wider, the first column fills the room and the rest size to their content; a long name ends in an ellipsis.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const scroll = (width) => canvas.getByTestId(`width-${width}`).querySelector('.plus-pattern-table-scroll');
        const narrow = scroll(480);
        await expect(narrow.scrollWidth, 'at 480 the table scrolls sideways').toBeGreaterThan(narrow.clientWidth);
        await expect(px(getComputedStyle(narrow.querySelector('table')).minWidth)).toBe(tokenLength(canvasElement, '--content-min-width'));
        const wide = scroll(1920);
        await expect(wide.scrollWidth, 'at 1920 nothing scrolls').toBeLessThanOrEqual(wide.clientWidth);
        const [first, ...rest] = within(wide).getAllByRole('columnheader');
        for (const other of rest) {
            await expect(first.offsetWidth, 'the first column fills').toBeGreaterThan(other.offsetWidth);
        }
    }
};

const HeadRow = ({ children }) => (
    <table className="plus-table plus-table-40" style={{ tableLayout: 'fixed' }}>
        <thead><tr>{children}</tr></thead>
    </table>
);

const SortableHeads = () => {
    const [sorted, setSorted] = React.useState({ key: null, sort: 'none' });
    const head = (key, label, extra = {}) => (
        <HeadCell
            key={key}
            label={label}
            isSortable
            sort={sorted.key === key ? sorted.sort : 'none'}
            onSort={(sort) => setSorted({ key, sort })}
            {...extra}
        />
    );
    return (
        <HeadRow>
            {head('student', 'Student', { width: '200px' })}
            {head('sessions', 'Sessions', { width: '140px', align: 'number' })}
        </HeadRow>
    );
};

export const SortableHeadCells = {
    render: () => <SortableHeads />,
    parameters: { docs: { description: { story: 'A sortable column puts `aria-sort` on the header and a real button inside it. A press asks for ascending, then descending, then no sort; the page owns the sort. The unsorted arrow shows on hover and focus and a sorted column keeps its arrow, always 12 tall. Focus is a ring inset in the cell, never a fill.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const th = canvas.getByRole('columnheader', { name: /Student/ });
        const button = within(th).getByRole('button');
        const arrow = th.querySelector('.plus-table-head-cell-sort');
        await expect(th).toHaveAttribute('aria-sort', 'none');
        // The suite's real pointer persists between stories and may rest on the button
        // when this one starts; hover is the other thing that shows the arrow.
        await expect(getComputedStyle(arrow).opacity, 'unsorted arrow is hidden at rest').toBe(button.matches(':hover') ? '1' : '0');
        await userEvent.tab();
        await expect(button, 'the button takes focus from the keyboard').toHaveFocus();
        await expect(getComputedStyle(arrow).opacity, 'and the arrow shows on focus').toBe('1');
        await expect(px(getComputedStyle(arrow).fontSize)).toBe(tokenLength(canvasElement, '--size-icon-sm'));
        button.blur();

        await userEvent.click(button);
        await expect(th).toHaveAttribute('aria-sort', 'ascending');
        await expect(arrow).toHaveClass('fa-sort-up');
        await userEvent.unhover(button);
        await expect(getComputedStyle(arrow).opacity, 'a sorted arrow stays').toBe('1');
        await userEvent.click(button);
        await expect(th).toHaveAttribute('aria-sort', 'descending');
        await expect(arrow).toHaveClass('fa-sort-down');
        await userEvent.click(button);
        await expect(th).toHaveAttribute('aria-sort', 'none');

        await inEveryColorMode(async (mode) => {
            button.blur();
            await userEvent.tab();
            await expect(button, `${mode}: keyboard focus`).toHaveFocus();
            const style = getComputedStyle(button);
            await expect(style.outlineStyle, `${mode}: focus is a ring`).toBe('solid');
            await expect(style.outlineColor, `${mode}: ring color`).toBe(tokenColor(canvasElement, '--ds-border-focused'));
            // The real pointer may still rest on the button after the clicks above; its
            // hover fill is the only fill the cell may carry. Focus adds none.
            const fill = button.matches(':hover') ? tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered') : 'rgba(0, 0, 0, 0)';
            await expect(style.backgroundColor, `${mode}: focus is not a fill`).toBe(fill);
            button.blur();
        });
    }
};
