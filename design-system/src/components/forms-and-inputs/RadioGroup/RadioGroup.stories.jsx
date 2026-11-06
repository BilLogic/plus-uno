import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import RadioGroup from './RadioGroup';

export default {
    title: 'Components/Forms and inputs/Radio/Radio group',
    component: RadioGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'One question and its radio answers: a Fieldset of Radios, stacked or inline, with an '
                    + 'optional scale and one group error.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onChange: { table: { disable: true } },
        style: { table: { disable: true } },
        options: { table: { disable: true, category: 'Development' } },
        value: { table: { disable: true, category: 'Development' } },
        defaultValue: { table: { disable: true, category: 'Development' } },
        legend: { control: 'text', table: { category: 'Content' } },
        orientation: {
            control: 'select',
            options: ['stacked', 'inline'],
            table: { category: 'Design' },
        },
        appearance: {
            control: 'select',
            options: ['plain', 'card'],
            table: { category: 'Design' },
        },
        size: {
            control: 'select',
            options: [10, 12, 14],
            description: 'Radio control (dot) width in px. Unset keeps today\'s rendering. No effect on type="checkbox".',
            table: { category: 'Design' },
        },
        leadingText: { control: 'text', table: { category: 'Content' } },
        trailingText: { control: 'text', table: { category: 'Content' } },
        error: { control: 'text', table: { category: 'Behavior' } },
        isRequired: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isReadOnly: { control: 'boolean', table: { category: 'Behavior' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', maxWidth: '560px' };

const subjects = [
    { value: 'math', label: 'Math' },
    { value: 'reading', label: 'Reading' },
    { value: 'science', label: 'Science' },
];

const fivePoint = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));

export const Overview = () => {
    const [value, setValue] = useState(null);
    return (
        <div style={stack}>
            <RadioGroup
                id="rg-overview"
                name="rg-overview"
                legend="Which subject did you tutor?"
                options={subjects}
                value={value}
                onChange={setValue}
            />
            <p className="body2-txt m-0" data-testid="rg-overview-value">
                Answer: {value ?? 'none'}
            </p>
        </div>
    );
};
Overview.parameters = {
    docs: { source: { language: 'jsx', code: webAppSourceSnippets.formRadioGroup } },
};
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The question names the answers: a group whose name is the legend, on
    // the real Base UI radiogroup nested inside the Fieldset.
    const group = canvas.getByRole('radiogroup', { name: 'Which subject did you tutor?' });
    await expect(group.closest('fieldset')).toBeTruthy();

    // Unanswered until someone answers.
    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(3);
    await expect(radios.some((r) => r.nextElementSibling.checked)).toBe(false);

    // One name for the set, one id per option. Base UI's accessible role
    // lives on a span; the shared `name` and `checked` state live on the
    // hidden native input rendered right beside it.
    const names = new Set(radios.map((r) => r.nextElementSibling.name));
    await expect(names.size).toBe(1);
    await expect(new Set(radios.map((r) => r.id)).size).toBe(3);

    await userEvent.click(canvas.getByRole('radio', { name: 'Reading' }));
    await expect(canvas.getByRole('radio', { name: 'Reading' }).nextElementSibling.checked).toBe(true);
    await expect(canvas.getByTestId('rg-overview-value').textContent).toBe('Answer: reading');
};

/** Arrow keys move the roving tab stop across options and answer as they go, the Base UI radiogroup's own keyboard contract. */
export const Keyboard = () => (
    <RadioGroup id="rg-keyboard" name="rg-keyboard" legend="Keyboard" options={subjects} defaultValue="math" />
);
Keyboard.parameters = { docs: { disable: true } };
Keyboard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const math = canvas.getByRole('radio', { name: 'Math' });
    const reading = canvas.getByRole('radio', { name: 'Reading' });
    const science = canvas.getByRole('radio', { name: 'Science' });

    // Math starts answered, so it is the group's one tab stop.
    await expect(math.getAttribute('tabindex')).toBe('0');
    await expect(reading.getAttribute('tabindex')).toBe('-1');

    math.focus();
    await expect(document.activeElement).toBe(math);
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(reading);
    await expect(reading.getAttribute('aria-checked')).toBe('true');
    await expect(math.getAttribute('aria-checked')).toBe('false');

    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(science);
    await expect(science.getAttribute('aria-checked')).toBe('true');
};

export const Orientation = () => (
    <div style={stack}>
        <RadioGroup name="rg-stacked" legend="Stacked" options={subjects} />
        <RadioGroup name="rg-inline" legend="Inline" orientation="inline" options={subjects} />
    </div>
);

