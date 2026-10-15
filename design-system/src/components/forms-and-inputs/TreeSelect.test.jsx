import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import TreeSelect from './TreeSelect';

const SUBJECTS = [
    {
        label: 'Mathematics',
        value: 'maths',
        children: [
            { label: 'Algebra', value: 'algebra' },
            { label: 'Geometry', value: 'geometry' },
        ],
    },
    { label: 'Science', value: 'science' },
];

const Harness = ({ initial, multiple = false }) => {
    const [value, setValue] = useState(initial);
    return (
        <>
            <label htmlFor="ts">Subject</label>
            <TreeSelect id="ts" options={SUBJECTS} value={value} onChange={setValue} multiple={multiple} />
        </>
    );
};

const open = async (user) => {
    await user.click(screen.getByRole('combobox', { name: 'Subject' }));
    return screen.getByRole('tree');
};

describe('TreeSelect', () => {
    it('draws its trigger in the shared field', () => {
        render(<Harness initial="" />);
        const trigger = screen.getByRole('combobox', { name: 'Subject' });
        expect(trigger.closest('.plus-field')).not.toBeNull();
    });

    it('opens a flat list of option rows, each a treeitem', async () => {
        const user = userEvent.setup();
        render(<Harness initial="algebra" />);
        const tree = await open(user);

        const items = within(tree).getAllByRole('treeitem');
        expect(items.map((item) => item.textContent)).toEqual(['Mathematics', 'Algebra', 'Geometry', 'Science']);
        items.forEach((item) => {
            expect(item).toHaveClass('plus-option-row');
            // Flat: no treeitem nests inside another.
            expect(item.parentElement).toBe(items[0].parentElement);
        });
        expect(items[1]).toHaveAttribute('aria-level', '2');
    });

    it('puts the indent, then the toggle, in the row\'s Leading slot', async () => {
        const user = userEvent.setup();
        render(<Harness initial="algebra" />);
        const tree = await open(user);
        const [maths, algebra] = within(tree).getAllByRole('treeitem');

        const mathsLeading = maths.querySelector('.plus-option-row-leading').children;
        expect(mathsLeading[0]).toHaveClass('plus-option-row-indent');
        expect(mathsLeading[0].style.getPropertyValue('--plus-option-row-level')).toBe('0');
        expect(mathsLeading[1]).toHaveClass('plus-option-row-toggle--expanded');

        const algebraLeading = algebra.querySelector('.plus-option-row-leading').children;
        expect(algebraLeading[0].style.getPropertyValue('--plus-option-row-level')).toBe('1');
        expect(algebraLeading[1]).toHaveClass('plus-option-row-toggle--leaf');
    });

    it('marks the chosen node selected in single mode', async () => {
        const user = userEvent.setup();
        render(<Harness initial="science" />);
        const tree = await open(user);
        const science = within(tree).getByRole('treeitem', { name: 'Science' });
        expect(science).toHaveAttribute('aria-selected', 'true');
        expect(science).toHaveClass('is-selected');
    });

    it('draws a checkbox after the toggle, partly checked on a parent with some children picked', async () => {
        const user = userEvent.setup();
        render(<Harness initial={['algebra']} multiple />);
        const tree = await open(user);
        const [maths, algebra] = within(tree).getAllByRole('treeitem');

        const mathsLeading = maths.querySelector('.plus-option-row-leading').children;
        expect(mathsLeading[2]).toHaveClass('plus-option-row-check--checkbox', 'is-indeterminate');
        expect(algebra.querySelector('.plus-option-row-check')).toHaveClass('is-checked');
        // A multi-select row shows the checkbox, not the trailing check.
        expect(algebra.querySelector('.plus-option-row-selected-mark')).toBeNull();
        // No real input inside a treeitem.
        expect(tree.querySelector('input')).toBeNull();
    });

    it('expands with the toggle without choosing the row', async () => {
        const user = userEvent.setup();
        render(<Harness initial="" />);
        const tree = await open(user);
        const maths = within(tree).getByRole('treeitem', { name: 'Mathematics' });
        await user.click(maths.querySelector('.plus-option-row-toggle'));
        expect(maths).toHaveAttribute('aria-expanded', 'true');
        expect(within(tree).getAllByRole('treeitem')).toHaveLength(4);
        expect(screen.getByRole('combobox', { name: 'Subject' })).toHaveValue('');
    });
});
