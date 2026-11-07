import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PatternTable from '@/patterns/PatternTable';
import Spinner from '@/components/loading/Spinner';
import HeadCell from './HeadCell';
import { TableCell, TableRow, TableMessageRow } from './TableParts';
import './Table.scss';
import './DynamicTable.scss';
import './TreeTable.scss';

const classes = (...names) => names.filter(Boolean).join(' ');

/** A press on one of these inside a row is the control's own, never the row's. */
const CONTROL = 'a, button, input, select, textarea, [role="button"], [role="checkbox"], [role="switch"], [role="menuitem"]';

/**
 * The rows on screen, in order: each item with its level, its parent and its
 * place among its siblings, and a message row under any expanded parent that
 * is still loading or turned out to have nothing in it.
 */
const flatten = (items, { isExpanded, childrenOf, loading }, level = 0, parentId = null) => items.flatMap((item, index) => {
    const known = childrenOf(item);
    const isParent = Boolean(item.hasChildren) || (known !== undefined && (known.length > 0 || item.children !== undefined));
    const expanded = isParent && isExpanded(item.id);
    const own = { type: 'row', item, level, parentId, posinset: index + 1, setsize: items.length, isParent, expanded };
    if (!expanded) return [own];
    if (loading.has(item.id) || known === undefined) {
        return [own, { type: 'message', id: `${item.id}:loading`, level: level + 1, kind: 'loading' }];
    }
    if (known.length === 0) {
        return [own, { type: 'message', id: `${item.id}:empty`, level: level + 1, kind: 'empty' }];
    }
    return [own, ...flatten(known, { isExpanded, childrenOf, loading }, level + 1, item.id)];
});

/**
 * Tree table. Records that nest: a school, its classes, their students. Each
 * level indents one step and keeps every column, so the nested rows can still
 * be read across. Built on the `PatternTable` shell with `HeadCell`s and the
 * shared `TableRow` and `TableCell` parts.
 *
 * - **Data.** `items` is one `{ id, cells, children, hasChildren, count }`
 *   per row; `cells` is one `{ content }` per column, and `children` nests the
 *   same shape. A row with `hasChildren` and no `children` gets them from
 *   `loadChildren(item)`, which returns them or a promise of them; until they
 *   arrive a loading message row sits under it, and an empty answer leaves an
 *   empty message row.
 * - **Expand and collapse.** The chevron toggles a parent (12 tall in a 24
 *   hit area). `shouldExpandOnClick` lets a press anywhere on the row toggle
 *   it too, but never a press on a control inside the row, so use it only on
 *   rows without controls. `defaultExpandedIds` seeds the open rows;
 *   `expandedIds` with `onExpandedChange` hands them to the page.
 * - **Keyboard.** The WAI-ARIA treegrid pattern in row-focus mode: the table
 *   is one tab stop; Down and Up move between rows, Home and End to the ends;
 *   Right opens a closed parent, then moves to its first child; Left closes an
 *   open parent, then moves to the parent row; Enter toggles. Every row
 *   carries `aria-level`, `aria-posinset` and `aria-setsize`, and a parent
 *   `aria-expanded`.
 */