/** `size` sets the radio control width. Unset keeps today's rendering. */
export const Size = () => (
    <div style={stack}>
        {[10, 12, 14].map((size) => (
            <RadioGroup
                key={size}
                name={`rg-size-${size}`}
                legend={String(size)}
                size={size}
                options={subjects}
            />
        ))}
    </div>
);
Size.play = async ({ canvasElement }) => {
    const groups = [...canvasElement.querySelectorAll('.plus-radio-group')];
    await expect(groups.map((group) => group.getAttribute('data-size'))).toEqual(['10', '12', '14']);
};

/** An inline Radio group with end labels — the reflection form's five-point scale. */
export const LinearScale = () => (
    <div style={stack}>
        <RadioGroup
            name="rg-scale"
            legend="How did this session go for you?"
            orientation="inline"
            leadingText="I struggled"
            trailingText="I nailed it"
            options={fivePoint}
        />
    </div>
);
LinearScale.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'How did this session go for you?' });

    // The ends of the scale describe the whole group, not one option.
    const describedBy = group.getAttribute('aria-describedby').split(' ');
    const ends = describedBy.map((id) => canvasElement.ownerDocument.getElementById(id).textContent);
    await expect(ends).toEqual(['I struggled', 'I nailed it']);
    await expect(within(group).getAllByRole('radio')).toHaveLength(5);

    // A number answer comes back as the number it was given.
    await userEvent.click(canvas.getByRole('radio', { name: '4' }));
    await expect(canvas.getByRole('radio', { name: '4' }).nextElementSibling.checked).toBe(true);
};

const described = [
    { value: 'weekly', label: 'Weekly', description: 'Every week at the same time.' },
    { value: 'biweekly', label: 'Every two weeks', description: 'Alternate weeks, same time.' },
    { value: 'once', label: 'Just once', description: 'A single session.' },
];

export const Descriptions = () => (
    <div style={stack}>
        <RadioGroup name="rg-desc-plain" legend="How often? (plain)" options={described} />
        <RadioGroup
            name="rg-desc-card"
            legend="How often? (card)"
            appearance="card"
            options={described}
            defaultValue="biweekly"
        />
    </div>
);
Descriptions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByRole('radiogroup', { name: 'How often? (plain)' });

    // The description is the option's description, not part of its name.
    const weekly = within(plain).getByRole('radio', { name: 'Weekly' });
    const descId = weekly.getAttribute('aria-describedby');
    await expect(canvasElement.ownerDocument.getElementById(descId).textContent).toBe('Every week at the same time.');

    // Card appearance reaches every choice.
    const card = canvas.getByRole('radiogroup', { name: 'How often? (card)' });
    const cards = card.querySelectorAll('.plus-choice-card');
    await expect(cards).toHaveLength(3);
};

/** An option's `reveal` opens under it while it is chosen. */
export const Reveal = () => (
    <div style={stack}>
        <RadioGroup
            name="rg-reveal"
            legend="Which sessions?"
            options={[
                { value: 'this', label: 'This session' },
                {
                    value: 'range',
                    label: 'Sessions in a date range',
                    reveal: <p className="body2-txt m-0" data-testid="rg-reveal-content">Pick the dates.</p>,
                },
            ]}
            defaultValue="this"
        />
    </div>
);
Reveal.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('rg-reveal-content')).toBeNull();
    await userEvent.click(canvas.getByRole('radio', { name: 'Sessions in a date range' }));
    await expect(canvas.getByTestId('rg-reveal-content')).toBeTruthy();
};

export const States = () => (
    <div style={stack}>
        <RadioGroup name="rg-disabled" legend="Disabled" options={subjects} defaultValue="math" isDisabled />
        <RadioGroup name="rg-readonly" legend="Read-only" options={subjects} defaultValue="math" isReadOnly />
    </div>
);
States.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Read-only: announced, focusable, and the answer does not move.
    const readOnly = canvas.getByRole('radiogroup', { name: 'Read-only' });
    await expect(readOnly.getAttribute('aria-readonly')).toBe('true');
    const science = within(readOnly).getByRole('radio', { name: 'Science' });
    await expect(science.nextElementSibling.disabled).toBe(false);
    await userEvent.click(science);
    await expect(science.nextElementSibling.checked).toBe(false);
    await expect(within(readOnly).getByRole('radio', { name: 'Math' }).nextElementSibling.checked).toBe(true);

    // Disabled: every choice is.
    const disabled = canvas.getByRole('radiogroup', { name: 'Disabled' });
    await expect(within(disabled).getAllByRole('radio').every((r) => r.nextElementSibling.disabled)).toBe(true);
};

export const Validation = () => (
    <div style={stack}>
        <RadioGroup
            name="rg-required"
            legend="Did the session happen?"
            options={['Yes', 'No']}
            isRequired
            error="Choose an answer."
        />
    </div>
);
Validation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: /Did the session happen\?/ });

    // One error for the group, announced, and pointed at by the group.
    const alert = canvas.getByRole('alert');
    await expect(alert.textContent).toBe('Choose an answer.');
    await expect(group.getAttribute('aria-describedby')).toBe(alert.id);
    await expect(group.getAttribute('aria-required')).toBe('true');
    await expect(within(group).getAllByRole('radio').every((r) => r.nextElementSibling.required)).toBe(true);
};

