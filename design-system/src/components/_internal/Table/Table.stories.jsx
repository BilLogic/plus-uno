import React from 'react';
import Table from '@/components/_internal/Table';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';
import { Message, RowSizes, Frames, staticPairs, CellPresets, StaticRowStates, CellStates } from '@/storybook-docs/table-doc-examples.jsx';

export default {
    title: 'Components/Text and data display/Table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A read-only table for records people read and compare across columns. Headers and rows accept plain values or per-cell objects ({ content, align, colSpan, className }), so a cell can hold any node: a Status, a Tag, a link or formatted currency. Sorting is not built in: the page owns the sort state and passes the rows already ordered.'
            }
        }
    },
    argTypes: {
        style: { table: { disable: true } },

        // CONTENT
        headers: {
            control: 'object',
            description: 'Column headers — a string, or { text, width, align, className } for control over layout',
            table: { category: 'Content' }
        },
        rows: {
            control: 'object',
            description: 'Row data — each row is an array of cells; a cell is a node or { content, align, colSpan, className }',
            table: { category: 'Content' }
        },

        // DESIGN
        density: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Cell padding: sm, md or lg',
            table: { category: 'Design' }
        },
        striped: {
            control: 'boolean',
            description: 'Alternate row background. The table rules do not stripe rows.',
            table: { category: 'Design' }
        },
        hover: {
            control: 'boolean',
            description: 'Highlight the row under the cursor',
            table: { category: 'Design' }
        },
        bordered: {
            control: 'boolean',
            description: 'Draw cell borders',
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
    { text: 'Amount', align: 'right', width: '20%' }
];

const rows = [
    ['Jul 3', 'Priya Nair', '1.0 hrs', { content: '$32.00', align: 'right' }],
    ['Jul 9', 'Marcus Lee', '0.5 hrs', { content: '$16.00', align: 'right' }],
    ['Jul 16', 'Aisha Khan', '1.0 hrs', { content: '$36.00', align: 'right' }]
];

export const Overview = {
    args: { headers, rows, hover: true, density: 'md' }
};

export const Striped = {
    args: { headers, rows, striped: true, density: 'md' }
};

export const Bordered = {
    args: { headers, rows, bordered: true, density: 'sm' }
};

export const Empty = {
    args: { headers, rows: [] },
    parameters: {
        docs: { description: { story: 'With no rows the header still renders.' } }
    }
};

const summaryRows = [
    ...rows,
    [
        { content: 'Total', className: 'text-body-secondary' },
        '',
        { content: '2.5 hrs', className: 'text-body-secondary' },
        { content: '$84.00', align: 'right', className: 'text-body-secondary' }
    ]
];

/** The parts of a table: the head row, a title column, a number column and a closing summary row. */
export const Anatomy = {
    args: { headers, rows: summaryRows, hover: false, density: 'md' }
};

/** With no rows, the head row stays and one message row spans every column. */
export const MessageRow = {
    args: {
        headers,
        hover: false,
        rows: [[{ content: <Message />, colSpan: 4, align: 'center' }]]
    }
};

/** The six do and don't pairs of the Static table rules. */
export const DoDont = () => <DoDontGrid pairs={staticPairs} />;

/** The cell recipes: a number, a date, a Status, a link and the empty dash. */
export const Cells = () => <CellPresets />;

/** A row at rest, and a highlighted row. */
export const RowStates = () => <StaticRowStates />;

/** A cell in error and a cell that is loading. */
export const CellStatesExample = () => <CellStates />;

/** The three row heights of the rule, 32, 40 and 48. */
export const RowSizeRule = () => <RowSizes />;

/** Plain and framed. */
export const FrameRule = () => <Frames />;
