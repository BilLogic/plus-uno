import React, { useEffect, useRef, useState } from 'react';

import { Button, DynamicTable, EmptyState, PageHeader, SearchField, SearchFieldAction, Skeleton } from '@/components';
import { Section } from '@/templates';
import { SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { STUDENTS, ViewPills, row, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';
import { typeStyle } from '../../lib/type-style.js';

/**
 * The Search pattern's examples: the real SearchField in each of its three
 * modes, inside the real Section and its header rows, with a Dynamic table, an
 * Empty state and Skeleton bars as the results. A picture holds the state its
 * heading names through props, never a play.
 *
 *   SearchStudents      active: the header's field, rows narrow as you type
 *   FocusedStudents     focused: the panel of recent searches or grouped results
 *   BasicStudents       basic: the field, submitted on Enter
 *   FocusedPage         focused in a page header, its panel held open for a picture
 *   BasicPage           basic in a page header, with the results page Enter leads to
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
export const countWords = (shown, total, query, noun = 'students') => (query.trim() ? `${shown} of ${total} ${noun}` : `${total} ${noun}`);

export const VIEWS = ['All students', 'Needs follow-up'];
/** The rows the second view keeps. */
const FOLLOW_UP = ['Marcus Lee', 'Noah Williams'];

const HEAD = { cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content })) };
const SESSION_HEAD = { cells: ['Time', 'Tutor', 'Subject'].map((content) => ({ key: content, content })) };
const SESSION_ROWS = [
    ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
    ['Thu 5:30 PM', 'Mr. Patel', 'Geometry'],
    ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ['Sat 10:00 AM', 'Ms. Kim', 'Linear equations'],
    ['Tue 4:00 PM', 'Ms. Ortiz', 'Two-step equations'],
    ['Mon 3:30 PM', 'Mr. Patel', 'Angles and proofs'],
];
const tableRows = (rows) => rows.map(([a, b, c]) => ({ key: `${a}-${b}`, cells: [a, b, c].map((content) => ({ key: content, content })) }));

const SCOPES = [
    { value: 'students', label: 'Students', count: 6 },
    { value: 'sessions', label: 'Sessions', count: 6 },
];

/** The results header: the count, always, in words. */
const ResultsHeader = ({ children }) => (
    <span role="status" style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' }}>{children}</span>
);

/** Loading mirrors empty: the same body slot, three Skeleton bars where the rows will be. */
const LoadingBody = () => (
    <div aria-busy="true">
        <Skeleton shape="text" lines={3} />
    </div>
);

/** The results: header with the count, then rows, loading or the empty state. */
const Results = ({ shown, total, query, loading, onReset, noun = 'students', head = HEAD }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <ResultsHeader>{loading ? `Searching ${noun}` : countWords(shown.length, total, query, noun)}</ResultsHeader>
        {loading && <LoadingBody />}
        {!loading && shown.length > 0 && <DynamicTable head={head} rows={tableRows(shown)} label={noun === 'sessions' ? 'Sessions' : 'Students'} isFixedSize />}
        {!loading && shown.length === 0 && (
            <EmptyState
                spacing="compact"
                icon="user-group"
                header="No matches"
                description={`No ${noun} match "${query.trim()}".`}
                primaryAction={<Button text="Reset filters" spacing="compact" onClick={onReset} />}
            />
        )}
    </div>
);

/**
 * A Section whose header carries a compact, collapsible SearchField. The
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
            <Section
                title="Students"
                description="Lincoln Middle"
                actions={<SectionActions />}
                views={<ViewPills views={VIEWS} activeView={view} onViewChange={setView} />}
                search={(
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
                )}
            >
                <Results shown={shown} total={inView.length} query={query} loading={isLoading} onReset={reset} />
            </Section>
        </div>
    );
};

/** The page-body field: default spacing, open, with a scope filter when `scoped`. */
const BodyField = ({ scoped, placeholder = SCOPE, ...props }) => (
    <div style={{ maxInlineSize: 'var(--field-width-md)' }}>
        <SearchField placeholder={placeholder} {...(scoped ? { scopes: SCOPES } : {})} {...props} />
    </div>
);

