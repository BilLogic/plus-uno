import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, ChangeTag, CountTag, DynamicTable, Heading, StatusTag } from '@/components';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import examplesSource from './IndicatorsExamples.jsx?raw';
import { typeStyle } from '../../lib/type-style.js';

/**
 * Interactive key cases for the Indicators pattern page, kept beside the
 * stories so `indicatorsDemo.jsx` stays static for other callers.
 */

/** The Show code for each do and don't example, read from `IndicatorsExamples.jsx`. */
export const CODE = showCode(examplesSource, ['DangerOnMissed', 'SuccessOnMissed', 'RiseIsBad', 'RiseIsGood']);

const frame = { padding: 'var(--page-pad)' };
const line = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', flexWrap: 'wrap' };
const text = { ...typeStyle('body-default'), color: 'var(--ds-text)' };
const subtle = { ...typeStyle('body-default'), color: 'var(--ds-text-subtle)' };

const SESSIONS = [
    ['Thursday, 4:00 PM', 'Ana Ruiz', 'info', 'Scheduled'],
    ['Wednesday, 3:30 PM', 'Marcus Lee', 'warning', 'Needs review'],
    ['Tuesday, 4:00 PM', 'Sofia Ramirez', 'danger', 'Missed'],
    ['Monday, 4:00 PM', 'Jordan Patel', 'success', 'Completed'],
];

/** Sortable table with one StatusTag per row. */
export const InARowCase = () => (
    <div style={frame}>
        <DynamicTable
            label="Sessions"
            isFixedSize
            head={{
                cells: [
                    { key: 'when', content: 'Session', isSortable: true },
                    { key: 'who', content: 'Student', isSortable: true },
                    { key: 'status', content: 'Status', isSortable: true },
                ],
            }}
            rows={SESSIONS.map(([when, who, appearance, status]) => ({
                key: when,
                cells: [
                    { key: when, content: when },
                    { key: who, content: who },
                    { key: status, content: <StatusTag appearance={appearance}>{status}</StatusTag> },
                ],
            }))}
        />
    </div>
);

/** Spacious StatusTag beside a page heading, toggled by an adjacent action button. */
export const BesideTitleCase = () => {
    const [reviewed, setReviewed] = useState(false);
    return (
        <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--inline-md)', flexWrap: 'wrap' }}>
            <div style={line}>
                <Heading size="lg">Session with Ana Ruiz</Heading>
                <StatusTag appearance={reviewed ? 'success' : 'warning'} spacing="spacious">
                    {reviewed ? 'Completed' : 'Needs review'}
                </StatusTag>
            </div>
            <Button
                appearance="subtle"
                spacing="compact"
                onClick={() => setReviewed((prev) => !prev)}
            >
                {reviewed ? 'Reopen review' : 'Mark reviewed'}
            </Button>
        </div>
    );
};

const NAV_ITEMS = [
    { name: 'Inbox', initial: 3, isBold: false, labelFor: (n) => (n > 0 ? `${n} unread` : 'No unread items') },
    { name: 'Reflections', initial: 5, isBold: true, labelFor: (n) => (n > 0 ? `${n} reflections to write` : 'No reflections to write') },
    { name: 'Archive', initial: 0, isBold: false, labelFor: () => 'No items' },
    { name: 'Messages', initial: 120, isBold: false, labelFor: (n) => (n > 99 ? '99 or more messages' : `${n} messages`) },
];

/** Plain navigation list with CountTag built from public Button API; selecting moves active state and handling decrements the count. */
export const OnNavigationCase = () => {
    const [selected, setSelected] = useState('Inbox');
    const [counts, setCounts] = useState(() => Object.fromEntries(NAV_ITEMS.map((item) => [item.name, item.initial])));
    const selectedCount = counts[selected] ?? 0;

    const handleOne = () => {
        setCounts((prev) => ({
            ...prev,
            [selected]: Math.max(0, (prev[selected] ?? 0) - 1),
        }));
    };

    return (
        <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-md)' }}>
            <nav aria-label="Workspace" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                {NAV_ITEMS.map((item) => {
                    const count = counts[item.name];
                    const isSelected = selected === item.name;
                    return (
                        <div key={item.name} data-nav-item={item.name}>
                            <Button
                                appearance="subtle"
                                isSelected={isSelected}
                                shouldFitContainer
                                style={{ justifyContent: 'space-between' }}
                                iconAfter={<CountTag value={count} isBold={item.isBold} label={item.labelFor(count)} />}
                                onClick={() => setSelected(item.name)}
                            >
                                {item.name}
                            </Button>
                        </div>
                    );
                })}
            </nav>
            <div>
                <Button
                    appearance="subtle"
                    spacing="compact"
                    isDisabled={selectedCount === 0}
                    onClick={handleOne}
                >
                    Handle item
                </Button>
            </div>
        </div>
    );
};

