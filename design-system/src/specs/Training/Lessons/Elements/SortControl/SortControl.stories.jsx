/**
 * SortControl Stories
 *
 * Sort control: what to sort by, and in which order.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=747-54853
 */

import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import SortControl from './SortControl';

export default {
    title: 'Specs/Training/Lessons/Elements/Sort Control',
    component: SortControl,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Sort control: two single Selects, Sort by (Name, SMART Competency, Status, Competency Areas) and Order. The orders on offer follow the sort.',
            },
        },
    },
    argTypes: {
        sortBy: {
            control: { type: 'select' },
            options: ['name', 'smart-competency', 'status', 'competency-areas'],
            description: 'Current sort by id'
        },
        sortOrder: {
            control: { type: 'text' },
            description: 'Current order id'
        }
    }
};

/**
 * Default
 * Default sort control
 */
export const Default = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <SortControl />
        </div>
    )
};

/**
 * Interactive
 * Interactive sort control with change handler
 */
export const Interactive = {
    render: (args) => {
        const [sortState, setSortState] = useState({
            sortBy: args.sortBy || 'name',
            sortOrder: args.sortOrder || 'az'
        });

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)', minHeight: '320px' }}>
                <p className="body2-txt" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>
                    Sorted by: <strong data-testid="applied">{`${sortState.sortBy} ${sortState.sortOrder}`}</strong>
                </p>
                <SortControl
                    sortBy={sortState.sortBy}
                    sortOrder={sortState.sortOrder}
                    onChange={setSortState}
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
    await userEvent.click(await page.findByRole('option', { name: 'Status' }));
    await expect(applied).toHaveTextContent('status least-progress');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Order' }));
    await userEvent.click(await page.findByRole('option', { name: 'Most Progress First' }));
    await expect(applied).toHaveTextContent('status most-progress');
};
