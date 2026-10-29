import React, { useMemo, useState } from 'react';
import { Card, Table, Badge, Button, Input, Dropdown } from '@/components';
import { SESSIONS } from '../data';

/**
 * Session lookup.
 *
 * For the other direction of work: a tutor or student reports something the AI
 * never flagged, and the supervisor has to find that session. Searching matches
 * tutor and student names, because a report usually names one or the other.
 */
const STATES = {
    flagged: { text: 'AI flagged', tone: 'danger' },
    clean: { text: 'No flags found', tone: 'secondary' },
    'not-processed': { text: 'Not analysed yet', tone: 'warning' },
};

const SessionSearchPage = ({ onOpenSession }) => {
    const [query, setQuery] = useState('');
    const [state, setState] = useState('Any status');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return SESSIONS.filter((s) => {
            const matchesText = !q
                || s.tutor.toLowerCase().includes(q)
                || s.students.some((n) => n.toLowerCase().includes(q))
                || s.date.toLowerCase().includes(q);
            const matchesState = state === 'Any status' || STATES[s.state].text === state;
            return matchesText && matchesState;
        });
    }, [query, state]);

    const headers = [
        { text: 'Session', width: '190px' },
        { text: 'Tutor', width: '170px' },
        { text: 'Students' },
        { text: 'AI status', width: '160px' },
        { text: '', width: '150px', align: 'right' },
    ];

    const rows = results.map((s) => [
        <div key={`${s.id}-when`}>
            <p className="body2-txt compliance-review__tutor">{s.date}</p>
            <p className="body3-txt compliance-review__muted">{s.time}</p>
        </div>,
        <p key={`${s.id}-tutor`} className="body2-txt">{s.tutor}</p>,
        <p key={`${s.id}-students`} className="body3-txt compliance-review__muted">
            {s.students.join(', ')}
        </p>,
        <div key={`${s.id}-state`} className="session-search__state">
            <Badge style={STATES[s.state].tone} text={STATES[s.state].text} />
            {s.state === 'flagged' && (
                <span className="body3-txt compliance-review__muted">
                    {s.flags} {s.flags === 1 ? 'flag' : 'flags'}
                </span>
            )}
        </div>,
        {
            align: 'right',
            content: s.recording ? (
                <Button
                    text="Open session"
                    style="primary"
                    fill="outline"
                    size="small"
                    leadingVisual="play"
                    disabled={!s.transcriptId}
                    onClick={() => onOpenSession(s)}
                />
            ) : (
                <span className="body3-txt compliance-review__muted">No recording</span>
            ),
        },
    ]);

    return (
        <>
            <p className="body2-txt compliance-review__lede">
                Look up any session, flagged or not — for when a tutor, student or teacher reports
                something the AI never raised. Search by tutor or student name.
            </p>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <div className="session-search__controls">
                    <Input
                        label="Search"
                        showLabel={false}
                        placeholder="Tutor or student name"
                        size="medium"
                        leadingVisual="fa-solid fa-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="session-search__input"
                    />
                    <Dropdown
                        buttonText={state}
                        fill="outline"
                        items={['Any status', ...Object.values(STATES).map((s) => s.text)].map((s) => ({
                            text: s,
                            selected: s === state,
                            onClick: () => setState(s),
                        }))}
                    />
                    <p className="body3-txt session-search__count">
                        {results.length} of {SESSIONS.length} sessions
                    </p>
                </div>

                {results.length === 0 ? (
                    <p className="body2-txt compliance-review__muted">
                        No sessions match. Try a tutor name, or widen the filters.
                    </p>
                ) : (
                    <Table headers={headers} rows={rows} hover density="lg" />
                )}
            </Card>
        </>
    );
};

export default SessionSearchPage;
