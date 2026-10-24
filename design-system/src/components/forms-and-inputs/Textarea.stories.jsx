import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Textarea from './Textarea';

export default {
    title: 'Components/Forms and inputs/Textarea',
    component: Textarea,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'The field became 80 high at least, growing with its rows.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
        docs: {
            description: {
                component:
                    'Free text over several lines, on the same field as Input. It is 80 high at least, and `rows` grows it from there.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Field label',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        rows: {
            control: 'number',
            description: 'Visible text rows. One row is the short textarea.',
            table: { category: 'Layout' },
        },
        maxLength: {
            control: 'number',
            description: 'Limits the length and shows a count in the caption',
            table: { category: 'Content' },
        },
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation result',
            table: { category: 'Validation' },
        },
        validationMessage: {
            control: 'text',
            description: 'Message under the field when validation is not none',
            table: { category: 'Validation' },
        },
        disabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        readOnly: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        state: { table: { disable: true } },
        value: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onSave: { table: { disable: true } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
    },
};

const label = 'text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3';

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Textarea id="textarea-overview" label="Label" placeholder="Enter text..." rows={3} />
    </div>
);

Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formTextarea }
    }
};

/** Rows — the field is 80 high at least, and `rows` grows it from there. */
export const Rows = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px' }}>
        {[1, 3, 6].map((rows) => (
            <div key={rows}>
                <span className={label}>{rows === 1 ? '1 ROW' : `${rows} ROWS`}</span>
                <Textarea id={`textarea-rows-${rows}`} label={`${rows} rows`} showLabel={false} placeholder="Enter text..." rows={rows} />
            </div>
        ))}
    </div>
);

Rows.play = async ({ canvasElement }) => {
    const height = (rows) => Math.round(
        canvasElement.querySelector(`#textarea-rows-${rows}`).closest('.plus-field').getBoundingClientRect().height,
    );
    await expect(canvasElement.querySelector('#textarea-rows-1').getAttribute('rows')).toBe('1');
    // One and three rows fit in the 80 minimum; six grow the field.
    await expect(height(1)).toBe(80);
    await expect(height(3)).toBe(80);
    await expect(height(6)).toBeGreaterThan(80);
};

/** Sizes — `small` and `large` are deprecated and draw like `medium`, from `_Field`. */
export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        {['small', 'medium', 'large'].map((size) => (
            <div key={size}>
                <span className={label}>{size.toUpperCase()}</span>
                <Textarea label={`${size} textarea`} showLabel={false} placeholder="Enter text..." size={size} rows={2} />
            </div>
        ))}
    </div>
);

/** InteractionStates — every state, drawn the same way as Input's. */
export const InteractionStates = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '1000px' }}>
        <div>
            <span className={label}>DEFAULT</span>
            <Textarea aria-label="Textarea, default state" placeholder="Enter text..." />
        </div>
        <div>
            <span className={label}>FOCUS (STATIC)</span>
            <Textarea aria-label="Textarea, focus state" placeholder="Enter text..." state="focus" />
        </div>
        <div>
            <span className={label}>FILLED</span>
            <Textarea aria-label="Textarea, filled state" defaultValue="Some content here" />
        </div>
        <div>
            <span className={label}>VALID</span>
            <Textarea aria-label="Textarea, valid state" defaultValue="Looks good" validation="success" validationMessage="Looks good." />
        </div>
        <div>
            <span className={label}>INVALID</span>
            <Textarea aria-label="Textarea, invalid state" defaultValue="Invalid content" validation="invalid" validationMessage="Say what you covered." />
        </div>
        <div>
            <span className={label}>DISABLED</span>
            <Textarea aria-label="Textarea, disabled state" defaultValue="Disabled content" disabled />
        </div>
        <div>
            <span className={label}>READ ONLY</span>
            <Textarea aria-label="Textarea, read only state" defaultValue="Read only content" readOnly />
        </div>
        <div>
            <span className={label}>READ ONLY (PLACEHOLDER)</span>
            <Textarea aria-label="Textarea, read only placeholder state" placeholder="Read only placeholder" readOnly />
        </div>
    </div>
);

/** Count — with `maxLength`, a count on the right of the caption, beside any error. */
export const Count = () => {
    const [value, setValue] = useState('We covered linear equations.');
    return (
        <div style={{ maxWidth: '600px' }}>
            <Textarea
                id="textarea-count"
                label="Session notes"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={120}
                validation={value.length < 40 ? 'invalid' : 'none'}
                validationMessage="Add a little more detail."
            />
        </div>
    );
};

Count.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Session notes' });
    const count = canvasElement.querySelector('.plus-field-caption__count');

    await expect(count).toHaveTextContent('28 / 120');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Add a little more detail.');
    await expect(field.getAttribute('maxlength')).toBe('120');

    await userEvent.type(field, ' And slope, and intercepts.');
    await expect(count).toHaveTextContent('55 / 120');
    // The error clears; the count stays.
    await expect(canvas.queryByRole('alert')).toBeNull();
};

/**
 * Subtle — plain text until hovered or edited. Save and Cancel show while
 * editing, and the field stays open when focus leaves it.
 */
export const Subtle = (args) => {
    const [saved, setSaved] = useState('Worked through slope.');
    return (
        <div style={{ maxWidth: '600px' }}>
            <Textarea
                id="textarea-subtle"
                label="Session notes"
                subtle
                rows={2}
                value={saved}
                onSave={async (next) => {
                    if (args.onSave) args.onSave(next);
                    await new Promise((resolve) => setTimeout(resolve, 150));
                    if (next.includes('fail')) throw new Error('Notes could not be saved.');
                    setSaved(next);
                }}
            />
        </div>
    );
};
Subtle.args = { onSave: fn() };

Subtle.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Session notes' });

    await expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull();

    // Typing opens the editor; leaving the field does not save or close it.
    await userEvent.click(field);
    await userEvent.type(field, ' Then intercepts.');
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeTruthy();
    await userEvent.tab({ shift: true });
    await expect(args.onSave).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeTruthy();

    // Save saves, with "saving…" in Trailing.
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith('Worked through slope. Then intercepts.');
    await expect(canvas.getByRole('status')).toHaveTextContent('saving…');
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull());

    // Cancel puts the saved text back.
    await userEvent.click(field);
    await userEvent.type(field, ' Scratch that.');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(field).toHaveValue('Worked through slope. Then intercepts.');

    // A failed save stays open in invalid and keeps the text.
    await userEvent.click(field);
    await userEvent.type(field, ' fail');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Notes could not be saved.'));
    await expect(field).toHaveValue('Worked through slope. Then intercepts. fail');
    await expect(field.getAttribute('aria-invalid')).toBe('true');
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeTruthy();
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px', padding: '20px' }}>
            <Textarea {...args} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    );
};

Interactive.args = {
    label: 'Interactive Label',
    placeholder: 'Type something...',
    size: 'medium',
    rows: 3,
    validation: 'none',
    validationMessage: '',
    disabled: false,
    readOnly: false,
};
