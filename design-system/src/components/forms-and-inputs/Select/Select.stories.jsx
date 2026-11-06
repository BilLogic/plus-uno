import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid } from '../_internal/fieldStatePlays';
import Select from './Select';

/**
 * Select — pick one value, or several, from a list. The field is `_Field`
 * and the list is the internal Listbox; isSearchable means typing in the field.
 */
export default {
    title: 'Components/Forms and inputs/Select',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'ADS props: `isMulti` replaces `mode`, `isInvalid`/`errorMessage` replace `validation`/`invalid`, `spacing` (default 40, compact 32) replaces `size`, and every boolean is `is…`-named.' },
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12, and a multi Select whose tags wrap grows from 32.' },
        ],
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
            description: 'Shows the clear ×. Unset, it is on with `isMulti` and `!isRequired` otherwise.',
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

const grid = { pointerEvents: 'auto', display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };

/** Content — Placeholder and value in single-select mode. */
export const Content = {
    render: () => (
        <div className="sb-select-interactive-override" style={grid}>
            <Select label="Closed, empty" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
            <Select label="Closed, filled" defaultValue="option-1" options={sampleOptions} placeholder="Select (a/an) {value} from below" />
        </div>
    )
};

/** Modes — isMulti with Tags, isSearchable and isCreatable. */
export const Modes = {
    render: () => (
        <div className="sb-select-interactive-override" style={grid}>
            <Select label="Multi (tags)" isMulti options={sampleOptions} defaultValue={['option-1', 'option-2']} placeholder="Select {value(s)} from below" />
            <Select label="Searchable" isSearchable options={sampleOptions} placeholder="Type to search" />
            <Select label="Creatable" isMulti isCreatable options={sampleOptions} placeholder="Type to search or create" />
        </div>
    )
};

/** Spacing — default (40) and compact (32). */
export const Spacing = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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

/** InteractionStates — Enabled, invalid, read-only and disabled. */
export const InteractionStates = {
    render: () => (
        <div className="sb-select-interactive-override" style={grid}>
            <Select label="Enabled" defaultValue="option-1" options={sampleOptions} />
            <Select label="Invalid" isInvalid caption="Choose an option" options={sampleOptions} />
            <Select label="Read only" isReadOnly defaultValue="option-1" options={sampleOptions} />
            <Select label="Disabled" isDisabled defaultValue="option-1" options={sampleOptions} />
        </div>
    )
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
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', maxWidth: 400, paddingBottom: 320 }}>
            <Select label="Tutor" options={people} recent={['p3']} suggested={['p8', 'p21']} />
        </div>
    )
};

/** Overview — Single-select default for docs landing. */
export const Overview = {
    render: () => (
        <div
            className="sb-select-interactive-override"
            style={{
                pointerEvents: 'auto',
                maxWidth: 400,
                width: '100%',
                minHeight: 48,
                paddingBottom: 320,
            }}
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
            <div style={{ maxWidth: '400px' }}>
                <p className="body3-txt mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
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
        isSearchable: false,
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
        const placeholder = canvasElement.querySelector('.plus-select-placeholder');
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
            await expect(getComputedStyle(placeholder).color, `${mode}: placeholder`).toBe(token('--ds-text-subtlest'));
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
const wrap = { maxWidth: '360px', minHeight: 48 };

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
