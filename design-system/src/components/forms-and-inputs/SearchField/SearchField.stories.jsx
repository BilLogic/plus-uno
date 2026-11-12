import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import SearchField, { SearchFieldAction } from './SearchField';
import Button from '../Button/Button';

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
        mode: { control: 'inline-radio', options: ['active', 'basic', 'focused'], table: { category: 'Behavior' } },
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
            <Button>After</Button>
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

export const CollapsibleScopes = {
    render: () => (
        <div style={stack}>
            <SearchField placeholder="Search students" isCollapsible scopes={SCOPES} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('searchbox')).toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Search students' }));
        const input = canvas.getByRole('searchbox');
        await waitFor(() => expect(input).toHaveFocus());
        // Opening shows the scope filter with "All" chosen.
        await expect(canvas.getByRole('combobox', { name: 'Search scope' })).toHaveTextContent('All');
        // Esc on the empty field closes it and returns focus to the icon.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Search students' })).toHaveFocus());
    },
};

const loadSpy = fn(async () => ({ results: [], total: 0 }));

export const Basic = {
    render: () => {
        const [searched, setSearched] = useState([]);
        const [keys, setKeys] = useState(0);
        return (
            <div style={stack}>
                <SearchField
                    placeholder="Search students"
                    mode="basic"
                    loadResults={loadSpy}
                    onValueChange={() => setKeys((n) => n + 1)}
                    onSearch={(text) => setSearched((list) => [...list, text])}
                />
                <output data-testid="searched">{searched.join('|')}</output>
                <output data-testid="keys">{keys}</output>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        loadSpy.mockClear();
        await userEvent.type(canvas.getByRole('searchbox'), 'ada');
        // Typing alone runs nothing.
        await expect(canvas.getByTestId('searched')).toHaveTextContent('');
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByTestId('searched')).toHaveTextContent('ada');
        // Never loads while typing, only on Enter.
        await expect(loadSpy).not.toHaveBeenCalled();
    },
};

const PEOPLE = [
    { value: 's1', label: 'Ada Lovelace', description: 'Grade 8' },
    { value: 's2', label: 'Grace Hopper', description: 'Grade 9' },
    { value: 's3', label: 'Alan Turing', description: 'Grade 7' },
];
const SESSIONS = [{ value: 'x1', label: 'Math, Tuesday 4pm' }];

const FocusedDemo = (args) => {
    const [text, setText] = useState('');
    const [log, setLog] = useState('');
    const q = text.trim().toLowerCase();
    const students = PEOPLE.filter((p) => p.label.toLowerCase().includes(q));
    const sessions = q && 'math'.includes(q) ? SESSIONS : [];
    const results = [
        { value: 'students', label: 'Students', count: students.length, items: students },
        { value: 'sessions', label: 'Sessions', count: sessions.length, items: sessions },
    ];
    return (
        <div style={stack}>
            <SearchField
                {...args}
                mode="focused"
                value={text}
                onValueChange={setText}
                results={results}
                recent={['Ada', 'Math']}
                onSelect={(item) => setLog(`select:${item.value}`)}
                onSearch={(t) => setLog(`search:${t}`)}
            >
                <SearchFieldAction onSelect={(t) => setLog(`create:${t}`)}>{`Create student \u201C${text}\u201D`}</SearchFieldAction>
            </SearchField>
            <output data-testid="log">{log}</output>
        </div>
    );
};

export const Focused = {
    render: (args) => <FocusedDemo {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        const input = canvas.getByRole('combobox', { name: 'Search students' });
        await userEvent.click(input);
        // Focus with no text lists recent searches.
        await waitFor(() => expect(page.getByText('Recent searches')).toBeVisible());
        await expect(input).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(page.getByRole('option', { name: 'Ada' }));
        await expect(input).toHaveValue('Ada');
        // Typing: groups with counts, then See all, then the action row.
        await waitFor(() => expect(page.getByText('Students (1)')).toBeVisible());
        // Hovering a row sets the cursor; leaving the panel clears it.
        await userEvent.hover(page.getByRole('option', { name: /Ada Lovelace/ }));
        await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'));
        await userEvent.unhover(page.getByRole('listbox', { name: 'Suggestions' }));
        await waitFor(() => expect(input).not.toHaveAttribute('aria-activedescendant'));
        // A click on the See all row runs a basic search and closes the panel.
        await userEvent.click(page.getByRole('option', { name: /See all results for/ }));
        await expect(canvas.getByTestId('log')).toHaveTextContent('search:Ada');
        await waitFor(() => expect(page.queryByRole('listbox', { name: 'Suggestions' })).toBeNull());
        await expect(input).toHaveAttribute('aria-expanded', 'false');
        // Clicking the focused field opens it again; Tab away closes it.
        await userEvent.click(input);
        await waitFor(() => expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible());
        await userEvent.tab();
        await waitFor(() => expect(page.queryByRole('listbox', { name: 'Suggestions' })).toBeNull());
        // A group with nothing in it is not drawn.
        await expect(page.queryByText('Sessions (0)')).toBeNull();
    },
};

export const FocusedKeyboard = {
    render: (args) => <FocusedDemo {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        const input = canvas.getByRole('combobox', { name: 'Search students' });
        await userEvent.type(input, 'a');
        await waitFor(() => expect(page.getByRole('option', { name: /See all results for/ })).toBeVisible());
        // Arrow down to the first result, Enter chooses it.
        await userEvent.keyboard('{ArrowDown}');
        await expect(input).toHaveAttribute('aria-activedescendant');
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByTestId('log')).toHaveTextContent('select:s1');
        await waitFor(() => expect(page.queryByRole('listbox', { name: 'Suggestions' })).toBeNull());
        // Esc closes the panel and keeps the text; a second Esc clears.
        await userEvent.type(input, 'l');
        await waitFor(() => expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(page.queryByRole('listbox', { name: 'Suggestions' })).toBeNull());
        await expect(input).toHaveValue('al');
        await userEvent.keyboard('{Escape}');
        await expect(input).toHaveValue('');
        // Enter with no row under the cursor is a basic search.
        await userEvent.type(input, 'gr');
        await waitFor(() => expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible());
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByTestId('log')).toHaveTextContent('search:gr');
        // Arrows wrap: up from the first row lands on the last, down from the last on the first.
        await userEvent.clear(input);
        await userEvent.type(input, 'a');
        await waitFor(() => expect(page.getByRole('option', { name: /See all results for/ })).toBeVisible());
        const options = page.getAllByRole('option');
        await userEvent.keyboard('{ArrowDown}');
        await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        await userEvent.keyboard('{ArrowUp}');
        await expect(input).toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
        await userEvent.keyboard('{ArrowDown}');
        await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        await userEvent.clear(input);
        await userEvent.type(input, 'gr');
        // Last row: See all, then the action row, by arrow from the end.
        await userEvent.type(input, 'x');
        await waitFor(() => expect(page.getByRole('option', { name: 'Create student \u201Cgrx\u201D' })).toBeVisible());
        await userEvent.keyboard('{ArrowUp}{Enter}');
        await expect(canvas.getByTestId('log')).toHaveTextContent('create:grx');
    },
};

export const Interactive = {
    render: (args) => <SearchField {...args} />,
};
