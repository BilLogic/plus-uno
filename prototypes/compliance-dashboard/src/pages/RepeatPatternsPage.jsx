import React, { useMemo, useState } from 'react';
import { Card, Table, Badge, Button, Input } from '@/components';
import { REPEAT_TUTORS, THIS_WEEK } from '../data';

const STATUS_TONE = {
    'On Track': 'success',
    'Verification Needed': 'warning',
    'Check-In Needed': 'danger',
};

const rate = (p) => Math.round((p.flagged / p.of) * 100);

/** The five tutors whose repeat flags crossed the threshold. */
const RepeatPatternsPage = ({ onOpenTutor }) => {
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return REPEAT_TUTORS.filter((t) =>
            !q
            || t.name.toLowerCase().includes(q)
            || t.patterns.some((p) => p.metric.toLowerCase().includes(q)));
    }, [query]);

    const headers = [
        { text: 'Tutor', width: '200px' },
        { text: 'Status', width: '170px' },
        { text: 'Repeating' },
        { text: 'Since', width: '120px' },
        { text: '', width: '130px', align: 'right' },
    ];

    const rows = results.map((t) => [
        <p key={`${t.id}-name`} className="body2-txt compliance-review__tutor">{t.name}</p>,
        <Badge key={`${t.id}-status`} style={STATUS_TONE[t.status]} text={t.status} />,
        <div key={`${t.id}-patterns`} className="repeat__patterns">
            {t.patterns.map((p) => (
                <span key={p.metric} className="body3-txt repeat__pattern">
                    <strong>{p.metric}</strong> — {p.flagged} of {p.of} sessions ({rate(p)}%)
                </span>
            ))}
        </div>,
        <p key={`${t.id}-since`} className="body3-txt compliance-review__muted">{t.since}</p>,
        {
            align: 'right',
            content: (
                <Button
                    text="View tutor"
                    style="primary"
                    fill="outline"
                    size="small"
                    trailingVisual="arrow-right"
                    onClick={() => onOpenTutor(t)}
                />
            ),
        },
    ]);

    return (
        <>
            <p className="body2-txt compliance-review__lede">
                Tutors flagged for the same thing in {THIS_WEEK.patternThreshold}% or more of their
                sessions. Dismissing a flag drops it from the rate.
            </p>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <div className="session-search__controls">
                    <Input
                        label="Search tutors"
                        showLabel={false}
                        placeholder="Tutor or metric"
                        size="medium"
                        leadingVisual="fa-solid fa-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="session-search__input"
                    />
                    <p className="body3-txt session-search__count">
                        {results.length} of {REPEAT_TUTORS.length} tutors
                    </p>
                </div>

                {results.length === 0 ? (
                    <p className="body2-txt compliance-review__muted">No tutors match that search.</p>
                ) : (
                    <Table headers={headers} rows={rows} hover density="lg" />
                )}
            </Card>
        </>
    );
};

export default RepeatPatternsPage;
