import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { tokenColor, tokenLength, px } from '@/storybook-docs/lib/style-probes.js';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import Table, { TableFooter, HeadCell } from '@/components/text-and-data-display/Table';

/**
 * The Dynamic table: a table people sort, filter, select, page or act on.
 * No code component owns the whole set yet — this page documents the parts
 * that do exist (a sortable `HeadCell`, `TableFooter`, the empty state) on
 * the same `Table` that the Static table uses. `PatternTable` carries part
 * of the rest: the sticky header and column, paging and the empty state.
 */

export default {
    title: 'Components/Text and data display/Dynamic table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A table people sort, filter, select, page or act on. Sorting is NOT built into `Table` itself: a sortable `HeadCell` puts `aria-sort` and a button in the header, and the consuming page owns the sort state and passes already-ordered rows. `TableFooter` states the range, and the empty state takes the body as one message row.'
            }
        }
    },
    argTypes: {
        style: { table: { disable: true } },
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

export const Footer = {
    args: { headers, rows, footer: <TableFooter range="1–3 of 3" /> },
    parameters: { docs: { description: { story: 'The footer states the range, and its inset matches the cells. A Static table never pages, so the footer belongs to the Dynamic table.' } } }
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

const sortButton = (canvasElement) => within(within(canvasElement).getByRole('columnheader', { name: /Student/ })).getByRole('button');

/** Rest: a sortable head cell is clear, with its arrow hidden until the cell is hovered or focused. */
export const Rest = {
    render: () => <SortableHeads />,
    play: async ({ canvasElement }) => {
        const th = within(canvasElement).getByRole('columnheader', { name: /Student/ });
        await expect(th).toHaveAttribute('aria-sort', 'none');
        await expect(getComputedStyle(sortButton(canvasElement)).backgroundColor).toBe(
            sortButton(canvasElement).matches(':hover') ? tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered') : 'rgba(0, 0, 0, 0)',
        );
    },
};

/** Hovered: the head cell takes the subtle hovered step. */
export const Hovered = {
    render: () => <SortableHeads />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, sortButton(canvasElement), ':hover', '--ds-background-neutral-subtle-hovered', 'head cell');
    },
};

/** Pressed: the head cell takes the subtle pressed step. */
export const Pressed = {
    render: () => <SortableHeads />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, sortButton(canvasElement), ':active', '--ds-background-neutral-subtle-pressed', 'head cell');
    },
};

/** Focused: the sort button shows the 2px ring inset in the cell, and the arrow appears. */
export const Focused = {
    render: () => <SortableHeads />,
    play: async ({ canvasElement }) => {
        const button = sortButton(canvasElement);
        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible')).toBe(true);
        const style = getComputedStyle(button);
        await expect(style.outlineStyle).toBe('solid');
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(getComputedStyle(button.querySelector('.plus-table-head-cell-sort')).opacity).toBe('1');
        button.blur();
    },
};

/** Disabled: the table has no disabled sort; a row can be disabled (see the Static table) and takes the disabled ink. */
export const DisabledRow = {
    args: { headers, rows: [['Jul 3', 'Priya Nair', '1.0 hrs', { content: '$32.00', align: 'number' }]], rowStates: ['disabled'] },
    play: async ({ canvasElement }) => {
        const row = within(canvasElement).getByText('Priya Nair').closest('tr');
        await expect(row).toHaveAttribute('aria-disabled', 'true');
    },
};
