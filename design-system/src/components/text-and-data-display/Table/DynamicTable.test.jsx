import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DynamicTable } from '.';

const head = {
    cells: [
        { key: 'student', content: 'Student', isSortable: true },
        { key: 'sessions', content: 'Sessions', isSortable: true, align: 'number' },
        { key: 'grade', content: 'Grade' },
    ],
};

const people = [
    ['Marcus Lee', 9, 'Grade 8'],
    ['Ava Thompson', 12, 'Grade 7'],
    ['Priya Nair', 3, 'Grade 6'],
    ['Diego Ruiz', 7, 'Grade 7'],
    ['Lena Park', 5, 'Grade 8'],
];

const rows = people.map(([name, sessions, grade]) => ({
    key: name,
    cells: [
        { key: name, content: name },
        { key: sessions, content: String(sessions) },
        { key: grade, content: grade },
    ],
}));

const bodyNames = () => within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('DynamicTable', () => {
    it('renders the head cells and the rows on the PatternTable shell', () => {
        render(<DynamicTable head={head} rows={rows} label="Students" />);
        const table = screen.getByRole('table', { name: 'Students' });
        expect(table.closest('.plus-pattern-table')).not.toBeNull();
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(bodyNames()).toEqual(people.map(([name]) => name));
    });

    it('names the table with a visible caption when one is given', () => {
        render(<DynamicTable head={head} rows={rows} caption="Students this term" />);
        expect(screen.getByRole('table', { name: 'Students this term' })).toBeInTheDocument();
    });

    it('sorts by the cell key on a head press when stateful', () => {
        render(<DynamicTable head={head} rows={rows} />);
        const sessions = screen.getByRole('columnheader', { name: /Sessions/ });
        fireEvent.click(within(sessions).getByRole('button'));
        expect(sessions).toHaveAttribute('aria-sort', 'ascending');
        expect(bodyNames()).toEqual(['Priya Nair', 'Lena Park', 'Diego Ruiz', 'Marcus Lee', 'Ava Thompson']);
        fireEvent.click(within(sessions).getByRole('button'));
        expect(sessions).toHaveAttribute('aria-sort', 'descending');
        expect(bodyNames()[0]).toBe('Ava Thompson');
    });

    it('starts from defaultSortKey and defaultSortOrder', () => {
        render(<DynamicTable head={head} rows={rows} defaultSortKey="student" defaultSortOrder="ascending" />);
        expect(bodyNames()[0]).toBe('Ava Thompson');
    });

    it('is stateless when sortKey is passed: it reports the sort and draws what it is given', () => {
        const onSort = vi.fn();
        const { rerender } = render(
            <DynamicTable head={head} rows={rows} sortKey="student" sortOrder="descending" onSort={onSort} />
        );
        expect(bodyNames()[0]).toBe('Priya Nair');
        const student = screen.getByRole('columnheader', { name: /Student/ });
        fireEvent.click(within(student).getByRole('button'));
        expect(onSort).toHaveBeenCalledWith({ key: 'student', sortOrder: 'none' });
        // Nothing moves until the page passes the new sort.
        expect(student).toHaveAttribute('aria-sort', 'descending');
        rerender(<DynamicTable head={head} rows={rows} sortKey="student" sortOrder="ascending" onSort={onSort} />);
        expect(bodyNames()[0]).toBe('Ava Thompson');
    });

    it('pages the rows, states the range in the footer and moves with the pager', () => {
        const onSetPage = vi.fn();
        render(<DynamicTable head={head} rows={rows} rowsPerPage={2} onSetPage={onSetPage} />);
        expect(bodyNames()).toEqual(['Marcus Lee', 'Ava Thompson']);
        expect(screen.getByText('1–2 of 5')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(onSetPage).toHaveBeenCalledWith(2);
        expect(bodyNames()).toEqual(['Priya Nair', 'Diego Ruiz']);
        expect(screen.getByText('3–4 of 5')).toBeInTheDocument();
    });

    it('draws only the page it is given when totalRows says the rows are already one page', () => {
        render(<DynamicTable head={head} rows={rows.slice(0, 2)} rowsPerPage={2} page={3} totalRows={340} />);
        expect(bodyNames()).toEqual(['Marcus Lee', 'Ava Thompson']);
        expect(screen.getByText('5–6 of 340')).toBeInTheDocument();
    });

    it('names its pager after the table, so two tables on a page have two distinct landmarks', () => {
        render(<DynamicTable head={head} rows={rows} rowsPerPage={2} label="Students" />);
        expect(screen.getByRole('navigation', { name: 'Students pages' })).toBeInTheDocument();
    });

    it('has no footer when it does not page', () => {
        const { container } = render(<DynamicTable head={head} rows={rows} />);
        expect(container.querySelector('.plus-table-footer')).toBeNull();
    });

    it.each([
        ['empty', { rows: [] }, 'Nothing here yet'],
        ['empty', { rows: [], emptyView: 'No sessions yet' }, 'No sessions yet'],
        ['no results', { state: 'no results' }, 'No results'],
        ['loading', { rows: [], isLoading: true }, 'Loading rows'],
        ['error', { state: 'error' }, 'Couldn’t load'],
    ])('the %s state keeps the head row and swaps the body for its message row', (state, props, text) => {
        const { container } = render(<DynamicTable head={head} rows={rows} {...props} />);
        expect(container.querySelector('.plus-dynamic-table')).toHaveAttribute('data-state', state);
        const message = screen.getByText(new RegExp(text)).closest('td');
        expect(message.colSpan).toBe(3);
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(screen.queryByText('Marcus Lee')).toBeNull();
    });

    it('refreshing keeps the rows under a spinner and marks the table busy', () => {
        const { container } = render(<DynamicTable head={head} rows={rows} isLoading />);
        const root = container.querySelector('.plus-dynamic-table');
        expect(root).toHaveAttribute('data-state', 'refreshing');
        expect(root).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Marcus Lee')).toBeInTheDocument();
        expect(container.querySelector('.plus-dynamic-table-overlay')).not.toBeNull();
    });

    it('highlights a row and makes a row with onClick clickable', () => {
        const onClick = vi.fn();
        const clickable = rows.map((row, i) => (i === 1 ? { ...row, onClick } : row));
        render(<DynamicTable head={head} rows={clickable} highlightedRowIndex={0} />);
        const [, first, second] = within(screen.getByRole('table')).getAllByRole('row');
        expect(first).toHaveClass('plus-dynamic-table-row--highlighted');
        fireEvent.click(second);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('fixes the column widths only with isFixedSize', () => {
        const { rerender } = render(<DynamicTable head={head} rows={rows} />);
        expect(screen.getByRole('table')).not.toHaveClass('plus-dynamic-table-table--fixed');
        rerender(<DynamicTable head={head} rows={rows} isFixedSize />);
        expect(screen.getByRole('table')).toHaveClass('plus-dynamic-table-table--fixed');
    });

    it('lets the first column fill and the rest size to their content', () => {
        render(<DynamicTable head={head} rows={rows} />);
        const [first, second] = screen.getAllByRole('columnheader');
        expect(first).not.toHaveClass('plus-dynamic-table-col--fit');
        expect(second).toHaveClass('plus-dynamic-table-col--fit');
    });
});

describe('DynamicTable selection', () => {
    const selectAll = () => screen.getByRole('checkbox', { name: 'Select all rows' });

    it('adds a checkbox column with "Select row N" labels and a select-all head cell', () => {
        render(<DynamicTable head={head} rows={rows} isSelectable label="Students" />);
        expect(selectAll()).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Select row 5' })).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    });

    it('selects a row, marks it selected and reports the keys', () => {
        const onSelectionChange = vi.fn();
        render(<DynamicTable head={head} rows={rows} isSelectable onSelectionChange={onSelectionChange} />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
        expect(onSelectionChange).toHaveBeenLastCalledWith(['Ava Thompson']);
        expect(screen.getByText('Ava Thompson').closest('tr')).toHaveAttribute('aria-selected', 'true');
        expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');
    });

    it('select-all is checked when every row is selected, indeterminate when only some are, and toggles them all', () => {
        const onSelectionChange = vi.fn();
        render(<DynamicTable head={head} rows={rows} isSelectable onSelectionChange={onSelectionChange} />);
        fireEvent.click(selectAll());
        expect(onSelectionChange).toHaveBeenLastCalledWith(people.map(([name]) => name));
        expect(selectAll()).toBeChecked();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
        expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');
        fireEvent.click(selectAll());
        expect(selectAll()).toBeChecked();
        fireEvent.click(selectAll());
        expect(onSelectionChange).toHaveBeenLastCalledWith([]);
        expect(selectAll()).not.toBeChecked();
    });

    it('is controlled by selectedRowKeys', () => {
        render(<DynamicTable head={head} rows={rows} isSelectable selectedRowKeys={['Lena Park']} onSelectionChange={() => {}} />);
        expect(screen.getByRole('checkbox', { name: 'Select row 5' })).toBeChecked();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
        // Nothing moves until the page passes the new keys.
        expect(screen.getByRole('checkbox', { name: 'Select row 1' })).not.toBeChecked();
    });

    it('numbers rows across pages', () => {
        render(<DynamicTable head={head} rows={rows} isSelectable rowsPerPage={2} defaultPage={2} />);
        expect(screen.getByRole('checkbox', { name: 'Select row 3' })).toBeInTheDocument();
    });
});

describe('DynamicTable sticky header and frozen column', () => {
    it('pins the head row inside its own bounded scroll region', () => {
        const { container } = render(<DynamicTable head={head} rows={rows} stickyHeader maxHeight={200} />);
        expect(container.querySelector('.plus-pattern-table')).toHaveClass('plus-pattern-table--sticky-header');
        expect(container.querySelector('.plus-pattern-table-scroll')).toHaveStyle({ maxHeight: '200px' });
    });

    it('freezes the first column, and the title column beside the checkboxes when selectable', () => {
        const { container, rerender } = render(<DynamicTable head={head} rows={rows} isFrozen />);
        expect(container.querySelector('.plus-pattern-table')).toHaveClass('plus-pattern-table--sticky-column');
        expect(container.querySelector('.plus-dynamic-table')).not.toHaveClass('plus-dynamic-table--frozen-pair');
        rerender(<DynamicTable head={head} rows={rows} isFrozen isSelectable />);
        expect(container.querySelector('.plus-dynamic-table')).toHaveClass('plus-dynamic-table--frozen-pair');
    });
});
