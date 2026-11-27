import React, { useState } from 'react';
import { Button, Checkbox, CountTag, DynamicTable, EmptyState, Facts, FilterMenu, IconButton, SearchField, SegmentedControl, Sidebar, StatusTag, Tabs, TextField } from '@/components';
import { Card, Frame, PanelBody, PanelCloseAction, PanelContainer, PanelDownAction, PanelFooter, PanelHeader, PanelSubheader, PanelUpAction, Section, usePanelControl } from '@/templates';

/**
 * The Section page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the docs wrapper that keeps Storybook's
 * styles off them lives in `SectionCases.jsx`. Body copy is a plain `p` on the
 * body token: PLUS has no text component to reach for first.
 */

const studentHead = {
    cells: [
        { key: 'name', content: 'Name' },
        { key: 'grade', content: 'Grade' },
        { key: 'last', content: 'Last session' },
    ],
};

const studentRows = [
    { key: 'Ava Thompson', cells: [{ key: 'name', content: 'Ava Thompson' }, { key: 'grade', content: 'Grade 7' }, { key: 'last', content: 'Oct 24' }] },
    { key: 'Marcus Lee', cells: [{ key: 'name', content: 'Marcus Lee' }, { key: 'grade', content: 'Grade 8' }, { key: 'last', content: 'Oct 23' }] },
];

const studentTable = <DynamicTable head={studentHead} rows={studentRows} label="Students" isFixedSize />;

const studentViews = (
    <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
        <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
        <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
    </Tabs>
);

const sessionViews = (
    <Tabs appearance="pill" defaultActiveKey="Upcoming" aria-label="Views">
        <Tabs.Tab eventKey="Upcoming">Upcoming</Tabs.Tab>
        <Tabs.Tab eventKey="Past">Past</Tabs.Tab>
    </Tabs>
);

const formatSwitch = (
    <SegmentedControl
        label="Format"
        defaultValue="table"
        options={[
            { value: 'table', label: 'Table', icon: 'table-list', isIconOnly: true },
            { value: 'cards', label: 'Cards', icon: 'grip', isIconOnly: true },
        ]}
    />
);

const sessionCard = (
    <Card
        title="Upcoming session"
        description="Tuesday at 4:30 PM · Lincoln Middle · 6 students"
        actions={<Button text="Join session" appearance="primary" onClick={() => {}} />}
    />
);

export const CardStandsAlone = () => sessionCard;

export const SectionRepeatsCard = () => (
    <Section title="Upcoming session">
        {sessionCard}
    </Section>
);

export const TitleRowAboveHeaderRows = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={studentViews}
    >
        {studentTable}
    </Section>
);

export const TitleInViewsRow = () => (
    <Section
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-lg)' }}>
                <span className="heading-sm">Students</span>
                {studentViews}
            </div>
        )}
    >
        {studentTable}
    </Section>
);

export const ActionsInTitleRow = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={studentViews}
    >
        {studentTable}
    </Section>
);

export const ActionsInTwoHomes = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
        views={studentViews}
        format={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
    >
        {studentTable}
    </Section>
);

export const RightSideInOrder = () => (
    <Section
        title="Sessions"
        description="This term"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={sessionViews}
        format={formatSwitch}
        search={<SearchField mode="active" spacing="compact" placeholder="Search sessions" />}
        filters={[{ key: 'status', label: 'Status', text: 'All', onClick: () => {} }]}
    >
        {studentTable}
    </Section>
);

export const RightSideCrowded = () => (
    <Section
        title="Sessions"
        description="This term"
        actions={(
            <>
                <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
                <IconButton icon="download" label="Export" appearance="subtle" onClick={() => {}} />
                <Button text="Share" onClick={() => {}} />
                <IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />
                <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
            </>
        )}
        views={(
            <Tabs appearance="pill" defaultActiveKey="Upcoming" aria-label="Views">
                <Tabs.Tab eventKey="Upcoming">Upcoming</Tabs.Tab>
                <Tabs.Tab eventKey="Past">Past</Tabs.Tab>
            </Tabs>
        )}
        format={formatSwitch}
    >
        {studentTable}
    </Section>
);

const contactFields = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--inline-xl)' }}>
        <TextField label="Guardian name" defaultValue="Dana Thompson" />
        <TextField label="Phone" defaultValue="(412) 555-0148" />
    </div>
);

