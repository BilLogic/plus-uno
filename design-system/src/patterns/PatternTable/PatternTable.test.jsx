import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PatternTable from './PatternTable';

const head = (
    <thead>
        <tr>
            <th>Name</th>
            <th colSpan={2}>Role</th>
            <th>Status</th>
        </tr>
    </thead>
);

const body = (
    <tbody>
        <tr>
            <td>Jordan Blake</td>
            <td>Tutor</td>
            <td>Lead</td>
            <td>Active</td>
        </tr>
    </tbody>
);

describe('PatternTable', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the empty state as a message row under the header, inside the table', () => {
        render(
            <PatternTable empty emptyState={<span>No members yet</span>} pagination={<span>1 of 4</span>}>
                {head}
                {body}
            </PatternTable>
        );
        const table = screen.getByRole('table');
        // The header stays, so the columns still say what will appear.
        expect(within(table).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        // The rows are replaced by one message row spanning every column.
        expect(within(table).queryByText('Jordan Blake')).toBeNull();
        const message = within(table).getByText('No members yet').closest('td');
        expect(message).not.toBeNull();
        expect(message.colSpan).toBe(4);
        expect(message.closest('tr')).toHaveClass('plus-pattern-table-message-row');
        expect(message.closest('tbody')).not.toBeNull();
        // Paging belongs to rows; with none there is nothing to page.
        expect(screen.queryByText('1 of 4')).toBeNull();
    });

    it('spans one column when there is no header to count', () => {
        render(<PatternTable empty emptyState={<span>Nothing here</span>} />);
        const cell = screen.getByText('Nothing here').closest('td');
        expect(cell.colSpan).toBe(1);
        expect(cell.closest('table')).not.toBeNull();
    });

    it('keeps a caption and a head row drawn by a wrapper component, and spans its columns', () => {
        const Head = () => (
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Role</th>
                </tr>
            </thead>
        );
        render(
            <PatternTable empty emptyState={<span>No members yet</span>}>
                <caption>Team members</caption>
                <Head />
                {body}
            </PatternTable>
        );
        expect(screen.getByRole('table', { name: 'Team members' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
        expect(screen.queryByText('Jordan Blake')).toBeNull();
        expect(screen.getByText('No members yet').closest('td').colSpan).toBe(2);
    });

    it('renders the rows and pagination when not empty', () => {
        render(
            <PatternTable emptyState={<span>No members yet</span>} pagination={<span>1 of 4</span>}>
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
        expect(screen.queryByText('No members yet')).toBeNull();
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('still renders a deprecated toolbar, and warns once in development', async () => {
        // A fresh module, so the once-per-session warning has not fired yet.
        vi.resetModules();
        const { default: FreshTable } = await import('./PatternTable');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { rerender } = render(<FreshTable toolbar={<span>Old toolbar</span>}>{head}</FreshTable>);
        rerender(<FreshTable toolbar={<span>Old toolbar</span>}>{head}</FreshTable>);
        render(<FreshTable toolbar={<span>Another</span>}>{head}</FreshTable>);
        expect(screen.getByText('Old toolbar')).toBeInTheDocument();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/`toolbar` is deprecated/);
        expect(warn.mock.calls[0][0]).toMatch(/Section header/);
    });

    it('does not warn without a toolbar', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<PatternTable>{head}{body}</PatternTable>);
        expect(warn).not.toHaveBeenCalled();
    });
});
