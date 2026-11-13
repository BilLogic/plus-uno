import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Cascader, DateTimePicker, DatePicker, TextField, RichTextEditor, Select, TagInput, TextArea, TreeSelect } from '@/components';

/**
 * Every single-line field is 40 high, or 32 compact, its content centered,
 * side padding 12. A button inside a field is 32 in the 40 field and 24 in the
 * 32 field, centered with 4 around it. Text area (80), Rich text editor (120)
 * and Tag field (40) start at a minimum and grow.
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
    { value: 'middle', label: 'Middle schools' },
    { value: 'high', label: 'High schools' },
];

const CASCADE = [
    { text: 'Middle schools', value: 'middle', children: [{ text: 'Lincoln Middle', value: 'lincoln-middle' }] },
];

const TREE = [
    { label: 'Middle schools', value: 'middle', children: [{ label: 'Lincoln Middle', value: 'lincoln-middle' }] },
];

/** One of each single-line field, at its default spacing. */
const SINGLE_LINE = [
    ['Text field', () => <TextField label="Text field" placeholder="Name" />],
    ['Select', () => <Select label="Select" options={OPTIONS} placeholder="Site" />],
    ['Number field', () => <TextField type="number" label="Number field" defaultValue={3} />],
    ['Date picker', () => <DatePicker aria-label="Date picker" placeholder="MM/DD/YYYY" />],
    ['Date time picker', () => <DateTimePicker label="Date time picker" />],
    ['Cascader', () => <Cascader options={CASCADE} onChange={() => {}} />],
    ['Tree select', () => <TreeSelect options={TREE} onChange={() => {}} />],
    ['Text field with affixes', () => <TextField label="Text field with affixes" elemBeforeInput="$" elemAfterInput=".00" />],
];

/** Each single-line field is 40, its text centered, its side padding 12. */
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
            await expect(heightOf(box), `${name} height`).toBe(40);

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

/** Compact fields are 32 and take a quarter of that for their corners: 8. */
export const Compact = () => (
    <div style={stack}>
        <div data-field="Compact text field"><TextField label="Compact text field" spacing="compact" /></div>
        <div data-field="Compact number field"><TextField type="number" label="Compact number field" spacing="compact" defaultValue={2} /></div>
    </div>
);

Compact.play = async ({ canvasElement }) => {
    for (const name of ['Compact text field', 'Compact number field']) {
        const box = fieldIn(canvasElement, name);
        await expect(heightOf(box), `${name} height`).toBe(32);
        await expect(Math.round(parseFloat(getComputedStyle(box).borderTopLeftRadius)), `${name} radius`).toBe(8);
    }
};

/** A button inside a field: 32 in the 40 field, 24 in the 32 field, centered, 4 from the box's edge. */
export const ButtonInside = () => (
    <div style={stack}>
        <div data-field="Buttons">
            <TextField
                label="Invite by email"
                elemAfterInput={(
                    <>
                        <Button appearance="default" spacing="default" text="Copy" />
                        <Button appearance="default" spacing="default" text="Send" />
                    </>
                )}
            />
        </div>
        <div data-field="Before button">
            <TextField label="Search tutors" elemBeforeInput={<Button appearance="default" spacing="default" text="Filter" />} />
        </div>
        <div data-field="Compact buttons">
            <TextField
                label="Invite by email, compact"
                spacing="compact"
                elemAfterInput={<Button appearance="default" spacing="compact" text="Send" />}
            />
        </div>
        <div data-field="Steppers">
            <TextField type="number" label="Sessions" defaultValue={3} />
        </div>
        <div data-field="Time">
            <DateTimePicker label="Starts" showDate={false} />
        </div>
    </div>
);

ButtonInside.play = async ({ canvasElement }) => {
    const heights = { Buttons: [40, 32], 'Before button': [40, 32], 'Compact buttons': [32, 24], Steppers: [40, 32] };
    for (const [name, [fieldHeight, buttonHeight]] of Object.entries(heights)) {
        const box = fieldIn(canvasElement, name);
        await expect(heightOf(box), `${name} field height`).toBe(fieldHeight);
        const outer = rect(box);
        const buttons = [...box.querySelectorAll('.plus-btn')];
        await expect(buttons.length, `${name} buttons`).toBeGreaterThan(0);
        for (const button of buttons) {
            const inner = rect(button);
            await expect(Math.round(inner.height), `${name} button height`).toBe(buttonHeight);
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

    // The time field is the same 40 as every field, its text centered in it.
    const timeBox = fieldIn(canvasElement, 'Time');
    const timeText = rect(timeBox.querySelector('.plus-field__control'));
    await expect(heightOf(timeBox), 'Time field height').toBe(40);
    await expect(Math.abs(middle(timeText) - middle(rect(timeBox))), 'time text centered').toBeLessThanOrEqual(0.5);

    // Steppers are square.
    for (const stepper of fieldIn(canvasElement, 'Steppers').querySelectorAll('.plus-field-stepper')) {
        await expect(Math.round(rect(stepper).width)).toBe(32);
    }
};

const MANY_TAGS = ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'South High', 'Riverside Academy', 'Jefferson Elementary', 'Washington Middle', 'Oakwood'];

/** Text area, Rich text editor and Tag field start at their minimums and grow. */
export const MultiLine = () => (
    <div style={stack}>
        <div data-field="Text area"><TextArea label="Text area" rows={1} /></div>
        <div data-field="Long text area"><TextArea label="Long text area" rows={8} /></div>
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

    await expect(heightOf(fieldIn(canvasElement, 'Tag field')), 'Tag field minimum').toBe(40);
    // At rest a full Tag field is one line; with focus its tags wrap and it grows.
    const full = fieldIn(canvasElement, 'Full tag field');
    await expect(heightOf(full), 'Full tag field at rest').toBe(40);
    await userEvent.click(within(full).getByRole('combobox'));
    await waitFor(() => expect(heightOf(full), 'Tag field grows').toBeGreaterThan(40));
};
