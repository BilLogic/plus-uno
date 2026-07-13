import React from 'react';
import PatternTable from '@/patterns/PatternTable';
import PatternCard from '@/patterns/PatternCard';
import Button from '@/components/actions/Button';

const sampleRows = [
    { name: 'Jordan Blake', role: 'Tutor', status: 'Active' },
    { name: 'Casey Rivera', role: 'Coach', status: 'Invited' },
    { name: 'Morgan Lee', role: 'Tutor', status: 'Active' },
];

const tableContent = (
    <>
        <thead>
            <tr>
                <th className="body3-txt">Name</th>
                <th className="body3-txt">Role</th>
                <th className="body3-txt">Status</th>
            </tr>
        </thead>
        <tbody>
            {sampleRows.map((row) => (
                <tr key={row.name}>
                    <td className="body1-txt">{row.name}</td>
                    <td className="body1-txt">{row.role}</td>
                    <td className="body1-txt">{row.status}</td>
                </tr>
            ))}
        </tbody>
    </>
);

const toolbarSlot = (
    <>
        <span className="h6" style={{ margin: 0 }}>Team members</span>
        <div style={{ marginLeft: 'auto' }}>
            <Button text="Add member" style="primary" fill="filled" size="small" onClick={() => {}} />
        </div>
    </>
);

const paginationSlot = (
    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
        Pagination slot — 1 of 4
    </span>
);

const emptyStateSlot = (
    <>
        <span className="h6" style={{ margin: 0 }}>No members yet</span>
        <span className="body1-txt">Empty-state slot — invite someone to get started.</span>
    </>
);

/** Full shell inside a card — docs section only */
function PatternTableCompositionDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TABLE SHELL INSIDE A CARD</span>
            <PatternCard>
                <PatternTable toolbar={toolbarSlot} pagination={paginationSlot}>
                    {tableContent}
                </PatternTable>
            </PatternCard>
        </div>
    );
}

/** Empty state */
function PatternTableEmptyDemo() {
    return (
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">EMPTY STATE</span>
            <PatternCard>
                <PatternTable toolbar={toolbarSlot} empty emptyState={emptyStateSlot} />
            </PatternCard>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Table',
    component: PatternTable,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        toolbar: { table: { disable: true } },
        pagination: { table: { disable: true } },
        emptyState: { table: { disable: true } },
        empty: {
            control: 'boolean',
            description: 'Show the empty-state slot instead of the table',
            table: { category: 'State' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <PatternTable toolbar={toolbarSlot} pagination={paginationSlot}>
        {tableContent}
    </PatternTable>
);

export const Composition = () => <PatternTableCompositionDemo />;

export const EmptyState = () => <PatternTableEmptyDemo />;

export const Interactive = {
    args: {
        empty: false,
    },
    render: (args) => (
        <PatternTable
            toolbar={toolbarSlot}
            pagination={paginationSlot}
            emptyState={emptyStateSlot}
            empty={args.empty}
        >
            {tableContent}
        </PatternTable>
    ),
};
