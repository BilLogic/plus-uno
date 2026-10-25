import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { eachColorMode } from '@/storybook-docs/lib/each-color-mode.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
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

/** One height, 32. `small` and `large` are deprecated and draw like `medium`. */
export const Sizes = () => (
    <div style={row}>
        {['small', 'medium', 'large'].map((size) => (
            <Field key={size} size={size} data-testid={size}>{control(`${size} field`)}</Field>
        ))}
    </div>
);

Sizes.play = async ({ canvasElement }) => {
    const height = (size) => px(getComputedStyle(within(canvasElement).getByTestId(size)).height);
    await expect(height('small')).toBe(32);
    await expect(height('medium')).toBe(32);
    await expect(height('large')).toBe(32);
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
    // Focus is the focus ring: 2px, and 2px off the box onto the surface.
    await expect(style('focus').outlineStyle).toBe('solid');
    await expect(px(style('focus').outlineWidth)).toBe(2);
    await expect(px(style('focus').outlineOffset)).toBe(2);
    // The disabled box fades once, by the disabled opacity token (0.4, Atlassian's opacity.disabled).
    await expect(Number(style('disabled').opacity)).toBeCloseTo(0.4, 2);

    // Each state's colors are its tokens, in every color mode.
    for (const [name] of STATES) within(canvasElement).getByTestId(name).style.transition = 'none';
    const token = (name) => tokenColor(canvasElement, name);
    const placeholder = getComputedStyle(within(canvasElement).getByRole('textbox', { name: 'default field' }), '::placeholder');
    await eachColorMode(async ({ label }) => {
        await expect(style('default').borderTopColor, `${label}: border`).toBe(token('--ds-border-input'));
        await expect(style('default').backgroundColor, `${label}: fill`).toBe(token('--ds-background-input'));
        await expect(style('default').color, `${label}: text`).toBe(token('--ds-text'));
        await expect(placeholder.color, `${label}: placeholder`).toBe(token('--ds-text-subtlest'));
        await expect(style('hover').backgroundColor, `${label}: hover fill`).toBe(token('--ds-background-input-hovered'));
        await expect(style('hover').borderTopColor, `${label}: hover border`).toBe(token('--ds-border-input'));
        await expect(style('focus').outlineColor, `${label}: ring`).toBe(token('--ds-border-focused'));
        await expect(style('read-only').backgroundColor, `${label}: read-only fill`).toBe(token('--ds-background-neutral'));
        await expect(style('invalid').borderTopColor, `${label}: invalid border`).toBe(token('--ds-border-danger'));
        await expect(style('valid').borderTopColor, `${label}: valid border`).toBe(token('--ds-border-success'));
    });
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

    // Hover is the neutral subtle step; editing is the standard field's fill and border.
    for (const name of ['rest', 'hover', 'focus']) box(name).style.transition = 'none';
    const token = (name) => tokenColor(canvasElement, name);
    await eachColorMode(async ({ label }) => {
        await expect(getComputedStyle(box('hover')).backgroundColor, `${label}: hover fill`).toBe(token('--ds-background-neutral-subtle-hovered'));
        await expect(getComputedStyle(box('focus')).backgroundColor, `${label}: editing fill`).toBe(token('--ds-background-input'));
        await expect(getComputedStyle(box('focus')).borderTopColor, `${label}: editing border`).toBe(token('--ds-border-input'));
    });
};
