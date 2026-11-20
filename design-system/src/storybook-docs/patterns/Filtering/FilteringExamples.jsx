import React from 'react';
import { FilterButton, FilterMenu, PopupSelect, SearchField, Tabs, Tag, TagGroup } from '@/components';
import { Section } from '@/templates';

/**
 * The Filtering page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the data, the filtering and the surface that
 * hold them live in `FilteringCases.jsx`, which passes its live slots in as
 * `slots` and the table as `children`.
 */

export const OneTier = ({ slots, children }) => (
    <Section
        title="Students"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        filters={[
            { key: 'grade', label: 'Grade', text: 'All', menu: (trigger) => <PopupSelect label="Grade" options={['Grade 6', 'Grade 7', 'Grade 8']} isSearchable={false} trigger={trigger} /> },
            { key: 'school', label: 'School', text: 'All', menu: (trigger) => <PopupSelect label="School" options={['Lincoln Middle', 'Roosevelt Middle']} isSearchable={false} trigger={trigger} /> },
            { key: 'subject', label: 'Subject', text: 'All', menu: (trigger) => <PopupSelect label="Subject" options={['Math', 'Reading', 'Science']} isSearchable={false} trigger={trigger} /> },
        ]}
        {...slots}
    >
        {children}
    </Section>
);

export const TwoTiers = ({ slots, children }) => (
    <Section
        title="Students"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        filters={[
            { key: 'grade', label: 'Grade', text: 'Grade 7', isSelected: true, menu: (trigger) => <PopupSelect label="Grade" options={['Grade 6', 'Grade 7', 'Grade 8']} value="Grade 7" isSearchable={false} trigger={trigger} /> },
            { key: 'school', label: 'School', text: 'All', menu: (trigger) => <PopupSelect label="School" options={['Lincoln Middle', 'Roosevelt Middle']} isSearchable={false} trigger={trigger} /> },
            {
                key: 'filters',
                text: 'Filters',
                iconBefore: 'filter',
                hasChevronDown: false,
                menu: (trigger) => (
                    <FilterMenu
                        layout="side-by-side"
                        trigger={trigger}
                        categories={[
                            { id: 'subject', label: 'Subject', options: ['Math', 'Reading', 'Science'] },
                            { id: 'tutor', label: 'Tutor', options: ['Dana Kim', 'Priya Nair', 'Sam Ortiz'] },
                        ]}
                    />
                ),
            },
        ]}
        {...slots}
    >
        {children}
    </Section>
);

export const FiltersAtEnd = ({ slots, children }) => (
    <Section
        title="Students"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
            </Tabs>
        )}
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
        filters={[
            { key: 'grade', label: 'Grade', text: 'All', menu: (trigger) => <PopupSelect label="Grade" options={['Grade 6', 'Grade 7', 'Grade 8']} isSearchable={false} trigger={trigger} /> },
            { key: 'school', label: 'School', text: 'All', menu: (trigger) => <PopupSelect label="School" options={['Lincoln Middle', 'Roosevelt Middle']} isSearchable={false} trigger={trigger} /> },
        ]}
        {...slots}
    >
        {children}
    </Section>
);

export const FiltersAmongViews = ({ slots, children }) => (
    <Section
        title="Students"
        views={(
            <>
                <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                    <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                    <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
                </Tabs>
                <PopupSelect
                    label="Grade"
                    options={['Grade 6', 'Grade 7', 'Grade 8']}
                    isSearchable={false}
                    trigger={<FilterButton label="Grade" text="All" />}
                />
                <PopupSelect
                    label="School"
                    options={['Lincoln Middle', 'Roosevelt Middle']}
                    isSearchable={false}
                    trigger={<FilterButton label="School" text="All" />}
                />
            </>
        )}
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
        {...slots}
    >
        {children}
    </Section>
);

export const CountOnIcon = ({ slots, children }) => (
    <Section
        title="Students"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        filters={[{
            key: 'filters',
            text: 'Filters',
            iconBefore: 'filter',
            hasChevronDown: false,
            trailingMetric: 2,
            isSelected: true,
            menu: (trigger) => (
                <FilterMenu
                    layout="side-by-side"
                    trigger={trigger}
                    defaultValue={{ grade: ['Grade 7'], school: ['Lincoln Middle'] }}
                    categories={[
                        { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8'] },
                        { id: 'school', label: 'School', options: ['Lincoln Middle', 'Roosevelt Middle'] },
                    ]}
                />
            ),
        }]}
        {...slots}
    >
        {children}
    </Section>
);

export const TagRow = ({ slots, tags = ['Grade 7', 'Lincoln Middle'], onRemove, children }) => (
    <Section
        title="Students"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        filters={[{
            key: 'filters',
            text: 'Filters',
            iconBefore: 'filter',
            hasChevronDown: false,
            trailingMetric: 2,
            isSelected: true,
            menu: (trigger) => (
                <FilterMenu
                    layout="side-by-side"
                    trigger={trigger}
                    defaultValue={{ grade: ['Grade 7'], school: ['Lincoln Middle'] }}
                    categories={[
                        { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8'] },
                        { id: 'school', label: 'School', options: ['Lincoln Middle', 'Roosevelt Middle'] },
                    ]}
                />
            ),
        }]}
        {...slots}
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <TagGroup label="Applied filters">
                {tags.map((tag) => <Tag key={tag} text={tag} isRemovable onAfterRemoveAction={() => onRemove?.(tag)} />)}
            </TagGroup>
            {children}
        </div>
    </Section>
);
