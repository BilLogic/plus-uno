import React, { useState } from 'react';
import { DynamicTable, SearchField } from '@/components';
import { Section } from '@/templates';

/**
 * The Search page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file, so each is a Section a consumer can copy
 * with its own state; the surface and heading level around it live in
 * `SearchCases.jsx`.
 */

const STUDENTS = ['Ava Thompson', 'Marcus Lee', 'Sofia Ramirez', 'Jordan Patel', 'Noah Williams', 'Zoe Chen'];

const matching = (query) => STUDENTS.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

const Roster = ({ names }) => (
    <DynamicTable
        label="Students"
        isFixedSize
        head={{ cells: [{ key: 'name', content: 'Name' }] }}
        rows={names.map((name) => ({ key: name, cells: [{ key: name, content: name }] }))}
    />
);

const Count = ({ children }) => (
    <span role="status" style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{children}</span>
);

const Results = ({ query, count }) => {
    const names = matching(query);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <Count>{count(names.length)}</Count>
            <Roster names={names} />
        </div>
    );
};

const inWords = (shown) => `${shown} of ${STUDENTS.length} students`;

const StudentsSection = ({ placeholder, initialQuery = '', count = inWords }) => {
    const [query, setQuery] = useState(initialQuery);
    return (
        <Section
            title="Students"
            search={(
                <SearchField
                    mode="active"
                    spacing="compact"
                    placeholder={placeholder}
                    value={query}
                    onValueChange={setQuery}
                />
            )}
        >
            <Results query={query} count={count} />
        </Section>
    );
};

export const ScopeNamed = () => <StudentsSection placeholder="Search students" />;

export const ScopeUnnamed = () => <StudentsSection placeholder="Search…" />;

export const CountInWords = () => <StudentsSection placeholder="Search students" initialQuery="ia" />;

export const CountBare = () => <StudentsSection placeholder="Search students" initialQuery="ia" count={(shown) => `${shown} results`} />;
