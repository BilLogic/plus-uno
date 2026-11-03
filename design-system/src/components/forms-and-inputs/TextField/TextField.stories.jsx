import React, { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Button from '../Button/Button';
import TextField from './TextField';

export default {
    title: 'Components/Forms and inputs/Text field',
    component: TextField,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Text field replaces Input, Number input and Input group. It is 40 high, or 32 with `spacing="compact"`; `elemBefore` and `elemAfter` take what the group addons did; `type="number"` adds the steppers.' },
            { date: '2026-11-03', kind: 'added', summary: 'A warning message, with `border.warning` on the field.' },
        ],
        docs: {
            description: {
                component: 'A text field is an input that allows a user to write or edit text. Adapted from Atlassian Design System Text field.'
            }
        }
    },
    argTypes: {
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: '`default` is 40 high; `compact` is 32.',
            table: { category: 'Design' }
        },
        appearance: {
            control: 'select',
            options: ['standard', 'subtle'],
            description: '`subtle` is transparent until it is hovered or edited.',
            table: { category: 'Design' }
        },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isReadOnly: { control: 'boolean', table: { category: 'Behavior' } },
        isInvalid: { control: 'boolean', table: { category: 'Validation' } },
        errorMessage: { control: 'text', table: { category: 'Validation' } },
        warningMessage: { control: 'text', table: { category: 'Validation' } },
        successMessage: { control: 'text', table: { category: 'Validation' } },
        isLabelHidden: {
            control: 'boolean',
            description: 'Hides the label visually. It is still rendered and still names the input.',
            table: { category: 'Content' }
        },
        label: { control: 'text', table: { category: 'Content' } },
        isRequired: { control: 'boolean', table: { category: 'Content' } },
        placeholder: { control: 'text', table: { category: 'Content' } },
        elemBefore: { control: false, table: { category: 'Content' } },
        elemAfter: { control: false, table: { category: 'Content' } },
        type: { table: { disable: true } },
        id: { control: false, table: { disable: true } },
        name: { control: false, table: { disable: true } },
        value: { control: false, table: { disable: true } },
        defaultValue: { control: false, table: { disable: true } },
        onChange: { control: false, table: { disable: true } },
        inputRef: { table: { disable: true } },
        className: { control: false, table: { disable: true } },
        style: { table: { disable: true } },
    }
};

const caption = 'text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3';
const row = { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' };
const px = (value) => Math.round(parseFloat(value));
const icon = (name) => <i className={`fa-solid fa-${name}`} aria-hidden="true" />;

/** Overview: a labeled field with a placeholder and an element after the control. */
export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <TextField
            id="text-field-overview"
            label="Label"
            placeholder="Placeholder"
            isRequired
            elemAfter={icon('icons')}
        />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formTextField }
    }
};

/** Content: placeholder and value, label and required marker, elements before and after. */
export const Content = () => (
    <div style={{ ...row, gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 260 }}>
            <div>
                <span className={caption}>PLACEHOLDER</span>
                <TextField label="Placeholder" isLabelHidden placeholder="Placeholder" />
            </div>
            <div>
                <span className={caption}>VALUE</span>
                <TextField label="Value" isLabelHidden defaultValue="Value" />
            </div>
            <div>
                <span className={caption}>ELEMENT BEFORE</span>
                <TextField label="Search" isLabelHidden placeholder="Search" elemBefore={icon('magnifying-glass')} />
            </div>
            <div>
                <span className={caption}>TEXT AFFIX</span>
                <TextField label="Amount" isLabelHidden elemBefore="$" elemAfter=".00" defaultValue="12" />
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 260 }}>
            <div>
                <span className={caption}>LABEL</span>
                <TextField label="Label" placeholder="Placeholder" />
            </div>
            <div>
                <span className={caption}>REQUIRED</span>
                <TextField label="Label" isRequired placeholder="Placeholder" />
            </div>
            <div>
                <span className={caption}>HELPER TEXT</span>
                <TextField label="Email" caption="We only use it for reminders." />
            </div>
        </div>
    </div>
);

