import React from 'react';
import { Button, Input, Dropdown, HeadCell, TableCell, TableRow } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { METRICS, FLAG_CATEGORIES, latest } from '../data';

/** Compliance options: everything, then each compliance. Priority is its own toggle. */
export const COMPLIANCE_OPTIONS = [
    { id: 'all', name: 'All' },
    // Every compliance a flag can carry, Session Attendance included.
    ...FLAG_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
];

/** Does a flag match the compliance filter? */
export const matchesCompliance = (value, categoryId) => value === 'all' || categoryId === value;

/**
 * The section toolbar for a list: search, one dropdown per filter (each names
 * its dimension, "Compliance: All"), the shown count, and Clear when a filter
 * is on. Sort is not a filter, so it lives in the column headers.
 */
export const FilterBar = ({
    query,
    onQuery,
    compliance,
    onCompliance,
    priorityOnly,
    onPriorityOnly,
    filters = [],
    count,
    total,
    onClear,
    searchPlaceholder = 'Tutor, student or compliance',
}) => {
    const current = COMPLIANCE_OPTIONS.find((c) => c.id === compliance) ?? COMPLIANCE_OPTIONS[0];
    const active = Boolean(query) || compliance !== 'all' || priorityOnly
        || filters.some((f) => f.value !== f.defaultValue);

    return (
        <PatternSection.Toolbar
            search={(
                <Input
                    label="Search"
                    showLabel={false}
                    placeholder={searchPlaceholder}
                    leadingVisual="fa-solid fa-search"
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                />
            )}
            filters={(
                <>
                    <Dropdown
                        buttonText={`Compliance: ${current.name}`}
                        fill="outline"
                        items={COMPLIANCE_OPTIONS.map((c) => ({
                            text: c.name,
                            selected: c.id === compliance,
                            onClick: () => onCompliance(c.id),
                        }))}
                    />
                    {onPriorityOnly && (
                        <Button
                            text="Priority only"
                            fill={priorityOnly ? undefined : 'outline'}
                            leadingVisual={priorityOnly ? 'check' : 'filter'}
                            onClick={() => onPriorityOnly(!priorityOnly)}
                        />
                    )}
                    {filters.map((f) => (
                        <Dropdown
                            key={f.label}
                            buttonText={`${f.label}: ${f.value}`}
                            fill="outline"
                            items={f.options.map((o) => ({
                                text: o,
                                selected: o === f.value,
                                onClick: () => f.onChange(o),
                            }))}
                        />
                    ))}
                    {active && onClear && <Button text="Clear filters" fill="text" onClick={onClear} />}
                </>
            )}
            count={`${count} of ${total} shown`}
        />
    );
};

/**
 * A table composed from the table parts, so a column can sort (`HeadCell
 * isSortable`) and a row can carry components. Columns: `{ key, label,
 * width?, align?, sortable? }`; rows: `{ key, cells: [node | { content,
 * secondary, wrap }] }`, one cell per column.
 */
export const DataTable = ({ columns, rows, sort, onSort, label }) => (
    <div className="plus-table-wrapper">
        <div className="plus-table-scroll">
            <table className="plus-table plus-table-md" aria-label={label}>
                <thead>
                    <tr>
                        {columns.map((c) => (
                            <HeadCell
                                key={c.key}
                                label={c.label}
                                width={c.width}
                                align={c.align}
                                isIconOnlyHeader={c.iconOnly}
                                isSortable={Boolean(c.sortable)}
                                sort={sort?.key === c.key ? sort.direction : 'none'}
                                onSort={(direction) => onSort?.(c.key, direction)}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <TableRow key={row.key}>
                            {row.cells.map((cell, i) => {
                                const spec = cell !== null && typeof cell === 'object' && 'content' in cell
                                    ? cell
                                    : { content: cell };
                                return (
                                    <TableCell
                                        key={columns[i].key}
                                        align={columns[i].align}
                                        emphasis={columns[i].title ? 'title' : undefined}
                                        overflow={spec.wrap === false ? 'truncate' : 'wrap'}
                                        secondary={spec.secondary}
                                    >
                                        {spec.content}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

/** Metric name + this week's rate, used in tiles. */
export const metricRate = (id) => {
    const m = METRICS.find((x) => x.id === id);
    return m ? latest(m.weekly) : null;
};

/** Review states and severities arrive as tones from the data; Status names them neutral and info. */
export const statusStyle = (tone) => ({ secondary: 'neutral', primary: 'info' }[tone] ?? tone);

/** A row of headline numbers: each a card with the figure over its label. */
export const Tiles = ({ items }) => (
    <div className="cm-tiles">
        {items.map((t) => (
            <PatternCard key={t.label} padding="sm">
                <p className={`cm-tile__value${t.alert ? ' cm-tile__value--alert' : ''}`}>{t.value}</p>
                <p className="cm-tile__label">{t.label}</p>
            </PatternCard>
        ))}
    </div>
);
