/**
 * SortControl Component
 *
 * Sort is one choice, so it is two small single Selects: what to sort by, and
 * in which order. The orders on offer follow the sort, and changing the sort
 * resets the order to that sort's first order.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=747-54853
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './SortControl.scss';

const alphabetical = [
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' },
];

/** What to sort by, and the orders each offers. */
const SORTS = {
    name: { label: 'Name', orders: alphabetical },
    'smart-competency': { label: 'SMART Competency', orders: alphabetical },
    status: {
        label: 'Status',
        orders: [
            { value: 'least-progress', label: 'Least Progress First' },
            { value: 'most-progress', label: 'Most Progress First' },
        ],
    },
    'competency-areas': {
        label: 'Competency Areas',
        orders: [{ value: 'technology-first', label: '"Technology" Competencies First' }],
    },
};

const sortOptions = Object.entries(SORTS).map(([value, { label }]) => ({ value, label }));

const SortControl = ({
    sortBy = 'name',
    sortOrder = 'az',
    onChange,
    className = '',
    style
}) => {
    const orders = (SORTS[sortBy] || SORTS.name).orders;

    return (
        <div
            className={`sort-control ${className}`}
            style={style}
            data-node-id="747-54853"
        >
            <Select
                aria-label="Sort by"
                clearable={false}
                size="small"
                options={sortOptions}
                value={sortBy}
                onChange={(next) => onChange && onChange({ sortBy: next, sortOrder: SORTS[next].orders[0].value })}
                className="sort-control__by"
            />
            <Select
                aria-label="Order"
                clearable={false}
                size="small"
                options={orders}
                value={sortOrder}
                onChange={(next) => onChange && onChange({ sortBy, sortOrder: next })}
                className="sort-control__order"
            />
        </div>
    );
};

SortControl.propTypes = {
    /** What to sort by */
    sortBy: PropTypes.oneOf(Object.keys(SORTS)),
    /** The order's id, one of the sort's orders */
    sortOrder: PropTypes.string,
    /** Change handler: receives `{ sortBy, sortOrder }` */
    onChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default SortControl;
