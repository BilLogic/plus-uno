import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Table, StaticTable, TableRow, TableCell, TableMessageRow, TableSummaryRow, TableFooter } from '.';

const headers = ['Student', { text: 'Grade', align: 'text' }, { text: 'Sessions', align: 'number' }];
const rows = [
    ['Ava Thompson', 'Grade 7', 12],
    ['Marcus Lee', 'Grade 8', { content: 9, align: 'number' }],
];

const inBody = (...children) => render(<table><tbody>{children}</tbody></table>);

describe('Table sizes', () => {
    it.each([[32], [40], [48]])('emits the size class for %s', (size) => {
        render(<Table headers={headers} rows={rows} size={size} />);
        expect(screen.getByRole('table')).toHaveClass(`plus-table-${size}`);
    });

    it('defaults to the 40 row', () => {
        render(<Table headers={headers} rows={rows} />);
        expect(screen.getByRole('table')).toHaveClass('plus-table-40');
    });
});

describe('Table feel', () => {
    it('is plain, with no zebra, by default', () => {
        render(<Table headers={headers} rows={rows} />);
        const table = screen.getByRole('table');
        expect(table).not.toHaveClass('plus-table-striped');
        expect(table.closest('.plus-table-wrapper')).not.toHaveClass('plus-table-framed');
    });

    it('frames and draws vertical lines only when asked', () => {
        render(<Table headers={headers} rows={rows} frame="framed" verticalLines striped />);
        const table = screen.getByRole('table');
        expect(table.closest('.plus-table-wrapper')).toHaveClass('plus-table-framed');
        expect(table).toHaveClass('plus-table-vertical-lines', 'plus-table-striped');
    });

    it('emphasizes only the title column', () => {
        render(<Table headers={headers} rows={rows} titleColumn={0} />);
        const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
        expect(cells[0]).toHaveClass('plus-table-cell--title');
        expect(cells[1]).not.toHaveClass('plus-table-cell--title');
    });
});

describe('cell alignment', () => {
    it('maps text, number and icon, and the edge names', () => {
        inBody(
            <TableRow>
                <TableCell align="text">a</TableCell>
                <TableCell align="number">1</TableCell>
                <TableCell align="icon">i</TableCell>
                <TableCell align="right">2</TableCell>
            </TableRow>
        );
        const cells = within(screen.getByRole('row')).getAllByRole('cell');
        expect(cells[0]).toHaveClass('plus-table-cell--align-text');
        expect(cells[1]).toHaveClass('plus-table-cell--align-number');
        expect(cells[2]).toHaveClass('plus-table-cell--align-icon');
        expect(cells[3]).toHaveClass('plus-table-cell--align-number');
    });

    it('aligns header cells from the same names', () => {
        render(<Table headers={headers} rows={rows} />);
        expect(screen.getAllByRole('columnheader')[2]).toHaveClass('plus-table-cell--align-number');
    });
});

describe('cell content', () => {
    it('truncates by default and wraps on request', () => {
        inBody(<TableRow><TableCell>one</TableCell><TableCell overflow="wrap">two</TableCell></TableRow>);
        const [a, b] = screen.getAllByRole('cell');
        expect(a).toHaveClass('plus-table-cell--truncate');
        expect(b).toHaveClass('plus-table-cell--wrap');
    });

    it('renders a secondary line and an elemBefore slot', () => {
        inBody(<TableRow><TableCell secondary="Grade 7" elemBefore={<i data-testid="lead" />}>Ava</TableCell></TableRow>);
        const cell = screen.getByRole('cell');
        expect(cell).toHaveClass('plus-table-cell--lines-2');
        expect(within(cell).getByText('Grade 7')).toBeInTheDocument();
        expect(within(cell).getByTestId('lead')).toBeInTheDocument();
    });

    it('marks an error cell and announces a loading cell as busy', () => {
        inBody(<TableRow><TableCell state="error">bad</TableCell><TableCell loading>x</TableCell></TableRow>);
        const [a, b] = screen.getAllByRole('cell');
        expect(a).toHaveClass('plus-table-cell--error');
        expect(b).toHaveAttribute('aria-busy', 'true');
    });

    it('keeps a long name in the DOM for the tooltip to read', () => {
        const long = 'A very long student name that will not fit its column';
        render(<Table headers={['Name']} rows={[[long]]} />);
        expect(screen.getByText(long)).toBeInTheDocument();
    });
});

