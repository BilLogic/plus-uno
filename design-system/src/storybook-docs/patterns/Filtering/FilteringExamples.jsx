import React, { useState } from 'react';
import { DynamicTable, FilterButton, FilterMenu, PopupSelect, SearchField, Tabs, Tag, TagGroup } from '@/components';
import { Section } from '@/templates';

/**
 * The Filtering page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file, so each is a Section a consumer can copy
 * with its own state; the surface and heading level around it live in
 * `FilteringCases.jsx`.
 */

const ROSTER = [
    { name: 'Ava Thompson', grade: 'Grade 7', school: 'Lincoln Middle', subject: 'Math', tutor: 'Priya Nair' },
    { name: 'Marcus Lee', grade: 'Grade 8', school: 'Lincoln Middle', subject: 'Reading', tutor: 'Sam Ortiz' },
    { name: 'Sofia Ramirez', grade: 'Grade 7', school: 'Roosevelt Middle', subject: 'Math', tutor: 'Priya Nair' },
    { name: 'Jordan Patel', grade: 'Grade 6', school: 'Roosevelt Middle', subject: 'Science', tutor: 'Dana Kim' },
];

const OPTIONS = {
    grade: ['Grade 6', 'Grade 7', 'Grade 8'],
    school: ['Lincoln Middle', 'Roosevelt Middle'],
    subject: ['Math', 'Reading', 'Science'],
    tutor: ['Dana Kim', 'Priya Nair', 'Sam Ortiz'],
};

const categories = (ids) => ids.map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), options: OPTIONS[id] }));

const Roster = ({ value, query = '' }) => (
    <DynamicTable
        label="Students"
        isFixedSize
        head={{ cells: [{ key: 'name', content: 'Name' }, { key: 'grade', content: 'Grade' }, { key: 'school', content: 'School' }] }}
        rows={ROSTER
            .filter((row) => Object.entries(value).every(([key, picked]) => picked.length === 0 || picked.includes(row[key])))
            .filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
            .map((row) => ({ key: row.name, cells: [row.name, row.grade, row.school].map((content) => ({ key: content, content })) }))}
    />
);

const Views = ({ names }) => (
    <Tabs appearance="pill" defaultActiveKey={names[0]} aria-label="Views">
        {names.map((name) => <Tabs.Tab key={name} eventKey={name}>{name}</Tabs.Tab>)}
    </Tabs>
);

const quickFilter = (id, picked, onPick) => ({
    key: id,
    label: categories([id])[0].label,
    text: picked ?? 'All',
    isSelected: Boolean(picked),
    menu: (trigger) => (
        <PopupSelect
            label={categories([id])[0].label}
            options={OPTIONS[id]}
            value={picked ?? null}
            onChange={(next) => onPick(next === picked ? null : next)}
            isSearchable={false}
            placement="bottom-end"
            trigger={trigger}
        />
    ),
});

const filterMenuEntry = (ids, value, onApply) => {
    const count = Object.values(value).reduce((sum, picked) => sum + picked.length, 0);
    return {
        key: 'filters',
        text: 'Filters',
        iconBefore: 'filter',
        hasChevronDown: false,
        trailingMetric: count > 0 ? count : undefined,
        isSelected: count > 0,
        menu: (trigger) => (
            <FilterMenu categories={categories(ids)} value={value} onApply={onApply} layout="side-by-side" trigger={trigger} />
        ),
    };
};

const asValue = (picks) => Object.fromEntries(Object.entries(picks).map(([id, picked]) => [id, picked ? [picked] : []]));

export const OneTier = () => {
    const [picks, setPicks] = useState({ grade: null, school: null, subject: null });
    const pick = (id) => (next) => setPicks((current) => ({ ...current, [id]: next }));
    return (
        <Section
            title="Students"
            views={<Views names={['All students']} />}
            filters={Object.keys(picks).map((id) => quickFilter(id, picks[id], pick(id)))}
        >
            <Roster value={asValue(picks)} />
        </Section>
    );
};

export const TwoTiers = () => {
    const [picks, setPicks] = useState({ grade: 'Grade 7', school: null });
    const [menu, setMenu] = useState({ subject: [], tutor: [] });
    const pick = (id) => (next) => setPicks((current) => ({ ...current, [id]: next }));
    return (
        <Section
            title="Students"
            views={<Views names={['All students']} />}
            filters={[
                ...Object.keys(picks).map((id) => quickFilter(id, picks[id], pick(id))),
                filterMenuEntry(['subject', 'tutor'], menu, setMenu),
            ]}
        >
            <Roster value={{ ...asValue(picks), ...menu }} />
        </Section>
    );
};

export const FiltersAtEnd = () => {
    const [picks, setPicks] = useState({ grade: null, school: null });
    const [query, setQuery] = useState('');
    const pick = (id) => (next) => setPicks((current) => ({ ...current, [id]: next }));
    return (
        <Section
            title="Students"
            views={<Views names={['All students', 'Needs follow-up']} />}
            search={<SearchField mode="active" spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
            filters={Object.keys(picks).map((id) => quickFilter(id, picks[id], pick(id)))}
        >
            <Roster value={asValue(picks)} query={query} />
        </Section>
    );
};

export const FiltersAmongViews = () => {
    const [picks, setPicks] = useState({ grade: null, school: null });
    const [query, setQuery] = useState('');
    const pick = (id) => (next) => setPicks((current) => ({ ...current, [id]: next }));
    return (
        <Section
            title="Students"
            views={(
                <>
                    <Views names={['All students', 'Needs follow-up']} />
                    {Object.keys(picks).map((id) => {
                        const { key, menu, ...trigger } = quickFilter(id, picks[id], pick(id));
                        return <React.Fragment key={key}>{menu(<FilterButton {...trigger} />)}</React.Fragment>;
                    })}
                </>
            )}
            search={<SearchField mode="active" spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
        >
            <Roster value={asValue(picks)} query={query} />
        </Section>
    );
};

export const CountOnIcon = () => {
    const [value, setValue] = useState({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    return (
        <Section
            title="Students"
            views={<Views names={['All students']} />}
            filters={[filterMenuEntry(['grade', 'school'], value, setValue)]}
        >
            <Roster value={value} />
        </Section>
    );
};

export const TagRow = () => {
    const [value, setValue] = useState({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    const tags = [...value.grade, ...value.school];
    const remove = (tag) => setValue((current) => ({
        grade: current.grade.filter((item) => item !== tag),
        school: current.school.filter((item) => item !== tag),
    }));
    return (
        <Section
            title="Students"
            views={<Views names={['All students']} />}
            filters={[filterMenuEntry(['grade', 'school'], value, setValue)]}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <TagGroup label="Applied filters">
                    {tags.map((tag) => <Tag key={tag} text={tag} isRemovable onAfterRemoveAction={() => remove(tag)} />)}
                </TagGroup>
                <Roster value={value} />
            </div>
        </Section>
    );
};
