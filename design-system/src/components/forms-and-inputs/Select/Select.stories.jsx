import React, { useEffect, useState } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid, expectReadOnly } from '../_internal/fieldStatePlays';
import Select from './Select';

/**
 * Select — pick one value, or several, from a list. The field is `_Field`
 * and the list is the internal Listbox; typing in the field filters it, and
 * isSearchable={false} turns that off for a short list.
 */
export default {
    title: 'Components/Forms and inputs/Select',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Pick one value, or several, from a list. Type in the field to filter it.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        isMulti: {
            control: 'boolean',
            table: { category: 'Design' }
        },
        marker: {
            control: { type: 'inline-radio' },
            options: ['check', 'radio'],
            table: { category: 'Design' }
        },
        spacing: {
            control: { type: 'inline-radio' },
            options: ['default', 'compact'],
            table: { category: 'Design' }
        },
        displayMode: {
            control: { type: 'select' },
            options: ['tags', 'text'],
            table: { category: 'Design' }
        },
        label: {
            control: 'text',
            table: { category: 'Content' }
        },
        placeholder: {
            control: 'text',
            table: { category: 'Content' }
        },
        caption: {
            control: 'text',
            table: { category: 'Content' }
        },
        isSearchable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isCreatable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isInvalid: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        isRequired: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        commitOnClose: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        clearable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        selectAll: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        maxSelections: {
            control: 'number',
            table: { category: 'Behavior' }
        },
        options: { table: { disable: true, category: 'Development' } },
        value: { control: false, table: { disable: true, category: 'Development' } },
        defaultValue: { control: false, table: { disable: true, category: 'Development' } },
        onChange: { control: false, table: { disable: true, category: 'Development' } },
        onCreate: { control: false, table: { disable: true, category: 'Development' } },
        onFocus: { control: false, table: { disable: true, category: 'Development' } },
        onBlur: { control: false, table: { disable: true, category: 'Development' } },
        loadOptions: { control: false, table: { disable: true, category: 'Development' } },
        dependsOn: { control: false, table: { disable: true, category: 'Development' } },
        recent: { control: false, table: { disable: true, category: 'Development' } },
        suggested: { control: false, table: { disable: true, category: 'Development' } },
        isLoading: { table: { disable: true, category: 'Development' } },
        defaultOpen: { table: { disable: true, category: 'Development' } },
        defaultSearchTerm: { table: { disable: true, category: 'Development' } },
        lineWrap: { table: { disable: true, category: 'Development' } },
        truncate: { table: { disable: true, category: 'Development' } },
        open: { table: { disable: true, category: 'Development' } },
        isValid: { table: { disable: true, category: 'Development' } },
        successMessage: { table: { disable: true, category: 'Development' } },
        errorMessage: { table: { disable: true, category: 'Development' } },
        info: { table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    }
};

const sampleOptions = [
    { value: 'option-1', label: 'Option #1' },
    { value: 'option-2', label: 'Option #2' },
    { value: 'option-3', label: 'Option #3' },
    { value: 'option-4', label: 'Option #4' },
    { value: 'option-5', label: 'Option #5' },
];

const grid = { pointerEvents: 'auto', display: 'grid', gap: 'var(--space-125)', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };

const field = { maxWidth: 'var(--width-2500)' };

/** One story per value, for the Examples tab. */
export const Empty = {
    render: () => <div style={field}><Select label="Subject" options={sampleOptions} placeholder="Select a subject" /></div>,
};

export const Filled = {
    render: () => <div style={field}><Select label="Subject" defaultValue="option-1" options={sampleOptions} placeholder="Select a subject" /></div>,
};

export const Multi = {
    render: () => <div style={field}><Select label="Subjects" isMulti options={sampleOptions} defaultValue={['option-1', 'option-2']} placeholder="Select subjects" /></div>,
};

export const Searchable = {
    render: () => <div style={field}><Select label="Subject" options={sampleOptions} placeholder="Type to search" /></div>,
};

