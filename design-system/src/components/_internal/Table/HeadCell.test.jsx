import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeadCell } from '.';

const inHead = (cell) => render(<table><thead><tr>{cell}</tr></thead></table>);

describe('HeadCell', () => {
    it('is a column header with its label', () => {
        inHead(<HeadCell label="Student" />);
        const th = screen.getByRole('columnheader', { name: 'Student' });
        expect(th).toHaveAttribute('scope', 'col');
        expect(th).toHaveClass('plus-table-head-cell');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('takes align and width', () => {
        inHead(<HeadCell label="Sessions" align="number" width="120px" />);
        const th = screen.getByRole('columnheader');
        expect(th).toHaveClass('plus-table-cell--align-number');
        expect(th).toHaveStyle({ width: '120px' });
    });

    it('truncates by default and wraps on request', () => {
        const { rerender } = inHead(<HeadCell label="Long label" />);
        expect(screen.getByRole('columnheader')).toHaveClass('plus-table-head-cell--truncate');
        rerender(<table><thead><tr><HeadCell label="Long label" shouldTruncate={false} /></tr></thead></table>);
        expect(screen.getByRole('columnheader')).not.toHaveClass('plus-table-head-cell--truncate');
    });

    it('draws the type icon, hidden from assistive technology', () => {
        inHead(<HeadCell label="Date" icon="fa-regular fa-calendar" />);
        const icon = document.querySelector('.plus-table-head-cell-type');
        expect(icon).toHaveClass('fa-regular', 'fa-calendar');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('keeps the label for screen readers when only the icon shows', () => {
        inHead(<HeadCell label="Flagged" icon="fa-solid fa-flag" isIconOnlyHeader />);
        expect(screen.getByRole('columnheader', { name: 'Flagged' })).toBeInTheDocument();
        expect(document.querySelector('.visually-hidden')).toHaveTextContent('Flagged');
        expect(document.querySelector('.plus-table-head-cell-label')).toBeNull();
    });
});

describe('HeadCell sorting', () => {
    it('is not sortable by default, so aria-sort is absent', () => {
        inHead(<HeadCell label="Student" />);
        expect(screen.getByRole('columnheader')).not.toHaveAttribute('aria-sort');
    });

    it.each(['none', 'ascending', 'descending'])('aria-sort matches sort=%s', (sort) => {
        inHead(<HeadCell label="Student" isSortable sort={sort} />);
        expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', sort);
    });

    it('puts a real button in the header', () => {
        inHead(<HeadCell label="Student" isSortable />);
        const button = screen.getByRole('button');
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(screen.getByRole('columnheader')).toContainElement(button);
    });

    it.each([
        ['none', 'fa-sort'],
        ['ascending', 'fa-sort-up'],
        ['descending', 'fa-sort-down'],
    ])('shows the %s glyph', (sort, glyph) => {
        inHead(<HeadCell label="Student" isSortable sort={sort} />);
        const icon = document.querySelector('.plus-table-head-cell-sort');
        expect(icon).toHaveClass('fa-solid', glyph);
        expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('says the sort state in text a screen reader reads', () => {
        inHead(<HeadCell label="Student" isSortable sort="ascending" />);
        expect(screen.getByRole('button', { name: /Student.*sorted ascending/i })).toBeInTheDocument();
    });

    it('asks for the next direction: ascending, descending, then none', () => {
        const onSort = vi.fn();
        const { rerender } = inHead(<HeadCell label="Student" isSortable sort="none" onSort={onSort} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onSort).toHaveBeenLastCalledWith('ascending');
        rerender(<table><thead><tr><HeadCell label="Student" isSortable sort="ascending" onSort={onSort} /></tr></thead></table>);
        fireEvent.click(screen.getByRole('button'));
        expect(onSort).toHaveBeenLastCalledWith('descending');
        rerender(<table><thead><tr><HeadCell label="Student" isSortable sort="descending" onSort={onSort} /></tr></thead></table>);
        fireEvent.click(screen.getByRole('button'));
        expect(onSort).toHaveBeenLastCalledWith('none');
    });

    it('marks the active sort so its arrow stays visible', () => {
        inHead(<HeadCell label="Student" isSortable sort="descending" />);
        expect(screen.getByRole('button')).toHaveClass('plus-table-head-cell-button--sorted');
    });
});