const TreeTable = ({
    head,
    items = [],
    label,
    loadChildren,
    shouldExpandOnClick = false,
    expandedIds: expandedProp,
    defaultExpandedIds = [],
    onExpandedChange,
    emptyMessage = 'Nothing in here yet',
    size = 40,
    className = '',
    testId,
    ...props
}) => {
    const controlled = expandedProp !== undefined;
    const [ownExpanded, setOwnExpanded] = useState(defaultExpandedIds);
    const expanded = controlled ? expandedProp : ownExpanded;
    const [loaded, setLoaded] = useState({});
    const [loading, setLoading] = useState(() => new Set());
    const [focusedId, setFocusedId] = useState(null);
    const bodyRef = useRef(null);
    const pendingFocus = useRef(null);

    const childrenOf = useCallback(
        (item) => (item.children !== undefined ? item.children : loaded[item.id]),
        [loaded]
    );

    const setExpanded = (next) => {
        if (!controlled) setOwnExpanded(next);
        if (onExpandedChange) onExpandedChange(next);
    };

    const load = (item) => {
        if (!loadChildren || item.children !== undefined || loaded[item.id] || loading.has(item.id)) return;
        setLoading((prev) => new Set(prev).add(item.id));
        Promise.resolve(loadChildren(item)).then((children) => {
            setLoaded((prev) => ({ ...prev, [item.id]: children || [] }));
        }).finally(() => {
            setLoading((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        });
    };

    const toggle = (row) => {
        if (!row.isParent) return;
        if (row.expanded) {
            setExpanded(expanded.filter((id) => id !== row.item.id));
        } else {
            setExpanded([...expanded, row.item.id]);
            load(row.item);
        }
    };

    const rows = flatten(items, { isExpanded: (id) => expanded.includes(id), childrenOf, loading });
    const treeRows = rows.filter((row) => row.type === 'row');
    const tabStop = treeRows.some((row) => row.item.id === focusedId) ? focusedId : treeRows[0]?.item.id;

    const rowElement = (id) => Array.from(bodyRef.current?.querySelectorAll('[data-tree-id]') || [])
        .find((el) => el.dataset.treeId === String(id));

    // Focus lands after the render that put the row on screen.
    useEffect(() => {
        if (pendingFocus.current === null) return;
        const el = rowElement(pendingFocus.current);
        pendingFocus.current = null;
        if (el) el.focus();
    });

    const focusRow = (id) => {
        setFocusedId(id);
        pendingFocus.current = id;
        const el = rowElement(id);
        if (el) {
            el.focus();
            pendingFocus.current = null;
        }
    };

    const onKeyDown = (row) => (event) => {
        if (event.target !== event.currentTarget) return;
        const at = treeRows.indexOf(row);
        const move = (to) => {
            const next = treeRows[to];
            if (next) focusRow(next.item.id);
        };
        const handlers = {
            ArrowDown: () => move(at + 1),
            ArrowUp: () => move(at - 1),
            Home: () => move(0),
            End: () => move(treeRows.length - 1),
            ArrowRight: () => {
                if (row.isParent && !row.expanded) toggle(row);
                else if (row.expanded && treeRows[at + 1]?.parentId === row.item.id) move(at + 1);
            },
            ArrowLeft: () => {
                if (row.expanded) toggle(row);
                else if (row.parentId !== null) focusRow(row.parentId);
            },
            Enter: () => toggle(row),
        };
        const handler = handlers[event.key];
        if (!handler) return;
        event.preventDefault();
        handler();
    };

    const onRowClick = (row) => (event) => {
        setFocusedId(row.item.id);
        if (!shouldExpandOnClick || !row.isParent) return;
        if (event.target.closest(CONTROL)) return;
        toggle(row);
    };

    const columnCount = head.cells.length;

    return (
        <div className={classes('plus-tree-table', className)} data-testid={testId} {...props}>
            <PatternTable
                tableProps={{
                    role: 'treegrid',
                    'aria-label': label,
                    className: classes('plus-table', `plus-table-${size}`, 'plus-dynamic-table-table', 'plus-tree-table-table'),
                }}
            >
                <thead>
                    <tr>
                        {head.cells.map((cell, index) => (
                            <HeadCell
                                key={cell.key ?? index}
                                label={cell.content}
                                align={cell.align}
                                width={cell.width}
                                className={classes(index > 0 && !head.cells.some((c) => c.width) && 'plus-dynamic-table-col--fit')}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody ref={bodyRef}>
                    {rows.map((row) => {
                        if (row.type === 'message') {
                            return (
                                <TableMessageRow
                                    key={row.id}
                                    type={row.kind}
                                    colSpan={columnCount}
                                    className="plus-tree-table-message-row"
                                >
                                    <span
                                        className="plus-tree-table-message"
                                        style={{ '--plus-tree-table-level': row.level }}
                                    >
                                        {row.kind === 'loading'
                                            ? <><span aria-hidden="true"><Spinner size={16} /></span><span>Loading</span></>
                                            : emptyMessage}
                                    </span>
                                </TableMessageRow>
                            );
                        }
                        const { item, level } = row;
                        const isLoading = loading.has(item.id);
                        const toggleState = !row.isParent ? 'leaf' : (isLoading ? 'loading' : (row.expanded ? 'expanded' : 'collapsed'));
                        return (
                            <TableRow
                                key={item.id}
                                data-tree-id={item.id}
                                className={classes('plus-tree-table-row', shouldExpandOnClick && row.isParent && 'plus-tree-table-row--expands')}
                                aria-level={level + 1}
                                aria-posinset={row.posinset}
                                aria-setsize={row.setsize}
                                aria-expanded={row.isParent ? String(row.expanded) : undefined}
                                aria-busy={isLoading ? 'true' : undefined}
                                tabIndex={item.id === tabStop ? 0 : -1}
                                onKeyDown={onKeyDown(row)}
                                onFocus={() => setFocusedId(item.id)}
                                onClick={onRowClick(row)}
                            >
                                {item.cells.map((cell, cellIndex) => {
                                    const { content, key, ...rest } = cell || {};
                                    if (cellIndex > 0) {
                                        return (
                                            <TableCell key={cellIndex} role="gridcell" align={head.cells[cellIndex]?.align} {...rest}>
                                                {content}
                                            </TableCell>
                                        );
                                    }
                                    return (
                                        <TableCell
                                            key={cellIndex}
                                            role="gridcell"
                                            emphasis="title"
                                            {...rest}
                                            leading={(
                                                <>
                                                    <span
                                                        aria-hidden="true"
                                                        className="plus-tree-table-indent"
                                                        style={{ '--plus-tree-table-level': level }}
                                                    />
                                                    <span
                                                        aria-hidden="true"
                                                        className={classes('plus-tree-table-toggle', `plus-tree-table-toggle--${toggleState}`)}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setFocusedId(item.id);
                                                            toggle(row);
                                                        }}
                                                    >
                                                        {toggleState === 'loading' && <Spinner size={16} />}
                                                        {(toggleState === 'expanded' || toggleState === 'collapsed') && (
                                                            <i className={classes('fa-solid', toggleState === 'expanded' ? 'fa-chevron-down' : 'fa-chevron-right')} />
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        >
                                            {content}
                                            {item.count !== undefined && <span className="plus-tree-table-count">{item.count}</span>}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </tbody>
            </PatternTable>
        </div>
    );
};

const itemShape = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    cells: PropTypes.arrayOf(PropTypes.object).isRequired,
    hasChildren: PropTypes.bool,
    count: PropTypes.node,
};
itemShape.children = PropTypes.arrayOf(PropTypes.shape(itemShape));

TreeTable.propTypes = {
    /** The head row: one `{ key, content, width, align }` per column. */
    head: PropTypes.shape({
        cells: PropTypes.arrayOf(PropTypes.shape({
            key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            content: PropTypes.string.isRequired,
            width: PropTypes.string,
            align: PropTypes.oneOf(['text', 'number', 'icon']),
        })).isRequired,
    }).isRequired,
    /** The top-level rows; each `{ id, cells, children, hasChildren, count }`. */
    items: PropTypes.arrayOf(PropTypes.shape(itemShape)),
    /** The treegrid's accessible name. */
    label: PropTypes.string,
    /** Returns a row's children, or a promise of them, the first time it opens. */
    loadChildren: PropTypes.func,
    /** A press anywhere on a parent row toggles it; never a press on a control in the row. */
    shouldExpandOnClick: PropTypes.bool,
    /** The open rows' ids, owned by the page. */
    expandedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    /** The rows open at first when the table holds its own expansion. */
    defaultExpandedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    /** Called with every open row's id when a row opens or closes. */
    onExpandedChange: PropTypes.func,
    /** The message under an open parent with nothing in it. */
    emptyMessage: PropTypes.node,
    /** Row height: 32, 40 or 48. */
    size: PropTypes.oneOf([32, 40, 48]),
    className: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default TreeTable;
