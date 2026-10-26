import React from 'react';
import PropTypes from 'prop-types';
import './RevealRows.css';

/**
 * RevealRows: a list of single-line rows whose action shows on hover and on
 * keyboard focus, so a list reads calmly until a row is reached.
 *
 * - `columns` is the rows' CSS grid template, shared by every row.
 * - Each row's `cells` fill the grid; its `action` takes the last column and is
 *   hidden (still in the tab order) until the row is hovered or holds focus.
 * - Rows divide with a hairline; the hovered row fills instead.
 */
export const RevealRows = ({ columns, label, children, className = '' }) => (
    <ul className={['tr-rows', className].filter(Boolean).join(' ')} style={{ '--tr-rows-columns': columns }} aria-label={label}>
        {children}
    </ul>
);

RevealRows.propTypes = {
    /** The grid template every row uses, e.g. "minmax(0, 1fr) 136px 150px 64px" */
    columns: PropTypes.string.isRequired,
    label: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
};

export const RevealRow = ({ children, action, hovered = false }) => (
    <li className={['tr-rows__row', hovered ? 'tr-rows__row--hover' : ''].filter(Boolean).join(' ')}>
        {children}
        <span className="tr-rows__action" data-part="action">{action}</span>
    </li>
);

RevealRow.propTypes = {
    /** The row's cells, one per column but the last */
    children: PropTypes.node,
    /** The control revealed on hover and focus */
    action: PropTypes.node,
    /** Show the hover state (screenshots) */
    hovered: PropTypes.bool,
};

export default RevealRows;
