import React, { useState } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import Select from './Select';

/**
 * Choosing a value in a `Select`: one play test per behaviour.
 *
 * The list renders in a portal on `document.body`, so rows are found from the
 * document, not the canvas. The field is a combobox: focus stays in it, and
 * the highlighted row is its `aria-activedescendant`.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const schools = [
    { value: 'north', label: 'North High' },
    { value: 'south', label: 'South High' },
    { value: 'riverside', label: 'Riverside Academy' },
];

const teachersBySchool = {
    north: [{ value: 'ng', label: 'Ms. Garcia' }, { value: 'nl', label: 'Mr. Lee' }],
    south: [{ value: 'sp', label: 'Ms. Patel' }],
    riverside: [{ value: 'rk', label: 'Mr. Kim' }],
};

/** Rows live in a portal, so they are looked up on the whole page. */
const page = () => within(document.body);

export default {
    title: 'Components/Forms and inputs/Select commit',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for Select: opening, typing to filter, creating, '
                    + 'committing, clearing, limits, long lists and dependent fields.',
            },
        },
    },
};

/* ------------------------------------------------------------------ single */

/** One commit replaces the last and closes the list; a disabled field never opens. */
export const SingleCommitClosesTheMenu = () => {
    const [value, setValue] = useState('');
    return (
        <div style={stack}>
            <Select id="scommit-school" label="School" options={schools} placeholder="Select a school" value={value} onChange={setValue} />
            <Select id="scommit-locked" label="District" options={schools} placeholder="Select a district" disabled />
            <p data-testid="chosen">{value}</p>
        </div>
    );
};

SingleCommitClosesTheMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = canvas.getByTestId('chosen');
    const field = canvas.getByRole('combobox', { name: 'School' });

    await expect(page().queryByRole('option', { name: 'North High' })).toBeNull();
    await expect(field).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(await page().findByRole('option', { name: 'North High' }));

    await expect(chosen).toHaveTextContent(/^north$/);
    await expect(field).toHaveTextContent('North High');
    await waitFor(() => expect(page().queryByRole('option', { name: 'South High' })).toBeNull());

    await userEvent.click(field);
    await userEvent.click(await page().findByRole('option', { name: 'Riverside Academy' }));
    await expect(chosen).toHaveTextContent(/^riverside$/);

    const locked = canvas.getByRole('combobox', { name: 'District' });
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    await expect(locked).not.toHaveAttribute('tabindex', '0');
    fireEvent.click(locked);
    await expect(page().queryByRole('option', { name: 'South High' })).toBeNull();
};

/** The keyboard opens the list, walks it and picks from it. */
export const KeyboardOpensAndPicks = () => {
    const [value, setValue] = useState('');
    return (
        <div style={stack}>
            <Select id="scommit-keys" aria-label="School" options={schools} value={value} onChange={setValue} />
            <p data-testid="chosen">{value}</p>
        </div>
    );
};

KeyboardOpensAndPicks.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'School' });

    await userEvent.tab();
    await expect(field).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    const options = await page().findAllByRole('option');
    await waitFor(() => expect(field).toHaveAttribute('aria-activedescendant', options[0].id));

    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(/^south$/);
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await expect(field).toHaveFocus();
};

/* ------------------------------------------------------------- searchable */

/** Searchable means typing in the field itself; there is no second search box. */
export const TypingFiltersOptions = () => {
    const [value, setValue] = useState('');
    return (
        <div style={stack}>
            <Select id="scommit-search" label="School" options={schools} placeholder="Select a school" searchable value={value} onChange={setValue} />
            <p data-testid="chosen">{value}</p>
        </div>
    );
};

TypingFiltersOptions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'School' });
    await expect(field.tagName).toBe('INPUT');

    await userEvent.click(field);
    await expect(page().queryByPlaceholderText('Search')).toBeNull();

    await userEvent.type(field, 'high');
    await waitFor(() => expect(page().queryByRole('option', { name: 'Riverside Academy' })).toBeNull());
    await expect(page().getByRole('option', { name: 'North High' })).toBeInTheDocument();
    await expect(page().getByRole('option', { name: 'South High' })).toBeInTheDocument();

    await userEvent.type(field, 'lands');
    await expect(await page().findByText('No results')).toBeInTheDocument();

    // Enter picks the highlighted row: the first match.
    await userEvent.clear(field);
    await userEvent.type(field, 'river');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('chosen')).toHaveTextContent(/^riverside$/);
    await expect(field).toHaveValue('Riverside Academy');
};

