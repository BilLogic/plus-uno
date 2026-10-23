import React from 'react';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import {
    Cascader,
    DateAndTimePicker,
    DatePicker,
    Input,
    InputGroup,
    NumberInput,
    RichTextEditor,
    Select,
    TagInput,
    Textarea,
    TreeSelect,
} from '@/components';

/**
 * Every single-line field is 32 high, its content centered, side padding 12.
 * A button inside a field is the 24 compact button, centered with 4 around
 * it. Text area (80), Rich text editor (120) and Tag field (32) start at a
 * minimum and grow.
 *
 * Size prop names stay. `medium` draws 32; `small` and `large` are
 * deprecated: they draw like `medium` and warn in development.
 */
export default {
    title: 'Components/Forms and inputs/Field heights',
    tags: ['!dev', '!autodocs'],
};

const stack = { display: 'flex', flexDirection: 'column', gap: '16px', width: '320px' };

const rect = (element) => element.getBoundingClientRect();
const heightOf = (element) => Math.round(rect(element).height);
const middle = (r) => r.top + r.height / 2;

/** The box a host draws, found from the wrapper that names it. */
const fieldIn = (canvasElement, name) => canvasElement.querySelector(`[data-field="${name}"] .plus-field`);

/** What a field shows as its text: the control, or the Select's value text. */
const textIn = (box) => box.querySelector('.plus-select-text, input:not([type="hidden"])');

const OPTIONS = [
    { value: 'math', label: 'Math' },
    { value: 'science', label: 'Science' },
];

const CASCADE = [
    { text: 'Math', value: 'math', children: [{ text: 'Algebra', value: 'algebra' }] },
];

const TREE = [
    { label: 'Math', value: 'math', children: [{ label: 'Algebra', value: 'algebra' }] },
];

/** One of each single-line field, at its default size. */
const SINGLE_LINE = [
    ['Text field', () => <Input label="Text field" placeholder="Name" />],
    ['Select', () => <Select label="Select" options={OPTIONS} placeholder="Subject" />],
    ['Number field', () => <NumberInput label="Number field" defaultValue={3} />],
    ['Date picker', () => <DatePicker aria-label="Date picker" placeholder="MM/DD/YYYY" />],
    ['Date time picker', () => <DateAndTimePicker label="Date time picker" />],
    ['Cascader', () => <Cascader options={CASCADE} onChange={() => {}} />],
    ['Tree select', () => <TreeSelect options={TREE} onChange={() => {}} />],
    ['Text field group', () => <InputGroup label="Text field group" leadingVisual="$" trailingVisual=".00" />],
];

/** Each single-line field is 32, its text centered, its side padding 12. */
export const SingleLine = () => (
    <div style={stack}>
        {SINGLE_LINE.map(([name, render]) => (
            <div key={name} data-field={name}>{render()}</div>
        ))}
    </div>
);

SingleLine.play = async ({ canvasElement }) => {
    for (const [name] of SINGLE_LINE) {
        const boxes = canvasElement.querySelectorAll(`[data-field="${name}"] .plus-field`);
        await expect(boxes.length, `${name} draws a field`).toBeGreaterThan(0);
        for (const box of boxes) {
            await expect(heightOf(box), `${name} height`).toBe(32);

            const style = getComputedStyle(box);
            const side = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
            await expect(side, `${name} side padding`).toBe(12);

            const text = textIn(box);
            await expect(text, `${name} text`).not.toBeNull();
            await expect(Math.abs(middle(rect(text)) - middle(rect(box))), `${name} text centered`)
                .toBeLessThanOrEqual(0.5);
        }
    }
};

/** A 24 compact button inside a field: centered, 4 from the box's edge, and the field stays 32. */
export const ButtonInside = () => (
    <div style={stack}>
        <div data-field="Buttons">
            <InputGroup
                label="Invite by email"
                trailingVisual={[{ type: 'button', text: 'Copy' }, { type: 'button', text: 'Send' }]}
            />
        </div>
        <div data-field="Leading button">
            <InputGroup label="Search tutors" leadingVisual={{ type: 'button', text: 'Filter' }} />
        </div>
        <div data-field="Steppers">
            <NumberInput label="Sessions" defaultValue={3} />
        </div>
    </div>
);

ButtonInside.play = async ({ canvasElement }) => {
    for (const name of ['Buttons', 'Leading button', 'Steppers']) {
        const box = fieldIn(canvasElement, name);
        await expect(heightOf(box), `${name} field height`).toBe(32);
        const outer = rect(box);
        const buttons = [...box.querySelectorAll('.plus-btn')];
        await expect(buttons.length, `${name} buttons`).toBeGreaterThan(0);
        for (const button of buttons) {
            const inner = rect(button);
            await expect(Math.round(inner.height), `${name} button height`).toBe(24);
            await expect(Math.round(inner.top - outer.top), `${name} button top`).toBe(4);
            await expect(Math.round(outer.bottom - inner.bottom), `${name} button bottom`).toBe(4);
        }
        const first = rect(buttons[0]);
        const last = rect(buttons[buttons.length - 1]);
        if (box.querySelector('.plus-field__trailing .plus-btn')) {
            await expect(Math.round(outer.right - last.right), `${name} button end`).toBe(4);
        } else {
            await expect(Math.round(first.left - outer.left), `${name} button start`).toBe(4);
        }
    }
    // Steppers are square.
    for (const stepper of fieldIn(canvasElement, 'Steppers').querySelectorAll('.plus-field-stepper')) {
        await expect(Math.round(rect(stepper).width)).toBe(24);
    }
};

