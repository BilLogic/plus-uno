import React, { useMemo, useState } from 'react';
import { Card, Table, Badge, Button } from '@/components';
import { FilterBar, matchesCompliance } from './Shared';
import { FLAG_INSTANCES } from '../data';
import { flagStatus, isOpen, isPatternFlag, patternState } from './audit';

const STATUSES = ['All', 'Violation', 'Below threshold', 'Not a violation', 'Not reviewed'];

const STATUS_TONE = {
    Violation: 'danger',
    // Some sessions confirmed, not enough to be a pattern.
    'Below threshold': 'secondary',
    'Not a violation': 'success',
    // Blue, like the Review button it sits beside — waiting on you, not good or bad.
    'Not reviewed': 'primary',
};

const SEVERITY_TONE = { High: 'danger', Medium: 'warning', Low: 'secondary' };

/**
 * Compliance flags — every flag the AI raised, reviewed or not.
 *
 * Filters narrow the list (compliance, priority, status). Order is set from the
 * Date and Severity column headers, so sorting never hides a row.
 */
const FlagsTab = ({ decisions, relabels = {}, flags = FLAG_INSTANCES, onOpenRecording }) => {
    const statusOf = (f) => flagStatus(f, decisions, relabels);
    const [query, setQuery] = useState('');
    const [compliance, setCompliance] = useState('all');
    const [status, setStatus] = useState('All');
    const [priorityOnly, setPriorityOnly] = useState(false);
    // Sort by clicking a column header; clicking it again flips the direction.
    const [sortKey, setSortKey] = useState('severity');
    const [sortDir, setSortDir] = useState('desc');

    const sortBy = (key) => {
        if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const clear = () => {
        setQuery('');
        setCompliance('all');
        setStatus('All');
        setPriorityOnly(false);
    };

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = flags.filter((f) => {
            const matchesQuery = !q
                || f.tutor.toLowerCase().includes(q)
                || f.category.toLowerCase().includes(q)
                || f.quote.toLowerCase().includes(q);
            const matchesStatus = status === 'All' || statusOf(f) === status;
            const matchesPriority = !priorityOnly || f.group === 'priority';
            return matchesQuery && matchesStatus && matchesPriority && matchesCompliance(compliance, f.categoryId);
        });
        // Descending = most severe / most recent first. Ties fall back to the other key.
        // Within High, Communication & Conduct leads: it's the one acted on from a single flag.
        // Descending status: what still needs you, then violations, then dismissed.
        const STATUS_RANK = { 'Not reviewed': 4, Violation: 3, 'Below threshold': 2, 'Not a violation': 1 };
        const rankOf = (f) => STATUS_RANK[statusOf(f)];
        const byStatus = (a, b) => rankOf(b) - rankOf(a)
            || b.severityRank - a.severityRank
            || Number(b.severe) - Number(a.severe)
            || b.latestDate - a.latestDate;
        const bySeverity = (a, b) => b.severityRank - a.severityRank
            || Number(b.severe) - Number(a.severe)
            || b.latestDate - a.latestDate;
        const byDate = (a, b) => b.latestDate - a.latestDate || b.severityRank - a.severityRank;
        const compare = sortKey === 'date' ? byDate : sortKey === 'status' ? byStatus : bySeverity;
        return [...filtered].sort((a, b) => (sortDir === 'desc' ? compare(a, b) : -compare(a, b)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flags, query, compliance, status, priorityOnly, sortKey, sortDir, decisions, relabels]);

    const sortHeader = (key, label) => {
        const active = sortKey === key;
        const icon = active && sortDir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down';
        return (
            <button
                type="button"
                className={`v2-sort${active ? ' is-active' : ''}`}
                onClick={() => sortBy(key)}
                aria-label={`Sort by ${label}${active ? `, ${sortDir === 'desc' ? 'descending' : 'ascending'}` : ''}`}
            >
                <span className="body3-txt">{label}</span>
                <i className={`fa-solid ${icon} v2-sort__icon`} aria-hidden="true" />
            </button>
        );
    };

    const headers = [
        { text: 'Tutor', width: '140px' },
        { text: sortHeader('date', 'Date'), width: '150px' },
        { text: 'Compliance', width: '190px' },
        { text: sortHeader('severity', 'Severity'), width: '100px' },
        { text: 'Basis', width: '130px' },
        { text: 'What the AI flagged' },
        { text: sortHeader('status', 'Status'), width: '150px' },
        { text: '', width: '120px', align: 'right' },
    ];

    const tableRows = rows.map((f) => {
        const label = statusOf(f);
        const p = isPatternFlag(f) ? patternState(f, decisions, relabels) : null;
        return [
            <p key={`${f.id}-t`} className="body3-txt v2-strong">{f.tutor}</p>,
            <p key={`${f.id}-d`} className="body3-txt v2-nowrap">{f.dateLabel}</p>,
            <div key={`${f.id}-m`}>
                <div className="v2-metric-cell">
                    {f.severe && <i className="fa-solid fa-triangle-exclamation v2-severe-icon" aria-hidden="true" />}
                    <span className="body3-txt">{f.category}</span>
                </div>
                {/* A relabelled flag keeps what the AI said, so the change is visible here. */}
                {f.aiCategory && <p className="body3-txt v2-muted">AI said: {f.aiCategory}</p>}
            </div>,
            <Badge key={`${f.id}-sev`} style={SEVERITY_TONE[f.severity]} text={f.severity} />,
            <p key={`${f.id}-b`} className="body3-txt">{f.basis}</p>,
            <p key={`${f.id}-q`} className="body3-txt">{f.quote}</p>,
            // Same component for every state, so "Not reviewed" matches the others in size.
            // A pattern also says how far its sessions have got.
            <div key={`${f.id}-r`}>
                <Badge style={STATUS_TONE[label]} text={label} />
                {p && (
                    <p className="body3-txt v2-muted v2-status-note">
                        {p.confirmed} of {p.total} sessions confirmed
                        {p.open > 0 && ` · ${p.open} to verify`}
                    </p>
                )}
            </div>,
            {
                align: 'right',
                content: (
                    <Button
                        text={f.source === 'supervisor' ? 'Open' : isOpen(f, decisions) ? 'Review' : 'Reopen'}
                        style="primary"
                        fill="outline"
                        size="small"
                        trailingVisual="arrow-right"
                        disabled={!f.moments}
                        // The list as shown — filters and sort — becomes the review queue,
                        // so "Submit and next" on the recording page follows this order.
                        onClick={() => onOpenRecording(f, f.category, rows.map((r) => r.id))}
                    />
                ),
            },
        ];
    });

    return (
        <Card paddingSize="lg" showBorder={false} className="compliance-surface">
            <FilterBar
                query={query}
                onQuery={setQuery}
                compliance={compliance}
                onCompliance={setCompliance}
                priorityOnly={priorityOnly}
                onPriorityOnly={setPriorityOnly}
                filters={[{
                    label: 'Status',
                    value: status,
                    defaultValue: 'All',
                    options: STATUSES,
                    onChange: setStatus,
                }]}
                onClear={clear}
                count={rows.length}
                total={flags.length}
            />
            {rows.length === 0 ? (
                <p className="body3-txt v2-muted">No flags match these filters.</p>
            ) : (
                <Table headers={headers} rows={tableRows} hover density="md" />
            )}
        </Card>
    );
};

export default FlagsTab;