/** "Create *text*" appears only when nothing matches exactly, ignoring case. */
export const EnterCreatesWhenNoMatch = () => {
    const [value, setValue] = useState('');
    const [created, setCreated] = useState('');
    return (
        <div style={stack}>
            <Select
                id="scommit-create"
                label="School"
                options={schools}
                creatable
                value={value}
                onChange={setValue}
                onCreate={setCreated}
            />
            <p data-testid="chosen">{value}</p>
            <p data-testid="created">{created}</p>
        </div>
    );
};

EnterCreatesWhenNoMatch.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'School' });

    await userEvent.click(field);
    await userEvent.type(field, 'north high');
    await expect(page().getByRole('option', { name: 'North High' })).toBeInTheDocument();
    await expect(page().queryByRole('option', { name: /^Create/ })).toBeNull();

    await userEvent.clear(field);
    await userEvent.type(field, 'Eastside');
    const create = await page().findByRole('option', { name: 'Create Eastside' });
    await waitFor(() => expect(field).toHaveAttribute('aria-activedescendant', create.id));
    await userEvent.keyboard('{Enter}');

    await expect(canvas.getByTestId('chosen')).toHaveTextContent(/^Eastside$/);
    await expect(canvas.getByTestId('created')).toHaveTextContent(/^Eastside$/);

    // The created value is an option from now on.
    await userEvent.click(field);
    await expect(await page().findByRole('option', { name: 'Eastside' })).toHaveAttribute('aria-selected', 'true');
};

/* ------------------------------------------------------------------ multi */

/** Picks accumulate in Tags and the list stays open; a Tag's × takes one back. */
export const MultiAccumulatesAndRemoves = () => {
    const [value, setValue] = useState([]);
    return (
        <div style={stack}>
            <Select id="scommit-multi" label="Schools" mode="multi" options={schools} value={value} onChange={setValue} />
            <p data-testid="chosen">{value.join(',')}</p>
        </div>
    );
};

MultiAccumulatesAndRemoves.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = canvas.getByTestId('chosen');
    const field = canvas.getByRole('combobox', { name: 'Schools' });

    await userEvent.click(field);
    const north = await page().findByRole('option', { name: 'North High' });
    await userEvent.click(north);
    await expect(chosen).toHaveTextContent(/^north$/);
    await expect(north).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(page().getByRole('option', { name: 'South High' }));
    await expect(chosen).toHaveTextContent(/^north,south$/);
    await userEvent.click(page().getByRole('option', { name: 'North High' }));
    await expect(chosen).toHaveTextContent(/^south$/);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page().queryByRole('option', { name: 'South High' })).toBeNull());

    // The chip is a Tag in a TagGroup, not a Badge.
    await expect(canvasElement.querySelector('.plus-tag-group .plus-tag')).not.toBeNull();
    await expect(canvasElement.querySelector('.plus-badge')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove South High' }));
    await expect(chosen.textContent).toBe('');
    await expect(page().queryByRole('option', { name: 'South High' })).toBeNull();
};

/** `displayMode="badges"` keeps the Badge chips for screens that still use them. */
export const BadgesDisplayKept = () => (
    <div style={stack}>
        <Select id="scommit-badges" label="Schools" mode="multi" displayMode="badges" options={schools} defaultValue={['north']} />
    </div>
);

BadgesDisplayKept.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.plus-badge')).not.toBeNull();
    await expect(canvasElement.querySelector('.plus-tag')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvasElement.querySelector('.plus-badge')).toBeNull();
};

/** A filter bar commits once, when the list closes, not on each tick. */
export const CommitOnClose = () => {
    const [log, setLog] = useState([]);
    return (
        <div style={stack}>
            <Select
                id="scommit-close"
                label="Schools"
                mode="multi"
                options={schools}
                commitOnClose
                onChange={(next) => setLog((prev) => [...prev, next.join('+')])}
            />
            <p data-testid="log">{log.join('|')}</p>
        </div>
    );
};

