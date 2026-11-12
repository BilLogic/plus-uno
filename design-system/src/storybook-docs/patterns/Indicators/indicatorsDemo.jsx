import React from 'react';

import { ChangeTag, CountTag, DynamicTable, Heading, StatusTag } from '@/components';

/**
 * The Indicators pattern's examples: the three tags in the places they sit,
 * each a real component with the state its heading names set through props.
 *
 *   Tags         Status, Count and Change, side by side
 *   InARow       one Status tag per table row, at the default spacing
 *   BesideTitle  a spacious Status tag after a page title
 *   OnNavigation counts on items: quiet, bold, nothing at zero, a cap
 *   NotColorOnly an icon joined to the color on a status told apart at a glance
 *   UpIsBad      a rise that is bad, in danger
 *   RollUp       a group showing the worst state among its children
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 640; // docs-literal

const frame = { padding: 'var(--page-pad)' };
const line = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', flexWrap: 'wrap' };
const text = { font: 'var(--body-default)', color: 'var(--ds-text)' };
const subtle = { font: 'var(--body-default)', color: 'var(--ds-text-subtle)' };

/** The six appearances, each with its fixed meaning. */
export const STATUSES = [
    ['neutral', 'Not started'],
    ['info', 'In progress'],
    ['success', 'Completed'],
    ['warning', 'Needs review'],
    ['danger', 'Missed'],
    ['discovery', 'New'],
];

/** The three tags, one job each: a state, how many, how much it moved. */
export const Tags = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
        <div style={line}>
            <span style={subtle}>State</span>
            {STATUSES.map(([appearance, label]) => <StatusTag key={appearance} appearance={appearance}>{label}</StatusTag>)}
        </div>
        <div style={line}>
            <span style={subtle}>How many</span>
            <CountTag value={4} label="4 unread" />
            <CountTag value={12} isBold label="12 to review" />
            <CountTag value={120} label="99 or more" />
        </div>
        <div style={line}>
            <span style={subtle}>How much it moved</span>
            <ChangeTag value={3} goodDirection="up" comparison="vs last week" />
            <ChangeTag value={-12} format="percent" goodDirection="down" comparison="vs last month" />
            <ChangeTag value={2} goodDirection="none" comparison="vs last week" />
        </div>
    </div>
);

const SESSIONS = [
    ['Thursday, 4:00 PM', 'Ana Ruiz', 'info', 'Scheduled'],
    ['Wednesday, 3:30 PM', 'Marcus Lee', 'warning', 'Needs review'],
    ['Tuesday, 4:00 PM', 'Sofia Ramirez', 'danger', 'Missed'],
    ['Monday, 4:00 PM', 'Jordan Patel', 'success', 'Completed'],
];

/** One Status tag per row, a word or two, at the default spacing. */
export const InARow = () => (
    <div style={frame}>
        <DynamicTable
            label="Sessions"
            isFixedSize
            head={{ cells: [{ key: 'when', content: 'Session' }, { key: 'who', content: 'Student' }, { key: 'status', content: 'Status' }] }}
            rows={SESSIONS.map(([when, who, appearance, status]) => ({
                key: when,
                cells: [
                    { key: `${when}-w`, content: when },
                    { key: `${when}-s`, content: who },
                    { key: `${when}-t`, content: <StatusTag appearance={appearance}>{status}</StatusTag> },
                ],
            }))}
        />
    </div>
);

/** A spacious Status tag after the page title. */
export const BesideTitle = () => (
    <div style={{ ...frame, ...line }}>
        <Heading size="large">Session with Ana Ruiz</Heading>
        <StatusTag appearance="warning" spacing="spacious">Needs review</StatusTag>
    </div>
);

/** An item's count: quiet by default, bold when it asks for action now, nothing at zero, a cap past max. */
export const OnNavigation = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-md)' }}>
        {[
            ['Inbox', <CountTag key="a" value={3} label="3 unread" />],
            ['Reflections', <CountTag key="b" value={5} isBold label="5 reflections to write" />],
            ['Archive', <CountTag key="c" value={0} label="No items" />],
            ['Messages', <CountTag key="d" value={120} label="99 or more messages" />],
        ].map(([name, count]) => (
            <div key={name} data-nav-item={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={text}>{name}</span>
                {count}
            </div>
        ))}
    </div>
);

/** A status told apart at a glance: the color is joined by a leading icon. */
export const NotColorOnly = ({ icon = true }) => (
    <div style={{ ...frame, ...line }}>
        <StatusTag appearance="danger" iconBefore={icon ? 'circle-exclamation' : undefined}>Missed</StatusTag>
        <StatusTag appearance="success" iconBefore={icon ? 'circle-check' : undefined}>Completed</StatusTag>
    </div>
);

/** Absences rose by 3: up, and in danger, because the good direction is down. */
export const UpIsBad = ({ goodDirection = 'down' }) => (
    <div style={{ ...frame, ...line }}>
        <span style={text}>Absences</span>
        <ChangeTag value={3} goodDirection={goodDirection} comparison="vs last week" />
    </div>
);

/** A group shows the worst state among its children: danger over warning over information. */
export const RollUp = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
        <div style={{ ...line, justifyContent: 'space-between' }}>
            <span style={{ ...text, font: 'var(--heading-xsmall)' }}>Group: Fractions</span>
            <StatusTag appearance="danger">Missed</StatusTag>
        </div>
        {SESSIONS.slice(0, 3).map(([when, , appearance, status]) => (
            <div key={when} style={{ ...line, justifyContent: 'space-between', paddingInlineStart: 'var(--inline-lg)' }}>
                <span style={subtle}>{when}</span>
                <StatusTag appearance={appearance}>{status}</StatusTag>
            </div>
        ))}
    </div>
);
