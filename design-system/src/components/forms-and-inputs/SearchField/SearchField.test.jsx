import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import SearchField, { SearchFieldAction } from './SearchField';

/**
 * SearchField, driven the way a page uses it: typed text, the clear button, the
 * keyboard, and the rows a page filters or loads. The Storybook plays cover the
 * drawn result (insets, spinner, focus ring); these cover what the field reports.
 */

// jsdom draws no layout, so it has no scrollIntoView; the focused panel asks for it.
beforeAll(() => {
    Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

const search = (name = 'Search students') => screen.getByRole('searchbox', { name });
const combo = (name = 'Search students') => screen.getByRole('combobox', { name });
const clear = () => screen.getByRole('button', { name: 'Clear search' });
const panel = () => screen.queryByRole('listbox', { name: 'Suggestions' });

const NAMES = ['Ada', 'Grace', 'Alan'];

const Filtering = (props) => {
    const [text, setText] = useState('');
    const rows = NAMES.filter((name) => name.toLowerCase().includes(text.toLowerCase()));
    return (
        <>
            <SearchField placeholder="Search students" value={text} onValueChange={setText} {...props} />
            <ul>{rows.map((name) => <li key={name}>{name}</li>)}</ul>
        </>
    );
};

describe('SearchField, naming', () => {
    it('is named by its placeholder, and a label prop names it instead', () => {
        const { unmount } = render(<SearchField placeholder="Search students" />);
        expect(search()).toHaveAttribute('placeholder', 'Search students');
        unmount();
        render(<SearchField placeholder="Name" label="Find a student" />);
        expect(search('Find a student')).toBeInTheDocument();
    });

    it('shows no clear button until there is text', async () => {
        const user = userEvent.setup();
        render(<SearchField placeholder="Search students" />);
        expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
        await user.type(search(), 'a');
        expect(clear()).toBeInTheDocument();
    });

    it('takes a page\'s own words for the clear button', () => {
        render(<SearchField placeholder="Buscar" defaultValue="a" clearLabel="Borrar búsqueda" />);
        expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeInTheDocument();
    });
});

describe('SearchField, active', () => {
    it('is uncontrolled: starts from defaultValue and reports every keystroke', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<SearchField placeholder="Search students" defaultValue="a" onValueChange={onValueChange} />);
        expect(search()).toHaveValue('a');
        await user.type(search(), 'da');
        expect(search()).toHaveValue('ada');
        expect(onValueChange.mock.calls.map(([text]) => text)).toEqual(['ad', 'ada']);
    });

    it('is controlled: the page filters its rows as the text changes', async () => {
        const user = userEvent.setup();
        render(<Filtering />);
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
        await user.type(search(), 'gr');
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByText('Grace')).toBeInTheDocument();
    });

    it('stays as it was when a controlled page refuses the edit', async () => {
        const user = userEvent.setup();
        render(<SearchField placeholder="Search students" value="fixed" onValueChange={() => {}} />);
        await user.type(search(), 'x');
        expect(search()).toHaveValue('fixed');
    });

    it('clears with the button, keeps focus in the field, and the page shows all its rows again', async () => {
        const user = userEvent.setup();
        render(<Filtering />);
        await user.type(search(), 'gr');
        await user.click(clear());
        expect(search()).toHaveValue('');
        expect(search()).toHaveFocus();
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    });

    it('reports the empty text when cleared', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<SearchField placeholder="Search students" defaultValue="ada" onValueChange={onValueChange} />);
        await user.click(clear());
        expect(onValueChange).toHaveBeenLastCalledWith('');
    });

    it('clears on Escape and keeps focus; a second Escape on a field that is not collapsible does nothing more', async () => {
        const user = userEvent.setup();
        render(<SearchField placeholder="Search students" defaultValue="ada" />);
        await user.click(search());
        await user.keyboard('{Escape}');
        expect(search()).toHaveValue('');
        expect(search()).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(search()).toBeInTheDocument();
    });

    it('does not submit the page\'s form on Escape, and Enter in a form still submits it', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <SearchField placeholder="Search students" />
                <button type="submit">Go</button>
            </form>,
        );
        await user.type(search(), 'ada{Escape}');
        expect(onSubmit).not.toHaveBeenCalled();
        await user.type(search(), 'ada{Enter}');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('currently leaves the search out of a submitted form: the input has no name to submit under', async () => {
        // Design question: SearchField has no `name` prop (extra attributes go to the
        // wrapper, not the input), so a plain form post never carries the text.
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <SearchField placeholder="Search students" name="q" />
            </form>,
        );
        await user.type(search(), 'ada');
        expect([...new FormData(screen.getByTestId('form')).entries()]).toEqual([]);
    });
});

