import React from 'react';
import PropTypes from 'prop-types';
import './PatternTable.scss';

/**
 * Table pattern for PLUS design system.
 * Table shell: toolbar slot, table children (consumers pass their own
 * thead/tbody), pagination slot, and an empty-state slot. The table itself is
 * no-fill (transparent) with additive row hover overlays — the surrounding
 * card or surface provides the background.
 * Mirrors the "Table" slot component in the Figma design system file.
 */
const PatternTable = ({
    id,
    toolbar,
    pagination,
    emptyState,
    empty = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-table',
        className,
    ].filter(Boolean).join(' ');

    const showEmptyState = empty && emptyState;

    return (
        <div id={id} className={classes} style={style} {...props}>
            {toolbar && <div className="plus-pattern-table-toolbar">{toolbar}</div>}
            {showEmptyState ? (
                <div className="plus-pattern-table-empty">{emptyState}</div>
            ) : (
                <div className="plus-pattern-table-scroll">
                    <table className="plus-pattern-table-table">{children}</table>
                </div>
            )}
            {pagination && !showEmptyState && (
                <div className="plus-pattern-table-pagination">{pagination}</div>
            )}
        </div>
    );
};

PatternTable.propTypes = {
    id: PropTypes.string,
    /** Toolbar slot above the table (search, filters, bulk actions) */
    toolbar: PropTypes.node,
    /** Pagination slot below the table */
    pagination: PropTypes.node,
    /** Empty-state slot, rendered instead of the table when `empty` is true */
    emptyState: PropTypes.node,
    /** Show the empty-state slot instead of the table */
    empty: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Table content slot — pass thead/tbody elements */
    children: PropTypes.node,
};

export default PatternTable;