/** Validation: none, error, warning and success, each with its message. */
export const Validation = () => (
    <div style={row}>
        <div>
            <span className={caption}>NONE</span>
            <TextField label="No validation" isLabelHidden placeholder="Placeholder" />
        </div>
        <div>
            <span className={caption}>ERROR</span>
            <TextField label="Error example" isLabelHidden placeholder="Placeholder" isInvalid errorMessage="Enter a 10-digit number" />
        </div>
        <div>
            <span className={caption}>WARNING</span>
            <TextField label="Warning example" isLabelHidden placeholder="Placeholder" warningMessage="This looks like a school address" />
        </div>
        <div>
            <span className={caption}>SUCCESS</span>
            <TextField label="Success example" isLabelHidden placeholder="Placeholder" successMessage="Looks good" />
        </div>
    </div>
);

/** Spacing: 40 by default, 32 compact. */
export const Spacing = () => (
    <div style={row}>
        {['default', 'compact'].map((spacing) => (
            <div key={spacing}>
                <span className={caption}>{spacing === 'default' ? 'DEFAULT (40)' : 'COMPACT (32)'}</span>
                <TextField
                    id={`text-field-spacing-${spacing}`}
                    label={`${spacing} field`}
                    isLabelHidden
                    placeholder="Placeholder"
                    spacing={spacing}
                    elemAfter={icon('icons')}
                />
            </div>
        ))}
    </div>
);

Spacing.play = async ({ canvasElement }) => {
    const box = (spacing) => canvasElement.querySelector(`#text-field-spacing-${spacing}`).closest('.plus-field');
    await expect(Math.round(box('default').getBoundingClientRect().height)).toBe(40);
    await expect(Math.round(box('compact').getBoundingClientRect().height)).toBe(32);
    // Radius is a quarter of the height: 10 and 8.
    await expect(px(getComputedStyle(box('default')).borderTopLeftRadius)).toBe(10);
    await expect(px(getComputedStyle(box('compact')).borderTopLeftRadius)).toBe(8);
};

/** States: default, disabled and read-only. Hover and focus are live. */
export const States = () => (
    <div style={row}>
        <div>
            <span className={caption}>DEFAULT</span>
            <TextField label="Default" isLabelHidden placeholder="Placeholder" />
        </div>
        <div>
            <span className={caption}>DISABLED</span>
            <TextField label="Disabled" isLabelHidden placeholder="Placeholder" isDisabled />
        </div>
        <div>
            <span className={caption}>READ ONLY</span>
            <TextField label="Read only" isLabelHidden defaultValue="Read only" isReadOnly />
        </div>
    </div>
);

/**
 * Focus is a ring and nothing else: the fill, the border and the text stay as
 * they were at rest, and a 2px ring in `border.focused` is drawn 2px off the box.
 */
export const FocusRing = () => (
    <div style={{ maxWidth: 320 }}>
        <TextField id="text-field-focus" label="Your name" placeholder="Name" />
    </div>
);

FocusRing.play = async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Your name' });
    const box = input.closest('.plus-field');
    const rest = {
        fill: getComputedStyle(box).backgroundColor,
        border: getComputedStyle(box).borderTopColor,
        text: getComputedStyle(box).color,
    };
    await expect(getComputedStyle(box).outlineStyle).toBe('none');
    await userEvent.click(input);
    await waitFor(() => expect(getComputedStyle(box).outlineStyle).toBe('solid'));
    const style = getComputedStyle(box);
    await expect(px(style.outlineWidth)).toBe(2);
    await expect(px(style.outlineOffset)).toBe(2);
    await expect(style.backgroundColor, 'focus changes no fill').toBe(rest.fill);
    await expect(style.borderTopColor, 'focus changes no border').toBe(rest.border);
    await expect(style.color, 'focus changes no text color').toBe(rest.text);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(box).outlineColor, `${mode}: ring`).toBe(token('--ds-border-focused'));
        await expect(getComputedStyle(box).backgroundColor, `${mode}: fill`).toBe(token('--ds-background-input'));
    });
};