/** A form's Save and Cancel: at the start under the last field, Primary first. */
const formActions = (
    <div style={{ display: 'flex', gap: 'var(--stack-md)', marginBlockStart: 'var(--stack-3xl)' }}>
        <Button text="Save" appearance="primary" onClick={() => {}} />
        <Button text="Cancel" appearance="subtle" onClick={() => {}} />
    </div>
);

export const SaveUnderFields = () => (
    <Section
        title="Contact details"
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        {contactFields}
        {formActions}
    </Section>
);

export const FooterCommits = () => (
    <Section
        title="Contact details"
        footer={(
            <>
                <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                <Button text="Save" appearance="primary" onClick={() => {}} />
            </>
        )}
    >
        <Card>
            {contactFields}
        </Card>
    </Section>
);

/*
 * The Section page's live examples: the header rows, the types and the states.
 * Each is a Section of PLUS parts only, so Show code prints what a consumer
 * writes. A story stages it (a frame, a stage width) around the example and
 * hands in any state the staging owns as props.
 */

const roster = [
    ['Ava Thompson', 'Grade 7', 'Oct 24', 'Active', true, 'Priya Nair'],
    ['Marcus Lee', 'Grade 8', 'Oct 23', 'Active', true, 'Devon Brooks'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23', 'Active', false, 'Priya Nair'],
    ['Jordan Patel', 'Grade 6', 'Oct 21', 'Paused', false, 'Samir Shah'],
    ['Emily Chen', 'Grade 8', 'Oct 20', 'Active', false, 'Devon Brooks'],
    ['Noah Williams', 'Grade 6', 'Oct 18', 'Paused', true, 'Samir Shah'],
];

const RosterTable = ({ list = roster.slice(0, 4), sortable = false, ...props }) => (
    <DynamicTable
        head={{
            cells: [
                { key: 'name', content: 'Name', isSortable: sortable },
                { key: 'grade', content: 'Grade', isSortable: sortable },
                { key: 'last', content: 'Last session', isSortable: sortable },
            ],
        }}
        rows={list.map(([name, grade, last]) => ({
            key: name,
            // A column sorts by its cells' keys, so each key is the cell's own value.
            cells: [{ key: name, content: name }, { key: grade, content: grade }, { key: last, content: last }],
        }))}
        label="Students"
        isFixedSize
        {...props}
    />
);

const termSessions = [
    ['Tue Nov 18', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Thu Nov 20', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Tue Nov 25', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Tue Dec 2', '3:30 PM', 'Whitaker · period 6', '4'],
];

const termStudents = [
    ['Maya R.', 'Grade 7', 'Whitaker', '12'],
    ['Jonah T.', 'Grade 8', 'Lincoln', '9'],
];

const TermTable = ({ list = termSessions.slice(0, 3), names = ['Date', 'Time', 'Group', 'Students'], ...props }) => (
    <DynamicTable
        head={{ cells: names.map((content) => ({ key: content, content })) }}
        rows={list.map((cells) => ({ key: cells.join(), cells: cells.map((content, i) => ({ key: `${i}`, content })) }))}
        label="Sessions"
        isFixedSize
        {...props}
    />
);

const studentColumns = ['Name', 'Grade', 'Group', 'Sessions'];

const signUpActions = (
    <>
        <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
        <Button text="Sign up" iconBefore="plus" appearance="primary" onClick={() => {}} />
    </>
);

const addStudentActions = (
    <>
        <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
        <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
    </>
);

const termFilters = [
    { key: 'status', label: 'Status', text: 'Upcoming', onClick: () => {} },
    { key: 'group', label: 'Group', text: 'All', onClick: () => {} },
    { key: 'date', label: 'Date', text: 'All time', onClick: () => {} },
];

const fullHeader = {
    title: 'Sessions',
    actions: signUpActions,
    views: (
        <Tabs appearance="pill" defaultActiveKey="Upcoming" aria-label="Views">
            <Tabs.Tab eventKey="Upcoming">Upcoming</Tabs.Tab>
            <Tabs.Tab eventKey="Past">Past</Tabs.Tab>
            <Tabs.Tab eventKey="All">All</Tabs.Tab>
        </Tabs>
    ),
    format: formatSwitch,
    search: <SearchField mode="active" spacing="compact" placeholder="Search" />,
    filters: termFilters,
};

export const FullHeaderRows = () => (
    <Section {...fullHeader}>
        <TermTable />
    </Section>
);

export const FiltersApplied = () => {
    const [applied, setApplied] = useState(true);
    const filters = termFilters.map((filter, i) => (
        applied && i < 2 ? { ...filter, text: i === 0 ? 'Upcoming' : 'Whitaker', isSelected: true } : filter
    ));
    return (
        <Section {...fullHeader} filters={filters} count="3 of 12" onClearAll={() => setApplied(false)}>
            <TermTable />
        </Section>
    );
};

export const NoViews = () => (
    <Section
        title="Students"
        actions={addStudentActions}
        format={formatSwitch}
        search={<SearchField mode="active" spacing="compact" placeholder="Search" />}
        filters={[
            { key: 'group', label: 'Group', text: 'All', onClick: () => {} },
            { key: 'grade', label: 'Grade', text: 'All', onClick: () => {} },
            { key: 'status', label: 'Status', text: 'Active', onClick: () => {} },
        ]}
    >
        <TermTable list={termStudents} names={studentColumns} />
    </Section>
);

export const ViewsOnly = () => (
    <Section
        title="Reflections"
        views={(
            <Tabs appearance="pill" defaultActiveKey="Owed" aria-label="Views">
                <Tabs.Tab eventKey="Owed">Owed</Tabs.Tab>
                <Tabs.Tab eventKey="Submitted">Submitted</Tabs.Tab>
            </Tabs>
        )}
    >
        <TermTable list={termStudents} names={studentColumns} />
    </Section>
);

export const TitleHidden = () => (
    <Section
        title="Reflections"
        isTitleHidden
        named
        views={(
            <Tabs appearance="pill" defaultActiveKey="Owed" aria-label="Views">
                <Tabs.Tab eventKey="Owed">Owed</Tabs.Tab>
                <Tabs.Tab eventKey="Submitted">Submitted</Tabs.Tab>
            </Tabs>
        )}
    >
        <TermTable list={termStudents} names={studentColumns} />
    </Section>
);

const termCategories = [
    { id: 'status', label: 'Status', options: ['Upcoming', 'Done', 'Called off'] },
    { id: 'group', label: 'Group', options: ['Whitaker', 'Lincoln', 'Roosevelt'] },
    { id: 'date', label: 'Date', options: ['This week', 'This month', 'This term'] },
    { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8'] },
];

/** Four or more categories: one Filter menu after Search, never three triggers and More filters. */
export const ManyFilters = () => {
    const [value, setValue] = useState({});
    const applied = Object.values(value).flat().length;
    return (
        <Section
            {...fullHeader}
            filters={undefined}
            filterMenu={<FilterMenu categories={termCategories} value={value} onApply={setValue} />}
            count={applied > 0 ? '3 of 12' : undefined}
            onClearAll={() => setValue({})}
        >
            <TermTable />
        </Section>
    );
};

export const WrappedFilters = () => (
    <Section
        {...fullHeader}
        filters={[
            { key: 'status', label: 'Status', text: 'Upcoming and called off', onClick: () => {} },
            { key: 'group', label: 'Group', text: 'Whitaker, Lincoln and Roosevelt', onClick: () => {} },
            { key: 'date', label: 'Date', text: 'All time', onClick: () => {} },
        ]}
    >
        <TermTable />
    </Section>
);

export const RowsSelected = () => (
    <Section {...fullHeader}>
        <TermTable
            list={termSessions}
            isSelectable
            defaultSelectedRowKeys={termSessions.slice(0, 3).map((cells) => cells.join())}
            bulkActions={[{ label: 'Call off' }, { label: 'Export' }, { label: 'Move to group' }, { label: 'Remove from group' }]}
        />
    </Section>
);

export const NarrowHeader = () => (
    <Section
        {...fullHeader}
        filters={termFilters.map((filter, i) => (i === 0 ? { ...filter, isSelected: true } : filter))}
        count="3 of 12"
        onClearAll={() => {}}
        onOpenFilters={() => {}}
    >
        <TermTable list={termSessions.slice(0, 3).map((cells) => cells.slice(0, 3))} names={['Date', 'Time', 'Group']} maxHeight={320} />
    </Section>
);

export const SubsectionHeader = () => (
    <Section title="Lincoln Middle">
        <Section {...fullHeader} title="This week">
            <TermTable />
        </Section>
    </Section>
);

export const SideAtEnd = () => (
    <Section
        title="Lincoln Middle"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        layout="split"
        side={(
            <Facts items={[{ label: 'Tutor', value: 'Priya Nair' }, { label: 'Meets', value: 'Tuesdays, 4:30 PM' }, { label: 'Room', value: 'Library 2' }]} />
        )}
    >
        <RosterTable />
    </Section>
);

export const ViewsSpacing = () => (
    <Section title="Students" description="Optional supporting description for this section." views={studentViews}>
        <RosterTable />
    </Section>
);

export const LoadingFullHeader = () => (
    <Section {...fullHeader} isLoading>
        <TermTable />
    </Section>
);

export const LoadingViews = () => (
    <Section title="Students" views={studentViews} isLoading>
        <RosterTable />
    </Section>
);

export const LoadingSearchAndFilters = () => (
    <Section
        title="Students"
        description="Optional supporting description for this section."
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
        filters={[{ key: 'status', label: 'Status', text: 'All' }]}
        isLoading
    >
        <RosterTable />
    </Section>
);

export const SectionAnatomy = () => (
    <Section
        title="Upcoming sessions"
        description="Optional supporting description for this section."
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                <Tabs.Tab eventKey="Active">Active</Tabs.Tab>
                <Tabs.Tab eventKey="Paused">Paused</Tabs.Tab>
            </Tabs>
        )}
        layout="split"
        side={<Card title="This week" description="12 sessions · 3 tutors out" />}
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <RosterTable />
    </Section>
);

export const SearchableStudents = () => {
    const names = [
        { name: 'Maya Chen', active: true },
        { name: 'Marcus Lee', active: false },
        { name: 'Ana Ruiz', active: true },
        { name: 'Jordan Park', active: true },
        { name: 'Priya Shah', active: false },
        { name: 'Sam Okafor', active: true },
    ];
    const [query, setQuery] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const found = names.filter((student) => (!activeOnly || student.active)
        && student.name.toLowerCase().includes(query.trim().toLowerCase()));
    const narrowed = query !== '' || activeOnly;
    const reset = () => {
        setQuery('');
        setActiveOnly(false);
    };
    return (
        <Section
            title="Students"
            actions={<Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
            search={<SearchField mode="active" isCollapsible spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
            filters={[{ key: 'status', label: 'Status', text: activeOnly ? 'Active' : 'All', isSelected: activeOnly, onClick: () => setActiveOnly((on) => !on) }]}
            onClearAll={reset}
        >
            <p role="status" className="body-sm color-secondary" style={{ margin: 0 }}>
                {narrowed ? `${found.length} of ${names.length} students` : `${names.length} students`}
            </p>
            <ul className="body-default" style={{ margin: 0, paddingInlineStart: 'var(--inline-xl)' }}>
                {found.map((student) => <li key={student.name}>{student.name}</li>)}
            </ul>
        </Section>
    );
};

export const ListType = () => {
    const [view, setView] = useState('All students');
    const list = view === 'Needs follow-up' ? roster.filter(([, , , , followUp]) => followUp) : roster;
    return (
        <Section
            title="Students"
            actions={(
                <>
                    <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                    <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
                </>
            )}
            views={(
                <Tabs appearance="pill" activeKey={view} onSelect={setView} aria-label="Views">
                    <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                    <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
                </Tabs>
            )}
        >
            <RosterTable list={list} sortable rowsPerPage={4} />
        </Section>
    );
};

const accountRow = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

export const queueStudents = roster.slice(0, 4);

const QueueReviewButton = ({ isSelected, onClick }) => {
    const panel = usePanelControl();
    return (
        <Button
            text="Review"
            spacing="compact"
            isSelected={isSelected}
            aria-controls={panel?.open ? panel.panelId : undefined}
            onClick={onClick}
        />
    );
};

export const ReflectionQueue = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [name, grade, last, , , tutor] = queueStudents[activeIndex];
    const panel = (
        <PanelContainer>
            <div>
                <PanelHeader
                    title={name}
                    actions={(
                        <>
                            <PanelUpAction
                                isDisabled={activeIndex === 0}
                                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                            />
                            <PanelDownAction
                                isDisabled={activeIndex === queueStudents.length - 1}
                                onClick={() => setActiveIndex((i) => Math.min(queueStudents.length - 1, i + 1))}
                            />
                            <PanelCloseAction onClick={() => setIsPanelOpen(false)} />
                        </>
                    )}
                />
                <PanelSubheader>
                    <StatusTag appearance="warning">To review</StatusTag>
                </PanelSubheader>
            </div>
            <PanelBody>
                <p className="body-default" style={{ margin: 0 }}>
                    {grade} · Tutor: {tutor} · {last}. The reflection names two goals for next week.
                </p>
            </PanelBody>
            <PanelFooter>
                <Button text="Open full review" appearance="subtle" onClick={() => {}} />
            </PanelFooter>
        </PanelContainer>
    );
    return (
        <Frame sidebar={<Sidebar user="tutor" activeTabId="home" account={accountRow} />} panel={panel} panelLabel="Reflection" panelOpen={isPanelOpen} onPanelOpenChange={setIsPanelOpen}>
            <Section
                title="Reflections to review"
            >
                <DynamicTable
                    label="Reflections to review"
                    isFixedSize
                    highlightedRowIndex={isPanelOpen ? activeIndex : undefined}
                    head={{
                        cells: [
                            { key: 'name', content: 'Name' },
                            { key: 'grade', content: 'Grade' },
                            { key: 'last', content: 'Last session' },
                            { key: 'action', content: 'Action' },
                        ],
                    }}
                    rows={queueStudents.map(([studentName, studentGrade, studentLast], i) => ({
                        key: studentName,
                        cells: [
                            { key: 'name', content: studentName },
                            { key: 'grade', content: studentGrade },
                            { key: 'last', content: studentLast },
                            {
                                key: 'action',
                                content: (
                                    <QueueReviewButton
                                        isSelected={isPanelOpen && i === activeIndex}
                                        onClick={() => {
                                            setActiveIndex(i);
                                            setIsPanelOpen(true);
                                        }}
                                    />
                                ),
                            },
                        ],
                    }))}
                />
            </Section>
        </Frame>
    );
};

export const MainAndSide = () => (
    <Section
        title="Lincoln Middle"
        description="Tuesdays at 4:30 PM"
        layout="split"
        side={(
            <Facts items={[{ label: 'Tutor', value: 'Priya Nair' }, { label: 'Meets', value: 'Tuesdays, 4:30 PM' }, { label: 'Room', value: 'Library 2' }]} />
        )}
    >
        <RosterTable />
    </Section>
);

export const DetailExpand = () => (
    <Section
        title="Reflections"
        description="Week of Oct 20"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All reflections" aria-label="Views">
                <Tabs.Tab eventKey="All reflections">All reflections</Tabs.Tab>
                <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
            </Tabs>
        )}
        detailTitle="Ava Thompson"
        detailDescription="Grade 7"
        detail={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <StatusTag appearance="warning">Needs follow-up</StatusTag>
                <p className="body-default" style={{ margin: 0 }}>
                    The reflection names two goals for next week and asks for extra fraction practice.
                </p>
            </div>
        )}
        detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <RosterTable />
    </Section>
);

