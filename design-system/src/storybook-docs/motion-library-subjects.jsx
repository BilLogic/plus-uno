import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate, motion, useReducedMotion } from 'motion/react';
import {
    Accordion,
    AiMessage,
    Banner,
    Breadcrumb,
    Button,
    ButtonItem,
    Calendar,
    Carousel,
    Cascader,
    Checkbox,
    CheckboxGroup,
    ChoiceGrid,
    CloseButton,
    DatePicker,
    DateTimePicker,
    DropdownMenu,
    DynamicTable,
    FileItem,
    FileUpload,
    FilterButton,
    FilterMenu,
    Flag,
    GenerativeBorder,
    Heading,
    HeadingContextProvider,
    IconButton,
    InlineEdit,
    InlineEditableTextfield,
    InlineMessage,
    Link,
    LinkButton,
    LinkIconButton,
    NotificationItem,
    PageHeader,
    Pagination,
    Popup,
    PopupSelect,
    ProgressBar,
    ProgressIndicator,
    ProgressRing,
    ProgressTracker,
    PromptInput,
    PromptStarters,
    Radio,
    RadioGroup,
    Range,
    Rating,
    SearchField,
    SectionMessage,
    Select,
    SettingRow,
    Skeleton,
    Spinner,
    SplitButton,
    Suggestion,
    Tabs,
    TagInput,
    TextArea,
    TextField,
    TimePicker,
    Toggle,
    Tooltip,
    TreeSelect,
    TreeTable,
} from '@/components';
import { OverlayContainer } from '@/lib/overlay';
import { BEAT, springFor } from '@/storybook-docs/illustrations/motion.jsx';

const NOOP = () => {};

const CALENDAR_BASE_DATE = new Date(2026, 10, 1);
const CALENDAR_NEXT_DATE = new Date(2026, 11, 1);

const CASCADER_OPTIONS = [
    {
        value: 'math',
        label: 'Mathematics',
        children: [
            { value: 'fractions', label: 'Fractions' },
            { value: 'ratios', label: 'Ratios' },
        ],
    },
];

const TREE_OPTIONS = [
    {
        value: 'algebra',
        label: 'Algebra I',
        children: [
            { value: 'linear-eq', label: 'Linear equations' },
            { value: 'quadratics', label: 'Quadratics' },
        ],
    },
];

const SELECT_OPTIONS = [
    { value: 'algebra', label: 'Algebra' },
    { value: 'geometry', label: 'Geometry' },
];

