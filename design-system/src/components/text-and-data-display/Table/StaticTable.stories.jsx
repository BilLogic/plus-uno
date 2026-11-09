import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import Table, { StaticTable, HeadCell } from '@/components/text-and-data-display/Table';
import { iconClass } from '../../../lib/icon';

export default {
    title: 'Components/Text and data display/Static table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A fixed grid people read. Headers and rows accept either plain values or per-cell objects ({ content, align, emphasis, overflow, secondary, leading, state, loading, colSpan, className }), so a cell can hold any node — a Badge, formatted currency. Rows rest or are highlighted; nothing in a Static table hovers, sorts, selects, pages or expands — see the Dynamic table for that.'
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
            options: [32, 40, 48],
            description: 'Row height in pixels, from the Row size tokens',
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
    args: { headers, rows, hover: true, size: 40, titleColumn: 1 }
};

export const Striped = {
    args: { headers, rows, striped: true, size: 40 }
};

export const Bordered = {
    args: { headers, rows, bordered: true, size: 32 }
};

export const Sizes = {
    parameters: { docs: { description: { story: 'Rows are 32, 40 or 48 tall at minimum, from `--row-height-sm`, `--row-height-md` and `--row-height-lg`.' } } },
    render: () => (
        <div style={{ display: 'grid', gap: 'var(--space-100)' }}>
            {[32, 40, 48].map((size) => (
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
        const expected = { 32: '--row-height-sm', 40: '--row-height-md', 48: '--row-height-lg' };
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
                    { content: <i className={iconClass('flag')} role="img" aria-label="Flagged" />, align: 'icon' }
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
    <table className="plus-table plus-table-40" style={{ tableLayout: 'fixed' }}>
        <thead><tr>{children}</tr></thead>
    </table>
);

export const HeadCells = {
    parameters: { docs: { description: { story: 'The head cell holds a label and an optional type icon (Font Awesome Free, 12 tall). It aligns as text, number or icon, and with `isIconOnlyHeader` draws the icon alone while the label stays for screen readers. A label too long for its width ends in an ellipsis and shows in full in a tooltip. Header links and buttons are not allowed; the sort button is the only control.' } } },
    render: () => (
        <HeadRow>
            <HeadCell label="Student" icon="user" width="160px" />
            <HeadCell label="A column name far too long for the width it was given" width="120px" />
            <HeadCell label="Sessions" align="number" icon={iconClass('hashtag')} width="120px" />
            <HeadCell label="Flagged" align="icon" icon={iconClass('flag')} isIconOnlyHeader width="64px" />
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
        await expect(px(getComputedStyle(canvasElement.querySelector('.plus-table-head-cell-type')).fontSize)).toBe(tokenLength(canvasElement, '--icon-sm'));
    }
};

const STATE_ROWS = {
    headers: ['Row', 'Grade'],
    rows: [['Rest row', 'Grade 7'], ['Selected row', 'Grade 7'], ['Disabled row', 'Grade 7'], ['Error row', { content: 'Grade 7', state: 'error' }]],
    rowStates: ['rest', 'selected', 'disabled', 'rest'],
    hover: true,
};

/** Rest: a row is clear; a selected row is on the selected fill. */
export const Rest = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(rowOf(canvasElement, 'Rest row')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        await expect(getComputedStyle(rowOf(canvasElement, 'Selected row')).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
    },
};

/** Hovered: a rest row takes the subtle hovered step, a selected row its own hovered step. */
export const Hovered = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, rowOf(canvasElement, 'Rest row'), ':hover', '--ds-background-neutral-subtle-hovered', 'rest row');
        await expectGroundUnder(canvasElement, rowOf(canvasElement, 'Selected row'), ':hover', '--ds-background-selected-hovered', 'selected row');
    },
};

/** Pressed: the pressed steps of the same two grounds. */
export const Pressed = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, rowOf(canvasElement, 'Rest row'), ':active', '--ds-background-neutral-subtle-pressed', 'rest row');
        await expectGroundUnder(canvasElement, rowOf(canvasElement, 'Selected row'), ':active', '--ds-background-selected-pressed', 'selected row');
    },
};

/** Focused: a row has no focus stop; the only controls in a table are in its head cells and cells. */
export const Focused = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        await userEvent.tab();
        await expect(rowOf(canvasElement, 'Rest row')).not.toHaveFocus();
        await expect(canvasElement.ownerDocument.activeElement.closest('tr')).toBeNull();
    },
};

/** Disabled: the row takes the disabled ink, ignores the pointer and says so to assistive tech. */
export const Disabled = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        const row = rowOf(canvasElement, 'Disabled row');
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        await expect(getComputedStyle(row).pointerEvents).toBe('none');
        await expect(getComputedStyle(row.querySelector('td')).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
    },
};

/** Invalid: a cell in the error state takes the danger ink. */
export const Invalid = {
    args: STATE_ROWS,
    play: async ({ canvasElement }) => {
        const cell = canvasElement.querySelector('.plus-table-cell--error');
        await expect(cell).not.toBeNull();
        await expect(getComputedStyle(cell).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));
    },
};

/** The playground: the overview story's args, with every control live. */
export const Interactive = {
    args: { ...Overview.args }
};
