import React, { useState } from 'react';
import { DynamicTable, FilterButton, FilterMenu, PopupSelect, SearchField, Tabs, Tag, TagGroup } from '@/components';
import { Section } from '@/templates';

/**
 * The Filtering page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `FilteringCases.jsx`.
 */

const ROSTER = [
    ['Ava Thompson', 'Grade 7', 'Lincoln Middle', 'Math', 'Priya Nair'],
    ['Marcus Lee', 'Grade 8', 'Lincoln Middle', 'Reading', 'Sam Ortiz'],
    ['Sofia Ramirez', 'Grade 7', 'Roosevelt Middle', 'Math', 'Priya Nair'],
    ['Jordan Patel', 'Grade 6', 'Roosevelt Middle', 'Science', 'Dana Kim'],
    ['Emily Chen', 'Grade 8', 'Lincoln Middle', 'Math', 'Sam Ortiz'],
    ['Noah Williams', 'Grade 6', 'Lincoln Middle', 'Reading', 'Dana Kim'],
];

const COLUMN = { grade: 1, school: 2, subject: 3, tutor: 4 };

const GRADE = { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8'] };
const SCHOOL = { id: 'school', label: 'School', options: ['Lincoln Middle', 'Roosevelt Middle'] };
const SUBJECT = { id: 'subject', label: 'Subject', options: ['Math', 'Reading', 'Science'] };
const TUTOR = { id: 'tutor', label: 'Tutor', options: ['Dana Kim', 'Priya Nair', 'Sam Ortiz'] };

const useFilters = (initial = {}) => useState({ grade: [], school: [], subject: [], tutor: [], ...initial });

const narrow = (value, query = '') => ROSTER.filter((row) => row[0].toLowerCase().includes(query.trim().toLowerCase())
    && Object.entries(value).every(([id, picked]) => picked.length === 0 || picked.includes(row[COLUMN[id]])));

const StudentsTable = ({ value, query }) => (
    <DynamicTable
        head={{ cells: ['Name', 'Grade', 'School'].map((content) => ({ key: content, content })) }}
        rows={narrow(value, query).slice(0, 3).map((row) => ({ key: row[0], cells: row.slice(0, 3).map((content) => ({ key: content, content })) }))}
        label="Students"
        isFixedSize
    />
);

const Views = () => (
    <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
        <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
        <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
    </Tabs>
);

const quickFilter = (category, value, setValue, placement = 'bottom-end') => {
    const picked = value[category.id][0];
    return {
        key: category.id,
        label: category.label,
        text: picked ?? 'All',
        isSelected: Boolean(picked),
        menu: (trigger) => (
            <PopupSelect
                label={category.label}
                options={category.options}
                value={picked ?? null}
                onChange={(next) => setValue({ ...value, [category.id]: next === picked ? [] : [next] })}
                isSearchable={false}
                placement={placement}
                trigger={trigger}
            />
        ),
    };
};

const menuFilter = (categories, value, setValue) => {
    const count = categories.flatMap(({ id }) => value[id]).length;
    return {
        key: 'filters',
        text: 'Filters',
        iconBefore: 'filter',
        hasChevronDown: false,
        trailingMetric: count > 0 ? count : undefined,
        isSelected: count > 0,
        menu: (trigger) => (
            <FilterMenu
                categories={categories}
                value={Object.fromEntries(categories.map(({ id }) => [id, value[id]]))}
                onApply={(next) => setValue({ ...value, ...next })}
                layout="side-by-side"
                trigger={trigger}
            />
        ),
    };
};

export const OneTier = () => {
    const [value, setValue] = useFilters();
    return (
        <Section
            title="Students"
            views={<Views />}
            filters={[GRADE, SCHOOL, SUBJECT].map((category) => quickFilter(category, value, setValue))}
        >
            <StudentsTable value={value} />
        </Section>
    );
};

export const TwoTiers = () => {
    const [value, setValue] = useFilters({ grade: ['Grade 7'] });
    return (
        <Section
            title="Students"
            views={<Views />}
            filters={[
                ...[GRADE, SCHOOL].map((category) => quickFilter(category, value, setValue)),
                menuFilter([SUBJECT, TUTOR], value, setValue),
            ]}
        >
            <StudentsTable value={value} />
        </Section>
    );
};

export const FiltersAtEnd = () => {
    const [value, setValue] = useFilters();
    const [query, setQuery] = useState('');
    return (
        <Section
            title="Students"
            views={<Views />}
            search={<SearchField mode="active" spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
            filters={[GRADE, SCHOOL].map((category) => quickFilter(category, value, setValue))}
        >
            <StudentsTable value={value} query={query} />
        </Section>
    );
};

export const FiltersAmongViews = () => {
    const [value, setValue] = useFilters();
    const [query, setQuery] = useState('');
    return (
        <Section
            title="Students"
            views={(
                <>
                    <Views />
                    {[GRADE, SCHOOL].map((category) => {
                        const { key, menu, ...trigger } = quickFilter(category, value, setValue, 'bottom-start');
                        return <React.Fragment key={key}>{menu(<FilterButton {...trigger} />)}</React.Fragment>;
                    })}
                </>
            )}
            search={<SearchField mode="active" spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
        >
            <StudentsTable value={value} query={query} />
        </Section>
    );
};

export const CountOnIcon = () => {
    const [value, setValue] = useFilters({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    return (
        <Section title="Students" views={<Views />} filters={[menuFilter([GRADE, SCHOOL], value, setValue)]}>
            <StudentsTable value={value} />
        </Section>
    );
};

export const TagRow = () => {
    const [value, setValue] = useFilters({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    const tags = Object.values(value).flat();
    const remove = (tag) => setValue(Object.fromEntries(Object.entries(value).map(([id, picked]) => [id, picked.filter((item) => item !== tag)])));
    return (
        <Section title="Students" views={<Views />} filters={[menuFilter([GRADE, SCHOOL], value, setValue)]}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                {tags.length > 0 && (
                    <TagGroup label="Applied filters">
                        {tags.map((tag) => <Tag key={tag} text={tag} isRemovable onAfterRemoveAction={() => remove(tag)} />)}
                    </TagGroup>
                )}
                <StudentsTable value={value} />
            </div>
        </Section>
    );
};