describe('TableRow states', () => {
    it.each([['highlighted'], ['selected'], ['disabled']])('%s', (state) => {
        inBody(<TableRow state={state}><TableCell>x</TableCell></TableRow>);
        const row = screen.getByRole('row');
        expect(row).toHaveClass(`plus-table-row--${state}`);
        if (state === 'selected') expect(row).toHaveAttribute('aria-selected', 'true');
        if (state === 'disabled') expect(row).toHaveAttribute('aria-disabled', 'true');
    });

    it('draws the divider unless it is turned off', () => {
        inBody(<TableRow divider={false}><TableCell>x</TableCell></TableRow>);
        expect(screen.getByRole('row')).toHaveClass('plus-table-row--no-divider');
    });

    it('Table maps rowStates onto rows', () => {
        render(<Table headers={headers} rows={rows} rowStates={[undefined, 'highlighted']} />);
        expect(screen.getAllByRole('row')[2]).toHaveClass('plus-table-row--highlighted');
    });
});

describe('Table props', () => {
    it('onRowClick fires with the row index', () => {
        const onRowClick = vi.fn();
        render(<Table headers={headers} rows={rows} onRowClick={onRowClick} />);
        fireEvent.click(screen.getByText('Marcus Lee'));
        expect(onRowClick).toHaveBeenCalledWith(1);
    });

    it('renders an empty message row spanning every column', () => {
        render(<Table headers={headers} rows={[]} emptyState="No students yet" />);
        expect(screen.getByText('No students yet').closest('td')).toHaveAttribute('colspan', '3');
    });

    it('renders a summary row in a tfoot with one calculation per column', () => {
        render(<Table headers={headers} rows={rows} summary={['Count 2', '–', 'Sum 21']} />);
        const foot = screen.getByText('Sum 21').closest('tfoot');
        expect(foot).not.toBeNull();
        expect(within(foot).getAllByRole('cell')).toHaveLength(3);
    });

    it('renders the footer slot after the table', () => {
        render(<Table headers={headers} rows={rows} footer={<TableFooter range="1–2 of 2" />} />);
        expect(screen.getByText('1–2 of 2')).toBeInTheDocument();
    });
});

describe('parts', () => {
    it('TableMessageRow types set the busy flag and the error class', () => {
        inBody(
            <TableMessageRow type="loading" colSpan={2}>Loading students</TableMessageRow>,
            <TableMessageRow type="error" colSpan={2}>Could not load</TableMessageRow>
        );
        expect(screen.getByText('Loading students').closest('tr')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Could not load').closest('tr')).toHaveClass('plus-table-message-row--error');
    });

    it('TableSummaryRow takes one calculation per column', () => {
        render(<table><tfoot><TableSummaryRow cells={['a', 'b']} /></tfoot></table>);
        expect(screen.getByText('a').closest('tr')).toHaveClass('plus-table-summary-row');
    });

    it('TableFooter compact and full', () => {
        const { rerender } = render(<TableFooter range="1–10 of 40" type="compact" />);
        expect(screen.getByText('1–10 of 40').closest('.plus-table-footer')).toHaveClass('plus-table-footer--compact');
        rerender(<TableFooter range="1–10 of 40" />);
        expect(screen.getByText('1–10 of 40').closest('.plus-table-footer')).toHaveClass('plus-table-footer--full');
    });
});

describe('StaticTable', () => {
    it('is a Table with no hover, since nothing in it acts', () => {
        render(<StaticTable headers={headers} rows={rows} />);
        expect(screen.getByRole('table')).not.toHaveClass('plus-table-hover');
    });

    it('lets rows be highlighted', () => {
        render(<StaticTable headers={headers} rows={rows} rowStates={['highlighted']} />);
        expect(screen.getAllByRole('row')[1]).toHaveClass('plus-table-row--highlighted');
    });
});