CommitOnClose.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByTestId('log');
    const field = canvas.getByRole('combobox', { name: 'Schools' });

    await userEvent.click(field);
    await userEvent.click(await page().findByRole('option', { name: 'North High' }));
    await userEvent.click(page().getByRole('option', { name: 'South High' }));
    await expect(page().getByRole('option', { name: 'South High' })).toHaveAttribute('aria-selected', 'true');
    await expect(log.textContent).toBe('');

    await userEvent.keyboard('{Escape}');
    await expect(log).toHaveTextContent(/^north\+south$/);

    // Opening and closing again without a change commits nothing.
    await userEvent.click(field);
    await userEvent.keyboard('{Escape}');
    await expect(log).toHaveTextContent(/^north\+south$/);
};

/** "Select all" is offered up to 50 matches and hidden past them. */
const manyOptions = Array.from({ length: 120 }, (_, i) => ({ value: `t${i + 1}`, label: `Tutor ${i + 1}` }));

export const SelectAllHiddenPast50 = () => {
    const [value, setValue] = useState([]);
    return (
        <div style={stack}>
            <Select id="scommit-all" label="Tutors" mode="multi" searchable selectAll options={manyOptions} value={value} onChange={setValue} />
            <p data-testid="count">{value.length}</p>
        </div>
    );
};

SelectAllHiddenPast50.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Tutors' });

    await userEvent.click(field);
    await userEvent.type(field, 'Tutor');
    await page().findAllByRole('option');
    await expect(page().queryByRole('button', { name: 'Select all' })).toBeNull();

    await userEvent.type(field, ' 1');
    const all = await page().findByRole('button', { name: 'Select all' });
    await userEvent.click(all);
    // Tutor 1, 10–19 and 100–120: 1 + 10 + 21.
    await expect(canvas.getByTestId('count')).toHaveTextContent(/^32$/);
};

/** With a pick limit, the rest of the rows are disabled and the list says why. */
export const PickLimitDisablesRows = () => (
    <div style={stack}>
        <Select id="scommit-limit" label="Schools" mode="multi" maxSelections={2} options={schools} />
    </div>
);

PickLimitDisablesRows.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Schools' });
    await userEvent.click(field);
    await userEvent.click(await page().findByRole('option', { name: 'North High' }));
    await expect(page().getByRole('option', { name: 'Riverside Academy' })).not.toHaveAttribute('aria-disabled');
    await userEvent.click(page().getByRole('option', { name: 'South High' }));

    await expect(page().getByRole('option', { name: 'Riverside Academy' })).toHaveAttribute('aria-disabled', 'true');
    // The list's footer says why, and so does the field's caption.
    const listbox = page().getByRole('listbox').closest('.plus-listbox');
    await expect(within(listbox).getByText('You can pick up to 2')).toBeInTheDocument();
    await expect(within(canvasElement).getByText('You can pick up to 2')).toBeInTheDocument();
    // A picked row can still be taken back.
    await expect(page().getByRole('option', { name: 'North High' })).not.toHaveAttribute('aria-disabled');
};

/** Without focus, the tags that do not fit collapse into "+n". */
export const CollapsedTagsShowPlusN = () => (
    <div style={{ ...stack, width: 220 }}>
        <button type="button">Before</button>
        <Select
            id="scommit-collapse"
            label="Subjects"
            mode="multi"
            options={[
                { value: 'alg', label: 'Algebra' },
                { value: 'bio', label: 'Biology' },
                { value: 'chem', label: 'Chemistry' },
                { value: 'econ', label: 'Economics' },
                { value: 'geo', label: 'Geometry' },
            ]}
            defaultValue={['alg', 'bio', 'chem', 'econ', 'geo']}
        />
    </div>
);

CollapsedTagsShowPlusN.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('button', { name: /^\+\d+ more tags$/ })).toBeInTheDocument());

    await userEvent.click(canvas.getByRole('combobox', { name: 'Subjects' }));
    await waitFor(() => expect(canvas.queryByRole('button', { name: /more tags$/ })).toBeNull());
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: /^\+\d+ more tags$/ })).toBeInTheDocument());
};