export const ReflectionsAnatomy = () => (
    <Section
        title="Reflections"
        description="Week of Oct 20"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All reflections" aria-label="Views">
                <Tabs.Tab eventKey="All reflections">All reflections</Tabs.Tab>
                <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
            </Tabs>
        )}
        detailTitle="Ava Thompson"
        detailDescription="Grade 7"
        detail={<p className="body-default" style={{ margin: 0 }}>The reflection names two goals for next week.</p>}
        detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
        defaultDetailOpen
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <RosterTable />
    </Section>
);

export const EmptyInTable = () => (
    <Section title="Students" description="Lincoln Middle · 24 students" views={studentViews}>
        <EmptyState
            spacing="compact"
            icon="user-group"
            header="No students match"
            description="Try other filters, or reset them to see every student."
            primaryAction={<Button text="Reset filters" appearance="primary" onClick={() => {}} />}
        />
    </Section>
);

const filterGroups = [['Grade', ['Grade 6', 'Grade 7', 'Grade 8']], ['Status', ['Active', 'Paused']]];

const matchingRoster = (checked) => {
    const grades = checked.filter((value) => value.startsWith('Grade '));
    const statuses = checked.filter((value) => value === 'Active' || value === 'Paused');
    return roster.filter(([, grade, , status]) => (
        (grades.length === 0 || grades.includes(grade)) && (statuses.length === 0 || statuses.includes(status))
    ));
};

