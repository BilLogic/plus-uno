import React from 'react';
import { Button, Input, Dropdown } from '@/components';
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
 * Filters on the left, each naming its dimension ("Compliance: All"), sort on
 * the right because order is not a filter. Active filters clear in one click,
 * and the count says how much is hidden.
 */
export const FilterBar = ({
    query,
    onQuery,
    compliance,
    onCompliance,
    priorityOnly,
    onPriorityOnly,
    filters = [],
    sort = null,
    count,
    total,
    onClear,
    searchPlaceholder = 'Tutor, student or compliance',
}) => {
    const current = COMPLIANCE_OPTIONS.find((c) => c.id === compliance) ?? COMPLIANCE_OPTIONS[0];
    const active = Boolean(query) || compliance !== 'all' || priorityOnly
        || filters.some((f) => f.value !== f.defaultValue);

    return (
        <div className="v2-filters">
            <Input
                label="Search"
                showLabel={false}
                placeholder={searchPlaceholder}
                size="small"
                leadingVisual="fa-solid fa-search"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                className="v2-filters__search"
            />
            <Dropdown
                buttonText={`Compliance: ${current.name}`}
                fill="outline"
                size="small"
                items={COMPLIANCE_OPTIONS.map((c) => ({
                    text: c.name,
                    selected: c.id === compliance,
                    onClick: () => onCompliance(c.id),
                }))}
            />
            {onPriorityOnly && (
                <Button
                    text="Priority only"
                    style="primary"
                    fill={priorityOnly ? 'filled' : 'outline'}
                    size="small"
                    leadingVisual={priorityOnly ? 'check' : 'filter'}
                    onClick={() => onPriorityOnly(!priorityOnly)}
                />
            )}
            {filters.map((f) => (
                <Dropdown
                    key={f.label}
                    buttonText={`${f.label}: ${f.value}`}
                    fill="outline"
                    size="small"
                    items={f.options.map((o) => ({
                        text: o,
                        selected: o === f.value,
                        onClick: () => f.onChange(o),
                    }))}
                />
            ))}
            {active && onClear && (
                <button type="button" className="body3-txt v2-filters__clear" onClick={onClear}>
                    Clear filters
                </button>
            )}
            <div className="v2-filters__right">
                <p className="body3-txt v2-filters__count">{count} of {total} shown</p>
                {sort}
            </div>
        </div>
    );
};

/** Metric name + this week's rate, used in tiles. */
export const metricRate = (id) => {
    const m = METRICS.find((x) => x.id === id);
    return m ? latest(m.weekly) : null;
};