const CARD_FILTER_CATEGORIES = [
    { id: 'status', label: 'Status', options: ['Upcoming', 'Completed'] },
    { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7'] },
];

/**
 * Component-tier rows that cannot render standalone inside a gallery card
 * (full-frame app shell context or popovers that steal page focus on open)
 * and therefore fall back to their transition's kit drawing.
 */
export const COMPONENT_SUBJECT_FALLBACKS = Object.freeze({
    AiChat: 'Chat surface requires the Frame shell, its Panel area and the shared AiChat provider to open as a Popup.',
    Sidebar: 'Full-app navigation rail requires the Frame shell layout and shared open-tabs store.',
    Spotlight: 'Coachmark popover requires a page target and steals focus onto its dismiss control when opened.',
});

/**
 * Subject map keyed by component-tier registry row name. Every entry renders
 * the real PLUS component from the `@/components` barrel with props from its
 * source and stories.
 */
export const COMPONENT_SUBJECTS = Object.freeze({
    Accordion: ({ step }) => (
        <div style={{ width: '100%' }}>
            <Accordion
                activeKey={step === 'landing' ? 'goals' : null}
                onSelect={NOOP}
                items={[
                    {
                        eventKey: 'goals',
                        header: 'Session goals',
                        body: 'Compare fractions using number lines.',
                    },
                    {
                        eventKey: 'notes',
                        header: 'Warm-up check',
                        body: 'Review exit ticket before starting.',
                    },
                ]}
            />
        </div>
    ),

    AiMessage: ({ step, event }) => (
        <div style={{ width: '100%' }}>
            <AiMessage
                parts={[{ type: 'text', text: 'Use a number line to compare 3/4 and 5/6.' }]}
                sources={[{ title: 'Grade 6 Fractions Guide', href: '#fractions', type: 'doc' }]}
                status={step === 'landing' ? 'complete' : 'thinking'}
                feedback={event?.event === 'strong' ? 'up' : event?.event === 'refine' ? 'down' : null}
                onFeedback={NOOP}
            />
        </div>
    ),

    Banner: () => (
        <div style={{ width: '100%' }}>
            <Banner appearance="warning">
                Practice environment resets tonight at 11:00 PM EST.
            </Banner>
        </div>
    ),

    Breadcrumb: ({ step, isExit }) => (
        <Breadcrumb
            label="Session breadcrumb"
            items={
                step === 'landing' && !isExit
                    ? [
                        { text: 'Students', onClick: NOOP },
                        { text: 'Maya Lin', onClick: NOOP },
                        { text: 'Session 12' },
                    ]
                    : [
                        { text: 'Students', onClick: NOOP },
                        { text: 'Maya Lin' },
                    ]
            }
        />
    ),

    Button: ({ step }) => (
        <Button appearance="primary" isSelected={step === 'landing'} onClick={NOOP}>
            Start session
        </Button>
    ),

    Calendar: ({ step }) => (
        <Calendar
            viewDate={step === 'landing' ? CALENDAR_NEXT_DATE : CALENDAR_BASE_DATE}
            selected="2026-11-16"
            size={24}
            onViewDateChange={NOOP}
            onPick={NOOP}
        />
    ),

    Carousel: ({ step }) => (
        <div style={{ width: '100%' }}>
            <Carousel
                key={step}
                aria-label="Lesson steps"
                autoplay={false}
                peek={false}
                aspectRatio={16 / 7}
                defaultIndex={step === 'landing' ? 1 : 0}
                slides={[
                    { media: 'Warm-up check', title: 'Step 1', description: 'Number lines' },
                    { media: 'Guided practice', title: 'Step 2', description: 'Equivalent fractions' },
                ]}
            />
        </div>
    ),

    Cascader: ({ step }) => (
        <div style={{ width: '100%' }}>
            <Cascader
                label="Topic path"
                spacing="compact"
                options={CASCADER_OPTIONS}
                value={step === 'landing' ? ['math', 'fractions'] : []}
                onChange={NOOP}
            />
        </div>
    ),

    Checkbox: ({ step }) => (
        <Checkbox
            label="Complete warm-up check"
            isChecked={step === 'landing'}
            onChange={NOOP}
        />
    ),

    CheckboxGroup: ({ step }) => (
        <CheckboxGroup
            legend="Session topics"
            options={[
                { label: 'Fractions', value: 'fractions' },
                { label: 'Decimals', value: 'decimals' },
            ]}
            value={step === 'landing' ? ['fractions', 'decimals'] : ['fractions']}
            onChange={NOOP}
        />
    ),

    ChoiceGrid: ({ step }) => (
        <div style={{ width: '100%' }}>
            <ChoiceGrid
                name="schedule-choice"
                type="radio"
                size={12}
                rows={[{ id: 'mon', label: 'Monday' }]}
                columns={[
                    { id: 'am', label: 'AM' },
                    { id: 'pm', label: 'PM' },
                ]}
                values={{ mon: step === 'landing' ? 'pm' : 'am' }}
                onChange={NOOP}
            />
        </div>
    ),

    CloseButton: () => (
        <CloseButton label="Dismiss item" onClick={NOOP} />
    ),

    DatePicker: ({ step }) => (
        <div style={{ width: '100%' }}>
            <DatePicker
                value={step === 'landing' ? '2026-11-18' : '2026-11-16'}
                spacing="compact"
                onChange={NOOP}
            />
        </div>
    ),

    DateTimePicker: ({ step }) => (
        <div style={{ width: '100%' }}>
            <DateTimePicker
                label="Session time"
                spacing="compact"
                dateValue={step === 'landing' ? '2026-11-18' : '2026-11-16'}
                timeValue={step === 'landing' ? '03:00 PM' : '02:30 PM'}
                onChange={NOOP}
            />
        </div>
    ),

    DropdownMenu: () => (
        <DropdownMenu
            trigger={(
                <Button iconAfter="chevron-down" spacing="compact" onClick={NOOP}>
                    Session actions
                </Button>
            )}
        >
            <ButtonItem onClick={NOOP}>Reschedule</ButtonItem>
            <ButtonItem onClick={NOOP}>Share notes</ButtonItem>
        </DropdownMenu>
    ),

    FileItem: ({ event, progress }) => (
        <div style={{ width: '100%' }}>
            <FileItem
                name="fraction-practice.pdf"
                meta="1.4 MB"
                status={event?.event === 'progress' ? 'uploading' : 'done'}
                progress={event?.event === 'progress' ? Math.round(20 + progress * 80) : undefined}
                removal="remove"
                onRemove={NOOP}
            />
        </div>
    ),

    FileUpload: ({ event, progress }) => (
        <div style={{ width: '100%' }}>
            <FileUpload label="Worksheet upload" buttonText="Attach worksheet" onChange={NOOP}>
                <FileItem
                    name="exit-ticket.pdf"
                    meta="840 KB"
                    status={event?.event === 'progress' ? 'uploading' : 'done'}
                    progress={event?.event === 'progress' ? Math.round(25 + progress * 75) : undefined}
                />
            </FileUpload>
        </div>
    ),

    FilterButton: ({ step }) => (
        <FilterButton
            text={step === 'landing' ? 'Subject: Algebra' : 'Subject'}
            isSelected={step === 'landing'}
            trailingMetric={step === 'landing' ? 2 : undefined}
            spacing="compact"
            onClick={NOOP}
        />
    ),

    FilterMenu: ({ step }) => (
        <FilterMenu
            label="Session filters"
            spacing="compact"
            categories={CARD_FILTER_CATEGORIES}
            value={{ status: step === 'landing' ? ['Upcoming'] : [] }}
            onApply={NOOP}
        />
    ),

    Flag: ({ event }) => (
        <div style={{ width: '100%' }}>
            <Flag
                title={event?.event === 'failed' ? 'Could not save notes' : 'Session saved'}
                appearance={
                    event?.event === 'failed'
                        ? 'error'
                        : event?.event === 'milestone'
                            ? 'success'
                            : 'information'
                }
                show
                autohide={false}
                sound={false}
                onDismiss={NOOP}
            >
                Updated for Maya Lin.
            </Flag>
        </div>
    ),

    GenerativeBorder: ({ step }) => (
        <GenerativeBorder isActive={step === 'landing'} radius="radius-lg">
            <div
                style={{
                    padding: 'var(--card-pad)',
                    background: 'var(--ds-surface)',
                    borderRadius: 'var(--radius-lg)',
                    font: 'var(--body-sm)',
                    color: 'var(--ds-text)',
                }}
            >
                Drafting session summary…
            </div>
        </GenerativeBorder>
    ),

    IconButton: ({ step }) => (
        <IconButton
            icon="bookmark"
            label="Bookmark session"
            isSelected={step === 'landing'}
            isTooltipDisabled
            onClick={NOOP}
        />
    ),

    InlineEdit: ({ step }) => (
        <div style={{ width: '100%' }}>
            <InlineEdit
                label="Session goal"
                spacing="compact"
                defaultValue={step === 'landing' ? 'Equivalent fractions' : 'Number lines'}
                readView={() => (
                    <span>{step === 'landing' ? 'Equivalent fractions' : 'Number lines'}</span>
                )}
                editView={({ value, onChange, id }) => (
                    <TextField id={id} value={value ?? ''} onChange={onChange} spacing="compact" />
                )}
                onConfirm={NOOP}
            />
        </div>
    ),

    InlineEditableTextfield: ({ step }) => (
        <div style={{ width: '100%' }}>
            <InlineEditableTextfield
                label="Student nickname"
                spacing="compact"
                value={step === 'landing' ? 'Maya L.' : 'Maya'}
                placeholder="Enter nickname"
                onConfirm={NOOP}
            />
        </div>
    ),

    InlineMessage: () => (
        <InlineMessage
            appearance="info"
            label="Grading rubric info"
            title="Mastery check"
            secondaryText="4 of 5 problems required"
        >
            Students can retry missed items once.
        </InlineMessage>
    ),

    Link: () => (
        <Link href="#session-notes">
            View session summary
        </Link>
    ),

    LinkButton: () => (
        <LinkButton href="#session-plan" appearance="primary" spacing="compact" onClick={(e) => e.preventDefault()}>
            Open lesson plan
        </LinkButton>
    ),

    LinkIconButton: () => (
        <LinkIconButton
            href="#open-new"
            icon="arrow-up-right-from-square"
            label="Open in new tab"
            onClick={(e) => e.preventDefault()}
        />
    ),

    NotificationItem: ({ step }) => (
        <div style={{ width: '100%' }}>
            <NotificationItem
                title="Maya Lin submitted Warm-up #4"
                meta="2m ago · Grade 6 Math"
                unread={step !== 'landing'}
                onClick={(e) => e.preventDefault()}
                onMarkRead={NOOP}
            />
        </div>
    ),

    PageHeader: () => (
        <div style={{ width: '100%' }}>
            <PageHeader
                disableTitleStyles
                title={<Heading size="sm" as="div">Upcoming sessions</Heading>}
                actions={<Button spacing="compact" onClick={NOOP}>Schedule</Button>}
            />
        </div>
    ),

    Pagination: ({ step }) => (
        <Pagination
            currentPage={step === 'landing' ? 2 : 1}
            totalPages={4}
            onPageChange={NOOP}
        />
    ),

    Popup: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--stack-lg)',
            }}
        >
            <Popup
                trigger={<Button spacing="compact" onClick={NOOP}>Session details</Button>}
                title="Room 204"
                show={false}
            >
                Bring fraction tiles.
            </Popup>
            <div
                className="plus-popup"
                style={{
                    padding: 'var(--card-pad)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--ds-surface-overlay)',
                    boxShadow: 'var(--ds-shadow-overlay)',
                    font: 'var(--body-sm)',
                    color: 'var(--ds-text)',
                }}
            >
                Room 204 · Bring fraction tiles.
            </div>
        </div>
    ),

    PopupSelect: ({ step }) => (
        <PopupSelect
            label="Filter status"
            options={SELECT_OPTIONS}
            value={step === 'landing' ? 'geometry' : 'algebra'}
            spacing="compact"
            onChange={NOOP}
        />
    ),

    ProgressBar: ({ event, progress, step }) => (
        <div style={{ width: '100%' }}>
            <ProgressBar
                ariaLabel="Lesson completion"
                appearance={event?.event === 'success' && step === 'landing' ? 'success' : 'default'}
                value={event?.event === 'success' ? 100 : Math.round(20 + progress * 65)}
            />
        </div>
    ),

    ProgressIndicator: ({ step }) => (
        <ProgressIndicator
            label="Onboarding steps"
            values={['Welcome', 'Profile', 'Schedule']}
            selectedIndex={step === 'landing' ? 1 : 0}
        />
    ),

    ProgressRing: ({ progress }) => (
        <ProgressRing
            label="Upload progress"
            value={Math.round(15 + progress * 75)}
        />
    ),

    ProgressTracker: ({ event, step }) => (
        <div style={{ width: '100%' }}>
            <ProgressTracker
                label="Session milestones"
                spacing="compact"
                items={[
                    { id: 'warmup', label: 'Warm-up', status: 'visited' },
                    {
                        id: 'practice',
                        label: 'Practice',
                        status: step === 'landing' ? 'visited' : 'current',
                    },
                    {
                        id: 'exit',
                        label: 'Exit ticket',
                        status:
                            event?.event === 'success' && step === 'landing'
                                ? 'visited'
                                : step === 'landing'
                                    ? 'current'
                                    : 'unvisited',
                    },
                ]}
            />
        </div>
    ),

    PromptInput: ({ step }) => (
        <div style={{ width: '100%' }}>
            <PromptInput
                label="Tutor assistant prompt"
                value="Draft three fraction word problems"
                isLoading={step === 'landing'}
                onChange={NOOP}
                onSubmit={NOOP}
                onStop={NOOP}
            />
        </div>
    ),

    PromptStarters: () => (
        <PromptStarters
            label="Suggested prompts"
            starters={[
                { id: 'warmup', label: 'Create a 5-minute warm-up', text: 'Create a 5-minute warm-up' },
                { id: 'recap', label: 'Summarize session notes', text: 'Summarize session notes' },
            ]}
            onSelect={NOOP}
        />
    ),

    Radio: ({ step }) => (
        <Radio
            name="session-length-demo"
            value="45"
            label="45-minute session"
            isChecked={step === 'landing'}
            onChange={NOOP}
        />
    ),

    RadioGroup: ({ step }) => (
        <RadioGroup
            name="cadence-demo"
            legend="Session cadence"
            options={[
                { label: 'Weekly', value: 'weekly' },
                { label: 'Twice weekly', value: 'twice' },
            ]}
            value={step === 'landing' ? 'twice' : 'weekly'}
            onChange={NOOP}
        />
    ),

    Range: ({ progress }) => (
        <div style={{ width: '100%' }}>
            <Range
                label="Difficulty level"
                min={0}
                max={100}
                value={Math.round(30 + progress * 45)}
                onChange={NOOP}
            />
        </div>
    ),

    Rating: ({ step }) => (
        <Rating
            label="Session rating"
            value={step === 'landing' ? 5 : 3}
            showCommentsLabel={false}
            onChange={NOOP}
        />
    ),

    SearchField: ({ step, isExit }) => (
        <div style={{ width: '100%' }}>
            <SearchField
                label="Search students"
                placeholder="Search students"
                value={step === 'landing' && !isExit ? 'Maya Lin' : ''}
                onValueChange={NOOP}
            />
        </div>
    ),

    SectionMessage: () => (
        <div style={{ width: '100%' }}>
            <SectionMessage
                appearance="info"
                title="Session moved to Thursday"
                headingLevel={4}
                actions={[]}
                dismissible={false}
            >
                Updated on both tutor and family calendars.
            </SectionMessage>
        </div>
    ),

    Select: ({ step }) => (
        <div style={{ width: '100%' }}>
            <Select
                label="Subject area"
                spacing="compact"
                isSearchable={false}
                options={SELECT_OPTIONS}
                value={step === 'landing' ? 'geometry' : 'algebra'}
                onChange={NOOP}
            />
        </div>
    ),

    SettingRow: ({ step }) => (
        <div style={{ width: '100%' }}>
            <SettingRow
                label="Email reminders"
                description="Send 24 hours before each session."
                control={<Toggle aria-label="Email reminders" isChecked={step === 'landing'} onChange={NOOP} />}
            />
        </div>
    ),

    Skeleton: ({ step }) => (
        <div style={{ width: '100%' }}>
            {step === 'landing' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                    <Skeleton preset="paragraph" lines={2} />
                </div>
            ) : (
                <Skeleton preset="paragraph" lines={3} />
            )}
        </div>
    ),

    Spinner: () => <Spinner size={24} label="Loading session" />,

    SplitButton: ({ step }) => (
        <SplitButton>
            <Button appearance="primary" spacing="compact" isSelected={step === 'landing'} onClick={NOOP}>
                Save notes
            </Button>
            <IconButton
                icon="chevron-down"
                label="More save options"
                appearance="primary"
                spacing="compact"
                isTooltipDisabled
                onClick={NOOP}
            />
        </SplitButton>
    ),

    Suggestion: ({ step }) => (
        <Suggestion
            label={step === 'landing' ? 'Common denominators' : 'Number line model'}
            type="insert"
            onAccept={NOOP}
        />
    ),

    DynamicTable: ({ step }) => (
        <div style={{ width: '100%' }}>
            <DynamicTable
                label="Session roster"
                head={{ cells: [{ key: 'student', content: 'Student' }, { key: 'status', content: 'Status' }] }}
                rows={(step === 'landing'
                    ? [['Maya Lin', 'Present'], ['Leo Park', 'Joined']]
                    : [['Maya Lin', 'Present']]
                ).map(([student, status]) => ({
                    key: student,
                    cells: [{ key: 'student', content: student }, { key: 'status', content: status }],
                }))}
            />
        </div>
    ),

    TreeTable: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TreeTable
                label="School roster"
                head={{ cells: [{ key: 'name', content: 'Name' }, { key: 'type', content: 'Type' }] }}
                items={[{
                    id: 'lincoln',
                    cells: [{ content: 'Lincoln Middle' }, { content: 'School' }],
                    children: [
                        { id: 'g7', cells: [{ content: 'Grade 7 · Math' }, { content: 'Class' }] },
                        { id: 'g6', cells: [{ content: 'Grade 6 · Reading' }, { content: 'Class' }] },
                    ],
                }]}
                expandedIds={step === 'landing' ? ['lincoln'] : []}
                onExpandedChange={NOOP}
            />
        </div>
    ),

    Tabs: ({ step }) => (
        <div style={{ width: '100%' }}>
            <Tabs activeKey={step === 'landing' ? 'notes' : 'goals'} onSelect={NOOP} spacing="compact">
                <Tabs.Tab eventKey="goals">Goals</Tabs.Tab>
                <Tabs.Tab eventKey="notes">Notes</Tabs.Tab>
                <Tabs.Panel eventKey="goals">Compare fractions on a number line.</Tabs.Panel>
                <Tabs.Panel eventKey="notes">Completed 4 of 5 warm-up items.</Tabs.Panel>
            </Tabs>
        </div>
    ),

    TagInput: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TagInput
                label="Focus tags"
                spacing="compact"
                options={['Fractions', 'Decimals', 'Ratios']}
                tags={step === 'landing' ? ['Fractions', 'Decimals'] : ['Fractions']}
                onChange={NOOP}
            />
        </div>
    ),

    TextArea: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TextArea
                label="Session summary"
                spacing="compact"
                rows={2}
                value={step === 'landing' ? 'Mastered equivalent fractions.' : 'Working on number lines.'}
                onChange={NOOP}
            />
        </div>
    ),

    TextField: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TextField
                label="Session title"
                spacing="compact"
                value={step === 'landing' ? 'Fractions & Ratios' : 'Fractions'}
                onChange={NOOP}
            />
        </div>
    ),

    TimePicker: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TimePicker
                spacing="compact"
                value={step === 'landing' ? '04:00 PM' : '03:30 PM'}
                onChange={NOOP}
            />
        </div>
    ),

    Toggle: ({ step }) => (
        <Toggle
            label="Record session"
            isChecked={step === 'landing'}
            onChange={NOOP}
        />
    ),

    Tooltip: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--stack-lg)',
            }}
        >
            <div className="plus-tooltip">
                Copy session link
            </div>
            <Tooltip text="Copy session link" placement="top" show={false}>
                <IconButton
                    icon="link"
                    label="Copy session link"
                    spacing="compact"
                    isTooltipDisabled
                    onClick={NOOP}
                />
            </Tooltip>
        </div>
    ),

    TreeSelect: ({ step }) => (
        <div style={{ width: '100%' }}>
            <TreeSelect
                label="Standard"
                spacing="compact"
                options={TREE_OPTIONS}
                value={step === 'landing' ? 'linear-eq' : undefined}
                onChange={NOOP}
            />
        </div>
    ),
});