/** A single pick is marked with a check by default; `marker="radio"` draws a radio before the label. Several picks always use checkboxes. */
export const Marker = {
    render: () => (
        <div style={{ ...grid, pointerEvents: 'auto' }}>
            <Select label="Check" options={sampleOptions} defaultValue="option-1" />
            <Select label="Radio" marker="radio" options={sampleOptions} defaultValue="option-1" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const picked = async (name) => {
            await userEvent.click(canvas.getByRole('combobox', { name }));
            const body = within(canvasElement.ownerDocument.body);
            const option = await waitFor(() => {
                const found = body.getAllByRole('option').find((row) => row.getAttribute('aria-selected') === 'true');
                expect(found).toBeTruthy();
                return found;
            });
            const marks = {
                radio: option.querySelector('.plus-option-row-check--radio'),
                check: option.querySelector('.plus-option-row-selected-mark'),
            };
            await userEvent.keyboard('{Escape}');
            return marks;
        };
        const check = await picked('Check');
        await expect(check.check).not.toBeNull();
        await expect(check.radio).toBeNull();
        const radio = await picked('Radio');
        await expect(radio.radio).not.toBeNull();
        await expect(radio.radio).toHaveClass('is-checked');
        await expect(radio.check).toBeNull();
    },
};

/** A short list in a filter menu opts out: the field is a plain trigger that opens the list. */
export const NotSearchable = {
    render: () => <div style={field}><Select label="Status" isSearchable={false} options={sampleOptions.slice(0, 3)} placeholder="Any status" /></div>,
};

export const Creatable = {
    render: () => <div style={field}><Select label="Subjects" isMulti isCreatable options={sampleOptions} placeholder="Type to search or create" /></div>,
};

export const SpacingDefault = {
    render: () => <div style={field}><Select label="Subject" spacing="default" options={sampleOptions} placeholder="Select a subject" /></div>,
};

export const SpacingCompact = {
    render: () => <div style={field}><Select label="Subject" spacing="compact" options={sampleOptions} placeholder="Select a subject" /></div>,
};

/** Spacing — default (40) and compact (32). */
export const Spacing = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-125)' }}>
            <Select label="Default" spacing="default" options={sampleOptions} placeholder="Select..." />
            <Select label="Compact" spacing="compact" options={sampleOptions} placeholder="Select..." />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('combobox', { name: 'Default' }).closest('.plus-field').getBoundingClientRect().height).toBe(40);
        await expect(canvas.getByRole('combobox', { name: 'Compact' }).closest('.plus-field').getBoundingClientRect().height).toBe(32);
    },
};

const schools = [
    { value: 'north', label: 'North High' },
    { value: 'south', label: 'South High' },
];
const teachers = {
    north: [{ value: 'ng', label: 'Ms. Garcia' }, { value: 'nl', label: 'Mr. Lee' }],
    south: [{ value: 'sp', label: 'Ms. Patel' }],
};

/** DependentFields — the child waits for its parent and clears when the parent changes. */
export const DependentFields = {
    render: () => {
        const [school, setSchool] = useState('');
        const [teacher, setTeacher] = useState('');
        return (
            <div className="sb-select-interactive-override" style={grid}>
                <Select label="School" options={schools} value={school} onChange={setSchool} />
                <Select
                    label="Teacher"
                    options={teachers[school] || []}
                    value={teacher}
                    onChange={setTeacher}
                    dependsOn={{ value: school, label: 'a school' }}
                />
            </div>
        );
    }
};

const people = Array.from({ length: 80 }, (_, i) => ({ value: `p${i + 1}`, label: `Tutor ${i + 1}` }));

/** LongList — past 50 options, Recent and Suggested come first and typing searches the rest. */
export const LongList = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)' }}>
            <Select label="Tutor" options={people} recent={['p3']} suggested={['p8', 'p21']} />
        </div>
    )
};

/** Rows live in a portal on `document.body`, so they are looked up on the whole page. */
const page = () => within(document.body);

const students = Array.from({ length: 120 }, (_, i) => ({ value: `s${i + 1}`, label: `Student ${i + 1}` }));

