import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Select } from '@/components';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Sorting Options',
    component: Select,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Sorting Options: two single Selects, what to sort by and in which order. The orders on offer follow the sort.'
            }
        }
    },
};

// Data structure for the sorting logic
const SORT_CONFIG = {
    name: {
        label: 'Name',
        orders: [
            { id: 'az', label: 'A-Z' },
            { id: 'za', label: 'Z-A' }
        ]
    },
    status: {
        label: 'Status',
        orders: [
            { id: 'needs_motivation', label: '“Needs Motivation” First' },
            { id: 'doing_well', label: '“Doing Well” First' }
        ]
    },
    bookmark: {
        label: 'Bookmarked',
        orders: [
            { id: 'bookmarked_first', label: 'Bookmarked First' },
            { id: 'bookmarked_last', label: 'Bookmarked Last' }
        ]
    },
    progress: {
        label: 'Progress',
        orders: [
            { id: 'goal_not_met', label: 'Goal Not Met First' },
            { id: 'goal_met', label: 'Goal Met First' }
        ]
    }
};

const sortOptions = Object.entries(SORT_CONFIG).map(([value, { label }]) => ({ value, label }));

/**
 * Sorting Options — sort is one choice, so each half is a single Select.
 * Changing what to sort by resets the order to that sort's first order.
 */
export const SortingOptions = ({
    initialSort = 'name',
    initialOrder,
    openSort,
    openOrder,
    onChange,
}) => {
    const [sort, setSort] = useState(initialSort);
    const [order, setOrder] = useState(initialOrder ?? SORT_CONFIG[initialSort].orders[0].id);

    const handleSortChange = (nextSort) => {
        const nextOrder = SORT_CONFIG[nextSort].orders[0].id;
        setSort(nextSort);
        setOrder(nextOrder);
        if (onChange) onChange({ sort: nextSort, order: nextOrder });
    };

    const handleOrderChange = (nextOrder) => {
        setOrder(nextOrder);
        if (onChange) onChange({ sort, order: nextOrder });
    };

    return (
        <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
            <Select
                aria-label="Sort by"
                clearable={false}
                size="small"
                options={sortOptions}
                value={sort}
                onChange={handleSortChange}
                open={openSort}
                style={{ width: '10rem' }}
            />
            <Select
                aria-label="Order"
                clearable={false}
                size="small"
                options={SORT_CONFIG[sort].orders.map(({ id, label }) => ({ value: id, label }))}
                value={order}
                onChange={handleOrderChange}
                open={openOrder}
                style={{ width: '14rem' }}
            />
        </div>
    );
};

export const Overview = () => (
    <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-lg)', paddingBottom: '240px' }}>
        <section>
            <h6 className="h6 mb-4 text-muted">Closed states</h6>
            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <SortingOptions initialSort="name" />
                <SortingOptions initialSort="status" />
                <SortingOptions initialSort="bookmark" />
                <SortingOptions initialSort="progress" />
            </div>
        </section>

        <section style={{ marginTop: 'var(--size-element-gap-lg)', paddingBottom: '200px' }}>
            <h6 className="h6 mb-4 text-muted">Sort by, open</h6>
            <SortingOptions initialSort="status" openSort />
        </section>

        <section style={{ paddingBottom: '160px' }}>
            <h6 className="h6 mb-4 text-muted">Order, open</h6>
            <SortingOptions initialSort="progress" initialOrder="goal_not_met" openOrder />
        </section>
    </div>
);

export const Interactive = () => {
    const [applied, setApplied] = useState({ sort: 'name', order: 'az' });
    return (
        <div className="border rounded" style={{ padding: 'var(--size-card-pad-y-lg)', minHeight: '400px' }}>
            <h6 className="h6 mb-3">Interactive demo</h6>
            <SortingOptions initialSort="name" onChange={setApplied} />
            <p className="body3-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Sorted by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {`${applied.sort} ${applied.order}`}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const applied = canvas.getByTestId('applied');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Sort by' }));
    await userEvent.click(await page.findByRole('option', { name: 'Progress' }));
    await expect(applied).toHaveTextContent('progress goal_not_met');
    await expect(canvas.getByRole('combobox', { name: 'Order' })).toHaveTextContent('Goal Not Met First');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Order' }));
    await userEvent.click(await page.findByRole('option', { name: 'Goal Met First' }));
    await expect(applied).toHaveTextContent('progress goal_met');
};