/* ---------------------------------------------------------------- states */

/** The clear × is not a tab stop; Delete clears from the keyboard. */
export const ClearButton = () => {
    const [value, setValue] = useState('north');
    return (
        <div style={stack}>
            <Select id="scommit-clear" label="School" options={schools} value={value} onChange={setValue} />
            <p data-testid="chosen">{value}</p>
        </div>
    );
};

ClearButton.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = canvas.getByTestId('chosen');
    const field = canvas.getByRole('combobox', { name: 'School' });

    const clear = canvas.getByRole('button', { name: 'Clear School' });
    await expect(clear).toHaveAttribute('tabindex', '-1');
    // One step smaller than the caret, as the Figma `_Field Clear`.
    const size = (el) => parseFloat(getComputedStyle(el).fontSize);
    await expect(size(clear.querySelector('.fa-circle-xmark')))
        .toBeLessThan(size(canvasElement.querySelector('.plus-select-caret')));
    await userEvent.click(clear);
    await expect(chosen.textContent).toBe('');
    await expect(canvas.queryByRole('button', { name: 'Clear School' })).toBeNull();
    await expect(page().queryByRole('option', { name: 'North High' })).toBeNull();

    await userEvent.click(field);
    await userEvent.click(await page().findByRole('option', { name: 'South High' }));
    await expect(field).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await expect(chosen.textContent).toBe('');
};

/** Read-only shows the value and stays focusable, but never opens or clears. */
export const ReadonlyIsNotDisabled = () => (
    <div style={stack}>
        <Select id="scommit-ro" label="School" options={schools} defaultValue="north" readonly />
        <Select id="scommit-off" label="District" options={schools} defaultValue="north" disabled />
    </div>
);

ReadonlyIsNotDisabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const readonly = canvas.getByRole('combobox', { name: 'School' });
    const disabled = canvas.getByRole('combobox', { name: 'District' });

    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await expect(readonly.closest('.plus-field')).toHaveClass('plus-field--readonly');
    await expect(disabled.closest('.plus-field')).toHaveClass('plus-field--disabled');
    await expect(canvas.queryByRole('button', { name: /^Clear/ })).toBeNull();

    await userEvent.tab();
    await expect(readonly).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(readonly);
    await expect(page().queryByRole('option', { name: 'North High' })).toBeNull();
    await userEvent.keyboard('{Delete}');
    await expect(readonly).toHaveTextContent('North High');

    // Disabled is out of the tab order.
    await userEvent.tab();
    await expect(disabled).not.toHaveFocus();
};

/** `invalid` draws the error border and points the field at its message. */
export const InvalidState = () => (
    <div style={stack}>
        <Select id="scommit-invalid" label="School" options={schools} invalid caption="Choose a school" />
    </div>
);

InvalidState.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'School' });
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field.closest('.plus-field')).toHaveClass('plus-field--invalid');
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Choose a school');
    await expect(field.getAttribute('aria-describedby')).toContain(alert.id);
};

/** A dependent field waits for its parent, and clears when the parent changes. */
export const DependentFieldClears = () => {
    const [school, setSchool] = useState('');
    const [teacher, setTeacher] = useState('');
    return (
        <div style={stack}>
            <Select id="scommit-parent" label="School" options={schools} value={school} onChange={setSchool} />
            <Select
                id="scommit-child"
                label="Teacher"
                options={teachersBySchool[school] || []}
                value={teacher}
                onChange={setTeacher}
                dependsOn={{ value: school, label: 'a school' }}
            />
            <p data-testid="teacher">{teacher}</p>
        </div>
    );
};

DependentFieldClears.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const school = canvas.getByRole('combobox', { name: 'School' });
    const teacher = canvas.getByRole('combobox', { name: 'Teacher' });

    await expect(teacher).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByText('Choose a school first')).toBeInTheDocument();

    await userEvent.click(school);
    await userEvent.click(await page().findByRole('option', { name: 'North High' }));
    await expect(teacher).not.toHaveAttribute('aria-disabled');
    await expect(canvas.queryByText('Choose a school first')).toBeNull();

    await userEvent.click(teacher);
    await userEvent.click(await page().findByRole('option', { name: 'Mr. Lee' }));
    await expect(canvas.getByTestId('teacher')).toHaveTextContent(/^nl$/);

    await userEvent.click(school);
    await userEvent.click(await page().findByRole('option', { name: 'South High' }));
    await expect(canvas.getByTestId('teacher').textContent).toBe('');
};

