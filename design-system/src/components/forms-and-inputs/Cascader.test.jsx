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

const Harness = ({ initial = [] }) => {
    const [path, setPath] = useState(initial);
    return (
        <>
            <label htmlFor="cc">Region</label>
            <Cascader id="cc" options={REGIONS} value={path} onChange={setPath} />
        </>
    );
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
        expect(scotland.querySelector('.plus-option-row-trailing .plus-option-row-chevron')).not.toBeNull();
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
});