describe('SearchField, disabled and loading', () => {
    it('is disabled: not focusable, not typeable, and offers no clear button', async () => {
        const user = userEvent.setup();
        render(<SearchField placeholder="Search students" defaultValue="ada" isDisabled />);
        expect(search()).toBeDisabled();
        await user.tab();
        expect(search()).not.toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
        expect(search()).toHaveValue('ada');
    });

    it('says it is searching while isLoading, and stops when it is not', () => {
        const { rerender } = render(<SearchField placeholder="Search students" isLoading />);
        expect(screen.getByText('Searching')).toBeInTheDocument();
        rerender(<SearchField placeholder="Search students" />);
        expect(screen.queryByText('Searching')).toBeNull();
    });
});

describe('SearchField, loadResults', () => {
    it('asks once at mount, then once after typing pauses, with the text and the page', async () => {
        const user = userEvent.setup();
        const loadResults = vi.fn(async (text) => ({ results: [text], total: text.length }));
        const onResults = vi.fn();
        render(<SearchField placeholder="Search students" loadResults={loadResults} onResults={onResults} />);
        await waitFor(() => expect(onResults).toHaveBeenCalledTimes(1));
        expect(loadResults).toHaveBeenLastCalledWith('', { offset: 0, limit: 50 });
        await user.type(search(), 'abc');
        await waitFor(() => expect(onResults).toHaveBeenLastCalledWith({ results: ['abc'], total: 3 }));
        expect(loadResults).toHaveBeenCalledTimes(2);
        expect(loadResults).toHaveBeenLastCalledWith('abc', { offset: 0, limit: 50 });
    });

    it('shows the spinner while a request runs and hides it after the answer', async () => {
        const user = userEvent.setup();
        let answer;
        const loadResults = vi.fn(() => new Promise((resolve) => { answer = resolve; }));
        render(<SearchField placeholder="Search students" loadResults={loadResults} />);
        await waitFor(() => expect(screen.getByText('Searching')).toBeInTheDocument());
        answer({ results: [], total: 0 });
        await waitFor(() => expect(screen.queryByText('Searching')).toBeNull());
        await user.type(search(), 'a');
        await waitFor(() => expect(screen.getByText('Searching')).toBeInTheDocument());
        answer({ results: [], total: 0 });
        await waitFor(() => expect(screen.queryByText('Searching')).toBeNull());
    });

    it('ignores a late answer to a text that has since changed', async () => {
        const user = userEvent.setup();
        const resolvers = {};
        const loadResults = vi.fn((text) => new Promise((resolve) => { resolvers[text] = resolve; }));
        const onResults = vi.fn();
        render(<SearchField placeholder="Search students" loadResults={loadResults} onResults={onResults} />);
        await waitFor(() => expect(loadResults).toHaveBeenCalledTimes(1));
        await user.type(search(), 'a');
        await waitFor(() => expect(loadResults).toHaveBeenCalledWith('a', expect.anything()));
        await user.type(search(), 'b');
        await waitFor(() => expect(loadResults).toHaveBeenCalledWith('ab', expect.anything()));
        resolvers.a({ results: ['stale'], total: 1 });
        resolvers.ab({ results: ['fresh'], total: 1 });
        await waitFor(() => expect(onResults).toHaveBeenCalledWith({ results: ['fresh'], total: 1 }));
        expect(onResults).not.toHaveBeenCalledWith({ results: ['stale'], total: 1 });
    });

    it('stops the spinner when a request fails', async () => {
        const loadResults = vi.fn(() => Promise.reject(new Error('offline')));
        render(<SearchField placeholder="Search students" loadResults={loadResults} />);
        await waitFor(() => expect(loadResults).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByText('Searching')).toBeNull());
    });
});

