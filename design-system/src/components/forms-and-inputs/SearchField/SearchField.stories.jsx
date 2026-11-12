import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import SearchField from './SearchField';

const stack = { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' };
const SCOPES = [
    { value: 'students', label: 'Students', count: 42 },
    { value: 'sessions', label: 'Sessions', count: 8 },
];

export default {
    title: 'Components/Forms and inputs/Search field',
    component: SearchField,
    tags: ['!dev', '!autodocs', 'new'],
    parameters: { docs: { toc: { title: 'On this page' } } },
    argTypes: {
        placeholder: { control: 'text', table: { category: 'Content' } },
        mode: { control: 'inline-radio', options: ['active'], table: { category: 'Behavior' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        isCollapsible: { control: 'boolean', table: { category: 'Behavior' } },
        isLoading: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        onValueChange: { table: { disable: true } },
    },
    args: { placeholder: 'Search students', spacing: 'default', mode: 'active' },
};

export const Overview = {
    render: (args) => <SearchField {...args} />,
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('searchbox', { name: 'Search students' });
        await expect(input).toHaveAttribute('placeholder', 'Search students');
        // The label is hidden but still names the field.
        const label = canvasElement.querySelector('label');
        await expect(label.getBoundingClientRect().height <= 1).toBe(true);
    },
};

export const Active = {
    render: (args) => {
        const [text, setText] = useState('');
        const rows = ['Ada', 'Grace', 'Alan'].filter((name) => name.toLowerCase().includes(text.toLowerCase()));
        return (
            <div style={stack}>
                <SearchField {...args} value={text} onValueChange={setText} />
                <ul data-testid="rows">{rows.map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByRole('searchbox'), 'gr');
        await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
        await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
        await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
        await expect(canvas.getByRole('searchbox')).toHaveFocus();
    },
};

export const Spacing = {
    render: () => (
        <div style={stack}>
            <SearchField placeholder="Search students" spacing="default" />
            <SearchField placeholder="Search students" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [roomy, tight] = [...canvasElement.querySelectorAll('.plus-field')].map((box) => box.getBoundingClientRect().height);
        await expect(roomy).toBe(40);
        await expect(tight).toBe(32);
    },
};

export const Filled = {
    render: () => <SearchField placeholder="Search students" defaultValue="Ada" />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Clear search' })).toBeVisible();
    },
};

export const Disabled = {
    render: () => <SearchField placeholder="Search students" isDisabled />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('searchbox')).toBeDisabled();
    },
};

export const Loading = {
    render: () => <SearchField placeholder="Search students" isLoading defaultValue="ad" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Searching').closest('.plus-search-field')).not.toBeNull();
        await expect(canvasElement.querySelector('.fa-magnifying-glass')).toBeNull();
    },
};

export const Async = {
    render: () => {
        const [summary, setSummary] = useState('');
        const [calls, setCalls] = useState(0);
        return (
            <div style={stack}>
                <SearchField
                    placeholder="Search students"
                    loadResults={async (text) => {
                        setCalls((n) => n + 1);
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        return { results: text ? [text] : [], total: text.length };
                    }}
                    onResults={({ total }) => setSummary(`${total} found`)}
                />
                <output data-testid="summary">{summary}</output>
                <output data-testid="calls">{calls}</output>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByTestId('summary')).toHaveTextContent('0 found'));
        await userEvent.type(canvas.getByRole('searchbox'), 'abc');
        // One debounced request for the whole word, with the spinner while it runs.
        await waitFor(() => expect(canvas.getByText('Searching')).toBeVisible());
        await waitFor(() => expect(canvas.getByTestId('summary')).toHaveTextContent('3 found'), { timeout: 3000 });
        // Mount plus one debounced request for the whole word, not one per key.
        await expect(canvas.getByTestId('calls')).toHaveTextContent('2');
        await expect(canvas.queryByText('Searching')).toBeNull();
    },
};

export const Collapsible = {
    render: () => (
        <div style={stack}>
            <SearchField placeholder="Search students" isCollapsible />
            <button type="button">After</button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('searchbox')).toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Search students' }));
        const input = canvas.getByRole('searchbox');
        await waitFor(() => expect(input).toHaveFocus());
        await userEvent.type(input, 'ad');
        // First Esc clears and keeps focus; the field stays open.
        await userEvent.keyboard('{Escape}');
        await expect(input).toHaveValue('');
        await expect(input).toHaveFocus();
        // Second Esc closes and returns focus to the icon.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Search students' })).toHaveFocus());
        // Left empty, it collapses on blur.
        await userEvent.click(canvas.getByRole('button', { name: 'Search students' }));
        await userEvent.click(canvas.getByRole('button', { name: 'After' }));
        await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
    },
};

export const Scopes = {
    render: () => {
        const [scope, setScope] = useState('all');
        return (
            <div style={stack}>
                <SearchField placeholder="Search students" scopes={SCOPES} scope={scope} onScopeChange={setScope} />
                <output data-testid="scope">{scope}</output>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const scope = canvas.getByRole('combobox', { name: 'Search scope' });
        await expect(scope).toHaveTextContent('All');
        await expect(canvas.getByTestId('scope')).toHaveTextContent('all');
    },
};

export const Interactive = {
    render: (args) => <SearchField {...args} />,
};