const MANY_TAGS = ['Algebra', 'Geometry', 'Biology', 'Chemistry', 'Physics', 'History', 'Spanish', 'Writing'];

/** Text area, Rich text editor and Tag field start at their minimums and grow. */
export const MultiLine = () => (
    <div style={stack}>
        <div data-field="Text area"><Textarea label="Text area" rows={1} /></div>
        <div data-field="Long text area"><Textarea label="Long text area" rows={8} /></div>
        <div data-field="Rich text editor"><RichTextEditor label="Rich text editor" /></div>
        <div data-field="Tag field"><TagInput label="Tag field" options={MANY_TAGS} /></div>
        <div data-field="Full tag field">
            <TagInput label="Full tag field" options={MANY_TAGS} defaultTags={MANY_TAGS} />
        </div>
    </div>
);

MultiLine.play = async ({ canvasElement }) => {
    await expect(heightOf(fieldIn(canvasElement, 'Text area')), 'Text area minimum').toBe(80);
    await expect(heightOf(fieldIn(canvasElement, 'Long text area')), 'Text area grows').toBeGreaterThan(80);

    const editor = canvasElement.querySelector('[data-field="Rich text editor"] .plus-rich-text-editor-content');
    await expect(heightOf(editor), 'Rich text editor minimum').toBe(120);
    editor.innerHTML = Array.from({ length: 12 }, (_, i) => `<p>Line ${i + 1}</p>`).join('');
    await waitFor(() => expect(heightOf(editor), 'Rich text editor grows').toBeGreaterThan(120));

    await expect(heightOf(fieldIn(canvasElement, 'Tag field')), 'Tag field minimum').toBe(32);
    // At rest a full Tag field is one line; with focus its tags wrap and it grows.
    const full = fieldIn(canvasElement, 'Full tag field');
    await expect(heightOf(full), 'Full tag field at rest').toBe(32);
    await userEvent.click(within(full).getByRole('combobox'));
    await waitFor(() => expect(heightOf(full), 'Tag field grows').toBeGreaterThan(32));
};

const DEPRECATED = [
    ['Input', (size) => <Input size={size} label={`Input ${size}`} />],
    ['Select', (size) => <Select size={size} label={`Select ${size}`} options={OPTIONS} />],
    ['NumberInput', (size) => <NumberInput size={size} label={`Number ${size}`} defaultValue={1} />],
    ['DatePicker', (size) => <DatePicker size={size} aria-label={`Date ${size}`} />],
    ['DateAndTimePicker', (size) => <DateAndTimePicker size={size} label={`Date and time ${size}`} />],
    ['InputGroup', (size) => <InputGroup size={size} label={`Group ${size}`} leadingVisual="$" />],
    ['TagInput', (size) => <TagInput size={size} label={`Tags ${size}`} options={MANY_TAGS} />],
    ['Textarea', (size) => <Textarea size={size} label={`Text area ${size}`} rows={1} />],
    ['RichTextEditor', (size) => <RichTextEditor size={size} label={`Editor ${size}`} />],
];

/** `small` and `large` are deprecated: they draw like `medium` and warn in development. */
let sizeWarn;
export const DeprecatedSizes = {
    beforeEach: () => {
        sizeWarn = spyOn(console, 'warn').mockImplementation(() => {});
        return () => sizeWarn.mockRestore();
    },
    render: () => (
        <div style={stack}>
            {DEPRECATED.map(([name, render]) => ['small', 'medium', 'large'].map((size) => (
                <div key={`${name}-${size}`} data-field={`${name} ${size}`}>{render(size)}</div>
            )))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const messages = sizeWarn.mock.calls.map((call) => String(call[0]));
        for (const [name] of DEPRECATED) {
            for (const size of ['small', 'large']) {
                await expect(
                    messages.some((m) => m.startsWith(`[${name}]`) && m.includes(`size="${size}" is deprecated`)),
                    `${name} warns for ${size}`,
                ).toBe(true);
            }
            await expect(
                messages.some((m) => m.startsWith(`[${name}]`) && m.includes('size="medium" is deprecated')),
                `${name} does not warn for medium`,
            ).toBe(false);

            const medium = canvasElement.querySelector(`[data-field="${name} medium"]`);
            for (const size of ['small', 'large']) {
                const other = canvasElement.querySelector(`[data-field="${name} ${size}"]`);
                await expect(heightOf(other), `${name} ${size} draws like medium`).toBe(heightOf(medium));
            }
        }
    },
};
