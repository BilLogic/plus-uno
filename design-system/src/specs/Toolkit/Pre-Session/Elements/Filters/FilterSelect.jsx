import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './FilterSelect.scss';

/**
 * FilterSelect — one control in a table's filter bar: a small `Select` at the
 * filter bar's width.
 *
 * - **Pick one** (`mode="single"`) when the options exclude each other, such
 *   as a timeframe.
 * - **Pick many** (`mode="multi"`) commits when the list closes, so the table
 *   refilters once rather than on every tick. An empty pick means "all", which
 *   the placeholder says.
 *
 * A filter bar has no visible labels, so pass `aria-label`.
 */
export const FilterSelect = ({ mode = 'single', className = '', ...props }) => (
    <Select
        size="small"
        mode={mode}
        commitOnClose={mode === 'multi'}
        className={`filter-select ${className}`.trim()}
        {...props}
    />
);

FilterSelect.propTypes = {
    mode: PropTypes.oneOf(['single', 'multi']),
    'aria-label': PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default FilterSelect;
