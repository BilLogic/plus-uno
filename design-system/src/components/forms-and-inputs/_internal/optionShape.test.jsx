import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterMenu, PopupSelect } from '@/components';
import {
    normalizeOption,
    getOptionValue,
    getOptionLabel,
    getOptionText,
    getOptionChildren,
    isOptionDisabled,
} from './optionShape';

describe('optionShape', () => {
    it('normalizes string and numeric primitive options including 0 and empty string', () => {
        expect(normalizeOption('Upcoming', 2)).toEqual({
            value: 'Upcoming',
            label: 'Upcoming',
            text: 'Upcoming',
            disabled: false,
            children: [],
            index: 2,
            source: 'Upcoming',
        });

        expect(normalizeOption(0, 0)).toEqual({
            value: 0,
            label: 0,
            text: '0',
            disabled: false,
            children: [],
            index: 0,
            source: 0,
        });

        expect(normalizeOption('', 1)).toEqual({
            value: '',
            label: '',
            text: '',
            disabled: false,
            children: [],
            index: 1,
            source: '',
        });
    });

    it('preserves falsy value: 0 and value: "" on object options via nullish coalescing', () => {
        const zeroOpt = { value: 0, label: 'Zero' };
        expect(normalizeOption(zeroOpt, 0)).toMatchObject({
            value: 0,
            label: 'Zero',
            text: 'Zero',
            disabled: false,
            children: [],
            index: 0,
            source: zeroOpt,
        });
        expect(getOptionValue(zeroOpt)).toBe(0);
        expect(getOptionLabel(zeroOpt)).toBe('Zero');
        expect(getOptionText(zeroOpt)).toBe('Zero');

        const emptyOpt = { value: '', label: 'All' };
        expect(normalizeOption(emptyOpt)).toMatchObject({
            value: '',
            label: 'All',
            text: 'All',
        });
        expect(getOptionValue(emptyOpt)).toBe('');
    });

    it('falls back across value ?? label ?? text and keeps string text when label is a ReactNode', () => {
        const nodeLabel = <span>Formatted</span>;
        const withNodeAndText = { value: 'fmt', label: nodeLabel, text: 'Formatted plain' };
        expect(normalizeOption(withNodeAndText)).toMatchObject({
            value: 'fmt',
            label: nodeLabel,
            text: 'Formatted plain',
        });

        const withNodeOnly = { value: 'fmt', label: nodeLabel };
        expect(normalizeOption(withNodeOnly)).toMatchObject({
            value: 'fmt',
            label: nodeLabel,
            text: 'fmt',
        });

        const textOnly = { text: 'Legacy text' };
        expect(normalizeOption(textOnly)).toMatchObject({
            value: 'Legacy text',
            label: 'Legacy text',
            text: 'Legacy text',
        });

        const valueOnlyZero = { value: 0 };
        expect(normalizeOption(valueOnlyZero)).toMatchObject({
            value: 0,
            label: '0',
            text: '0',
        });
    });

    it('normalizes disabled, children, and listbox row metadata', () => {
        const child = { value: 'c', label: 'Child' };
        const parent = {
            value: 'p',
            label: 'Parent',
            disabled: true,
            children: [child],
            description: 'Desc',
            group: 'Group A',
        };
        expect(normalizeOption(parent, 3)).toMatchObject({
            value: 'p',
            label: 'Parent',
            text: 'Parent',
            disabled: true,
            children: [child],
            description: 'Desc',
            group: 'Group A',
            index: 3,
            source: parent,
        });
        expect(getOptionChildren(parent)).toEqual([child]);
        expect(getOptionChildren('leaf')).toEqual([]);
        expect(isOptionDisabled(parent)).toBe(true);
        expect(isOptionDisabled('leaf')).toBe(false);
    });

    it('supports numeric 0 options and controlled/uncontrolled open state in PopupSelect', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const onChange = vi.fn();
        render(
            <PopupSelect
                label="Priority"
                options={[
                    { value: 0, label: 'None' },
                    { value: 1, label: 'High' },
                ]}
                defaultValue={0}
                onChange={onChange}
                onOpenChange={onOpenChange}
                isSearchable={false}
            />
        );

        const trigger = screen.getByRole('button', { name: 'Priority: None' });
        await user.click(trigger);
        expect(onOpenChange).toHaveBeenLastCalledWith(true);

        const listbox = await screen.findByRole('listbox', { name: 'Priority' });
        await user.click(within(listbox).getByRole('option', { name: 'High' }));
        expect(onChange).toHaveBeenCalledWith(1, { value: 1, label: 'High' });
        expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('resets FilterMenu draft to applied values when reopened via useOpenState', async () => {
        const user = userEvent.setup();
        const onApply = vi.fn();
        render(
            <FilterMenu
                categories={[
                    {
                        id: 'tier',
                        label: 'Tier',
                        options: [
                            { value: 0, label: 'Tier 0' },
                            { value: 1, label: 'Tier 1', disabled: true },
                        ],
                    },
                ]}
                defaultValue={{ tier: [0] }}
                onApply={onApply}
            />
        );

        const trigger = screen.getByRole('button', { name: /Filters/ });
        await user.click(trigger);
        const tier0 = await screen.findByRole('checkbox', { name: 'Tier 0' });
        const tier1 = screen.getByRole('checkbox', { name: 'Tier 1' });
        expect(tier0).toBeChecked();
        expect(tier1).toHaveAttribute('aria-disabled', 'true');

        // Untick without applying, then close with Escape: next open resets draft to applied.
        await user.click(tier0);
        expect(tier0).not.toBeChecked();
        await user.keyboard('{Escape}');

        await user.click(trigger);
        expect(await screen.findByRole('checkbox', { name: 'Tier 0' })).toBeChecked();
        await user.keyboard('{Escape}');
    });
});
