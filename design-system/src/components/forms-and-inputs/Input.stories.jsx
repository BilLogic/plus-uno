import React, { useState, useEffect } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Input from './Input';

export default {
    title: 'Components/Forms and inputs/Input',
    component: Input,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="small"` and `size="large"` were deprecated: they draw like `medium` and warn in development.' },
        ],
        docs: {
            description: {
                component: 'Textual form controls like inputs. The labeled text input box allows users to enter textual inputs and receive validation feedback with message.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Available in 3 sizes: small, medium (default), large.',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the input component',
            table: { category: 'Behavior' }
        },
        readonly: {
            control: 'boolean',
            description: 'Make the input read-only',
            table: { category: 'Behavior' }
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation types include: none, invalid, success.',
            table: { category: 'Validation' }
        },
        validationMessage: {
            control: 'text',
            description: 'Validation message displayed below the input',
            table: { category: 'Validation' }
        },
        showLabel: {
            control: 'boolean',
            description: 'Show the label, or hide it visually. Off still renders it and still names the input.',
            table: { category: 'Content' }
        },
        label: {
            control: 'text',
            description: 'Visible field label',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the input is required.',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'select',
            options: ['none', 'icon'],
            description: 'Leading visual preset',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'select',
            options: ['none', 'icon', 'dropdown'],
            description: 'Trailing visual preset',
            table: { category: 'Content' }
        },
        type: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' }
        },
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
        inputRef: { table: { disable: true } },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },}
};

/** Overview — Default field for docs landing. */
export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Input
            id="input-overview"
            showLabel
            label="Label"
            placeholder="Placeholder"
            value=""
            required
            trailingVisual="fa-solid fa-icons"
        />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formInput }
    }
};

/** Content — Placeholder vs value, label, required, and visuals. */
export const Content = () => (
    <div
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 48,
            justifyContent: 'center',
            alignItems: 'flex-start',
        }}
    >
        {/* Column: no-label variants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 260 }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PLACEHOLDER</span>
                <Input id="doc-content-placeholder" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VALUE</span>
                <Input id="doc-content-value" placeholder="Placeholder" value="Value" trailingVisual="fa-solid fa-icons" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LEADING VISUAL</span>
                <Input id="doc-content-leading" placeholder="Placeholder" value="" leadingVisual="fa-solid fa-icons" trailingVisual="dropdown" />
            </div>
        </div>

        {/* Column: labeled variants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 260 }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LABEL</span>
                <Input id="doc-content-label" placeholder="Placeholder" value="" showLabel label="Label" trailingVisual="fa-solid fa-icons" />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">REQUIRED</span>
                <Input id="doc-content-required" placeholder="Placeholder" value="" label="Label" required trailingVisual="fa-solid fa-icons" />
            </div>
        </div>
    </div>
);

/** Styles — Validation treatments: none, invalid, and success. */
export const Styles = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NONE</span>
            <Input id="doc-style-none" label="No validation" showLabel={false} placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INVALID</span>
            <Input id="doc-style-invalid" label="Invalid example" showLabel={false} placeholder="Placeholder" value="" validation="invalid" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUCCESS</span>
            <Input id="doc-style-success" label="Success example" showLabel={false} placeholder="Placeholder" value="" validation="success" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
        </div>
    </div>
);

/** Sizes — small, medium (default) and large, from `_Field`. */
export const Sizes = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        {['small', 'medium', 'large'].map((size) => (
            <div key={size}>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                    {size === 'medium' ? 'MEDIUM (DEFAULT)' : size.toUpperCase()}
                </span>
                <Input id={`doc-size-${size}`} label={`${size} input`} showLabel={false} placeholder="Placeholder" size={size} trailingVisual="fa-solid fa-icons" />
            </div>
        ))}
    </div>
);

/** InteractionStates — Default, hover, focus, disabled, and read-only. */
export const InteractionStates = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
            <Input id="doc-state-default" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <Input id="doc-state-disabled" placeholder="Placeholder" value="" disabled trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
            <Input id="doc-state-readonly" placeholder="Placeholder" value="" readonly trailingVisual="fa-solid fa-icons" />
        </div>
    </div>
);

/**
 * Interactive Playground
 * Customize the Input attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    useEffect(() => {
        if (args.value !== undefined) {
            setValue(args.value);
        }
    }, [args.value]);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Input
                id={args.id || 'input-interactive'}
                name={args.name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                size={args.size}
                disabled={args.disabled}
                readonly={args.readonly}
                validation={args.validation}
                validationMessage={args.validationMessage}
                showLabel={args.showLabel}
                required={args.required}
                label={args.label}
                placeholder={args.placeholder}
                leadingVisual={args.leadingVisual === 'icon' ? 'fa-solid fa-icons' : undefined}
                trailingVisual={args.trailingVisual === 'dropdown'
                    ? 'dropdown'
                    : (args.trailingVisual === 'icon' ? 'fa-solid fa-icons' : undefined)}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    disabled: false,
    readonly: false,
    validation: 'none',
    validationMessage: '',
    showLabel: true,
    required: true,
    label: 'Label',
    placeholder: 'Placeholder',
    value: '',
    leadingVisual: 'none',
    trailingVisual: 'icon',
};

/**
 * Anatomy — label, `_Field` (Leading · Content · Trailing) and caption.
 * The caption carries a message on the left and a count on the right.
 */
export const Anatomy = () => (
    <div style={{ maxWidth: '360px' }}>
        <Input
            id="input-anatomy"
            label="Full name"
            required
            info="As it appears on your school ID."
            caption="Your first and last name."
            placeholder="Your name"
            leadingVisual="fa-solid fa-user"
            trailingVisual="fa-solid fa-circle-check"
            maxLength={40}
            defaultValue="Bill"
        />
    </div>
);

Anatomy.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Full name' });
    const box = input.closest('.plus-field');

    // The three slots, in order, with the control in Content.
    await expect([...box.children].map((child) => child.className))
        .toEqual(['plus-field__leading', 'plus-field__content', 'plus-field__trailing']);
    await expect(box.querySelector('.plus-field__content').contains(input)).toBe(true);

    // Required: an asterisk for the eye, `aria-required` for everyone else.
    await expect(input.getAttribute('aria-required')).toBe('true');
    const star = canvasElement.querySelector('.plus-field-required');
    await expect(star.getAttribute('aria-hidden')).toBe('true');

    // The info button sits outside the label, so its name is not the field's,
    // and it opens a tooltip on hover.
    const info = canvas.getByRole('button', { name: 'About Full name' });
    await userEvent.hover(info);
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('As it appears on your school ID.'));
    await userEvent.unhover(info);

    // Standing help and the count, side by side.
    await expect(canvasElement.querySelector('.plus-field-caption__message')).toHaveTextContent('Your first and last name.');
    await expect(canvasElement.querySelector('.plus-field-caption__count')).toHaveTextContent('4 / 40');
};

/** CaptionErrorAndCount — the error on the left, the count on the right, together. */
export const CaptionErrorAndCount = () => {
    const [value, setValue] = useState('A summary that runs long');
    return (
        <div style={{ maxWidth: '360px' }}>
            <Input
                id="input-caption"
                label="Headline"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={30}
                validation="invalid"
                validationMessage="Keep it to one line."
            />
        </div>
    );
};

CaptionErrorAndCount.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Headline' });

    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Keep it to one line.');
    const count = canvasElement.querySelector('.plus-field-caption__count');
    await expect(count).toHaveTextContent('24 / 30');

    // Both sit on one line: the message left, the count right.
    await expect(alert.getBoundingClientRect().left).toBeLessThan(count.getBoundingClientRect().left);
    await expect(Math.round(alert.getBoundingClientRect().top)).toBe(Math.round(count.getBoundingClientRect().top));

    // The control points at both, and the count follows typing.
    const ids = input.getAttribute('aria-describedby').split(' ');
    await expect(ids).toContain(alert.id);
    await expect(ids).toContain(count.id);
    await userEvent.type(input, '!');
    await expect(count).toHaveTextContent('25 / 30');
};

/** Autofill — `autoComplete` reaches the input, for the browser and password managers. */
export const Autofill = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '360px' }}>
        <Input id="input-autofill-email" label="Email address" type="email" autoComplete="email" />
        <Input id="input-autofill-password" label="Password" type="password" autoComplete="current-password" />
        <Input id="input-autofill-code" label="Access code" autoComplete="one-time-code" />
    </div>
);

Autofill.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Email address' }).getAttribute('autocomplete')).toBe('email');
    await expect(canvasElement.querySelector('#input-autofill-password').getAttribute('autocomplete')).toBe('current-password');
    await expect(canvas.getByRole('textbox', { name: 'Access code' }).getAttribute('autocomplete')).toBe('one-time-code');
};

/**
 * Search — Input with the magnifier in Leading and a visually hidden label.
 * An example, not a component: the Figma Search example is two Inputs like these.
 */
export const Search = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '360px' }}>
        <Input id="input-search-small" label="Search tutors" showLabel={false} type="search" size="small" placeholder="Search tutors" leadingVisual="fa-solid fa-magnifying-glass" />
        <Input id="input-search-medium" label="Search tutors" showLabel={false} type="search" placeholder="Search tutors" leadingVisual="fa-solid fa-magnifying-glass" />
    </div>
);

Search.play = async ({ canvasElement }) => {
    const [small, medium] = within(canvasElement).getAllByRole('searchbox', { name: 'Search tutors' });
    await expect(small.closest('.plus-field').querySelector('.plus-field__leading .fa-magnifying-glass')).not.toBeNull();
    await expect(medium.closest('.plus-field').querySelector('.plus-field__trailing')).toBeNull();
};

/** A save that takes a moment, and fails when asked to save "fail". */
const slowSave = (value) => new Promise((resolve, reject) => {
    setTimeout(() => (value === 'fail' ? reject(new Error('That grade could not be saved.')) : resolve()), 150);
});

/**
 * Subtle — reads as plain text until hovered or edited, for record pages.
 * Saves on blur or Enter, Esc cancels, "saving…" shows in Trailing, and a
 * failed save keeps the field open in `invalid` with what was typed.
 */
export const Subtle = (args) => {
    const [saved, setSaved] = useState('8th grade');
    return (
        <div style={{ maxWidth: '360px' }}>
            <Input
                id="input-subtle"
                label="Grade level"
                subtle
                value={saved}
                trailingVisual="dropdown"
                onSave={async (next) => {
                    if (args.onSave) args.onSave(next);
                    await slowSave(next);
                    setSaved(next);
                }}
            />
        </div>
    );
};
Subtle.args = { onSave: fn() };

Subtle.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Grade level' });
    const box = input.closest('.plus-field');
    await expect(getComputedStyle(box).borderTopColor).toBe('rgba(0, 0, 0, 0)');

    // Esc cancels: back to the saved value, nothing saved.
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '7th grade{Escape}');
    await expect(input).toHaveValue('8th grade');
    await expect(args.onSave).not.toHaveBeenCalled();

    // Enter saves, with "saving…" in Trailing while it runs.
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, '9th grade{Enter}');
    await expect(args.onSave).toHaveBeenCalledWith('9th grade');
    await expect(canvas.getByRole('status')).toHaveTextContent('saving…');
    await waitFor(() => expect(canvas.queryByRole('status')).toBeNull());
    await expect(input).toHaveValue('9th grade');

    // Leaving the field saves too.
    await userEvent.click(input);
    await userEvent.type(input, '!');
    await userEvent.tab();
    await expect(args.onSave).toHaveBeenLastCalledWith('9th grade!');
    await waitFor(() => expect(canvas.queryByRole('status')).toBeNull());

    // A failed save stays open in invalid, says why, and keeps the text.
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'fail{Enter}');
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('That grade could not be saved.'));
    await expect(input).toHaveValue('fail');
    await expect(input.getAttribute('aria-invalid')).toBe('true');
    await expect(box.classList.contains('plus-field--invalid')).toBe(true);
};
