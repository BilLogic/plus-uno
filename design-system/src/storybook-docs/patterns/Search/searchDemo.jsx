import React, { useRef, useState } from 'react';

import { Button, DynamicTable, EmptyState, IconButton, Tabs, TextField } from '@/components';
import { PatternSection } from '@/patterns';
import { BarEnd, STUDENTS, row } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Search pattern's examples: the real Section and its view bar, the real
 * IconButton and TextField, and a Dynamic table the rows narrow in. The field's
 * behavior is composed here from those parts (no Search component exists yet),
 * so a picture holds each state through `initialOpen` and `initialQuery`.
 *
 *   SearchStudents   the Section: closed icon, open field, narrowing, no matches
 *   matching, countWords   the rule and the count the field reads
 */

/** The width a Search picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** How wide the open field draws, in docs geometry; no token holds a field width. */
const SEARCH_FIELD_WIDTH = '20rem'; // docs-literal

export const SCOPE = 'Search students';

/** Rows narrow on a case-blind match of the name. */
export const matching = (rows, query) => {
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter(([name]) => name.toLowerCase().includes(needle)) : rows;
};

/** The count in words, read politely as the rows narrow. */
export const countWords = (shown, total, query) => (query.trim() ? `${shown} of ${total} students` : `${total} students`);

export const VIEWS = ['All students', 'Needs follow-up'];
/** The rows the second view keeps. */
const FOLLOW_UP = ['Marcus Lee', 'Noah Williams'];

const HEAD = { cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content })) };
const tableRows = (rows) => rows.map(([name, grade, last]) => ({ key: name, cells: [name, grade, last].map((content) => ({ key: content, content })) }));

/** The field: the IconButton's place is taken by a TextField that names its scope, with "Clear search" after the text. */
const SearchField = ({ query, onQuery, onKeyDown, onBlur, inputRef }) => (
    <TextField
        label={SCOPE}
        isLabelHidden
        placeholder={SCOPE}
        spacing="compact"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        inputRef={inputRef}
        elemBeforeInput={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
        elemAfterInput={query ? <IconButton icon="xmark" label="Clear search" appearance="subtle" spacing="compact" onClick={() => onQuery('')} /> : undefined}
    />
);

/**
 * A Section whose view bar carries Search. Closed it is the icon; open it is
 * the field; the table narrows as the text changes; a query nothing matches
 * replaces the table with the empty state. `initialOpen` and `initialQuery` hold
 * a picture at the state its heading names.
 */
export const SearchStudents = ({ initialOpen = false, initialQuery = '', initialView = VIEWS[0] }) => {
    const [open, setOpen] = useState(initialOpen || Boolean(initialQuery));
    const [query, setQuery] = useState(initialQuery);
    const [view, setView] = useState(initialView);
    const inputRef = useRef(null);
    const iconRef = useRef(null);

    const close = () => {
        setOpen(false);
        // Closing returns focus to the icon once it is back on the page.
        setTimeout(() => iconRef.current?.querySelector('button')?.focus(), 0);
    };
    const onKeyDown = (event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        if (query) setQuery('');
        else close();
    };
    // The field stays open while it holds text; an empty field shrinks back on blur.
    const onBlur = () => { if (!query) setOpen(false); };
    const grow = () => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const inView = view === VIEWS[0] ? STUDENTS : STUDENTS.filter(([name]) => FOLLOW_UP.includes(name));
    const shown = matching(inView, query);
    const searchControl = open
        ? <div style={{ inlineSize: 'var(--search-field-width)' }}><SearchField query={query} onQuery={setQuery} onKeyDown={onKeyDown} onBlur={onBlur} inputRef={inputRef} /></div>
        : <span ref={iconRef}><IconButton icon="magnifying-glass" label={SCOPE} appearance="subtle" onClick={grow} /></span>;

    const reset = () => { setQuery(''); setOpen(false); };

    return (
        <div style={{ padding: 'var(--page-pad)', '--search-field-width': SEARCH_FIELD_WIDTH }}>
            <PatternSection
                title="Students"
                description="Algebra B"
                tabs={(
                    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
                        <Tabs appearance="pill" activeKey={view} onSelect={setView} aria-label="Views">
                            {VIEWS.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
                        </Tabs>
                        <div style={{ ...row, marginInlineStart: 'auto', flexShrink: 0 }}>
                            {searchControl}
                            <BarEnd search={false} />
                        </div>
                    </div>
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <span role="status" style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{countWords(shown.length, inView.length, query)}</span>
                    {shown.length > 0
                        ? <DynamicTable head={HEAD} rows={tableRows(shown)} label="Students" isFixedSize />
                        : (
                            <EmptyState
                                spacing="compact"
                                icon="user-group"
                                header="No matches"
                                description={`No students match "${query.trim()}".`}
                                primaryAction={<Button text="Reset filters" onClick={reset} />}
                            />
                        )}
                </div>
            </PatternSection>
        </div>
    );
};
