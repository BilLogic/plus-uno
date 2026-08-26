import React from 'react';
import { expect, within } from 'storybook/test';

import DateAndTimePicker from './DateAndTimePicker';
import FileUpload from './FileUpload';
import Input from './Input';
import NumberInput from './NumberInput';
import Rating from './Rating';
import Scale from './RadioButtonGroup';
import TagInput from './TagInput';
import Textarea from './Textarea';

/**
 * Label association across every form component that renders its own label.
 *
 * WHY THIS FILE EXISTS (#206). Eight components rendered `htmlFor={id || name}`
 * while handing only `id` to the control. A caller who passed `name` and no
 * `id` got a label pointing at an id no element carried — a `for` that looks
 * right in the markup and resolves to nothing. Three of them
 * (`DateAndTimePicker`, `Rating`, `TagInput`) never put an id on anything the
 * label could reach, so their labels dangled even when `id` *was* passed.
 *
 * axe's `label` rule only sees half of that: it fires when an `input` ends up
 * with no accessible name, so it catches `Input`, `Textarea` and friends but
 * says nothing about `Rating` or `TagInput`, which render no input at all. The
 * `play` blocks below cover the other half — every `label[for]` in the story
 * has to resolve, and every field has to be reachable by its visible label.
 */

/** Fails with the list of dangling `for` values, which is the useful message. */
async function expectNoDanglingLabels(canvasElement) {
    const doc = canvasElement.ownerDocument;
    const dangling = Array.from(canvasElement.querySelectorAll('label[for]'))
        .map((label) => label.getAttribute('for'))
        .filter((target) => !doc.getElementById(target));
    await expect(dangling).toEqual([]);
}

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const scaleOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

export default {
    title: 'Components/Forms and inputs/Label association',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #206: every form component that renders its own '
                    + 'label must associate that label with something real, whether the caller '
                    + 'passes `id`, `name`, both, or neither.',
            },
        },
    },
};

/**
 * The case that was broken: `name` given, `id` omitted. Every label here used
 * to point at the `name` string, which no element carried.
 */
export const NameWithoutId = () => (
    <div style={stack}>
        <Input name="email" label="Email address" placeholder="you@example.com" />
        <Textarea name="message" label="Message" placeholder="Say something" />
        <NumberInput name="quantity" label="Quantity" />
        <FileUpload name="transcript" label="Transcript" />
        <DateAndTimePicker name="starts" label="Session start" />
        <Scale name="confidence" label="Confidence" options={scaleOptions} />
        <Rating name="overall" label="Overall rating" value={3} />
        <TagInput name="topics" label="Topics" tags={['Algebra', 'Geometry']} />
    </div>
);

NameWithoutId.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoDanglingLabels(canvasElement);

    // Single-control fields: the visible label has to name the control itself.
    await expect(canvas.getByLabelText('Email address').tagName).toBe('INPUT');
    await expect(canvas.getByLabelText('Message').tagName).toBe('TEXTAREA');
    await expect(canvas.getByLabelText('Quantity').tagName).toBe('INPUT');
    await expect(canvas.getByLabelText('Transcript').getAttribute('type')).toBe('file');

    // Composite fields: one label over several controls is a group label.
    const dateTime = canvas.getByRole('group', { name: /Session start/ });
    await expect(within(dateTime).getAllByLabelText(/Session start/)).toHaveLength(2);
    canvas.getByRole('radiogroup', { name: /Confidence/ });
    canvas.getByRole('group', { name: /Overall rating/ });
    canvas.getByRole('group', { name: /Topics/ });
};

/**
 * The contract the fix must not disturb: a caller who passes `id` keeps the
 * exact ids they passed, on the exact elements they were on before.
 */
export const ExplicitIds = () => (
    <div style={stack}>
        <Input id="la-email" name="email" label="Email address" />
        <Textarea id="la-message" name="message" label="Message" />
        <NumberInput id="la-quantity" name="quantity" label="Quantity" />
        <FileUpload id="la-transcript" name="transcript" label="Transcript" />
        <DateAndTimePicker id="la-starts" name="starts" label="Session start" />
        <Scale id="la-confidence" name="confidence" label="Confidence" options={scaleOptions} />
        <Rating id="la-overall" name="overall" label="Overall rating" value={3} />
        <TagInput id="la-topics" name="topics" label="Topics" tags={['Algebra']} />
    </div>
);

ExplicitIds.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await expectNoDanglingLabels(canvasElement);

    // Ids that shipped before #206 and are therefore public surface.
    for (const id of [
        'la-email',
        'la-message',
        'la-quantity',
        'la-transcript',
        'la-starts-date',
        'la-starts-time',
        'la-confidence-option-0',
        'la-topics-container',
    ]) {
        await expect(doc.getElementById(id)).not.toBeNull();
    }
};
