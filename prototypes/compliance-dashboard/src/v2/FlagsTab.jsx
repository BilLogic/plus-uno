import React, { useMemo, useState } from 'react';
import { AiIcon, Button, EmptyState, StatusTag } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { DataTable, FilterBar, matchesCompliance } from './Shared';
import { FLAG_INSTANCES } from '../data';
import { flagStatus, isOpen, isPatternFlag, patternState } from './audit';

const STATUSES = ['All', 'Violation', 'Below threshold', 'Not a violation', 'Not reviewed'];

const STATUS_TONE = {
    Violation: 'danger',
    // Some sessions confirmed, not enough to be a pattern.
    'Below threshold': 'neutral',
    'Not a violation': 'success',
    // Blue: waiting on you, not good or bad.
    'Not reviewed': 'info',
};

const SEVERITY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' };

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

    const columns = [
        { key: 'tutor', label: 'Tutor', width: '130px', title: true },
        { key: 'date', label: 'Date and basis', width: '150px', sortable: true },
        { key: 'compliance', label: 'Compliance', width: '170px' },
        { key: 'severity', label: 'Severity', width: '100px', sortable: true },
        { key: 'quote', label: 'What the AI flagged' },
        { key: 'status', label: 'Status', width: '150px', sortable: true },
        { key: 'action', label: 'Review', width: '110px', iconOnly: true, align: 'icon' },
    ];

    const tableRows = rows.map((f) => {
        const label = statusOf(f);
        const p = isPatternFlag(f) ? patternState(f, decisions, relabels) : null;
        return {
            key: f.id,
            cells: [
                f.tutor,
                { content: f.dateLabel, secondary: f.basis },
                {
                    // A relabelled flag keeps what the AI said, so the change is visible here.
                    content: (
                        <>
                            {f.severe && <i className="fa-solid fa-triangle-exclamation cm-severe-icon" aria-hidden="true" />}
                            {f.category}
                        </>
                    ),
                    secondary: f.aiCategory ? `AI said: ${f.aiCategory}` : undefined,
                },
                <StatusTag key="sev" appearance={SEVERITY_TONE[f.severity]}>{f.severity}</StatusTag>,
                {
                    content: (
                        <span className="cm-ai-quote">
                            <AiIcon name="summarize" />
                            {f.quote}
                        </span>
                    ),
                },
                {
                    // A pattern also says how far its sessions have got.
                    content: <StatusTag key="st" appearance={STATUS_TONE[label]}>{label}</StatusTag>,
                    secondary: p
                        ? `${p.confirmed} of ${p.total} sessions confirmed${p.open > 0 ? ` · ${p.open} to verify` : ''}`
                        : undefined,
                },
                {
                    content: (
                        <Button
                            text={f.source === 'supervisor' ? 'Open' : isOpen(f, decisions) ? 'Review' : 'Reopen'}
                            iconAfter="arrow-right"
                            isDisabled={!f.moments}
                            // The list as shown, filters and sort included, becomes the review queue,
                            // so "Submit and next" on the recording page follows this order.
                            onClick={() => onOpenRecording(f, f.category, rows.map((r) => r.id))}
                        />
                    ),
                },
            ],
        };
    });

    const onSort = (key) => {
        if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    return (
        <PatternSection
            title="Compliance flags"
            description="Every flag the AI raised, reviewed or not. Sort from the Date, Severity and Status headers."
            toolbar={(
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
            )}
        >
            <PatternCard padding="sm">
                {rows.length === 0 ? (
                    <EmptyState
                        spacing="compact"
                        icon="flag"
                        header="No flags match these filters"
                        description="Clear a filter to see more."
                        primaryAction={<Button text="Clear filters" onClick={clear} />}
                    />
                ) : (
                    <DataTable
                        label="Compliance flags"
                        columns={columns}
                        rows={tableRows}
                        sort={{ key: sortKey, direction: sortDir === 'desc' ? 'descending' : 'ascending' }}
                        onSort={onSort}
                    />
                )}
            </PatternCard>
        </PatternSection>
    );
};

export default FlagsTab;
