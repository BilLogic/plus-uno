import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import Table, { StaticTable, TableFooter, HeadCell } from '@/components/text-and-data-display/Table';

export default {
    title: 'Components/Text and data display/Table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Data table for tabular content. Headers and rows accept either plain values or per-cell objects ({ content, align, emphasis, overflow, secondary, leading, state, loading, colSpan, className }), so a cell can hold any node — a Badge, a Button used as a sort trigger, formatted currency. Sorting is NOT built in: the consuming page owns the sort state and passes already-ordered rows.'
            }
        }
    },
    argTypes: {
        style: { table: { disable: true } },

        // CONTENT
        headers: {
            control: 'object',
            description: 'Column headers — a string, or { text, width, align } for control over layout; align is text, number or icon',
            table: { category: 'Content' }
        },
        rows: {
            control: 'object',
            description: 'Row data — each row is an array of cells; a cell is a node or { content, align, emphasis, overflow, secondary, leading, state, loading, colSpan, className }',
            table: { category: 'Content' }
        },
        titleColumn: {
            control: 'number',
            description: 'Index of the one column that names the record, set in semibold',
            table: { category: 'Content' }
        },
        rowStates: {
            control: 'object',
            description: 'One state per row: rest, highlighted, selected or disabled',
            table: { category: 'Content' }
        },
        summary: {
            control: 'object',
            description: 'One calculation per column, in a muted row that closes the table',
            table: { category: 'Content' }
        },
        emptyState: {
            control: false,
            description: 'Shown as a message row spanning every column when there are no rows',
            table: { category: 'Content' }
        },
        footer: {
            control: false,
            description: 'A TableFooter under the rows',
            table: { category: 'Content' }
        },

        // DESIGN
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Row height: sm 32, md 40, lg 48, from the Row size tokens',
            table: { category: 'Design' }
        },
        density: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'The older name for size',
            table: { category: 'Design' }
        },
        frame: {
            control: 'inline-radio',
            options: ['plain', 'framed'],
            description: 'Plain spans its section with no outer frame; framed draws its own edge',
            table: { category: 'Design' }
        },
        verticalLines: {
            control: 'boolean',
            description: 'Vertical hairlines between columns',
            table: { category: 'Design' }
        },
        striped: {
            control: 'boolean',
            description: 'Alternate row background',
            table: { category: 'Design' }
        },
        hover: {
            control: 'boolean',
            description: 'Highlight the row under the cursor',
            table: { category: 'Design' }
        },
        bordered: {
            control: 'boolean',
            description: 'Frame the table and draw vertical lines',
            table: { category: 'Design' }
        },

        // DEVELOPMENT
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } }
    }
};

const headers = [
    { text: 'Session date', width: '22%' },
    { text: 'Student', width: '40%' },
    { text: 'Hours', width: '18%' },
    { text: 'Amount', align: 'number', width: '20%' }
];

const rows = [
    ['Jul 3', 'Priya Nair', '1.0 hrs', { content: '$32.00', align: 'number' }],
    ['Jul 9', 'Marcus Lee', '0.5 hrs', { content: '$16.00', align: 'number' }],
    ['Jul 16', 'Aisha Khan', '1.0 hrs', { content: '$36.00', align: 'number' }]
];

const rowOf = (canvasElement, name) => within(canvasElement).getByText(name).closest('tr');

export const Overview = {
    args: { headers, rows, hover: true, size: 'md', titleColumn: 1 }
};

export const Striped = {
    args: { headers, rows, striped: true, size: 'md' }
};

export const Bordered = {
    args: { headers, rows, bordered: true, size: 'sm' }
};

export const Empty = {
    args: { headers, rows: [], emptyState: 'No sessions yet' },
    parameters: {
        docs: { description: { story: 'With no rows the header stays and `emptyState` takes the body as one message row spanning every column.' } }
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No sessions yet').closest('td').colSpan).toBe(4);
        await expect(canvas.getByRole('columnheader', { name: 'Session date' })).toBeVisible();
    }
};