describe('SearchField, basic', () => {
    it('searches on Enter only, never per keystroke', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        render(<SearchField placeholder="Search students" mode="basic" onSearch={onSearch} />);
        await user.type(search(), 'ada');
        expect(onSearch).not.toHaveBeenCalled();
        await user.keyboard('{Enter}');
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('ada');
    });

    it('currently still calls loadResults on mount and after typing pauses', async () => {
        // Design question: the docs say basic mode "does no work per keystroke", but
        // loadResults is not gated on mode, so a page that passes one gets a request
        // per typing pause. The Basic story asserts "never called" right after typing,
        // before the 250ms pause has elapsed, so it cannot see this.
        const user = userEvent.setup();
        const loadResults = vi.fn(async () => ({ results: [], total: 0 }));
        render(<SearchField placeholder="Search students" mode="basic" loadResults={loadResults} />);
        await waitFor(() => expect(loadResults).toHaveBeenCalledTimes(1));
        await user.type(search(), 'ada');
        await waitFor(() => expect(loadResults).toHaveBeenLastCalledWith('ada', expect.anything()));
    });

    it('keeps Enter from submitting the form it sits in', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <SearchField placeholder="Search students" mode="basic" />
                <button type="submit">Go</button>
            </form>,
        );
        await user.type(search(), 'ada{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('SearchField, collapsible', () => {
    const Bar = (props) => (
        <>
            <SearchField placeholder="Search students" isCollapsible {...props} />
            <button type="button">After</button>
        </>
    );

    it('starts as a button, opens into the field with focus, and shows an open field with defaultOpen', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Bar />);
        expect(screen.queryByRole('searchbox')).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Search students' }));
        await waitFor(() => expect(search()).toHaveFocus());
        unmount();
        render(<Bar defaultOpen />);
        expect(search()).toBeInTheDocument();
    });

    it('closes on the second Escape and gives focus back to the icon', async () => {
        const user = userEvent.setup();
        render(<Bar />);
        await user.click(screen.getByRole('button', { name: 'Search students' }));
        await user.type(await screen.findByRole('searchbox'), 'ad');
        await user.keyboard('{Escape}');
        expect(search()).toHaveValue('');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('searchbox')).toBeNull());
        await waitFor(() => expect(screen.getByRole('button', { name: 'Search students' })).toHaveFocus());
    });

    it('collapses when focus leaves an empty field, and stays open when it has text', async () => {
        const user = userEvent.setup();
        render(<Bar />);
        await user.click(screen.getByRole('button', { name: 'Search students' }));
        await screen.findByRole('searchbox');
        await user.click(screen.getByRole('button', { name: 'After' }));
        await waitFor(() => expect(screen.queryByRole('searchbox')).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Search students' }));
        await user.type(await screen.findByRole('searchbox'), 'ada');
        await user.click(screen.getByRole('button', { name: 'After' }));
        expect(search()).toHaveValue('ada');
    });

    it('opens already when it has text', () => {
        render(<Bar defaultValue="ada" />);
        expect(search()).toHaveValue('ada');
    });
});

describe('SearchField, scopes', () => {
    const SCOPES = [
        { value: 'students', label: 'Students', count: 12 },
        { value: 'tutors', label: 'Tutors' },
    ];

    it('puts "All" first and chosen, and asks loadResults with the chosen scope', async () => {
        const loadResults = vi.fn(async () => ({ results: [], total: 0 }));
        render(<SearchField placeholder="Search" scopes={SCOPES} loadResults={loadResults} />);
        expect(screen.getByRole('combobox', { name: 'Search scope' })).toHaveTextContent('All');
        await waitFor(() => expect(loadResults).toHaveBeenCalledWith('', { offset: 0, limit: 50, scope: 'all' }));
    });

    it('reports a scope the user picks', async () => {
        const user = userEvent.setup();
        const onScopeChange = vi.fn();
        render(<SearchField placeholder="Search" scopes={SCOPES} onScopeChange={onScopeChange} />);
        await user.click(screen.getByRole('combobox', { name: 'Search scope' }));
        await user.click(await screen.findByRole('option', { name: 'Students (12)' }));
        expect(onScopeChange).toHaveBeenCalledWith('students');
        expect(screen.getByRole('combobox', { name: 'Search scope' })).toHaveTextContent('Students (12)');
    });
});