const POPUP_LIKE_COMPONENTS = new Set([
    'Popup',
    'DropdownMenu',
    'Select',
    'PopupSelect',
    'FilterMenu',
    'SplitButton',
    'Calendar',
    'DatePicker',
    'DateTimePicker',
    'TimePicker',
    'Cascader',
    'TreeSelect',
]);

/**
 * Resolves a registry token name into a `motion/react` spring or linear config,
 * scaled by `fastForward` for headless test runs.
 */
export const motionSpecForToken = (token, mode = 'productive', fastForward = 1) => {
    const speed = Math.max(0.25, fastForward || 1);
    if (!token || token === 'linear') {
        return { ease: 'linear', duration: BEAT / speed };
    }
    const resolved = token === 'loop' ? 'appearance.default' : token;
    const base = springFor(resolved, mode);
    if (speed === 1) return base;
    return {
        ...base,
        stiffness: base.stiffness * speed * speed,
        damping: base.damping * speed,
    };
};

const SETTLED_STYLE = Object.freeze({
    opacity: 1,
    scale: 1,
    scaleY: 1,
    x: 0,
    y: 0,
});

/**
 * Computes the starting and landing styles for a component card's event
 * transition, driven by that event's registry tokens. Every transition settles
 * at full contrast (`opacity: 1`) so the component is legible at rest.
 */
