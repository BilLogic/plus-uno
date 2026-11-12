import React, { useEffect, useRef, useState } from 'react';

import { Button, DynamicTable, EmptyState, SearchField, SearchFieldAction, Skeleton, Tabs } from '@/components';
import { PatternSection } from '@/patterns';
import { BarEnd, STUDENTS, row } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Search pattern's examples: the real SearchField in each of its three
 * modes, inside the real Section and its view bar, with a Dynamic table, an
 * Empty state and Skeleton bars as the results. A picture holds the state its
 * heading names through props, never a play.
 *
 *   SearchStudents      active: the view bar's field, rows narrow as you type
 *   FocusedStudents     focused: the panel of recent searches or grouped results
 *   BasicStudents       basic: the field, submitted on Enter
 *   ScopedStudents      the scope filter before the field
 *   matching, countWords   the rule and the count the field reads
 */

/** The width a Search picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

export const SCOPE = 'Search students';
export const PANEL = 'Suggestions';

/** Rows narrow on a case-blind match of the name. */
export const matching = (rows, query) => {
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter(([name]) => name.toLowerCase().includes(needle)) : rows;
};

/** The count in words, in the results header, zero included. */
export const countWords = (shown, total, query) => (query.trim() ? `${shown} of ${total} students` : `${total} students`);

export const VIEWS = ['All students', 'Needs follow-up'];
/** The rows the second view keeps. */
const FOLLOW_UP = ['Marcus Lee', 'Noah Williams'];

const HEAD = { cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content })) };
const tableRows = (rows) => rows.map(([name, grade, last]) => ({ key: name, cells: [name, grade, last].map((content) => ({ key: content, content })) }));

const SCOPES = [
    { value: 'students', label: 'Students', count: 6 },
    { value: 'sessions', label: 'Sessions', count: 12 },
];

/** The results header: the count, always, in words. */
const ResultsHeader = ({ children }) => (
    <span role="status" style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{children}</span>
);

/** Loading mirrors empty: the same body slot, three Skeleton bars where the rows will be. */
const LoadingBody = () => (
    <div aria-busy="true">
        <Skeleton shape="text" lines={3} />
    </div>
);

/** The results: header with the count, then rows, loading or the empty state. */
const Results = ({ shown, total, query, loading, onReset }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <ResultsHeader>{loading ? 'Searching students' : countWords(shown.length, total, query)}</ResultsHeader>
        {loading && <LoadingBody />}
        {!loading && shown.length > 0 && <DynamicTable head={HEAD} rows={tableRows(shown)} label="Students" isFixedSize />}
        {!loading && shown.length === 0 && (
            <EmptyState
                spacing="compact"
                icon="user-group"
                header="No matches"
                description={`No students match "${query.trim()}".`}
                primaryAction={<Button text="Reset filters" onClick={onReset} />}
            />
        )}
    </div>
);

/**
 * A Section whose view bar carries a compact, collapsible SearchField. The
 * table narrows as the text changes; a query nothing matches replaces the table
 * with the empty state; `isLoading` shows the loading body in the same slot.
 */
export const SearchStudents = ({ initialQuery = '', initialOpen = false, isLoading = false, initialView = VIEWS[0] }) => {
    const [query, setQuery] = useState(initialQuery);
    const [view, setView] = useState(initialView);
    const [key, setKey] = useState(0);
    const inView = view === VIEWS[0] ? STUDENTS : STUDENTS.filter(([name]) => FOLLOW_UP.includes(name));
    const shown = matching(inView, query);
    // Reset remounts the field so a collapsible one closes with its text gone.
    const reset = () => { setQuery(''); setKey((n) => n + 1); };
    return (
        <div style={{ padding: 'var(--page-pad)' }}>
            <PatternSection
                title="Students"
                description="Algebra B"
                tabs={(
                    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
                        <Tabs appearance="pill" activeKey={view} onSelect={setView} aria-label="Views">
                            {VIEWS.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
                        </Tabs>
                        <div style={{ ...row, marginInlineStart: 'auto', flexShrink: 0 }}>
                            <SearchField
                                key={key}
                                placeholder={SCOPE}
                                spacing="compact"
                                isCollapsible
                                defaultOpen={initialOpen || Boolean(initialQuery)}
                                value={query}
                                onValueChange={setQuery}
                                isLoading={isLoading}
                            />
                            <BarEnd search={false} />
                        </div>
                    </div>
                )}
            >
                <Results shown={shown} total={inView.length} query={query} loading={isLoading} onReset={reset} />
            </PatternSection>
        </div>
    );
};

/** The page-body field: default spacing, open, with a scope filter when `scoped`. */
const BodyField = ({ scoped, ...props }) => (
    <div style={{ maxInlineSize: 'var(--field-width-md)' }}>
        <SearchField placeholder={SCOPE} {...(scoped ? { scopes: SCOPES } : {})} {...props} />
    </div>
);

/** A page body with its own search, at default spacing. */
export const BodySearch = ({ initialQuery = '', scoped = false }) => {
    const [query, setQuery] = useState(initialQuery);
    const shown = matching(STUDENTS, query);
    return (
        <div style={{ padding: 'var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <BodyField scoped={scoped} value={query} onValueChange={setQuery} />
            <Results shown={shown} total={STUDENTS.length} query={query} onReset={() => setQuery('')} />
        </div>
    );
};

const PEOPLE = STUDENTS.map(([name, grade], index) => ({ value: `s${index}`, label: name, description: grade }));
const SESSIONS = [{ value: 'x1', label: 'Algebra B, Tuesday 4pm' }, { value: 'x2', label: 'Geometry, Thursday 5pm' }];

/** The panel's groups for a text: students by name, sessions by subject. */
export const groupsFor = (text) => {
    const needle = text.trim().toLowerCase();
    const students = PEOPLE.filter((person) => person.label.toLowerCase().includes(needle));
    const sessions = needle ? SESSIONS.filter((session) => session.label.toLowerCase().includes(needle)) : [];
    return [
        { value: 'students', label: 'Students', count: students.length, items: students },
        { value: 'sessions', label: 'Sessions', count: sessions.length, items: sessions },
    ];
};

/**
 * Focused: the field in a page body with its panel under it. `holdFocus` puts
 * focus in the field on mount so the panel is open in a picture; `text` is the
 * starting text (empty lists recent searches, text lists grouped results).
 */
export const FocusedStudents = ({ text: initialText = '', holdFocus = false }) => {
    const [text, setText] = useState(initialText);
    const input = useRef(null);
    useEffect(() => { setText(initialText); }, [initialText]);
    useEffect(() => {
        if (!holdFocus) return undefined;
        const id = setTimeout(() => input.current?.focus({ preventScroll: true }), 150);
        return () => clearTimeout(id);
    }, [holdFocus]);
    return (
        <div style={{ padding: 'var(--page-pad)', minBlockSize: 'calc(var(--field-width-md) * 0.9)' }}>
            <BodyField
                mode="focused"
                value={text}
                onValueChange={setText}
                inputRef={input}
                results={groupsFor(text)}
                recent={['Ava', 'Algebra B']}
                panelLabel={PANEL}
                onSelect={() => {}}
                onSearch={() => {}}
            >
                <SearchFieldAction onSelect={() => {}}>{`Add student “${text.trim()}”`}</SearchFieldAction>
            </BodyField>
        </div>
    );
};

/** Basic: the field alone; the search runs on Enter, then the results page takes over. */
export const BasicStudents = ({ onSearch }) => (
    <div style={{ padding: 'var(--page-pad)' }}>
        <BodyField mode="basic" onSearch={onSearch} />
    </div>
);