const FilterSide = ({ checked, onToggle, onReset }) => (
    <div role="group" aria-label="Student filters" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        <div>
            <Button text="Reset filters" appearance="subtle" spacing="compact" onClick={onReset} />
        </div>
        {filterGroups.map(([category, values]) => {
            const on = values.filter((value) => checked.includes(value)).length;
            return (
                <fieldset key={category} style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <legend className="heading-xxs" style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', padding: 0, marginBlockEnd: 'var(--stack-md)' }}>
                        {category}
                        <CountTag value={on} label={`${on} applied`} />
                    </legend>
                    {values.map((value) => <Checkbox key={value} label={value} isChecked={checked.includes(value)} onChange={() => onToggle(value)} />)}
                </fieldset>
            );
        })}
    </div>
);

const NoStudentsMatch = ({ onReset }) => (
    <EmptyState
        spacing="compact"
        icon="user-group"
        header="No students match"
        description="Try other filters, or reset them to see every student."
        primaryAction={<Button text="Reset filters" appearance="primary" onClick={onReset} />}
    />
);

const filterSideViews = (
    <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
        <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
        <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
    </Tabs>
);

const studentsTitle = (count) => `Lincoln Middle · ${count} ${count === 1 ? 'student' : 'students'}`;

const addStudentsPrimary = <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />;

