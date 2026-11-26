import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableShell } from './TableParts';

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

describe('TableShell', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the empty state instead of the table, with no column headers or footer', () => {
        render(
            <TableShell empty emptyState={<span>No members yet</span>} footer={<span>1 of 4</span>}>
                {head}
                {body}
            </TableShell>
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
            <TableShell
                empty
                emptyState={<span>Nothing here</span>}
                tableProps={{ 'aria-label': 'Team members' }}
            >
                {head}
                {body}
            </TableShell>
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
            <TableShell empty emptyState={<span>No members yet</span>}>
                <caption>Team members</caption>
                <Head />
                {body}
            </TableShell>
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('columnheader')).toBeNull();
        expect(screen.queryByText('Jordan Blake')).toBeNull();
        const region = screen.getByRole('region', { name: 'Team members' });
        expect(within(region).getByText('No members yet')).toBeVisible();
    });

    it('omits the region role when empty without an accessible name or caption', () => {
        render(
            <TableShell empty emptyState={<span>No members yet</span>}>
                {head}
                {body}
            </TableShell>
        );
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('region')).toBeNull();
        expect(screen.getByText('No members yet')).toBeVisible();
    });

    it('renders the table normally when empty is true without emptyState', () => {
        render(
            <TableShell empty footer={<span>1 of 4</span>}>
                {head}
                {body}
            </TableShell>
        );
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('renders the rows and pagination when not empty', () => {
        render(
            <TableShell emptyState={<span>No members yet</span>} footer={<span>1 of 4</span>}>
                {head}
                {body}
            </TableShell>
        );
        expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
        expect(screen.queryByText('No members yet')).toBeNull();
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('renders empty state inside .plus-table-shell-empty and reveals rows when cleared', () => {
        const { container, rerender } = render(
            <TableShell empty emptyState={<span>No members match</span>}>
                {head}
                {body}
            </TableShell>
        );
        expect(container.querySelector('.plus-table-shell-empty')).not.toBeNull();
        expect(screen.queryByRole('table')).toBeNull();

        rerender(
            <TableShell empty={false} emptyState={<span>No members match</span>}>
                {head}
                {body}
            </TableShell>
        );
        expect(container.querySelector('.plus-table-shell-empty')).toBeNull();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

});

describe('TableShell scroll region', () => {
    /** Box sizes for the scroll region; any other element measures 0. */
    let size;
    let observers;

    const measure = (name) => function measured() {
        return this.classList?.contains('plus-table-shell-scroll') ? size[name] : 0;
    };

    beforeEach(() => {
        size = { scrollWidth: 400, clientWidth: 400, scrollHeight: 200, clientHeight: 200 };
        observers = [];
        for (const name of Object.keys(size)) {
            vi.spyOn(HTMLElement.prototype, name, 'get').mockImplementation(measure(name));
        }
        vi.stubGlobal('ResizeObserver', class {
            constructor(callback) { this.callback = callback; observers.push(this); }
            observe() {}
            disconnect() {}
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const resize = (next) => {
        Object.assign(size, next);
        act(() => observers.forEach((observer) => observer.callback([])));
    };

    const scrollRegion = (container) => container.querySelector('.plus-table-shell-scroll');

    it('takes no tab stop, role or name while the table fits', () => {
        const { container } = render(
            <TableShell tableProps={{ 'aria-label': 'Members' }}>{head}{body}</TableShell>
        );
        const region = scrollRegion(container);
        expect(region).not.toHaveAttribute('tabindex');
        expect(region).not.toHaveAttribute('role');
        expect(region).not.toHaveAttribute('aria-label');
    });

    it('is a named, focusable region while the table overflows sideways', () => {
        size.scrollWidth = 720;
        const { container } = render(
            <TableShell tableProps={{ 'aria-label': 'Members' }}>{head}{body}</TableShell>
        );
        const region = screen.getByRole('region', { name: 'Members' });
        expect(region).toBe(scrollRegion(container));
        expect(region).toHaveAttribute('tabindex', '0');
    });

    it('takes the name from the caption when the table has no label', () => {
        size.scrollWidth = 720;
        render(<TableShell><caption>Roster</caption>{head}{body}</TableShell>);
        expect(screen.getByRole('region', { name: 'Roster' })).toHaveAttribute('tabindex', '0');
    });

    it('points at the same label as the table when another element labels it', () => {
        size.scrollWidth = 720;
        const { container } = render(
            <>
                <h2 id="members-title">Members</h2>
                <TableShell tableProps={{ 'aria-labelledby': 'members-title' }}>{head}{body}</TableShell>
            </>
        );
        expect(scrollRegion(container)).toHaveAttribute('aria-labelledby', 'members-title');
        expect(screen.getByRole('region', { name: 'Members' })).toBe(scrollRegion(container));
    });

    it('counts height overflow only when maxHeight bounds the region', () => {
        size.scrollHeight = 600;
        const { container, rerender } = render(
            <TableShell tableProps={{ 'aria-label': 'Members' }}>{head}{body}</TableShell>
        );
        expect(scrollRegion(container)).not.toHaveAttribute('tabindex');
        rerender(<TableShell maxHeight={200} tableProps={{ 'aria-label': 'Members' }}>{head}{body}</TableShell>);
        expect(screen.getByRole('region', { name: 'Members' })).toHaveAttribute('tabindex', '0');
        expect(scrollRegion(container)).toHaveStyle({ maxHeight: '200px' });
    });

    it('drops the tab stop, role and name when a resize makes the table fit', () => {
        size.scrollWidth = 720;
        const { container } = render(
            <TableShell stickyColumn tableProps={{ 'aria-label': 'Members' }}>{head}{body}</TableShell>
        );
        expect(scrollRegion(container)).toHaveAttribute('tabindex', '0');
        resize({ clientWidth: 800, scrollWidth: 800 });
        const region = scrollRegion(container);
        expect(region).not.toHaveAttribute('tabindex');
        expect(region).not.toHaveAttribute('role');
        expect(region).not.toHaveAttribute('aria-label');
        resize({ clientWidth: 375 });
        expect(screen.getByRole('region', { name: 'Members' })).toHaveAttribute('tabindex', '0');
    });
});