/** A server stand-in: filters by the typed text and answers a page after a short wait. */
const loadStudents = (query, { offset, limit }) => new Promise((resolve) => {
    const matches = students.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
    setTimeout(() => resolve({ options: matches.slice(offset, offset + limit), total: matches.length }), 20);
});

/**
 * Async — `loadOptions` pages in 50 at a time as the list opens, as you type and
 * as you scroll, and the list says how many there are. Typing is on with it.
 */
export const Async = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)' }}>
            <Select label="Student" loadOptions={loadStudents} />
        </div>
    ),
    play: async ({ canvasElement }) => {
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
    },
};

/** AsyncCreatable — `isCreatable` works over loaded options: what nothing matches can be created. */
export const AsyncCreatable = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)' }}>
            <Select label="Student" isCreatable loadOptions={loadStudents} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
        await userEvent.click(field);
        await userEvent.type(field, 'Zoe Park');
        await userEvent.click(await page().findByRole('option', { name: /Create\s+Zoe Park/ }));
        await waitFor(() => expect(field).toHaveValue('Zoe Park'));
    },
};

/** Until the first page arrives, the list shows one "Loading options" row. Never skeleton rows. */
export const AsyncLoading = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)' }}>
            <Select label="Teacher" options={[]} isLoading defaultOpen />
        </div>
    ),
    play: async () => {
        // The list also announces it, so the row is found by its own class.
        await waitFor(() => expect(document.querySelector('.plus-listbox-message--loading')).toHaveTextContent('Loading options'));
    },
};

/** When a request fails, the list says "Couldn't load options" with Retry, which asks for the same page again. */
export const AsyncFailed = {
    render: () => {
        const calls = React.useRef(0);
        const loadOptions = (query, paging) => {
            calls.current += 1;
            return calls.current === 1 ? Promise.reject(new Error('offline')) : loadStudents(query, paging);
        };
        return (
            <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)' }}>
                <Select label="Student" loadOptions={loadOptions} />
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox', { name: 'Student' });
        await userEvent.click(field);
        await waitFor(() => expect(document.querySelector('.plus-listbox-message--error')).toHaveTextContent("Couldn't load options"));
        await userEvent.click(page().getByRole('button', { name: 'Retry' }));
        await expect(await page().findByText('Showing 50 of 120')).toBeInTheDocument();
        await expect(document.querySelector('.plus-listbox-message--error')).toBeNull();
    },
};

/** Overview — Single-select default for docs landing. */
export const Overview = {
    render: () => (
        <div
            className="sb-select-interactive-override"
            style={{ pointerEvents: 'auto', maxWidth: 'var(--width-2500)', width: '100%' }}
        >
            <Select aria-label="Option" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
        </div>
    ),
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.formSelect }
        }
    }
};

/**
 * Interactive
 * Full playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.isMulti ? [] : '');

        useEffect(() => {
            setValue(args.isMulti ? [] : '');
        }, [args.isMulti]);

        return (
            <div style={{ maxWidth: 'var(--width-2500)' }}>
                <p style={{ margin: '0 0 var(--stack-md)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                    Selected: {args.isMulti
                        ? (value.length > 0 ? value.join(', ') : 'None')
                        : (value || 'None')
                    }
                </p>
                <Select
                    {...args}
                    options={sampleOptions}
                    value={value}
                    onChange={setValue}
                />
            </div>
        );
    },
    args: {
        isMulti: false,
        label: 'Option',
        placeholder: 'Select...',
        caption: '',
        isSearchable: true,
        isCreatable: false,
        displayMode: 'tags',
        spacing: 'default',
        isInvalid: false,
        isDisabled: false,
        isReadOnly: false,
        commitOnClose: false,
        selectAll: false,
    }
};

const COLOR_OPTIONS = [
    { value: 'algebra', label: 'Algebra' },
    { value: 'biology', label: 'Biology' },
    { value: 'chemistry', label: 'Chemistry' },
];

/**
 * The placeholder is `text.subtlest` and the caret `icon.subtle`. In the list,
 * "Select all" draws the input's mark until every option is picked, then the
 * Lagoon checked mark; picked rows are neutral selection with a Lagoon mark.
 */
