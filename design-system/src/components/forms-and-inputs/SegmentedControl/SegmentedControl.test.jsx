import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

const OPTIONS = [
    { value: 'table', label: 'Table', icon: 'table-list' },
    { value: 'cards', label: 'Cards', icon: 'grip' },
    { value: 'list', label: 'List' },
];
const pressed = (name) => screen.getByRole('button', { name }).getAttribute('aria-pressed');

describe('SegmentedControl', () => {
    it('is a named group of toggle buttons, one pressed: not a radiogroup or a tablist', () => {
        render(<SegmentedControl label="Format" options={OPTIONS} />);
        expect(screen.getByRole('group', { name: 'Format' })).toBeInTheDocument();
        expect(screen.queryByRole('radiogroup')).toBeNull();
        expect(screen.queryByRole('tablist')).toBeNull();
        expect(pressed('Table')).toBe('true');
        expect(pressed('Cards')).toBe('false');
    });

    it('starts from defaultValue and switches on click, reporting the value', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SegmentedControl label="Format" options={OPTIONS} defaultValue="cards" onChange={onChange} />);
        expect(pressed('Cards')).toBe('true');
        await user.click(screen.getByRole('button', { name: 'List' }));
        expect(pressed('List')).toBe('true');
        expect(pressed('Cards')).toBe('false');
        expect(onChange).toHaveBeenCalledWith('list');
    });

    it('never empties: pressing the selected segment keeps it and reports nothing', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SegmentedControl label="Format" options={OPTIONS} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Table' }));
        expect(pressed('Table')).toBe('true');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('is controlled by value', async () => {
        const user = userEvent.setup();
        const Host = () => {
            const [value, setValue] = useState('table');
            return <SegmentedControl label="Format" options={OPTIONS} value={value} onChange={setValue} />;
        };
        render(<Host />);
        await user.click(screen.getByRole('button', { name: 'Cards' }));
        expect(pressed('Cards')).toBe('true');
    });

    it('stays on its value until the host changes it', async () => {
        const user = userEvent.setup();
        render(<SegmentedControl label="Fixed" options={OPTIONS} value="list" onChange={() => {}} />);
        await user.click(screen.getByRole('button', { name: 'Table' }));
        expect(pressed('List')).toBe('true');
    });

    it('moves focus with the arrow keys and selects with Enter', async () => {
        const user = userEvent.setup();
        render(<SegmentedControl label="Format" options={OPTIONS} />);
        await user.tab();
        expect(screen.getByRole('button', { name: 'Table' })).toHaveFocus();
        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('button', { name: 'Cards' })).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(pressed('Cards')).toBe('true');
    });

    it('names an icon-only segment by its label, with no drawn text', () => {
        render(<SegmentedControl label="Format" options={OPTIONS.map((o) => ({ ...o, icon: o.icon ?? 'list', isIconOnly: true }))} />);
        const button = screen.getByRole('button', { name: 'Cards' });
        expect(button.querySelector('.plus-segmented-control__text')).toBeNull();
        expect(button.querySelector('.plus-segmented-control__icon')).not.toBeNull();
    });

    it('ignores input while disabled', async () => {
        const user = userEvent.setup();
        render(<SegmentedControl label="Format" options={OPTIONS} isDisabled />);
        await user.click(screen.getByRole('button', { name: 'Cards' }));
        expect(pressed('Table')).toBe('true');
    });

    it('fits its container on request', () => {
        render(<SegmentedControl label="Format" options={OPTIONS} shouldFitContainer />);
        expect(screen.getByRole('group')).toHaveClass('plus-segmented-control--fit-container');
    });
});
