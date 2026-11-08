import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid, expectReadOnly } from '../_internal/fieldStatePlays';
import TextArea from './TextArea';

export default {
    title: 'Components/Forms and inputs/Text area',
    component: TextArea,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A text area lets users enter long form text which spans over multiple lines. It is 80 high at least, and `rows` grows it from there.',
            },
        },
    },
    argTypes: {
        label: { control: 'text', table: { category: 'Content' } },
        placeholder: { control: 'text', table: { category: 'Content' } },
        rows: { control: 'number', table: { category: 'Layout' } },
        maxLength: { control: 'number', table: { category: 'Content' } },
        spacing: { control: 'radio', options: ['default', 'compact'], table: { category: 'Design' } },
        appearance: { control: 'radio', options: ['standard', 'subtle'], table: { category: 'Design' } },
        isInvalid: { control: 'boolean', table: { category: 'Validation' } },
        errorMessage: { control: 'text', table: { category: 'Validation' } },
        warningMessage: { control: 'text', table: { category: 'Validation' } },
        successMessage: { control: 'text', table: { category: 'Validation' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isReadOnly: { control: 'boolean', table: { category: 'Behavior' } },
        isRequired: { control: 'boolean', table: { category: 'Content' } },
        isLabelHidden: { control: 'boolean', table: { category: 'Content' } },
        style: { table: { disable: true } },
        value: { control: false, table: { disable: true } },
        defaultValue: { control: false, table: { disable: true } },
        onChange: { control: false, table: { disable: true } },
        onSave: { table: { disable: true } },
        id: { control: false, table: { disable: true } },
        name: { control: false, table: { disable: true } },
        className: { control: false, table: { disable: true } },
    },
};

const fieldWrap = { maxWidth: 'var(--width-2500)' };
const label = 'text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3';
const px = (value) => Math.round(parseFloat(value));

export const Overview = () => (
    <div style={fieldWrap}>
        <TextArea id="text-area-overview" label="Label" placeholder="Enter text..." rows={3} />
    </div>
);

Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formTextArea }
    }
};

/** Rows: the field is 80 high at least, and `rows` grows it from there. */
export const Rows = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px' }}>
        {[1, 3, 6].map((rows) => (
            <div key={rows}>
                <span className={label}>{rows === 1 ? '1 ROW' : `${rows} ROWS`}</span>
                <TextArea id={`text-area-rows-${rows}`} label={`${rows} rows`} isLabelHidden placeholder="Enter text..." rows={rows} />
            </div>
        ))}
    </div>
);

Rows.play = async ({ canvasElement }) => {
    const height = (rows) => Math.round(
        canvasElement.querySelector(`#text-area-rows-${rows}`).closest('.plus-field').getBoundingClientRect().height,
    );
    await expect(canvasElement.querySelector('#text-area-rows-1').getAttribute('rows')).toBe('1');
    await expect(height(1)).toBe(80);
    await expect(height(3)).toBe(80);
    await expect(height(6)).toBeGreaterThan(80);
};

/** Spacing: the same 80 minimum, with 10 corners by default and 8 compact, like the single-line field beside it. */
export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        {['default', 'compact'].map((spacing) => (
            <div key={spacing}>
                <span className={label}>{spacing.toUpperCase()}</span>
                <TextArea id={`text-area-spacing-${spacing}`} label={`${spacing} text area`} isLabelHidden placeholder="Enter text..." spacing={spacing} rows={2} />
            </div>
        ))}
    </div>
);

Spacing.play = async ({ canvasElement }) => {
    const box = (spacing) => canvasElement.querySelector(`#text-area-spacing-${spacing}`).closest('.plus-field');
    await expect(px(getComputedStyle(box('default')).borderTopLeftRadius)).toBe(10);
    await expect(px(getComputedStyle(box('compact')).borderTopLeftRadius)).toBe(8);
};



/** One story per value, for the Examples tab. */
export const Rows1 = () => <div style={fieldWrap}><TextArea label="Notes" placeholder="Enter text..." rows={1} /></div>;
export const Rows3 = () => <div style={fieldWrap}><TextArea label="Notes" placeholder="Enter text..." rows={3} /></div>;
export const Rows6 = () => <div style={fieldWrap}><TextArea label="Notes" placeholder="Enter text..." rows={6} /></div>;