describe('SearchField, focused panel', () => {
    const PEOPLE = [
        { value: 's1', label: 'Ada Lovelace', description: 'Grade 8' },
        { value: 's2', label: 'Grace Hopper', description: 'Grade 9' },
    ];
    const Focused = ({ onSelect, onSearch, onCreate, recent = ['Ada', 'Math'], people = PEOPLE }) => {
        const [text, setText] = useState('');
        const q = text.trim().toLowerCase();
        const items = people.filter((person) => person.label.toLowerCase().includes(q));
        return (
            <SearchField
                placeholder="Search students"
                mode="focused"
                value={text}
                onValueChange={setText}
                recent={recent}
                results={[{ value: 'students', label: 'Students', count: items.length, items }]}
                onSelect={onSelect}
                onSearch={onSearch}
            >
                {onCreate && <SearchFieldAction onSelect={onCreate}>{`Create student “${text}”`}</SearchFieldAction>}
            </SearchField>
        );
    };

    it('lists recent searches on focus, and choosing one fills the field and keeps focus', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.click(combo());
        expect(await screen.findByRole('listbox', { name: 'Suggestions' })).toBeInTheDocument();
        expect(combo()).toHaveAttribute('aria-expanded', 'true');
        await user.click(screen.getByRole('option', { name: 'Math' }));
        expect(combo()).toHaveValue('Math');
        expect(combo()).toHaveFocus();
    });

    it('shows nothing under an empty field with no recent searches', async () => {
        const user = userEvent.setup();
        render(<Focused recent={[]} />);
        await user.click(combo());
        expect(panel()).toBeNull();
        expect(combo()).toHaveAttribute('aria-expanded', 'false');
    });

    it('lists matches while typing, grouped with a count, then a See all row', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.type(combo(), 'gr');
        expect(await screen.findByText('Students (1)')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Grace Hopper/ })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Ada Lovelace/ })).toBeNull();
        expect(screen.getByRole('option', { name: /See all results for .gr./ })).toBeInTheDocument();
    });

    it('says when nothing matches, and still offers See all', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.type(combo(), 'zzz');
        expect(await screen.findByText(/No matches for/)).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /See all results for/ })).toBeInTheDocument();
    });

    it('moves through rows with the arrows, chooses with Enter, and closes the panel', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Focused onSelect={onSelect} />);
        await user.type(combo(), 'a');
        await screen.findByRole('option', { name: /See all results for/ });
        await user.keyboard('{ArrowDown}');
        const first = screen.getAllByRole('option')[0];
        expect(combo()).toHaveAttribute('aria-activedescendant', first.id);
        await user.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toMatchObject({ value: 's1' });
        await waitFor(() => expect(panel()).toBeNull());
    });

    it('wraps: up from nothing lands on the last row, down from the last on the first', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.type(combo(), 'a');
        await screen.findByRole('option', { name: /See all results for/ });
        const options = screen.getAllByRole('option');
        await user.keyboard('{ArrowUp}');
        expect(combo()).toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
        await user.keyboard('{ArrowDown}');
        expect(combo()).toHaveAttribute('aria-activedescendant', options[0].id);
    });

    it('runs a search on Enter with no row under the cursor', async () => {
        const user = userEvent.setup();
        const onSearch = vi.fn();
        render(<Focused onSearch={onSearch} />);
        await user.type(combo(), 'gr');
        await screen.findByRole('listbox', { name: 'Suggestions' });
        await user.keyboard('{Enter}');
        expect(onSearch).toHaveBeenCalledWith('gr');
        await waitFor(() => expect(panel()).toBeNull());
    });

    it('reaches the action row by arrow from the end, and hands it the text', async () => {
        const user = userEvent.setup();
        const onCreate = vi.fn();
        render(<Focused onCreate={onCreate} />);
        await user.type(combo(), 'grx');
        await screen.findByRole('option', { name: /Create student/ });
        await user.keyboard('{ArrowUp}{Enter}');
        expect(onCreate).toHaveBeenCalledWith('grx');
    });

    it('closes on the first Escape and keeps the text, then clears on the second', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.type(combo(), 'al');
        await screen.findByRole('listbox', { name: 'Suggestions' });
        await user.keyboard('{Escape}');
        await waitFor(() => expect(panel()).toBeNull());
        expect(combo()).toHaveValue('al');
        await user.keyboard('{Escape}');
        expect(combo()).toHaveValue('');
    });

    it('closes when Tab leaves the field, and opens again with the arrow keys', async () => {
        const user = userEvent.setup();
        render(<Focused />);
        await user.click(combo());
        await screen.findByRole('listbox', { name: 'Suggestions' });
        await user.tab();
        await waitFor(() => expect(panel()).toBeNull());
        await user.click(combo());
        await user.keyboard('{Escape}');
        await waitFor(() => expect(panel()).toBeNull());
        await user.keyboard('{ArrowDown}');
        expect(await screen.findByRole('listbox', { name: 'Suggestions' })).toBeInTheDocument();
    });

    it('stays shut while disabled', async () => {
        const user = userEvent.setup();
        render(<SearchField placeholder="Search students" mode="focused" recent={['Ada']} isDisabled />);
        await user.click(combo());
        expect(panel()).toBeNull();
    });
});
