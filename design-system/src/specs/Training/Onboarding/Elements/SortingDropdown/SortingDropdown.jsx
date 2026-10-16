/**
 * SortingDropdown Component
 *
 * Sort for the onboarding modules. Sort is one choice, so it is two small
 * single Selects: what to sort by, and in which order. The orders on offer
 * follow the sort; changing the sort resets the order. A sort always has a
 * value, so neither field can be cleared.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121969
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './SortingDropdown.scss';

/** What to sort by, and the orders each offers. */
const SORTS = {
    name: {
        label: 'Name',
        orders: [
            { value: 'az', label: 'A-Z' },
            { value: 'za', label: 'Z-A' },
        ],
    },
    duration: {
        label: 'Duration',
        orders: [
            { value: 'shortest-first', label: 'Shortest First' },
            { value: 'longest-first', label: 'Longest First' },
        ],
    },
    progress: {
        label: 'Progress',
        orders: [
            { value: 'completed-first', label: 'Completed First' },
            { value: 'completed-last', label: 'Completed Last' },
        ],
    },
};

const sortOptions = Object.entries(SORTS).map(([value, { label }]) => ({ value, label }));

const SortingDropdown = ({
    sortBy = 'name',
    sortOrder,
    onChange,
    className = '',
    ...props
}) => {
    const orders = (SORTS[sortBy] || SORTS.name).orders;
    const order = sortOrder ?? orders[0].value;

    return (
        <div className={`sorting-dropdown ${className}`} {...props}>
            <Select
                aria-label="Sort by"
                size="small"
                options={sortOptions}
                value={sortBy}
                onChange={(next) => onChange && onChange({ sortBy: next, sortOrder: SORTS[next].orders[0].value })}
                clearable={false}
                className="sorting-dropdown__by"
            />
            <Select
                aria-label="Order"
                size="small"
                options={orders}
                value={order}
                onChange={(next) => onChange && onChange({ sortBy, sortOrder: next })}
                clearable={false}
                className="sorting-dropdown__order"
            />
        </div>
    );
};

SortingDropdown.propTypes = {
    /** What to sort by */
    sortBy: PropTypes.oneOf(Object.keys(SORTS)),
    /** The order's id, one of the sort's orders; defaults to its first */
    sortOrder: PropTypes.string,
    /** `({ sortBy, sortOrder })` when either changes */
    onChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SortingDropdown;
