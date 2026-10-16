/**
 * SortingDropdown - Training Onboarding Element
 *
 * Sort for the onboarding modules: what to sort by, and in which order.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121969
 */

import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import SortingDropdown from './SortingDropdown';

export default {
    title: 'Specs/Training/Onboarding/Elements/Sorting Dropdown',
    component: SortingDropdown,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Sort for the onboarding modules: two single Selects, Sort by (Name, Duration, Progress) and Order. The orders on offer follow the sort, and neither field can be cleared.'
            }
        }
    },
    argTypes: {
        sortBy: {
            control: { type: 'select' },
            options: ['name', 'duration', 'progress'],
            description: 'Sort by id',
            table: { category: 'Content' }
        },
        sortOrder: {
            control: 'text',
            description: 'Order id, one of the sort\'s orders',
            table: { category: 'Content' }
        },
        onChange: {
            action: 'changed',
            table: { category: 'Events' }
        }
    }
};

/**
 * Overview
 * Each sort with its first order
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <SortingDropdown sortBy="name" sortOrder="az" />
            <SortingDropdown sortBy="duration" sortOrder="shortest-first" />
            <SortingDropdown sortBy="progress" sortOrder="completed-first" />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [sort, setSort] = useState({ sortBy: args.sortBy, sortOrder: args.sortOrder });

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)', minHeight: '320px' }}>
                <p className="body2-txt" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>
                    Sorted by: <strong data-testid="applied">{`${sort.sortBy} ${sort.sortOrder}`}</strong>
                </p>
                <SortingDropdown
                    sortBy={sort.sortBy}
                    sortOrder={sort.sortOrder}
                    onChange={(next) => {
                        setSort(next);
                        if (args.onChange) args.onChange(next);
                    }}
                />
            </div>
        );
    },
    args: {
        sortBy: 'name',
        sortOrder: 'az'
    }
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const applied = canvas.getByTestId('applied');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Sort by' }));
    await userEvent.click(await page.findByRole('option', { name: 'Duration' }));
    await expect(applied).toHaveTextContent('duration shortest-first');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Order' }));
    await userEvent.click(await page.findByRole('option', { name: 'Longest First' }));
    await expect(applied).toHaveTextContent('duration longest-first');
    await expect(canvas.queryByRole('button', { name: /^Clear/ })).toBeNull();
};
