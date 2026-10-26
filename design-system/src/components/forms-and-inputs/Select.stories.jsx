import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Select from './Select';

/**
 * Select — pick one value, or several, from a list. The field is `_Field`
 * and the list is the internal Listbox; searchable means typing in the field.
 */
export default {
    title: 'Components/Forms and inputs/Select',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12, and a multi Select whose tags wrap grows from 32.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
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
        mode: {
            control: { type: 'select' },
            options: ['single', 'multi'],
            table: { category: 'Design' }
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' }
        },
        displayMode: {
            control: { type: 'select' },
            options: ['tags', 'badges', 'text'],
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
        searchable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        creatable: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        invalid: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        readonly: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        commitOnClose: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        clearable: {
            control: 'boolean',
            description: 'Shows the clear ×. Unset, it is on in multi mode and `!required` in single mode.',
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
        readOnly: { table: { disable: true, category: 'Development' } },
        required: { table: { disable: true, category: 'Development' } },
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
        loading: { table: { disable: true, category: 'Development' } },
        defaultOpen: { table: { disable: true, category: 'Development' } },
        defaultSearchTerm: { table: { disable: true, category: 'Development' } },
        lineWrap: { table: { disable: true, category: 'Development' } },
        truncate: { table: { disable: true, category: 'Development' } },
        open: { table: { disable: true, category: 'Development' } },
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

/** Modes — Multi-select with Tags or Badges, searchable and creatable. */
export const Modes = {
    render: () => (
        <div className="sb-select-interactive-override" style={grid}>
            <Select label="Multi (tags)" mode="multi" options={sampleOptions} defaultValue={['option-1', 'option-2']} placeholder="Select {value(s)} from below" />
            <Select label="Multi (badges)" mode="multi" displayMode="badges" options={sampleOptions} defaultValue={['option-1', 'option-2']} placeholder="Select {value(s)} from below" />
            <Select label="Searchable" searchable options={sampleOptions} placeholder="Type to search" />
            <Select label="Creatable" mode="multi" creatable options={sampleOptions} placeholder="Type to search or create" />
        </div>
    )
};

/** Sizes — Small, medium, and large. */
export const Sizes = {
    render: () => (
        <div className="sb-select-interactive-override" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Select label="Small" size="small" options={sampleOptions} placeholder="Select..." />
            <Select label="Medium (default)" size="medium" options={sampleOptions} placeholder="Select..." />
            <Select label="Large" size="large" options={sampleOptions} placeholder="Select..." />
        </div>
    )
};

/** InteractionStates — Enabled, invalid, read-only and disabled. */
export const InteractionStates = {
    render: () => (
        <div className="sb-select-interactive-override" style={grid}>
            <Select label="Enabled" defaultValue="option-1" options={sampleOptions} />
            <Select label="Invalid" invalid caption="Choose an option" options={sampleOptions} />
            <Select label="Read only" readonly defaultValue="option-1" options={sampleOptions} />
            <Select label="Disabled" disabled defaultValue="option-1" options={sampleOptions} />
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
        const [value, setValue] = useState(args.mode === 'multi' ? [] : '');

        useEffect(() => {
            setValue(args.mode === 'multi' ? [] : '');
        }, [args.mode]);

        return (
            <div style={{ maxWidth: '400px' }}>
                <p className="body3-txt mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
                    Selected: {args.mode === 'multi'
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
        mode: 'single',
        label: 'Option',
        placeholder: 'Select...',
        caption: '',
        searchable: false,
        creatable: false,
        displayMode: 'tags',
        size: 'medium',
        invalid: false,
        disabled: false,
        readonly: false,
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
            <Select label="Subjects" mode="multi" selectAll options={COLOR_OPTIONS} defaultValue={['algebra']} />
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
