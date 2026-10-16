import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import Field from './Field';

/**
 * _Field — the part behind Input, Textarea, Number input and Input group.
 *
 * Unpublished in Figma and absent from the barrel: it is never placed on a
 * screen by itself, so it has stories and no docs page. Each story pins down
 * one thing the hosts inherit, so a change here shows up here first.
 */
export default {
    title: 'Components/Forms and inputs/_Field',
    component: Field,
    tags: ['!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The one box behind every text-like input: size, border, fill and state, '
                    + 'with Leading, Content and Trailing slots.',
            },
        },
    },
};

const row = { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px' };
const caption = { display: 'block', marginBottom: '4px' };

const control = (name, extra = {}) => (
    <input className="plus-field__control" aria-label={name} placeholder="Placeholder" {...extra} />
);

const px = (value) => Math.round(parseFloat(value));

/** Leading, Content and Trailing, in that order. */
export const Anatomy = () => (
    <div style={row}>
        <Field
            leading={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
            trailing={<i className="fa-solid fa-caret-down" aria-hidden="true" />}
        >
            {control('Search tutors')}
        </Field>
    </div>
);

Anatomy.play = async ({ canvasElement }) => {
    const box = canvasElement.querySelector('.plus-field');
    const slots = [...box.children].map((child) => child.className);
    await expect(slots).toEqual(['plus-field__leading', 'plus-field__content', 'plus-field__trailing']);

    // A press on the box's own padding puts the caret in the control.
    const input = within(canvasElement).getByRole('textbox', { name: 'Search tutors' });
    await userEvent.pointer({ keys: '[MouseLeft]', target: box, coords: { offsetX: 1, offsetY: 1 } });
    await expect(document.activeElement).toBe(input);
};

/** Small, medium and large: 28, 34 and 40 high, as in the library. */
export const Sizes = () => (
    <div style={row}>
        {['small', 'medium', 'large'].map((size) => (
            <Field key={size} size={size} data-testid={size}>{control(`${size} field`)}</Field>
        ))}
    </div>
);

Sizes.play = async ({ canvasElement }) => {
    const height = (size) => px(getComputedStyle(within(canvasElement).getByTestId(size)).height);
    await expect(height('small')).toBe(28);
    await expect(height('medium')).toBe(34);
    await expect(height('large')).toBe(40);
};

const STATES = [
    ['default', {}],
    ['hover', { state: 'hover' }],
    ['focus', { state: 'focus' }],
    ['disabled', { disabled: true }],
    ['read-only', { readOnly: true }],
    ['invalid', { invalid: true }],
    ['valid', { valid: true }],
];

/** Every state, drawn still. Hover and focus are live in use. */
export const States = () => (
    <div style={row}>
        {STATES.map(([name, props]) => (
            <div key={name}>
                <span className="body3-txt" style={caption}>{name}</span>
                <Field {...props} data-testid={name}>
                    {control(`${name} field`, { disabled: props.disabled, readOnly: props.readOnly, defaultValue: 'Bill Guo' })}
                </Field>
            </div>
        ))}
    </div>
);

States.play = async ({ canvasElement }) => {
    const style = (name) => getComputedStyle(within(canvasElement).getByTestId(name));

    // One border: 1px, in every state.
    for (const [name] of STATES) {
        await expect(px(style(name).borderTopWidth), `${name} border`).toBe(1);
    }
    // Focus is a 2px ring, drawn inside the box.
    await expect(style('focus').outlineStyle).toBe('solid');
    await expect(px(style('focus').outlineWidth)).toBe(2);
    await expect(px(style('focus').outlineOffset)).toBe(-2);
    // Hover changes the border color, not its width.
    await expect(style('hover').borderTopColor).not.toBe(style('default').borderTopColor);
    // One fill, and read-only's own.
    await expect(style('read-only').backgroundColor).not.toBe(style('default').backgroundColor);
    // The disabled box fades once.
    await expect(Number(style('disabled').opacity)).toBeCloseTo(0.38, 2);
    // Invalid and valid each own a border color.
    await expect(style('invalid').borderTopColor).not.toBe(style('default').borderTopColor);
    await expect(style('valid').borderTopColor).not.toBe(style('invalid').borderTopColor);
};

/** Focus within the box draws the ring; nothing in the host tracks it. */
export const LiveFocus = () => (
    <div style={row}>
        <Field data-testid="live">{control('Your name')}</Field>
    </div>
);

LiveFocus.play = async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId('live');
    await expect(getComputedStyle(box).outlineStyle).toBe('none');
    await userEvent.click(within(canvasElement).getByRole('textbox', { name: 'Your name' }));
    await expect(getComputedStyle(box).outlineStyle).toBe('solid');
    await expect(px(getComputedStyle(box).outlineWidth)).toBe(2);
};

/** Subtle: plain text at rest, a gray fill and the caret on hover, the standard field while editing. */
export const Subtle = () => (
    <div style={row}>
        {[['rest', {}], ['hover', { state: 'hover' }], ['focus', { state: 'focus' }]].map(([name, props]) => (
            <div key={name}>
                <span className="body3-txt" style={caption}>{name}</span>
                <Field
                    subtle
                    {...props}
                    data-testid={name}
                    trailing={<i className="fa-solid fa-caret-down" aria-hidden="true" />}
                >
                    {control(`Grade level, ${name}`, { defaultValue: '8th grade' })}
                </Field>
            </div>
        ))}
    </div>
);

Subtle.play = async ({ canvasElement }) => {
    const box = (name) => within(canvasElement).getByTestId(name);
    const transparent = 'rgba(0, 0, 0, 0)';

    await expect(getComputedStyle(box('rest')).borderTopColor).toBe(transparent);
    await expect(getComputedStyle(box('rest')).backgroundColor).toBe(transparent);
    await expect(getComputedStyle(box('rest').querySelector('.plus-field__trailing')).visibility).toBe('hidden');

    await expect(getComputedStyle(box('hover')).backgroundColor).not.toBe(transparent);
    await expect(getComputedStyle(box('hover').querySelector('.plus-field__trailing')).visibility).toBe('visible');

    await expect(getComputedStyle(box('focus')).borderTopColor).not.toBe(transparent);
    await expect(px(getComputedStyle(box('focus')).outlineWidth)).toBe(2);
};
