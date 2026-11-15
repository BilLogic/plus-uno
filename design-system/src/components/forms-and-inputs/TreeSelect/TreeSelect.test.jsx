import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import TreeSelect from './TreeSelect';

const SUBJECTS = [
    {
        label: 'Middle schools',
        value: 'middle-schools',
        children: [
            { label: 'Lincoln Middle', value: 'lincoln-middle' },
            { label: 'Roosevelt K-8', value: 'roosevelt-k8' },
        ],
    },
    { label: 'High schools', value: 'high-schools' },
];

const Harness = ({ initial, isMulti = false }) => {
    const [value, setValue] = useState(initial);
    return (
        <TreeSelect id="ts" label="Site" options={SUBJECTS} value={value} onChange={setValue} isMulti={isMulti} />
    );
};

const open = async (user) => {
    await user.click(screen.getByRole('combobox', { name: 'Site' }));
    return screen.getByRole('tree');
};

describe('TreeSelect', () => {
    it('draws its trigger in the shared field', () => {
        render(<Harness initial="" />);
        const trigger = screen.getByRole('combobox', { name: 'Site' });
        expect(trigger.closest('.plus-field')).not.toBeNull();
    });

    it('opens a flat list of option rows, each a treeitem', async () => {
        const user = userEvent.setup();
        render(<Harness initial="lincoln-middle" />);
        const tree = await open(user);

        const items = within(tree).getAllByRole('treeitem');
        expect(items.map((item) => item.textContent)).toEqual(['Middle schools', 'Lincoln Middle', 'Roosevelt K-8', 'High schools']);
        items.forEach((item) => {
            expect(item).toHaveClass('plus-option-row');
            // Flat: no treeitem nests inside another.
            expect(item.closest('[role="tree"]')).toBe(tree);
            expect(item.parentElement.closest('[role="treeitem"]')).toBeNull();
        });
        expect(items[1]).toHaveAttribute('aria-level', '2');
    });

    it('puts the indent, then the toggle, in the row\'s Leading slot', async () => {
        const user = userEvent.setup();
        render(<Harness initial="lincoln-middle" />);
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
        render(<Harness initial="high-schools" />);
        const tree = await open(user);
        const science = within(tree).getByRole('treeitem', { name: 'High schools' });
        expect(science).toHaveAttribute('aria-selected', 'true');
        expect(science).toHaveClass('is-selected');
    });

    it('draws a checkbox after the toggle, partly checked on a parent with some children picked', async () => {
        const user = userEvent.setup();
        render(<Harness initial={['lincoln-middle']} isMulti />);
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
        const maths = within(tree).getByRole('treeitem', { name: 'Middle schools' });
        await user.click(maths.querySelector('.plus-option-row-toggle'));
        expect(maths).toHaveAttribute('aria-expanded', 'true');
        expect(within(tree).getAllByRole('treeitem')).toHaveLength(4);
        expect(screen.getByRole('combobox', { name: 'Site' })).toHaveValue('');
    });

    it('draws the error border and announces errorMessage when isInvalid', () => {
        render(
            <TreeSelect id="ts2" label="Site" options={SUBJECTS} isInvalid errorMessage="Pick a site" />
        );
        const trigger = screen.getByRole('combobox', { name: 'Site' });
        expect(trigger.closest('.plus-field')).toHaveClass('plus-field--invalid');
        expect(screen.getByRole('alert')).toHaveTextContent('Pick a site');
    });

    it('draws rows at 32 with spacing="compact"', async () => {
        const user = userEvent.setup();
        render(<TreeSelect id="ts3" label="Site" options={SUBJECTS} spacing="compact" />);
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
            const trigger = screen.getByRole('combobox', { name: 'Site' });
            trigger.focus();
            await user.keyboard('{ArrowDown}');
            expect(screen.getByRole('tree')).toBeInTheDocument();
            await user.keyboard('{ArrowDown}');
            expect(activeName(trigger)).toBe('High schools');
            await user.keyboard('{Home}');
            expect(activeName(trigger)).toBe('Middle schools');
            await user.keyboard('{End}');
            expect(activeName(trigger)).toBe('High schools');
            await user.keyboard('{ArrowUp}');
            expect(activeName(trigger)).toBe('Middle schools');
        });

        it('ArrowRight opens a branch then steps in; ArrowLeft closes it then steps out', async () => {
            const user = userEvent.setup();
            render(<Harness initial="" />);
            const trigger = screen.getByRole('combobox', { name: 'Site' });
            await user.click(trigger);
            const branch = screen.getByRole('treeitem', { name: /Middle schools/ });
            branch.focus();
            await user.keyboard('{ArrowRight}');
            expect(branch).toHaveAttribute('aria-expanded', 'true');
            await user.keyboard('{ArrowRight}');
            expect(activeName(trigger)).toBe('Lincoln Middle');
            await user.keyboard('{ArrowLeft}');
            expect(activeName(trigger)).toBe('Middle schools');
            await user.keyboard('{ArrowLeft}');
            expect(branch).toHaveAttribute('aria-expanded', 'false');
        });

        it('Enter picks the row, and Escape closes and returns focus to the field', async () => {
            const user = userEvent.setup();
            render(<Harness initial="" />);
            const trigger = screen.getByRole('combobox', { name: 'Site' });
            await user.click(trigger);
            screen.getByRole('treeitem', { name: /High schools/ }).focus();
            await user.keyboard('{Enter}');
            expect(trigger).toHaveValue('High schools');
            await user.click(trigger);
            await user.keyboard('{Escape}');
            expect(screen.queryByRole('tree')).toBeNull();
            expect(trigger).toHaveFocus();
        });
    });
});
