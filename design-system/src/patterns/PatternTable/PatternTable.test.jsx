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

    it('renders the empty state instead of the table, with no column headers or footer', () => {
        render(
            <PatternTable empty emptyState={<span>No members yet</span>} footer={<span>1 of 4</span>}>
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
        expect(screen.queryAllByRole('row')).toHaveLength(0);
        expect(screen.queryByText('Jordan Blake')).toBeNull();
        expect(screen.queryByText('1 of 4')).toBeNull();
        expect(screen.getByText('No members yet')).toBeVisible();
    });

    it('keeps the accessible name from tableProps without leaving table roles', () => {
        render(
            <PatternTable
                empty
                emptyState={<span>Nothing here</span>}
                tableProps={{ 'aria-label': 'Team members' }}
            >
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
        const region = screen.getByRole('region', { name: 'Team members' });
        expect(within(region).getByText('Nothing here')).toBeVisible();
    });

    it('drops caption and head rows when empty while preserving the accessible name', () => {
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
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('columnheader')).toBeNull();
        expect(screen.queryByText('Jordan Blake')).toBeNull();
        const region = screen.getByRole('region', { name: 'Team members' });
        expect(within(region).getByText('No members yet')).toBeVisible();
    });

    it('omits the region role when empty without an accessible name or caption', () => {
        render(
            <PatternTable empty emptyState={<span>No members yet</span>}>
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('region')).toBeNull();
        expect(screen.getByText('No members yet')).toBeVisible();
    });

    it('renders the table normally when empty is true without emptyState', () => {
        render(
            <PatternTable empty footer={<span>1 of 4</span>}>
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('renders the rows and pagination when not empty', () => {
        render(
            <PatternTable emptyState={<span>No members yet</span>} footer={<span>1 of 4</span>}>
                {head}
                {body}
            </PatternTable>
        );
        expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
        expect(screen.queryByText('No members yet')).toBeNull();
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

});
