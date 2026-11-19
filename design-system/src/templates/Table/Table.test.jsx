import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Table, { TABLE_KINDS } from './Table';
import { StaticTable } from '@/components';

const staticProps = {
    headers: ['Name', 'Role'],
    rows: [['Jordan Blake', 'Tutor'], ['Casey Rivera', 'Coach']],
};

const treeProps = {
    label: 'Schools',
    head: { cells: [{ key: 'name', content: 'Name' }] },
    items: [{ id: 'lincoln', cells: [{ content: 'Lincoln Middle' }] }],
};

const dynamicProps = {
    label: 'Members',
    head: { cells: [{ key: 'name', content: 'Name' }] },
    rows: [{ key: 'jordan', cells: [{ key: 'name', content: 'Jordan Blake' }] }],
};

describe('Table template', () => {
    it('names the three kinds', () => {
        expect(TABLE_KINDS).toEqual(['static', 'dynamic', 'tree']);
    });

    it('draws a Static table for kind="static" under the Section title', () => {
        const { container } = render(<Table title="Team" kind="static" tableProps={staticProps} />);
        expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(container.querySelector('.plus-table-template')).toHaveAttribute('data-kind', 'static');
        expect(container.querySelector('.plus-static-table')).not.toBeNull();
    });

    it('draws a Dynamic table for kind="dynamic"', () => {
        const { container } = render(<Table title="Team" kind="dynamic" tableProps={dynamicProps} />);
        expect(screen.getByRole('table', { name: 'Members' })).toBeInTheDocument();
        expect(container.querySelector('.plus-dynamic-table')).not.toBeNull();
    });

    it('draws a Tree table for kind="tree"', () => {
        render(<Table title="Schools" kind="tree" tableProps={treeProps} />);
        expect(screen.getByRole('treegrid', { name: 'Schools' })).toBeInTheDocument();
    });

    it('arranges a table passed as children, and children win over kind', () => {
        render(
            <Table title="Team" kind="tree" tableProps={treeProps}>
                <StaticTable {...staticProps} />
            </Table>
        );
        expect(screen.queryByRole('treegrid')).toBeNull();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('puts the footer after the table', () => {
        render(<Table title="Team" kind="static" tableProps={staticProps} footer={<span>1–2 of 2</span>} />);
        const table = screen.getByRole('table');
        const footer = screen.getByText('1–2 of 2');
        expect(table.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('replaces the table and footer with the empty state box, keeping the table name', () => {
        render(
            <Table
                title="Team"
                kind="static"
                tableProps={staticProps}
                footer={<span>1–2 of 2</span>}
                empty
                emptyState={<span>No members yet</span>}
                label="Team members"
            />
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByText('1–2 of 2')).toBeNull();
        expect(screen.queryByText('Jordan Blake')).toBeNull();
        const region = screen.getByRole('region', { name: 'Team members' });
        expect(within(region).getByText('No members yet')).toBeVisible();
        // The Section header stays.
        expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument();
    });

    it('renders the table normally when empty has no emptyState', () => {
        render(<Table title="Team" kind="static" tableProps={staticProps} empty />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('leaves the footer and empty state to a Dynamic or Tree table, which draws its own', () => {
        render(
            <Table
                title="Team"
                kind="dynamic"
                tableProps={dynamicProps}
                footer={<span>template footer</span>}
                empty
                emptyState={<span>template empty</span>}
            />
        );
        expect(screen.getByRole('table', { name: 'Members' })).toBeInTheDocument();
        expect(screen.queryByText('template footer')).toBeNull();
        expect(screen.queryByText('template empty')).toBeNull();
    });
});