export const TwoGroupsWithoutIds = () => (
    <div style={stack}>
        <RadioGroup legend="First" options={['A', 'B']} />
        <RadioGroup legend="Second" options={['A', 'B']} />
    </div>
);
TwoGroupsWithoutIds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = within(canvas.getByRole('radiogroup', { name: 'First' })).getAllByRole('radio');
    const second = within(canvas.getByRole('radiogroup', { name: 'Second' })).getAllByRole('radio');

    // No shared radio name and no shared ids, so answering one leaves the other.
    await expect(first[0].nextElementSibling.name).not.toBe(second[0].nextElementSibling.name);
    const ids = [...first, ...second].map((r) => r.id);
    await expect(new Set(ids).size).toBe(4);
    await userEvent.click(first[0]);
    await userEvent.click(second[1]);
    await expect(first[0].nextElementSibling.checked).toBe(true);
};

export const Interactive = (args) => {
    const [value, setValue] = useState(null);
    return (
        <div style={{ maxWidth: '560px' }}>
            <RadioGroup
                {...args}
                name="rg-interactive"
                options={args.leadingText || args.trailingText ? fivePoint : described}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    legend: 'How often?',
    orientation: 'stacked',
    appearance: 'plain',
    leadingText: '',
    trailingText: '',
    error: '',
    isRequired: false,
    isDisabled: false,
    isReadOnly: false,
};

/** One story per state, for the Examples tab. */
const groupRadio = (canvasElement, name) => within(canvasElement).getByRole('radio', { name });

export const Unanswered = {
    render: () => <RadioGroup name="rg-ex-unanswered" legend="Subject" options={subjects} />,
    play: async ({ canvasElement }) => {
        const radios = within(canvasElement).getAllByRole('radio');
        await expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
    },
};

export const Selected = {
    render: () => <RadioGroup name="rg-ex-selected" legend="Subject" options={subjects} defaultValue="math" />,
    play: async ({ canvasElement }) => {
        const el = groupRadio(canvasElement, 'Math');
        await expect(el).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Hovered = {
    render: () => <RadioGroup name="rg-ex-hover" legend="Subject" options={subjects} />,
    play: async ({ canvasElement }) => {
        const el = groupRadio(canvasElement, 'Reading');
        el.style.transition = 'none';
        const border = withForcedPseudo(el, ':hover', () => getComputedStyle(el).borderTopColor);
        await expect(border).toBe(tokenColor(canvasElement, '--ds-border-brand'));
    },
};

export const Focused = {
    render: () => <RadioGroup name="rg-ex-focus" legend="Subject" options={subjects} defaultValue="math" />,
    play: async ({ canvasElement }) => {
        await userEvent.tab();
        const el = groupRadio(canvasElement, 'Math');
        await expect(document.activeElement).toBe(el);
        const style = getComputedStyle(el);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        el.blur();
    },
};

export const Required = {
    render: () => <RadioGroup name="rg-ex-required" legend="Did the session happen?" options={['Yes', 'No']} isRequired />,
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('radiogroup', { name: /Did the session happen\?/ });
        await expect(group.getAttribute('aria-required')).toBe('true');
    },
};

export const Invalid = {
    render: () => <RadioGroup name="rg-ex-invalid" legend="Did the session happen?" options={['Yes', 'No']} isRequired error="Choose an answer." />,
    play: async ({ canvasElement }) => {
        const radios = within(canvasElement).getAllByRole('radio');
        await expect(radios.every((r) => r.getAttribute('aria-invalid') === 'true')).toBe(true);
        await expect(getComputedStyle(radios[0]).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-danger'));
    },
};

export const ReadOnly = {
    render: () => <RadioGroup name="rg-ex-readonly" legend="Subject" options={subjects} defaultValue="math" isReadOnly />,
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('radiogroup', { name: 'Subject' });
        await expect(group.getAttribute('aria-readonly')).toBe('true');
        await userEvent.click(groupRadio(canvasElement, 'Science'));
        await expect(groupRadio(canvasElement, 'Math')).toHaveAttribute('aria-checked', 'true');
    },
};

export const Disabled = {
    render: () => <RadioGroup name="rg-ex-disabled" legend="Subject" options={subjects} defaultValue="math" isDisabled />,
    play: async ({ canvasElement }) => {
        const radios = within(canvasElement).getAllByRole('radio');
        await expect(radios.every((r) => r.hasAttribute('data-disabled'))).toBe(true);
        await expect(getComputedStyle(radios[1]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
    },
};
