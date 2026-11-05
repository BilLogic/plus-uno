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

const Harness = ({ initial, isMulti = false }) => {
    const [value, setValue] = useState(initial);
    return (
        <TreeSelect id="ts" label="Subject" options={SUBJECTS} value={value} onChange={setValue} isMulti={isMulti} />
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
        render(<Harness initial={['algebra']} isMulti />);
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

    it('draws the error border and announces errorMessage when isInvalid', () => {
        render(
            <TreeSelect id="ts2" label="Subject" options={SUBJECTS} isInvalid errorMessage="Pick a subject" />
        );
        const trigger = screen.getByRole('combobox', { name: 'Subject' });
        expect(trigger.closest('.plus-field')).toHaveClass('plus-field--invalid');
        expect(screen.getByRole('alert')).toHaveTextContent('Pick a subject');
    });

    it('draws rows at 32 with spacing="compact"', async () => {
        const user = userEvent.setup();
        render(<TreeSelect id="ts3" label="Subject" options={SUBJECTS} spacing="compact" />);
        const tree = await open(user);
        expect(within(tree).getAllByRole('treeitem')[0]).toHaveClass('plus-option-row--compact');
    });

    // ADR-037 exception: Base UI ships no tree, so TreeSelect keeps its own
    // keyboard handler. These tests are what holds it.
    describe('keyboard', () => {
        const active = (trigger) => document.getElementById(trigger.getAttribute('aria-activedescendant'))
            ?? document.activeElement;
        const activeName = (trigger) => active(trigger)?.textContent;

        it('opens on ArrowDown and walks the visible rows with Up, Down, Home and End', async () => {
            const user = userEvent.setup();
            render(<Harness initial="" />);
            const trigger = screen.getByRole('combobox', { name: 'Subject' });
            trigger.focus();
            await user.keyboard('{ArrowDown}');
            expect(screen.getByRole('tree')).toBeInTheDocument();
            await user.keyboard('{ArrowDown}');
            expect(activeName(trigger)).toBe('Science');
            await user.keyboard('{Home}');
            expect(activeName(trigger)).toBe('Mathematics');
            await user.keyboard('{End}');
            expect(activeName(trigger)).toBe('Science');
            await user.keyboard('{ArrowUp}');
            expect(activeName(trigger)).toBe('Mathematics');
        });

        it('ArrowRight opens a branch then steps in; ArrowLeft closes it then steps out', async () => {
            const user = userEvent.setup();
            render(<Harness initial="" />);
            const trigger = screen.getByRole('combobox', { name: 'Subject' });
            await user.click(trigger);
            const branch = screen.getByRole('treeitem', { name: /Mathematics/ });
            branch.focus();
            await user.keyboard('{ArrowRight}');
            expect(branch).toHaveAttribute('aria-expanded', 'true');
            await user.keyboard('{ArrowRight}');
            expect(activeName(trigger)).toBe('Algebra');
            await user.keyboard('{ArrowLeft}');
            expect(activeName(trigger)).toBe('Mathematics');
            await user.keyboard('{ArrowLeft}');
            expect(branch).toHaveAttribute('aria-expanded', 'false');
        });

        it('Enter picks the row, and Escape closes and returns focus to the field', async () => {
            const user = userEvent.setup();
            render(<Harness initial="" />);
            const trigger = screen.getByRole('combobox', { name: 'Subject' });
            await user.click(trigger);
            screen.getByRole('treeitem', { name: /Science/ }).focus();
            await user.keyboard('{Enter}');
            expect(trigger).toHaveValue('Science');
            await user.click(trigger);
            await user.keyboard('{Escape}');
            expect(screen.queryByRole('tree')).toBeNull();
            expect(trigger).toHaveFocus();
        });
    });
});