export const Sizes = {
    parameters: { docs: { description: { story: 'Rows are 32, 40 or 48 tall at minimum, from `--size-row-compact`, `--size-row-default` and `--size-row-comfortable`.' } } },
    render: () => (
        <div style={{ display: 'grid', gap: 'var(--size-spacing-medium-space-300)' }}>
            {['sm', 'md', 'lg'].map((size) => (
                <Table
                    key={size}
                    size={size}
                    headers={[{ text: `size=${size}` }, { text: 'Sessions', align: 'number' }]}
                    rows={[[`Student ${size}`, { content: 12, align: 'number' }]]}
                />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const expected = { sm: '--size-row-compact', md: '--size-row-default', lg: '--size-row-comfortable' };
        for (const [size, token] of Object.entries(expected)) {
            await expect(
                rowOf(canvasElement, `Student ${size}`).getBoundingClientRect().height,
                `${size} row`
            ).toBe(tokenLength(canvasElement, token));
        }
    }
};

export const FramedAndLines = {
    args: { headers, rows, frame: 'framed', verticalLines: true, titleColumn: 1 },
    parameters: { docs: { description: { story: 'Plain is the default. Framed draws its own edge, for a table that sits beside other content or in a modal body.' } } },
    play: async ({ canvasElement }) => {
        const wrapper = canvasElement.querySelector('.plus-table-wrapper');
        await inEveryColorMode(async (mode) => {
            await expect(getComputedStyle(wrapper).borderTopColor, `${mode}: the frame`).toBe(tokenColor(canvasElement, '--ds-border'));
        });
    }
};

export const Cells = {
    parameters: { docs: { description: { story: 'A cell is text or a slot. Text cells add a muted second line, wrap, take the title emphasis, align as text, number or icon, and take a leading slot. A name that does not fit ends in an ellipsis and shows its full text in a tooltip.' } } },
    render: () => (
        <Table
            headers={[
                { text: 'Student', width: '28%' },
                { text: 'Note', width: '30%' },
                { text: 'Sessions', align: 'number' },
                { text: 'Flag', align: 'icon' }
            ]}
            rows={[
                [
                    { content: 'Ava Thompson', emphasis: 'title', secondary: 'Grade 7 · Lincoln Middle', leading: <i className="fa-regular fa-circle-user" aria-hidden="true" /> },
                    { content: 'Rescheduled from Oct 22 because of a school assembly', overflow: 'wrap' },
                    { content: '1,240', align: 'number' },
                    { content: <i className="fa-solid fa-flag" role="img" aria-label="Flagged" />, align: 'icon' }
                ],
                [
                    { content: 'Marcus Lee', emphasis: 'title' },
                    { content: 'A very long single-line note that does not fit its column and ends in an ellipsis' },
                    { content: '9', align: 'number' },
                    { content: '', align: 'icon' }
                ],
                [
                    { content: 'Sofia Ramirez', emphasis: 'title', state: 'error' },
                    { content: 'Loading', loading: true },
                    { content: '15', align: 'number' },
                    { content: '', align: 'icon' }
                ]
            ]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const note = canvas.getByText(/A very long single-line note/);
        await waitFor(() => expect(note.scrollWidth).toBeGreaterThan(note.clientWidth));
        await expect(getComputedStyle(note).textOverflow).toBe('ellipsis');
        await userEvent.hover(note);
        await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('tooltip')).toHaveTextContent(/A very long single-line note/));
        await userEvent.unhover(note);
        await expect(getComputedStyle(canvas.getByText('1,240').closest('td')).textAlign).toBe('right');
    }
};

export const RowStates = {
    args: {
        headers: ['Row', 'Grade'],
        rows: [['Rest', 'Grade 7'], ['Highlighted', 'Grade 7'], ['Selected', 'Grade 7'], ['Disabled', 'Grade 7']],
        rowStates: ['rest', 'highlighted', 'selected', 'disabled'],
        hover: true
    },
    parameters: { docs: { description: { story: 'A row rests, is highlighted (a warning wash), is selected, or is disabled. The fills are transparencies of ink and state tokens, so each flips with the color mode.' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const fill = (name) => getComputedStyle(canvas.getByText(name).closest('tr')).backgroundColor;
        await inEveryColorMode(async (mode) => {
            await expect(fill('Rest'), `${mode}: rest is clear`).toBe('rgba(0, 0, 0, 0)');
            await expect(fill('Highlighted'), `${mode}: highlighted is washed`).not.toBe('rgba(0, 0, 0, 0)');
            await expect(fill('Selected'), `${mode}: selected`).toBe(tokenColor(canvasElement, '--ds-background-selected'));
            await expect(canvas.getByText('Selected').closest('tr')).toHaveAttribute('aria-selected', 'true');
            await expect(canvas.getByText('Disabled').closest('tr')).toHaveAttribute('aria-disabled', 'true');
        });
    }
};

export const Summary = {
    args: {
        headers: [{ text: 'Student' }, { text: 'Grade' }, { text: 'Sessions', align: 'number' }],
        rows: [['Ava Thompson', 'Grade 7', { content: 12, align: 'number' }], ['Marcus Lee', 'Grade 8', { content: 9, align: 'number' }]],
        summary: ['Count 2', '–', 'Sum 21'],
        titleColumn: 0
    },
    parameters: { docs: { description: { story: 'The summary row closes the table, muted, with one calculation per column and no rule under it.' } } },
    play: async ({ canvasElement }) => {
        const cell = within(canvasElement).getByText('Sum 21');
        await expect(px(getComputedStyle(cell).borderBottomWidth)).toBe(0);
        await expect(getComputedStyle(cell).textAlign).toBe('right');
    }
};

export const Footer = {
    args: { headers, rows, footer: <TableFooter range="1–3 of 3" /> },
    parameters: { docs: { description: { story: 'The footer states the range, and its inset matches the cells. A Static table never pages, so the footer belongs to the Dynamic table.' } } }
};

export const Static = {
    render: (args) => <StaticTable {...args} />,
    args: { headers, rows, titleColumn: 1, rowStates: [undefined, 'highlighted'] },
    parameters: { docs: { description: { story: 'The Static table is a fixed grid people read. Rows rest or are highlighted; nothing in it hovers, sorts, selects, pages or expands.' } } },
    play: async ({ canvasElement }) => {
        const row = rowOf(canvasElement, 'Priya Nair');
        await userEvent.hover(row);
        await expect(getComputedStyle(row).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
};

const HeadRow = ({ children }) => (
    <table className="plus-table plus-table-md" style={{ tableLayout: 'fixed' }}>
        <thead><tr>{children}</tr></thead>
    </table>
);

export const HeadCells = {
    parameters: { docs: { description: { story: 'The head cell holds a label and an optional type icon (Font Awesome Free, 12 tall). It aligns as text, number or icon, and with `isIconOnlyHeader` draws the icon alone while the label stays for screen readers. A label too long for its width ends in an ellipsis and shows in full in a tooltip. Header links and buttons are not allowed; the sort button is the only control.' } } },
    render: () => (
        <HeadRow>
            <HeadCell label="Student" icon="fa-regular fa-user" width="160px" />
            <HeadCell label="A column name far too long for the width it was given" width="120px" />
            <HeadCell label="Sessions" align="number" icon="fa-solid fa-hashtag" width="120px" />
            <HeadCell label="Flagged" align="icon" icon="fa-solid fa-flag" isIconOnlyHeader width="64px" />
        </HeadRow>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const long = canvas.getByText(/far too long/);
        await waitFor(() => expect(long.scrollWidth).toBeGreaterThan(long.clientWidth));
        await expect(getComputedStyle(long).textOverflow).toBe('ellipsis');
        await userEvent.hover(long);
        await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('tooltip')).toHaveTextContent(/far too long/));
        await userEvent.unhover(long);
        await expect(canvas.getByRole('columnheader', { name: 'Flagged' })).toBeVisible();
        await expect(canvasElement.querySelector('.plus-table-head-cell-type.fa-flag')).toBeVisible();
        await expect(canvas.getByText('Sessions').closest('th')).toHaveClass('plus-table-cell--align-number');
        await expect(px(getComputedStyle(canvasElement.querySelector('.plus-table-head-cell-type')).fontSize)).toBe(tokenLength(canvasElement, '--size-icon-sm'));
    }
};

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
