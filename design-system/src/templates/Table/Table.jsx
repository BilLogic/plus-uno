import React from 'react';
import PropTypes from 'prop-types';
import Section from '../Section';
import { DynamicTable, StaticTable, TableEmptyBox, TableFooterRow, TreeTable } from '@/components';
import './Table.scss';

/** The three kinds of table the template arranges, by the name `kind` takes. */
export const TABLE_KINDS = ['static', 'dynamic', 'tree'];

const KIND_COMPONENTS = {
    static: StaticTable,
    dynamic: DynamicTable,
    tree: TreeTable,
};

/**
 * Table template: how a table sits on a page. A Section holds it, and the
 * Section header carries the title and the toolbar. Under the header come the
 * table, then the `footer` slot (range, page size, Pagination), and the empty
 * state box in place of both when there are no rows. The template draws no
 * default footer: the slot is the contract.
 *
 * Pass the table as `children` (a `StaticTable`, `DynamicTable` or
 * `TreeTable`), or name a `kind` and pass its props as `tableProps`. Choose
 * the kind by what people do with the rows: nesting is a Tree table; sort,
 * filter, select, page, expand or row actions is a Dynamic table; otherwise
 * it is a Static table.
 *
 * A Dynamic or Tree table already draws its own footer and empty state, so
 * the template's `footer`, `emptyState` and `empty` serve a Static table and
 * are not drawn around the other two.
 *
 * Every other prop goes to the Section (`title`, `description`, `actions`,
 * `views`, `search`, `filters`).
 */
const Table = ({
    kind,
    tableProps,
    children,
    footer,
    emptyState,
    empty = false,
    label,
    className = '',
    ...sectionProps
}) => {
    const Kind = KIND_COMPONENTS[kind];
    const element = children ?? (Kind ? <Kind {...tableProps} /> : null);
    const ownsStates = element?.type === DynamicTable || element?.type === TreeTable;
    const showEmptyState = !ownsStates && Boolean(empty && emptyState);

    return (
        <Section {...sectionProps}>
            <div className={['plus-table-template', className].filter(Boolean).join(' ')} data-kind={kind}>
                {showEmptyState ? (
                    <TableEmptyBox label={label}>{emptyState}</TableEmptyBox>
                ) : (
                    <>
                        {element}
                        {footer && !ownsStates && <TableFooterRow>{footer}</TableFooterRow>}
                    </>
                )}
            </div>
        </Section>
    );
};

Table.propTypes = {
    /** The kind of table to draw when no table is passed as `children`
     * @ds-context Used in: Table.kind (ds guide table)
     */
    kind: PropTypes.oneOf(TABLE_KINDS),
    /** Props for the table a `kind` draws: its head, rows, label and state */
    tableProps: PropTypes.object,
    /** The table itself, a `StaticTable`, `DynamicTable` or `TreeTable`; wins over `kind`
     * @ds-context Used in: Table.children (ds guide table)
     */
    children: PropTypes.node,
    /** Footer slot under a Static table (range, page-size Select, Pagination); the template draws no default. Not drawn around a Dynamic or Tree table, which has its own; hidden while the empty state shows
     * @ds-context Used in: Table.footer (ds guide table)
     * @ds-context Governed by: Empty (ds guide empty)
     */
    footer: PropTypes.node,
    /** Empty-state slot: replaces a Static table and its footer when `empty` is true; a Dynamic or Tree table draws its own
     * @ds-context Used in: Table.emptyState (ds guide table)
     * @ds-context Governed by: Empty (ds guide empty)
     */
    emptyState: PropTypes.node,
    /** Replace the table with the `emptyState` slot; with `empty` and no `emptyState`, the table renders normally */
    empty: PropTypes.bool,
    /** The table's accessible name, kept on the empty state box when the table is replaced */
    label: PropTypes.string,
    className: PropTypes.string,
    /** The Section title above the table; passed to the Section
     * @ds-context Used in: Table.title (ds guide table)
     */
    title: PropTypes.node,
    /** Actions slot in the Section's title row; passed to the Section
     * @ds-context Used in: Table.actions (ds guide table)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    actions: PropTypes.node,
    /** Inline styles on the Section; passed to the Section */
    style: PropTypes.object,
};

export default Table;