/**
 * Interactive playground: customize the Text field attributes in real time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <TextField
                {...args}
                id="text-field-interactive"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

Interactive.args = {
    spacing: 'default',
    appearance: 'standard',
    isDisabled: false,
    isReadOnly: false,
    isInvalid: false,
    errorMessage: '',
    isLabelHidden: false,
    isRequired: true,
    label: 'Label',
    placeholder: 'Placeholder',
};

/**
 * Anatomy: label, `_Field` (before, control, after) and caption. The caption
 * carries a message on the left and a count on the right.
 */
export const Anatomy = () => (
    <div style={{ maxWidth: '360px' }}>
        <TextField
            id="text-field-anatomy"
            label="Full name"
            isRequired
            info="As it appears on your school ID."
            caption="Your first and last name."
            placeholder="Your name"
            elemBefore={icon('user')}
            elemAfter={icon('circle-check')}
            maxLength={40}
            defaultValue="Bill"
        />
    </div>
);

Anatomy.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Full name' });
    const box = input.closest('.plus-field');

    await expect([...box.children].map((child) => child.className))
        .toEqual(['plus-field__leading', 'plus-field__content', 'plus-field__trailing']);
    await expect(box.querySelector('.plus-field__content').contains(input)).toBe(true);

    // Required: an asterisk for the eye, `aria-required` for everyone else.
    await expect(input.getAttribute('aria-required')).toBe('true');
    await expect(canvasElement.querySelector('.plus-field-required').getAttribute('aria-hidden')).toBe('true');

    // The info button sits outside the label, so its name is not the field's.
    const info = canvas.getByRole('button', { name: 'About Full name' });
    await userEvent.hover(info);
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('As it appears on your school ID.'));
    await userEvent.unhover(info);

    await expect(canvasElement.querySelector('.plus-field-caption__message')).toHaveTextContent('Your first and last name.');
    await expect(canvasElement.querySelector('.plus-field-caption__count')).toHaveTextContent('4 / 40');
};

/** The error on the left, the count on the right, together. */
export const ErrorAndCount = () => {
    const [value, setValue] = useState('A summary that runs long');
    return (
        <div style={{ maxWidth: '360px' }}>
            <TextField
                id="text-field-count"
                label="Headline"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={30}
                isInvalid
                errorMessage="Keep it to one line."
            />
        </div>
    );
};

ErrorAndCount.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Headline' });
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Keep it to one line.');
    const count = canvasElement.querySelector('.plus-field-caption__count');
    await expect(count).toHaveTextContent('24 / 30');
    await expect(alert.getBoundingClientRect().left).toBeLessThan(count.getBoundingClientRect().left);
    await expect(Math.round(alert.getBoundingClientRect().top)).toBe(Math.round(count.getBoundingClientRect().top));
    const ids = input.getAttribute('aria-describedby').split(' ');
    await expect(ids).toContain(alert.id);
    await expect(ids).toContain(count.id);
    await userEvent.type(input, '!');
    await expect(count).toHaveTextContent('25 / 30');
};

/** A warning accepts the value: the field is not invalid, and it is described, not announced. */
export const Warning = () => (
    <div style={{ maxWidth: '360px' }}>
        <TextField
            id="text-field-warning"
            label="Meeting link"
            defaultValue="http://example.com"
            warningMessage="This link is not secure."
        />
    </div>
);

Warning.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Meeting link' });
    const box = input.closest('.plus-field');
    await expect(input.getAttribute('aria-invalid')).toBeNull();
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(input.getAttribute('aria-describedby')).toContain('-message');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(box).borderTopColor, `${mode}: warning border`).toBe(token('--ds-border-warning'));
        await expect(getComputedStyle(canvasElement.querySelector('.plus-field-caption__message--warning')).color, `${mode}: warning text`).toBe(token('--ds-text-warning'));
    });
};

/** `autoComplete` reaches the input, for the browser and password managers. */
export const Autofill = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '360px' }}>
        <TextField id="text-field-autofill-email" label="Email address" type="email" autoComplete="email" />
        <TextField id="text-field-autofill-password" label="Password" type="password" autoComplete="current-password" />
        <TextField id="text-field-autofill-code" label="Access code" autoComplete="one-time-code" />
    </div>
);