const COLOR_NOT_ENOUGH_ROWS = [
    { id: 'tue', label: 'Tuesday · Sofia R.', appearance: 'danger', icon: 'circle-exclamation', status: 'Missed' },
    { id: 'mon', label: 'Monday · Jordan P.', appearance: 'success', icon: 'circle-check', status: 'Completed' },
];

/** Leading icon joined to color, filterable via ViewPills. */
export const NotColorOnlyCase = ({ icon = true }) => {
    const [filter, setFilter] = useState('All');
    const visible = filter === 'All'
        ? COLOR_NOT_ENOUGH_ROWS
        : COLOR_NOT_ENOUGH_ROWS.filter((row) => row.status === filter);

    return (
        <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <ViewPills
                views={['All', 'Missed', 'Completed']}
                activeView={filter}
                onViewChange={setFilter}
            />
            <div data-testid="status-rows" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                {visible.map((row) => (
                    <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--inline-md)' }}>
                        <span style={text}>{row.label}</span>
                        <StatusTag appearance={row.appearance} iconBefore={icon ? row.icon : undefined}>
                            {row.status}
                        </StatusTag>
                    </div>
                ))}
            </div>
        </div>
    );
};

NotColorOnlyCase.propTypes = {
    icon: PropTypes.bool,
};

const ABSENCE_PERIODS = {
    'vs last week': 3,
    'vs last month': -2,
};

/** ChangeTag where up is bad, switching between comparison periods via ViewPills. */
export const UpIsBadCase = ({ goodDirection = 'down' }) => {
    const [period, setPeriod] = useState('vs last week');
    return (
        <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <ViewPills
                views={['vs last week', 'vs last month']}
                activeView={period}
                onViewChange={setPeriod}
            />
            <div style={line}>
                <span style={text}>Absences</span>
                <ChangeTag value={ABSENCE_PERIODS[period]} goodDirection={goodDirection} comparison={period} />
            </div>
        </div>
    );
};

UpIsBadCase.propTypes = {
    goodDirection: PropTypes.oneOf(['up', 'down', 'none']),
};

export const SEVERITY_RANK = { danger: 3, warning: 2, info: 1, success: 0 };

/** Picks the highest-severity item from a list of indicator states. */
export const worstIndicator = (items) => items.reduce(
    (worst, item) => ((SEVERITY_RANK[item.appearance] ?? -1) > (SEVERITY_RANK[worst.appearance] ?? -1) ? item : worst),
    items[0],
);

/** Group status rolls up the worst child state and updates when the missed session is resolved. */
export const RollUpCase = () => {
    const [tuesdayResolved, setTuesdayResolved] = useState(false);
    const children = [
        { when: 'Thursday, 4:00 PM', appearance: 'info', status: 'Scheduled' },
        { when: 'Wednesday, 3:30 PM', appearance: 'warning', status: 'Needs review' },
        tuesdayResolved
            ? { when: 'Tuesday, 4:00 PM', appearance: 'success', status: 'Completed', canToggle: true }
            : { when: 'Tuesday, 4:00 PM', appearance: 'danger', status: 'Missed', canToggle: true },
    ];
    const worst = worstIndicator(children);

    return (
        <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
            <div style={{ ...line, justifyContent: 'space-between' }}>
                <span style={{ ...text, ...typeStyle('heading-xs') }}>Group: Fractions</span>
                <StatusTag appearance={worst.appearance} data-testid="rollup-group-status">{worst.status}</StatusTag>
            </div>
            {children.map((row) => (
                <div key={row.when} style={{ ...line, justifyContent: 'space-between', paddingInlineStart: 'var(--inline-lg)' }}>
                    <span style={subtle}>{row.when}</span>
                    <div style={line}>
                        <StatusTag appearance={row.appearance}>{row.status}</StatusTag>
                        {row.canToggle ? (
                            <Button
                                appearance="subtle"
                                spacing="compact"
                                onClick={() => setTuesdayResolved((prev) => !prev)}
                            >
                                {tuesdayResolved ? 'Undo' : 'Resolve'}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
};