export const Colors = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px' }}>
            <Select label="Subject" options={COLOR_OPTIONS} placeholder="Pick a subject" />
            <Select label="Subjects" isMulti selectAll options={COLOR_OPTIONS} defaultValue={['algebra']} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const subject = canvas.getByRole('combobox', { name: 'Subject' });
        const caret = canvasElement.querySelector('.plus-select-caret');
        await userEvent.click(canvas.getByRole('combobox', { name: 'Subjects' }));
        const all = await waitFor(() => {
            const el = document.querySelector('.plus-select-all');
            if (!el) throw new Error('the list has not opened');
            return el;
        });
        const mark = all.querySelector('.plus-select-all-mark');
        const picked = document.querySelector('.plus-option-row.is-selected');
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(subject, '::placeholder').color, `${mode}: placeholder`).toBe(token('--ds-text-subtlest'));
            await expect(getComputedStyle(caret).color, `${mode}: caret`).toBe(token('--ds-icon-subtle'));
            await expect(getComputedStyle(mark).borderTopColor, `${mode}: select-all mark edge`).toBe(token('--ds-border-input'));
            await expect(getComputedStyle(mark).backgroundColor, `${mode}: select-all mark fill`).toBe(token('--ds-background-input'));
            const pickedFill = picked.classList.contains('is-highlighted') ? '--ds-background-selected-hovered' : '--ds-background-selected';
            await expect(getComputedStyle(picked).backgroundColor, `${mode}: picked row`).toBe(token(pickedFill));
            await expect(getComputedStyle(picked.querySelector('.plus-option-row-check')).backgroundColor, `${mode}: the picked row's mark`).toBe(token('--ds-background-selected-bold'));
        });
        await userEvent.click(all);
        await waitFor(() => expect(mark).toHaveClass('is-checked'));
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(mark).backgroundColor, `${mode}: checked mark fill`).toBe(token('--ds-background-selected-bold'));
            await expect(getComputedStyle(mark).borderTopColor, `${mode}: checked mark edge`).toBe(token('--ds-border-selected'));
            await expect(getComputedStyle(mark).color, `${mode}: checked mark`).toBe(token('--ds-icon-inverse'));
        });
        await userEvent.keyboard('{Escape}');
    },
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('combobox', { name: 'Option' });
const wrap = { maxWidth: 'var(--width-2500)', minHeight: 'var(--height-250)' };

export const Rest = {
    render: () => <div style={wrap}><Select id="select-ex-rest" label="Option" options={sampleOptions} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><Select id="select-ex-hover" label="Option" options={sampleOptions} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><Select id="select-ex-focus" label="Option" options={sampleOptions} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><Select id="select-ex-disabled" label="Option" options={sampleOptions} placeholder="Please select" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><Select id="select-ex-invalid" label="Option" options={sampleOptions} placeholder="Please select" isInvalid errorMessage="Pick an option." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};

export const FieldReadOnly = {
    render: () => <div style={wrap}><Select id="select-ex-readonly" label="Option" options={sampleOptions} placeholder="Please select" isReadOnly /></div>,
    play: async ({ canvasElement }) => {
        await expectReadOnly(canvasElement, controlOf(canvasElement));
        // Nothing to open: the chevron is not drawn, and a press or Enter leaves the list shut.
        await expect(canvasElement.querySelector('.plus-select-caret')).toBeNull();
        await expect(controlOf(canvasElement)).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(controlOf(canvasElement));
        await userEvent.keyboard('{Enter}');
        await expect(controlOf(canvasElement)).toHaveAttribute('aria-expanded', 'false');
    },
};

/** A read-only value is shown whole: it wraps, and is never clipped to one line. */
export const FieldReadOnlyLongValue = {
    render: () => (
        <div style={{ ...wrap, maxWidth: '200px' }}>
            <Select
                id="select-ex-readonly-long"
                label="Option"
                isReadOnly
                value="long"
                options={[{ value: 'long', label: 'Introduction to organic chemistry for first-year students' }]}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const text = canvasElement.querySelector('.plus-select-text');
        await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
        await expect(getComputedStyle(text).textOverflow).toBe('clip');
    },
};