Autofill.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Email address' }).getAttribute('autocomplete')).toBe('email');
    await expect(canvasElement.querySelector('#text-field-autofill-password').getAttribute('autocomplete')).toBe('current-password');
    await expect(canvas.getByRole('textbox', { name: 'Access code' }).getAttribute('autocomplete')).toBe('one-time-code');
};

/** Search: the magnifier before the control and a visually hidden label. */
export const Search = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '360px' }}>
        <TextField id="text-field-search-compact" label="Search tutors" isLabelHidden type="search" spacing="compact" placeholder="Search tutors" elemBefore={icon('magnifying-glass')} />
        <TextField id="text-field-search" label="Search tutors" isLabelHidden type="search" placeholder="Search tutors" elemBefore={icon('magnifying-glass')} />
    </div>
);

Search.play = async ({ canvasElement }) => {
    const [compact, standard] = within(canvasElement).getAllByRole('searchbox', { name: 'Search tutors' });
    await expect(compact.closest('.plus-field').querySelector('.plus-field__leading .fa-magnifying-glass')).not.toBeNull();
    await expect(standard.closest('.plus-field').querySelector('.plus-field__trailing')).toBeNull();
};

/** Buttons in the slots: 32 in the 40 field, 24 in the 32 field, centered, 4 from the edge. */
export const ButtonsInside = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '360px' }}>
        <div data-field="default">
            <TextField
                label="Invite by email"
                elemAfter={<Button appearance="default" spacing="default" text="Send" />}
            />
        </div>
        <div data-field="compact">
            <TextField
                label="Invite by email, compact"
                spacing="compact"
                elemAfter={<Button appearance="default" spacing="compact" text="Send" />}
            />
        </div>
    </div>
);

ButtonsInside.play = async ({ canvasElement }) => {
    const expected = { default: [40, 32], compact: [32, 24] };
    for (const [name, [field, button]] of Object.entries(expected)) {
        const box = canvasElement.querySelector(`[data-field="${name}"] .plus-field`);
        const outer = box.getBoundingClientRect();
        const inner = box.querySelector('.plus-btn').getBoundingClientRect();   await expect(canvas.getByRole('textbox', { name: 'Students' })).toHaveValue('5');
};

/** A typed number outside min and max is brought inside when the field loses focus. */
export const NumberClampOnBlur = () => (
    <div style={{ maxWidth: '320px' }}>
        <TextField id="text-field-clamp" type="number" label="Sessions" min={1} max={10} />
    </div>
);

NumberClampOnBlur.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Sessions' });
    await userEvent.type(field, '12');
    await expect(field).toHaveValue('12');
    await userEvent.tab();
    await expect(field).toHaveValue('10');
    await userEvent.clear(field);
    await userEvent.type(field, '-3');
    await userEvent.tab();
    await expect(field).toHaveValue('1');
};

/** Scrolling over a focused number field does not change the number. */
export const NumberWheelLeavesTheValue = () => (
    <div style={{ maxWidth: '320px' }}>
        <TextField id="text-field-wheel" type="number" label="Capacity" defaultValue="4" />
    </div>
);

NumberWheelLeavesTheValue.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Capacity' });
    await userEvent.click(field);
    await fireEvent.wheel(field, { deltaY: -120 });
    await fireEvent.wheel(field, { deltaY: 120 });
    await expect(field).toHaveValue('4');
    await expect(field.getAttribute('type')).toBe('text');
};

/** A read-only number field hides the steppers; the value can still be read. */
export const NumberReadOnly = () => (
    <div style={{ maxWidth: '320px' }}>
        <TextField id="text-field-number-readonly" type="number" label="Seats" defaultValue="12" isReadOnly />
    </div>
);

NumberReadOnly.play = async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
    await expect(within(canvasElement).getByRole('textbox', { name: 'Seats' })).toHaveValue('12');
};
