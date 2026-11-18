import React, { useState } from 'react';
import {
    Banner, Breadcrumb, Button, EmptyState,
    SearchField, Skeleton, StatusTag, TextField,
} from '@/components';
import { PatternCard, PatternSection, PatternTable } from '@/patterns';

export default {
    title: 'Patterns/Overview/Code examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const STATUSES = ['All', 'Needs review', 'Reviewed'];

export const Filtering = {
    tags: ['pattern:Filtering'],
    render: function QuickFilterExample() {
        const [status, setStatus] = useState('All');
        return (
            <PatternSection
                title="Sessions"
                filters={[{
                    key: 'status',
                    label: 'Status',
                    text: status,
                    isSelected: status !== 'All',
                    onClick: () => setStatus(STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length]),
                }]}
            >
                <p role="status">Showing: {status}</p>
            </PatternSection>
        );
    },
};

export const Search = {
    tags: ['pattern:Search'],
    render: function SearchExample() {
        const [query, setQuery] = useState('');
        return (
            <PatternSection
                title="Students"
                search={<SearchField placeholder="Search students" mode="active" spacing="compact" value={query} onValueChange={setQuery} />}
            >
                <p role="status">{['Ana Ruiz', 'Ben Okafor'].filter((name) => name.toLowerCase().includes(query.toLowerCase())).join(', ')}</p>
            </PatternSection>
        );
    },
};

export const CommonActions = {
    tags: ['pattern:CommonActions'],
    render: function ActionsExample() {
        return (
            <PatternCard title="Review notes" footer={
                <div style={{ display: 'flex', gap: 'var(--inline-sm)' }}>
                    <Button text="Cancel" />
                    <Button text="Save notes" appearance="primary" />
                </div>
            }>
                <TextField label="Notes" defaultValue="Start with unit rates." />
            </PatternCard>
        );
    },
};

export const Forms = {
    tags: ['pattern:Forms'],
    render: function FormExample() {
        const [name, setName] = useState('');
        return (
            <form onSubmit={(event) => event.preventDefault()}>
                <TextField label="Student name" value={name} onChange={(event) => setName(event.target.value)}
                    caption="Use the name the student goes by." />
                <Button text="Add student" appearance="primary" type="submit" />
            </form>
        );
    },
};

export const Navigation = {
    tags: ['pattern:Navigation'],
    render: function NavigationExample() {
        return <Breadcrumb items={[{ text: 'Sessions', href: '#sessions' }, { text: 'Session review' }]} />;
    },
};

export const Indicators = {
    tags: ['pattern:Indicators'],
    render: function IndicatorExample() {
        return <StatusTag appearance="warning">Needs review</StatusTag>;
    },
};

export const Notifications = {
    tags: ['pattern:Notifications'],
    render: function NotificationExample() {
        return <Banner appearance="announcement">Session reports will be available Friday.</Banner>;
    },
};

export const Empty = {
    tags: ['pattern:Empty'],
    render: function EmptyExample() {
        return (
            <PatternTable empty emptyState={
                <EmptyState spacing="compact" header="No matching sessions" description="Try another search or reset the filters."
                    secondaryAction={<Button text="Reset filters" spacing="compact" />} />
            }>
                <thead><tr><th>Student</th><th>Status</th></tr></thead>
                <tbody />
            </PatternTable>
        );
    },
};

export const Loading = {
    tags: ['pattern:Loading'],
    render: function LoadingExample() {
        return <div role="status" aria-label="Loading session notes"><Skeleton preset="paragraph" /></div>;
    },
};

export const Errors = {
    tags: ['pattern:Errors'],
    render: function ErrorExample() {
        return <TextField label="Student name" isInvalid errorMessage="Enter the student name." />;
    },
};

export const Disabled = {
    tags: ['pattern:Disabled'],
    render: function DisabledExample() {
        return (
            <div>
                <p id="review-reason">Add review notes before saving.</p>
                <Button text="Save review" isDisabled aria-describedby="review-reason" />
            </div>
        );
    },
};

export const ReadOnly = {
    tags: ['pattern:ReadOnly'],
    render: function ReadOnlyExample() {
        return <TextField label="Student ID" value="S-1042" isReadOnly caption="Assigned by the school." />;
    },
};

export const Overflow = {
    tags: ['pattern:Overflow'],
    render: function OverflowExample() {
        return (
            <PatternSection title="Fractions, decimals and percentages: weekly review for the seventh grade group">
                <p>The section title wraps so the full topic stays readable.</p>
            </PatternSection>
        );
    },
};
