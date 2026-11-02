import React from 'react';
import PropTypes from 'prop-types';
import Table from './Table';

/**
 * The Static table: a fixed grid people read. Rows rest or are highlighted
 * (`rowStates`); there is nothing to sort, select, page or expand, so it takes
 * no hover and no row click. Reach for `Table` with `hover` when rows act, and
 * for the Dynamic table when people work the data.
 *
 * Takes every other `Table` prop (`headers`, `rows`, `size`, `frame`,
 * `titleColumn`, `summary`, `verticalLines`, `striped`).
 */
const StaticTable = ({ className = '', ...props }) => (
    <Table {...props} hover={false} className={['plus-static-table', className].filter(Boolean).join(' ')} />
);

StaticTable.propTypes = {
    className: PropTypes.string,
};

export default StaticTable;