/** A page body with its own search, at default spacing. */
export const BodySearch = ({ initialQuery = '', scoped = false }) => {
    const [query, setQuery] = useState(initialQuery);
    const [scope, setScope] = useState('all');
    const isSessions = scoped && scope === 'sessions';
    const pool = isSessions ? SESSION_ROWS : STUDENTS;
    const shown = matching(pool, query);
    return (
        <div style={{ padding: 'var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <BodyField
                scoped={scoped}
                scope={scoped ? scope : undefined}
                onScopeChange={scoped ? setScope : undefined}
                placeholder={isSessions ? 'Search sessions' : SCOPE}
                value={query}
                onValueChange={setQuery}
            />
            <Results
                shown={shown}
                total={pool.length}
                query={query}
                noun={isSessions ? 'sessions' : 'students'}
                head={isSessions ? SESSION_HEAD : HEAD}
                onReset={() => setQuery('')}
            />
        </div>
    );
};

const PEOPLE = STUDENTS.map(([name, grade], index) => ({ value: `s${index}`, label: name, description: grade }));
const SESSIONS = [{ value: 'x1', label: 'Lincoln Middle, Tuesday 4pm' }, { value: 'x2', label: 'Roosevelt K-8, Thursday 5pm' }];

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
                recent={['Ava', 'Lincoln Middle']}
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

/** The height a type card's picture lays out at, in px: docs geometry, half the stage so it fills the card's 2 / 1 frame. */
const THUMB_HEIGHT = STAGE / 2; // docs-literal

/** A page whose header carries the search field, at the picture's frame size. */
const PageFrame = ({ mountRef, field, children }) => (
    <div ref={mountRef} style={{ position: 'relative', blockSize: THUMB_HEIGHT, overflow: 'hidden', padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <PageHeader title="Students" actions={field} />
        <div style={{ marginBlockStart: 'var(--page-stack-md)' }}>{children}</div>
    </div>
);

/**
 * Focused, as a picture: the field in the page header with its panel open
 * under it, grouped matches for the text and the "See all results" row. The
 * panel mounts inside the picture, so it scales and clips with it.
 */
export const FocusedPage = ({ text = 'a' }) => {
    const [setMount, mount] = useLayerMount();
    const [query, setQuery] = useState(text);
    // The picture is scaled after the panel first places itself, so it is placed again once settled.
    useEffect(() => {
        if (!mount) return undefined;
        const replace = setTimeout(() => window.dispatchEvent(new Event('resize')), 250); // docs-literal: after the picture is scaled
        return () => clearTimeout(replace);
    }, [mount]);
    const groups = groupsFor(query).map((group) => ({ ...group, items: group.items.slice(0, 3) }));
    return (
        <PageFrame
            mountRef={setMount}
            field={mount && (
                <div style={{ inlineSize: 'var(--field-width-md)' }}>
                    <SearchField
                        mode="focused"
                        spacing="compact"
                        placeholder={SCOPE}
                        value={query}
                        onValueChange={setQuery}
                        results={groups}
                        recent={['Ava', 'Lincoln Middle']}
                        panelLabel={PANEL}
                        defaultPanelOpen
                        panelContainer={mount}
                        onSelect={() => {}}
                        onSearch={() => {}}
                    >
                        <SearchFieldAction onSelect={() => {}}>{`Add student \u201C${query.trim()}\u201D`}</SearchFieldAction>
                    </SearchField>
                </div>
            )}
        >
            <Section title="Roster" description="Lincoln Middle">
                <div aria-busy="true"><Skeleton shape="text" lines={6} /></div>
            </Section>
        </PageFrame>
    );
};

/**
 * Basic, as a picture: the field with its text in the page header, and
 * under it the results page that Enter leads to, as Skeleton bars.
 */
export const BasicPage = ({ text = 'Ava' }) => {
    const [submitted, setSubmitted] = useState(text);
    return (
        <PageFrame
            field={(
                <div style={{ ...row, inlineSize: '100%' }}>
                    <span style={{ ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)', whiteSpace: 'nowrap' }}>Press Enter to search</span>
                    <div style={{ inlineSize: 'var(--field-width-md)' }}>
                        <SearchField mode="basic" spacing="compact" placeholder={SCOPE} defaultValue={text} onSearch={(next) => setSubmitted(next || text)} />
                    </div>
                </div>
            )}
        >
            <Section title="Results" description={`For \u201C${submitted}\u201D`}>
                <div aria-busy="true"><Skeleton shape="text" lines={8} /></div>
            </Section>
        </PageFrame>
    );
};
