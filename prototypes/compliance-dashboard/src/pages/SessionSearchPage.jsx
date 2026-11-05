import React, { useMemo, useState } from 'react';
import { Avatar, Button, EmptyState, StaticTable, StatusTag, TextField, VisuallyHidden } from '@/components';
import OptionMenu from '../v2/OptionMenu';
import { PatternCard, PatternSection } from '@/patterns';
import { SESSIONS } from '../data';
import './pages.css';

/**
 * Session lookup.
 *
 * For the other direction of work: a tutor or student reports something the AI
 * never flagged, and the supervisor has to find that session. Searching matches
 * tutor and student names, because a report usually names one or the other.
 */
const STATES = {
    flagged: { text: 'AI flagged', style: 'danger' },
    clean: { text: 'No flags found', style: 'neutral' },
    'not-processed': { text: 'Not analyzed yet', style: 'warning' },
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
        { text: 'Session', width: '12rem' },
        { text: 'Tutor', width: '14rem' },
        { text: 'Students' },
        { text: 'AI status', width: '12rem' },
        { text: <VisuallyHidden>Open</VisuallyHidden>, width: '10rem', align: 'right' },
    ];

    const rows = results.map((s) => [
        { content: s.date, secondary: s.time, emphasis: 'title' },
        { content: s.tutor, leading: <Avatar name={s.tutor} size={24} /> },
        s.students.join(', '),
        <StatusTag
            key={`${s.id}-state`}
            appearance={STATES[s.state].style}
            trailingMetric={s.state === 'flagged' ? s.flags : undefined}
        >
            {STATES[s.state].text}
        </StatusTag>,
        {
            align: 'right',
            content: s.recording ? (
                <Button
                    text="Open session"
                    iconBefore="play"
                    disabled={!s.transcriptId}
                    onClick={() => onOpenSession(s)}
                />
            ) : (
                <span className="cm-muted cm-small">No recording</span>
            ),
        },
    ]);

    return (
        <PatternSection
            title="Find a session"
            description="Look up any session, flagged or not, for when a tutor, student or teacher reports something the AI never raised. Search by tutor or student name."
            toolbar={(
                <PatternSection.Toolbar
                    search={(
                        <TextField
                            label="Search"
                            isLabelHidden
                            placeholder="Tutor or student name"
                            elemBeforeInput={<i className="fa-solid fa-search" aria-hidden="true" />}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="cm-search"
                        />
                    )}
                    filters={(
                        <OptionMenu
                            buttonText={state}
                            items={['Any status', ...Object.values(STATES).map((s) => s.text)].map((s) => ({
                                text: s,
                                selected: s === state,
                                onClick: () => setState(s),
                            }))}
                        />
                    )}
                    count={`${results.length} of ${SESSIONS.length} sessions`}
                />
            )}
        >
            <PatternCard padding="lg">
                {results.length === 0 ? (
                    <EmptyState
                        spacing="compact"
                        icon="magnifying-glass"
                        header="No sessions match"
                        description="Try a tutor name, or widen the filters."
                    />
                ) : (
                    <StaticTable headers={headers} rows={rows} />
                )}
            </PatternCard>
        </PatternSection>
    );
};

export default SessionSearchPage;
