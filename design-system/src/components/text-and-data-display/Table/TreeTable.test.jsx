import React from 'react';
import { act, render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TreeTable } from '.';

const head = {
    cells: [
        { key: 'name', content: 'Name' },
        { key: 'type', content: 'Type' },
        { key: 'sessions', content: 'Sessions', align: 'number' },
    ],
};

const student = (id, name, sessions) => ({ id, cells: [{ content: name }, { content: 'Student' }, { content: String(sessions) }] });

const items = [
    {
        id: 'lincoln',
        cells: [{ content: 'Lincoln Middle' }, { content: 'School' }, { content: '54' }],
        count: 2,
        children: [
            {
                id: 'g7',
                cells: [{ content: 'Grade 7 · Math' }, { content: 'Class' }, { content: '27' }],
                children: [student('ava', 'Ava Thompson', 12), student('sofia', 'Sofia Ramirez', 15)],
            },
            { id: 'g8', cells: [{ content: 'Grade 8 · Math' }, { content: 'Class' }, { content: '19' }], children: [] },
        ],
    },
    { id: 'roosevelt', cells: [{ content: 'Roosevelt K-8' }, { content: 'School' }, { content: '31' }], hasChildren: true },
];

const row = (name) => screen.getByText(name).closest('tr');
const names = () => within(screen.getByRole('treegrid'))
    .getAllByRole('row')
    .filter((r) => r.hasAttribute('aria-level'))
    .map((r) => within(r).getAllByRole('gridcell')[0].querySelector('.plus-table-cell-text').firstChild.textContent);

describe('TreeTable', () => {
    it('is a treegrid of top-level rows, collapsed by default', () => {
        render(<TreeTable head={head} items={items} label="Schools" />);
        expect(screen.getByRole('treegrid', { name: 'Schools' })).toBeInTheDocument();
        expect(names()).toEqual(['Lincoln Middle', 'Roosevelt K-8']);
        expect(row('Lincoln Middle')).toHaveAttribute('aria-level', '1');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'false');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-posinset', '1');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-setsize', '2');
    });

    it('expands and collapses from the chevron, and levels follow depth', () => {
        render(<TreeTable head={head} items={items} defaultExpandedIds={['lincoln']} />);
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'true');
        expect(row('Grade 7 · Math')).toHaveAttribute('aria-level', '2');
        fireEvent.click(row('Grade 7 · Math').querySelector('.plus-tree-table-toggle'));
        expect(row('Ava Thompson')).toHaveAttribute('aria-level', '3');
        expect(row('Ava Thompson')).not.toHaveAttribute('aria-expanded');
        fireEvent.click(row('Lincoln Middle').querySelector('.plus-tree-table-toggle'));
        expect(names()).toEqual(['Lincoln Middle', 'Roosevelt K-8']);
    });

    it('indents each level by one step', () => {
        render(<TreeTable head={head} items={items} defaultExpandedIds={['lincoln', 'g7']} />);
        const indent = (name) => row(name).querySelector('.plus-tree-table-indent').style.getPropertyValue('--plus-tree-table-level');
        expect(indent('Lincoln Middle')).toBe('0');
        expect(indent('Grade 7 · Math')).toBe('1');
        expect(indent('Ava Thompson')).toBe('2');
    });

    it('shows the count beside a parent', () => {
        render(<TreeTable head={head} items={items} />);
        expect(within(row('Lincoln Middle')).getByText('2')).toHaveClass('plus-tree-table-count');
    });

    it('shows a message row under an expanded parent with no children', () => {
        render(<TreeTable head={head} items={items} defaultExpandedIds={['lincoln', 'g8']} />);
        const message = screen.getByText('Nothing in here yet').closest('tr');
        expect(message.previousElementSibling).toBe(row('Grade 8 · Math'));
    });

    it('loads children on expand, with a loading message row until they arrive', async () => {
        let resolve;
        const loadChildren = vi.fn(() => new Promise((r) => { resolve = r; }));
        render(<TreeTable head={head} items={items} loadChildren={loadChildren} />);
        fireEvent.click(row('Roosevelt K-8').querySelector('.plus-tree-table-toggle'));
        expect(loadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'roosevelt' }));
        expect(row('Roosevelt K-8')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Loading', { ignore: '[aria-hidden="true"] *' })).toBeInTheDocument();
        await act(async () => resolve([student('liam', 'Liam Brooks', 6)]));
        await waitFor(() => expect(row('Liam Brooks')).toHaveAttribute('aria-level', '2'));
        expect(screen.queryByText('Loading', { ignore: '[aria-hidden="true"] *' })).toBeNull();
    });

    it('expands on a row press only with shouldExpandOnClick, and never from a control in the row', () => {
        const withButton = [{ ...items[0], cells: [items[0].cells[0], { content: <button type="button">Open</button> }, items[0].cells[2]] }, items[1]];
        const { rerender } = render(<TreeTable head={head} items={withButton} />);
        fireEvent.click(row('Lincoln Middle'));
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'false');
        rerender(<TreeTable head={head} items={withButton} shouldExpandOnClick />);
        fireEvent.click(screen.getByRole('button', { name: 'Open' }));
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(row('Lincoln Middle'));
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'true');
    });

    it('reports expansion and can be controlled', () => {
        const onExpandedChange = vi.fn();
        render(<TreeTable head={head} items={items} expandedIds={[]} onExpandedChange={onExpandedChange} />);
        fireEvent.click(row('Lincoln Middle').querySelector('.plus-tree-table-toggle'));
        expect(onExpandedChange).toHaveBeenCalledWith(['lincoln']);
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('TreeTable keyboard (treegrid row focus)', () => {
    const press = (key) => fireEvent.keyDown(document.activeElement, { key });

    it('has one tab stop, the first row', () => {
        render(<TreeTable head={head} items={items} />);
        expect(row('Lincoln Middle')).toHaveAttribute('tabindex', '0');
        expect(row('Roosevelt K-8')).toHaveAttribute('tabindex', '-1');
    });

    it('moves with Down, Up, Home and End', () => {
        render(<TreeTable head={head} items={items} defaultExpandedIds={['lincoln']} />);
        row('Lincoln Middle').focus();
        press('ArrowDown');
        expect(row('Grade 7 · Math')).toHaveFocus();
        expect(row('Grade 7 · Math')).toHaveAttribute('tabindex', '0');
        press('End');
        expect(row('Roosevelt K-8')).toHaveFocus();
        press('ArrowUp');
        expect(row('Grade 8 · Math')).toHaveFocus();
        press('Home');
        expect(row('Lincoln Middle')).toHaveFocus();
    });

    it('Right expands a closed parent, then moves to its first child; Left collapses, then moves to the parent', () => {
        render(<TreeTable head={head} items={items} />);
        row('Lincoln Middle').focus();
        press('ArrowRight');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'true');
        expect(row('Lincoln Middle')).toHaveFocus();
        press('ArrowRight');
        expect(row('Grade 7 · Math')).toHaveFocus();
        press('ArrowLeft');
        expect(row('Lincoln Middle')).toHaveFocus();
        press('ArrowLeft');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'false');
    });

    it('Enter toggles a parent', () => {
        render(<TreeTable head={head} items={items} />);
        row('Lincoln Middle').focus();
        press('Enter');
        expect(row('Lincoln Middle')).toHaveAttribute('aria-expanded', 'true');
    });
});