/** The filter side at the start, when the Section is wide enough for it. */
export const FilterSideStudents = () => {
    const [checked, setChecked] = useState(['Grade 7', 'Active']);
    const toggle = (value) => setChecked(checked.includes(value) ? checked.filter((c) => c !== value) : [...checked, value]);
    const matching = matchingRoster(checked);
    return (
        <Section
            title="Students"
            description={studentsTitle(matching.length)}
            actions={(
                <>
                    <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                    {addStudentsPrimary}
                </>
            )}
            views={filterSideViews}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(var(--section-min-width-side), 3fr) minmax(0, 9fr)', gap: 'var(--grid-gutter)' }}>
                <FilterSide checked={checked} onToggle={toggle} onReset={() => setChecked([])} />
                {matching.length > 0 ? <RosterTable list={matching} /> : <NoStudentsMatch onReset={() => setChecked([])} />}
            </div>
        </Section>
    );
};

/** Below the width the side needs: the filters move behind a Filters button and take the whole Section. */
export const FilterSideStudentsCompact = () => {
    const [checked, setChecked] = useState(['Grade 7', 'Active']);
    const [isFiltering, setIsFiltering] = useState(false);
    const toggle = (value) => setChecked(checked.includes(value) ? checked.filter((c) => c !== value) : [...checked, value]);
    const matching = matchingRoster(checked);
    let body = matching.length > 0 ? <RosterTable list={matching} /> : <NoStudentsMatch onReset={() => setChecked([])} />;
    if (isFiltering) {
        body = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                <FilterSide checked={checked} onToggle={toggle} onReset={() => setChecked([])} />
                <div><Button text="Show results" appearance="primary" onClick={() => setIsFiltering(false)} /></div>
            </div>
        );
    }
    return (
        <Section
            title="Students"
            description={studentsTitle(matching.length)}
            actions={(
                <>
                    <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                    {addStudentsPrimary}
                </>
            )}
            views={filterSideViews}
            filters={[{
                key: 'filters',
                text: 'Filters',
                iconBefore: 'filter',
                hasChevronDown: false,
                trailingMetric: checked.length || undefined,
                isSelected: checked.length > 0,
                onClick: () => setIsFiltering(true),
            }]}
        >
            {body}
        </Section>
    );
};