/** While options load, the list shows a Message row. */
export const LoadingShowsMessage = () => (
    <div style={stack}>
        <Select id="scommit-loading" label="Teacher" options={[]} loading defaultOpen />
    </div>
);

LoadingShowsMessage.play = async () => {
    await expect(await page().findByText('Loading…')).toBeInTheDocument();
};

/* ------------------------------------------------------------ long lists */

const tutors = Array.from({ length: 80 }, (_, i) => ({ value: `u${i + 1}`, label: `Person ${String(i + 1).padStart(2, '0')}` }));

/** Past 50 options the list is search-first: Recent and Suggested until you type. */
export const LongListSearchFirst = () => (
    <div style={stack}>
        <Select
            id="scommit-long"
            label="Tutor"
            options={tutors}
            recent={['u7']}
            suggested={['u12', 'u7', 'u30']}
        />
    </div>
);

LongListSearchFirst.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Tutor' });
    await expect(field.tagName).toBe('INPUT');

    await userEvent.click(field);
    await expect(await page().findByText('Recent')).toBeInTheDocument();
    await expect(page().getByText('Suggested')).toBeInTheDocument();
    await expect(page().getByText('Type to search 80 options')).toBeInTheDocument();
    // Person 07 is recent, so it is not suggested twice.
    await expect(page().getAllByRole('option').map((o) => o.textContent)).toEqual(['Person 07', 'Person 12', 'Person 30']);

    await userEvent.type(field, 'Person 5');
    await waitFor(() => expect(page().getAllByRole('option')).toHaveLength(10));
};

/** `loadOptions` pages in 50 at a time as the list scrolls, and says how many there are. */
export const LoadOptionsPages = () => {
    const all = Array.from({ length: 120 }, (_, i) => ({ value: `s${i + 1}`, label: `Student ${i + 1}` }));
    const loadOptions = (query, { offset, limit }) => new Promise((resolve) => {
        const matches = all.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
        setTimeout(() => resolve({ options: matches.slice(offset, offset + limit), total: matches.length }), 20);
    });
    return (
        <div style={stack}>
            <Select id="scommit-async" label="Student" loadOptions={loadOptions} />
        </div>
    );
};

LoadOptionsPages.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
    await userEvent.click(field);
    await expect(await page().findByText('Showing 50 of 120')).toBeInTheDocument();

    const body = page().getByRole('listbox').closest('.plus-listbox-body');
    body.scrollTop = body.scrollHeight;
    fireEvent.scroll(body);
    await expect(await page().findByText('Showing 100 of 120')).toBeInTheDocument();

    await userEvent.type(field, 'Student 11');
    await waitFor(() => expect(page().getAllByRole('option')).toHaveLength(11));
    await expect(page().queryByText(/^Showing/)).toBeNull();
};

/* -------------------------------------------------------------- clearable */

/**
 * `clearable` decides whether the clear × shows. Multi defaults to true; a
 * single field defaults to `!required`, so a required pick cannot be emptied;
 * a sort passes `clearable={false}`.
 */
export const ClearableDefaults = () => (
    <div style={stack}>
        <Select id="sclear-multi" label="Subjects" mode="multi" options={schools} defaultValue={['north']} />
        <Select id="sclear-single" label="School" options={schools} defaultValue="north" />
        <Select id="sclear-required" label="Home school" options={schools} defaultValue="north" required />
        <Select id="sclear-sort" label="Sort" options={schools} defaultValue="north" clearable={false} />
    </div>
);

ClearableDefaults.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button', { name: 'Clear Subjects' })).not.toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Clear School' })).not.toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Clear Home school' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Clear Sort' })).toBeNull();

    // Delete does not empty a field that cannot be cleared.
    const sort = canvas.getByRole('combobox', { name: 'Sort' });
    sort.focus();
    await userEvent.keyboard('{Delete}');
    await expect(sort).toHaveTextContent('North High');
};