const stylesForEvent = (rowName, event, step, isReduced) => {
    if (isReduced || step === 'landing') {
        if (!isReduced && event?.transition === 'Call attention' && /shake/i.test(event?.note ?? '')) {
            return {
                opacity: 1,
                scale: 1,
                scaleY: 1,
                x: [0, -7, 7, -4, 4, 0],
                y: 0,
            };
        }
        return SETTLED_STYLE;
    }

    const transitionName = event?.transition ?? 'Update a value or state';
    const eventName = event?.event ?? 'change';
    const isExit = eventName === 'exit' || eventName === 'dismiss' || eventName === 'floating-exit';

    switch (transitionName) {
        case 'Open and close an overlay': {
            if (rowName === 'Flag') {
                return {
                    opacity: 0.25,
                    scale: 1,
                    scaleY: 1,
                    x: eventName === 'dismiss' ? 0 : 20,
                    y: 0,
                };
            }
            if (POPUP_LIKE_COMPONENTS.has(rowName)) {
                return {
                    opacity: 0.25,
                    scale: 1,
                    scaleY: 0.92,
                    x: 0,
                    y: isExit ? -6 : 6,
                };
            }
            // Floating layers (Modal, Tooltip): scale from 96% + fade on enter; 98% + fade on exit
            return {
                opacity: 0.2,
                scale: isExit ? 0.98 : 0.96,
                scaleY: 1,
                x: 0,
                y: 0,
            };
        }

        case 'Add or remove an item': {
            return {
                opacity: 0.2,
                scale: 1,
                scaleY: 0.85,
                x: 0,
                y: isExit ? -6 : 6,
            };
        }

        case 'Expand and collapse': {
            return {
                opacity: 0.35,
                scale: 1,
                scaleY: 0.88,
                x: 0,
                y: 0,
            };
        }

        case 'Call attention': {
            return {
                opacity: /shake/i.test(event?.note ?? '') ? 1 : 0.35,
                scale: 1,
                scaleY: 1,
                x: 0,
                y: 0,
            };
        }

        case 'Load content': {
            return {
                opacity: 0.3,
                scale: 1,
                scaleY: 1,
                x: 0,
                y: 0,
            };
        }

        case 'Swap content in place': {
            return {
                opacity: 0.25,
                scale: 1,
                scaleY: 1,
                x: 0,
                y: 0,
            };
        }

        case 'Switch views':
        case 'Step to the next or previous':
        case 'Drill into and climb back out':
        case 'Dock and undock a panel': {
            return {
                opacity: 0.35,
                scale: 1,
                scaleY: 1,
                x: isExit ? -18 : 18,
                y: 0,
            };
        }

        case 'Scroll to a spot on the page': {
            return {
                opacity: 0.4,
                scale: 1,
                scaleY: 1,
                x: 0,
                y: 10,
            };
        }

        case 'Update a value or state':
        default: {
            return {
                opacity: 0.45,
                scale: 0.99,
                scaleY: 1,
                x: 0,
                y: 0,
            };
        }
    }
};