/** Under 768 the Primary keeps only its icon. */
export const FilterSideStudentsNarrow = () => {
    const [checked, setChecked] = useState(['Grade 7', 'Active']);
    const [isFiltering, setIsFiltering] = useState(false);
    const toggle = (value) => setChecked(checked.includes(value) ? checked.filter((c) => c !== value) : [...checked, value]);
    const matching = matchingRoster(checked);
    let body = matching.length > 0 ? <RosterTable list={matching} /> : <NoStudentsMatch onReset={() => setChecked([])} />;
    if (isFiltering) {
        body = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                <FilterSide checked={checked} onToggle={toggle} onReset={() => setChecked([])} />
                <div><Button text="Show results" appearance="primary" onClick={() => setIsFiltering(false)} /></div>
            </div>
        );
    }
    return (
        <Section
            title="Students"
            description={studentsTitle(matching.length)}
            actions={(
                <>
                    <IconButton icon="ellipsis" label="More section actions" appearance="default" onClick={() => {}} />
                    <IconButton icon="user-plus" label="Add students" appearance="primary" onClick={() => {}} />
                </>
            )}
            views={filterSideViews}
            filters={[{
                key: 'filters',
                text: 'Filters',
                iconBefore: 'filter',
                hasChevronDown: false,
                trailingMetric: checked.length || undefined,
                isSelected: checked.length > 0,
                onClick: () => setIsFiltering(true),
            }]}
        >
            {body}
        </Section>
    );
};