export const SpacingDefault = () => <div style={fieldWrap}><TextArea label="Notes" placeholder="Enter text..." spacing="default" rows={2} /></div>;
export const SpacingCompact = () => <div style={fieldWrap}><TextArea label="Notes" placeholder="Enter text..." spacing="compact" rows={2} /></div>;

export const Filled = () => <div style={fieldWrap}><TextArea label="Notes" defaultValue="Worked through slope and intercepts." /></div>;
export const Success = () => <div style={fieldWrap}><TextArea label="Notes" defaultValue="Worked through slope and intercepts." successMessage="Looks good." /></div>;
export const Warning = () => <div style={fieldWrap}><TextArea label="Notes" defaultValue="Short note" warningMessage="This is shorter than most notes." /></div>;

/** Focus is a ring only: no fill, border or text color changes. */
export const FocusRing = () => (
    <div style={{ maxWidth: '600px' }}>
        <TextArea id="text-area-focus" label="Notes" placeholder="Enter text..." />
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Notes' });
    const box = field.closest('.plus-field');
    const rest = { fill: getComputedStyle(box).backgroundColor, border: getComputedStyle(box).borderTopColor };
    await userEvent.click(field);
    await waitFor(() => expect(getComputedStyle(box).outlineStyle).toBe('solid'));
    await expect(px(getComputedStyle(box).outlineWidth)).toBe(2);
    await expect(getComputedStyle(box).backgroundColor, 'focus changes no fill').toBe(rest.fill);
    await expect(getComputedStyle(box).borderTopColor, 'focus changes no border').toBe(rest.border);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(box).outlineColor, `${mode}: ring`).toBe(token('--ds-border-focused'));
    });
};

/** Count: with `maxLength`, a count on the right of the caption, beside any error. */
export const Count = () => {
    const [value, setValue] = useState('We covered linear equations.');
    return (
        <div style={fieldWrap}>
            <TextArea
                id="text-area-count"
                label="Session notes"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={120}
                isInvalid={value.length < 40}
                errorMessage="Add a little more detail."
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
    await expect(canvas.queryByRole('alert')).toBeNull();
};

/**
 * Subtle: plain text until hovered or edited. Save and Cancel show while
 * editing, and the field stays open when focus leaves it.
 */
export const Subtle = (args) => {
    const [saved, setSaved] = useState('Worked through slope.');
    return (
        <div style={fieldWrap}>
            <TextArea
                id="text-area-subtle"
                label="Session notes"
                appearance="subtle"
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

    await userEvent.click(field);
    await userEvent.type(field, ' Then intercepts.');
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeTruthy();
    await userEvent.tab({ shift: true });
    await expect(args.onSave).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeTruthy();

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith('Worked through slope. Then intercepts.');
    await expect(canvas.getByRole('status')).toHaveTextContent('saving…');
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Save' })).toBeNull());

    await userEvent.click(field);
    await userEvent.type(field, ' Scratch that.');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(field).toHaveValue('Worked through slope. Then intercepts.');

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
        <div style={fieldWrap}>
            <TextArea {...args} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
    );
};

Interactive.args = {
    label: 'Interactive Label',
    placeholder: 'Type something...',
    spacing: 'default',
    appearance: 'standard',
    rows: 3,
    isInvalid: false,
    errorMessage: '',
    isDisabled: false,
    isReadOnly: false,
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('textbox', { name: 'Notes' });
const wrap = { maxWidth: 'var(--width-2500)', minHeight: 'var(--height-250)' };

export const Rest = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-rest" label="Notes" placeholder="Notes" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-hover" label="Notes" placeholder="Notes" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-focus" label="Notes" placeholder="Notes" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-disabled" label="Notes" placeholder="Notes" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-invalid" label="Notes" placeholder="Notes" isInvalid errorMessage="Add a note." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};

export const FieldReadOnly = {
    render: () => <div style={wrap}><TextArea id="textarea-ex-readonly" label="Notes" placeholder="Notes" isReadOnly /></div>,
    play: async ({ canvasElement }) => expectReadOnly(canvasElement, controlOf(canvasElement)),
};