/**
 * Live component stage for a component-tier row in the Motion · Library gallery.
 * Renders the real PLUS component only once the card enters the viewport, and
 * animates each event on its registry tokens through `motion/react` with
 * `springFor(token, mode)`.
 */
export const MotionComponentStage = ({
    row,
    event,
    renderSubject,
    mode = 'productive',
    reduced,
    replayKey = 0,
    fastForward = 1,
    playOnInView = true,
}) => {
    const osReduced = useReducedMotion();
    const isReduced = reduced ?? Boolean(osReduced);
    const stageRef = useRef(null);
    const [overlayRoot, setOverlayRoot] = useState(null);
    const [inView, setInView] = useState(() => !playOnInView);
    const [phase, setPhase] = useState(() => (isReduced && replayKey === 0 ? 'still' : 'idle'));
    const [passes, setPasses] = useState(0);
    const [step, setStep] = useState(() => (isReduced && replayKey === 0 ? 'landing' : 'start'));
    const [progress, setProgress] = useState(() => (isReduced && replayKey === 0 ? 1 : 0));

    const sceneId = `${row.tier}-${row.name}-${event?.event ?? 'default'}`;

    useEffect(() => {
        if (!playOnInView) {
            setInView(true);
            return undefined;
        }
        const el = stageRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return undefined;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setInView(true);
                    io.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [playOnInView]);

    useEffect(() => {
        if (isReduced && replayKey === 0) {
            setPhase('still');
            setStep('landing');
            setProgress(1);
            return undefined;
        }
        if (!inView) return undefined;

        let cancelled = false;
        let controls = null;
        let preControls = null;

        setPhase('playing');
        setStep('start');
        setProgress(0);

        const tokens = event?.tokens ?? [];
        const primaryToken =
            tokens.find((t) => t.startsWith('spatial.')) ??
            tokens.find((t) => t.startsWith('appearance.')) ??
            tokens[0] ??
            'appearance.fast';
        const spec = motionSpecForToken(primaryToken, mode, fastForward);
        const speed = Math.max(0.25, fastForward || 1);

        // Hold initial state for a short lead beat so the start-to-landing
        // change is visible, then drive the transition on the event's token.
        preControls = animate(0, 1, {
            ease: 'linear',
            duration: (BEAT * 0.2) / speed,
            onComplete: () => {
                if (cancelled) return;
                setStep('landing');
                controls = animate(0, 1, {
                    ...spec,
                    onComplete: () => {
                        if (cancelled) return;
                        setProgress(1);
                        setStep('landing');
                        setPasses((p) => p + 1);
                        setPhase('settled');
                    },
                });
            },
        });

        return () => {
            cancelled = true;
            preControls?.stop();
            controls?.stop();
        };
    }, [inView, isReduced, replayKey, event?.event, mode, fastForward]);

    const tokens = event?.tokens ?? [];
    const primaryToken =
        tokens.find((t) => t.startsWith('spatial.')) ??
        tokens.find((t) => t.startsWith('appearance.')) ??
        tokens[0] ??
        'appearance.fast';
    const motionTransition = motionSpecForToken(primaryToken, mode, fastForward);
    const isExit =
        event?.event === 'exit' || event?.event === 'dismiss' || event?.event === 'floating-exit';
    const showSkeletonLead =
        event?.transition === 'Load content' &&
        row.name !== 'Skeleton' &&
        row.name !== 'Spinner' &&
        row.name !== 'ProgressBar' &&
        row.name !== 'ProgressRing' &&
        row.name !== 'FileItem' &&
        row.name !== 'FileUpload' &&
        row.name !== 'GenerativeBorder' &&
        step === 'start' &&
        !isReduced;

    const frameStyle = stylesForEvent(row.name, event, step, isReduced);
    const roundedProgress = Math.round(progress * 100) / 100;

    return (
        <div
            ref={stageRef}
            data-motion-demo={sceneId}
            data-phase={phase}
            data-passes={String(passes)}
            data-reduced={String(isReduced)}
            data-mode={mode}
            data-in-view={String(inView)}
            data-subject="component"
            data-landing={JSON.stringify({ [sceneId]: { progress: 1 } })}
            style={{
                position: 'relative',
                minHeight: 168,
                padding: 'calc(var(--card-pad) * 2)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--ds-surface-sunken)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            <div
                ref={setOverlayRoot}
                data-scene={sceneId}
                data-state={JSON.stringify({ progress: roundedProgress })}
                data-step={step}
                style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {inView ? (
                    <HeadingContextProvider value={4}>
                        <OverlayContainer container={overlayRoot} boundary={overlayRoot}>
                            <motion.div
                                data-motion-component-subject={row.name}
                                animate={frameStyle}
                                transition={motionTransition}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transformOrigin: 'top center',
                                }}
                            >
                                {showSkeletonLead ? (
                                    <div style={{ width: '100%' }} data-motion-skeleton-lead>
                                        <Skeleton preset="paragraph" lines={2} />
                                    </div>
                                ) : (
                                    renderSubject({
                                        row,
                                        event,
                                        step,
                                        progress,
                                        isExit,
                                        reduced: isReduced,
                                        mode,
                                        container: overlayRoot,
                                    })
                                )}
                            </motion.div>
                        </OverlayContainer>
                    </HeadingContextProvider>
                ) : null}
            </div>
        </div>
    );
};

MotionComponentStage.propTypes = {
    row: PropTypes.object.isRequired,
    event: PropTypes.object,
    renderSubject: PropTypes.func.isRequired,
    mode: PropTypes.oneOf(['productive', 'expressive']),
    reduced: PropTypes.bool,
    replayKey: PropTypes.number,
    fastForward: PropTypes.number,
    playOnInView: PropTypes.bool,
};

/**
 * Default subject resolver for `MotionLibraryCard`: renders a `MotionComponentStage`
 * for every component-tier row in `COMPONENT_SUBJECTS`, and returns `null` for
 * template/pattern rows or explicit `COMPONENT_SUBJECT_FALLBACKS` rows so they
 * keep their transition kit drawing.
 */
export const renderComponentSubject = (
    row,
    event,
    { replayKey = 0, reduced, mode = 'productive', fastForward = 1, playOnInView = true } = {},
) => {
    if (!row || row.tier !== 'component') return null;
    if (Object.prototype.hasOwnProperty.call(COMPONENT_SUBJECT_FALLBACKS, row.name)) {
        return null;
    }
    const renderFn = COMPONENT_SUBJECTS[row.name];
    if (!renderFn) return null;
    return (
        <MotionComponentStage
            row={row}
            event={event}
            renderSubject={renderFn}
            mode={mode}
            reduced={reduced}
            replayKey={replayKey}
            fastForward={fastForward}
            playOnInView={playOnInView}
        />
    );
};
