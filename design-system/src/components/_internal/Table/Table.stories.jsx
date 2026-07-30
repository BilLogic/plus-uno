import React from 'react';
import Table from '@/components/_internal/Table';

export default {
    title: 'Components/Layout and structure/Table',
    component: Table,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Data table for tabular content. Headers and rows accept either plain values or per-cell objects ({ content, align, colSpan, className }), so a cell can hold any node — a Badge, a Button used as a sort trigger, formatted currency. Sorting is NOT built in: the consuming page owns the sort state and passes already-ordered rows.'
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
            description: 'Vertical cell padding, bound to the --size-table-cell-y token family',
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
        docs: { description: { story: 'With no rows the header still renders — pair it with an empty-state message above or below the table.' } }
    }
};
