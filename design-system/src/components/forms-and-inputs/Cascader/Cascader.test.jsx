import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Cascader from './Cascader';

const REGIONS = [
    {
        label: 'Scotland',
        value: 'scotland',
        children: [
            { label: 'Edinburgh', value: 'edinburgh' },
            { label: 'Glasgow', value: 'glasgow' },
        ],
    },
    { label: 'Wales', value: 'wales' },
];

const Harness = ({ initial = [], ...props }) => {
    const [path, setPath] = useState(initial);
    return <Cascader id="cc" label="Region" options={REGIONS} value={path} onChange={setPath} {...props} />;
};

describe('Cascader', () => {
    it('draws its trigger in the shared field', () => {
        render(<Harness />);
        const trigger = screen.getByRole('combobox', { name: 'Region' });
        expect(trigger.closest('.plus-field')).not.toBeNull();
    });

    it('opens columns of option rows, with a chevron in Trailing on a row that has children', async () => {
        const user = userEvent.setup();
        render(<Harness initial={['scotland', 'glasgow']} />);
        await user.click(screen.getByRole('combobox', { name: 'Region' }));

        const [first, second] = screen.getAllByRole('listbox');
        const [scotland, wales] = within(first).getAllByRole('option');
        expect(scotland).toHaveClass('plus-option-row');
        expect(scotland.querySelector('.plus-option-row-elem-after .plus-option-row-chevron')).not.toBeNull();
        expect(wales.querySelector('.plus-option-row-chevron')).toBeNull();

        // The path so far is selected in each column, without a trailing check.
        expect(scotland).toHaveAttribute('aria-selected', 'true');
        const glasgow = within(second).getByRole('option', { name: 'Glasgow' });
        expect(glasgow).toHaveClass('is-selected');
        expect(glasgow.querySelector('.plus-option-row-selected-mark')).toBeNull();
    });

    it('commits a leaf on click', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const trigger = screen.getByRole('combobox', { name: 'Region' });
        await user.click(trigger);
        await user.click(screen.getByRole('option', { name: 'Scotland' }));
        await user.click(screen.getByRole('option', { name: 'Edinburgh' }));
        expect(trigger).toHaveValue('Scotland / Edinburgh');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('draws the error border and announces errorMessage when isInvalid', () => {
        render(<Harness isInvalid errorMessage="Pick a region" />);
        const trigger = screen.getByRole('combobox', { name: 'Region' });
        expect(trigger.closest('.plus-field')).toHaveClass('plus-field--invalid');
        expect(screen.getByRole('alert')).toHaveTextContent('Pick a region');
    });

    it('draws rows at 32 with spacing="compact"', async () => {
        const user = userEvent.setup();
        render(<Harness spacing="compact" />);
        await user.click(screen.getByRole('combobox', { name: 'Region' }));
        expect(screen.getAllByRole('option')[0]).toHaveClass('plus-option-row--compact');
    });

    // ADR-037 exception: Base UI has no multi-column listbox, so the Cascader
    // keeps its own keyboard handler. These tests are what holds it.
    describe('keyboard', () => {
        const rows = () => screen.getAllByRole('option');
        const focusedName = () => document.activeElement?.textContent;

        it('opens on ArrowDown and walks a column with Up, Down, Home and End', async () => {
            const user = userEvent.setup();
            render(<Harness />);
            screen.getByRole('combobox', { name: 'Region' }).focus();
            await user.keyboard('{ArrowDown}');
            expect(screen.getAllByRole('listbox')).toHaveLength(1);
            rows()[0].focus();
            await user.keyboard('{ArrowDown}');
            expect(focusedName()).toContain('Wales');
            await user.keyboard('{ArrowUp}');
            expect(focusedName()).toContain('Scotland');
            await user.keyboard('{End}');
            expect(focusedName()).toContain('Wales');
            await user.keyboard('{Home}');
            expect(focusedName()).toContain('Scotland');
        });

        it('ArrowRight opens the next column and ArrowLeft steps back out', async () => {
            const user = userEvent.setup();
            render(<Harness />);
            await user.click(screen.getByRole('combobox', { name: 'Region' }));
            screen.getByRole('option', { name: 'Scotland' }).focus();
            await user.keyboard('{ArrowRight}');
            expect(screen.getAllByRole('listbox')).toHaveLength(2);
            expect(focusedName()).toContain('Edinburgh');
            await user.keyboard('{ArrowLeft}');
            expect(focusedName()).toContain('Scotland');
        });

        it('Enter on a leaf commits the path, closes and returns focus to the field', async () => {
            const user = userEvent.setup();
            render(<Harness />);
            const trigger = screen.getByRole('combobox', { name: 'Region' });
            await user.click(trigger);
            screen.getByRole('option', { name: 'Scotland' }).focus();
            await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');
            expect(trigger).toHaveValue('Scotland / Glasgow');
            expect(screen.queryByRole('listbox')).toBeNull();
            expect(trigger).toHaveFocus();
        });

        it('Escape closes and returns focus to the field', async () => {
            const user = userEvent.setup();
            render(<Harness />);
            const trigger = screen.getByRole('combobox', { name: 'Region' });
            await user.click(trigger);
            screen.getByRole('option', { name: 'Scotland' }).focus();
            await user.keyboard('{Escape}');
            expect(screen.queryByRole('listbox')).toBeNull();
            expect(trigger).toHaveFocus();
        });
    });
});
