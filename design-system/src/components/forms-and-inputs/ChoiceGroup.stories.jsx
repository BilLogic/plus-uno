import React, { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ChoiceGroup from './ChoiceGroup';

export default {
    title: 'Components/Forms and inputs/Choice group',
    component: ChoiceGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'One question and its answers: a fieldset of radios (pick one) or checkboxes (pick any), '
                    + 'stacked or inline, with an optional scale, an "Other" answer and one group error.',
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
        other: { table: { disable: true, category: 'Development' } },
        legend: { control: 'text', table: { category: 'Content' } },
        type: {
            control: 'select',
            options: ['radio', 'checkbox'],
            description: 'radio: pick one. checkbox: pick any.',
            table: { category: 'Content' },
        },
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
            options: ['small', 'medium', 'large'],
            table: { category: 'Design' },
        },
        leadingText: { control: 'text', table: { category: 'Content' } },
        trailingText: { control: 'text', table: { category: 'Content' } },
        error: { control: 'text', table: { category: 'Behavior' } },
        required: { control: 'boolean', table: { category: 'Behavior' } },
        disabled: { control: 'boolean', table: { category: 'Behavior' } },
        readOnly: { control: 'boolean', table: { category: 'Behavior' } },
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
            <ChoiceGroup
                id="cg-overview"
                name="cg-overview"
                legend="Which subject did you tutor?"
                options={subjects}
                value={value}
                onChange={setValue}
            />
            <p className="body2-txt m-0" data-testid="cg-overview-value">
                Answer: {value ?? 'none'}
            </p>
        </div>
    );
};
Overview.parameters = {
    docs: { source: { language: 'jsx', code: webAppSourceSnippets.formChoiceGroup } },
};
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The question names the answers: a group whose name is the legend.
    const group = canvas.getByRole('radiogroup', { name: 'Which subject did you tutor?' });
    await expect(group.tagName).toBe('FIELDSET');

    // Unanswered until someone answers.
    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(3);
    await expect(radios.some((r) => r.checked)).toBe(false);

    // One name for the set, one id per option.
    const names = new Set(radios.map((r) => r.name));
    await expect(names.size).toBe(1);
    await expect(new Set(radios.map((r) => r.id)).size).toBe(3);

    await userEvent.click(canvas.getByRole('radio', { name: 'Reading' }));
    await expect(canvas.getByRole('radio', { name: 'Reading' }).checked).toBe(true);
    await expect(canvas.getByTestId('cg-overview-value').textContent).toBe('Answer: reading');
};

export const Types = () => (
    <div style={stack}>
        <ChoiceGroup
            name="cg-type-radio"
            legend="Radio: pick one"
            options={subjects}
            defaultValue="math"
        />
        <ChoiceGroup
            name="cg-type-checkbox"
            type="checkbox"
            legend="Checkbox: pick any"
            options={subjects}
            defaultValue={['math']}
        />
    </div>
);
Types.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pickAny = canvas.getByRole('group', { name: 'Checkbox: pick any' });
    await expect(pickAny.tagName).toBe('FIELDSET');

    await userEvent.click(within(pickAny).getByRole('checkbox', { name: 'Science' }));
    const checked = within(pickAny).getAllByRole('checkbox').filter((c) => c.checked).map((c) => c.value);
    await expect(checked).toEqual(['math', 'science']);

    // Unchecking takes it back out.
    await userEvent.click(within(pickAny).getByRole('checkbox', { name: 'Math' }));
    await expect(within(pickAny).getByRole('checkbox', { name: 'Math' }).checked).toBe(false);
};

export const Orientation = () => (
    <div style={stack}>
        <ChoiceGroup name="cg-stacked" legend="Stacked" options={subjects} />
        <ChoiceGroup name="cg-inline" legend="Inline" orientation="inline" options={subjects} />
    </div>
);

export const ScaleEnds = () => (
    <div style={stack}>
        <ChoiceGroup
            name="cg-scale"
            legend="How did this session go for you?"
            orientation="inline"
            leadingText="I struggled"
            trailingText="I nailed it"
            options={fivePoint}
        />
    </div>
);
ScaleEnds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'How did this session go for you?' });

    // The ends of the scale describe the whole group, not one option.
    const describedBy = group.getAttribute('aria-describedby').split(' ');
    const ends = describedBy.map((id) => canvasElement.ownerDocument.getElementById(id).textContent);
    await expect(ends).toEqual(['I struggled', 'I nailed it']);
    await expect(within(group).getAllByRole('radio')).toHaveLength(5);

    // A number answer comes back as the number it was given.
    await userEvent.click(canvas.getByRole('radio', { name: '4' }));
    await expect(canvas.getByRole('radio', { name: '4' }).checked).toBe(true);
};

const described = [
    { value: 'weekly', label: 'Weekly', description: 'Every week at the same time.' },
    { value: 'biweekly', label: 'Every two weeks', description: 'Alternate weeks, same time.' },
    { value: 'once', label: 'Just once', description: 'A single session.' },
];

export const Descriptions = () => (
    <div style={stack}>
        <ChoiceGroup name="cg-desc-plain" legend="How often? (plain)" options={described} />
        <ChoiceGroup
            name="cg-desc-card"
            legend="How often? (card)"
            appearance="card"
            options={described}
            defaultValue="biweekly"
        />
        <ChoiceGroup
            name="cg-desc-card-checkbox"
            type="checkbox"
            legend="Reminders (card)"
            appearance="card"
            options={[
                { value: 'email', label: 'Email', description: 'The evening before.' },
                { value: 'sms', label: 'Text message', description: 'An hour before.' },
            ]}
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

export const Other = () => {
    const [value, setValue] = useState([]);
    const [otherText, setOtherText] = useState('');
    return (
        <div style={stack}>
            <ChoiceGroup
                name="cg-other"
                type="checkbox"
                legend="Reason for request"
                options={[
                    { value: 'fewer-tutors', label: 'Fewer tutors than expected' },
                    { value: 'more-students', label: 'More students than expected' },
                ]}
                value={value}
                onChange={setValue}
                other={{ label: 'Other', placeholder: 'Tell us more…', text: otherText, onTextChange: setOtherText }}
            />
            <p className="body2-txt m-0" data-testid="cg-other-value">{JSON.stringify({ value, otherText })}</p>
        </div>
    );
};
Other.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Reason for request' });

    // "Other" is an answer like the rest, and its text box is named for it.
    const otherBox = within(group).getByRole('checkbox', { name: 'Other' });
    await expect(otherBox.checked).toBe(false);
    const text = within(group).getByRole('textbox', { name: 'Other, please specify' });

    // Typing an answer chooses it.
    await userEvent.type(text, 'Fire drill');
    await expect(otherBox.checked).toBe(true);
    await expect(JSON.parse(canvas.getByTestId('cg-other-value').textContent))
        .toEqual({ value: ['other'], otherText: 'Fire drill' });
};

/** An option's `reveal` opens under it while it is chosen. */
export const Reveal = () => (
    <div style={stack}>
        <ChoiceGroup
            name="cg-reveal"
            legend="Which sessions?"
            options={[
                { value: 'this', label: 'This session' },
                {
                    value: 'range',
                    label: 'Sessions in a date range',
                    reveal: <p className="body2-txt m-0" data-testid="cg-reveal-content">Pick the dates.</p>,
                },
            ]}
            defaultValue="this"
        />
    </div>
);
Reveal.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('cg-reveal-content')).toBeNull();
    await userEvent.click(canvas.getByRole('radio', { name: 'Sessions in a date range' }));
    await expect(canvas.getByTestId('cg-reveal-content')).toBeTruthy();
};

export const States = () => (
    <div style={stack}>
        <ChoiceGroup name="cg-disabled" legend="Disabled" options={subjects} defaultValue="math" disabled />
        <ChoiceGroup name="cg-readonly" legend="Read-only" options={subjects} defaultValue="math" readOnly />
        <ChoiceGroup
            name="cg-readonly-checkbox"
            type="checkbox"
            legend="Read-only checkboxes"
            options={subjects}
            defaultValue={['reading']}
            readOnly
        />
    </div>
);
States.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Read-only: announced, focusable, and the answer does not move.
    const readOnly = canvas.getByRole('radiogroup', { name: 'Read-only' });
    await expect(readOnly.getAttribute('aria-readonly')).toBe('true');
    const science = within(readOnly).getByRole('radio', { name: 'Science' });
    await expect(science.disabled).toBe(false);
    await userEvent.click(science);
    await expect(science.checked).toBe(false);
    await expect(within(readOnly).getByRole('radio', { name: 'Math' }).checked).toBe(true);

    const boxes = canvas.getByRole('group', { name: 'Read-only checkboxes' });
    const math = within(boxes).getByRole('checkbox', { name: 'Math' });
    await expect(math.getAttribute('aria-readonly')).toBe('true');
    await userEvent.click(math);
    await expect(math.checked).toBe(false);
    await userEvent.click(within(boxes).getByRole('checkbox', { name: 'Reading' }));
    await expect(within(boxes).getByRole('checkbox', { name: 'Reading' }).checked).toBe(true);

    // Disabled: every choice is.
    const disabled = canvas.getByRole('radiogroup', { name: 'Disabled' });
    await expect(within(disabled).getAllByRole('radio').every((r) => r.disabled)).toBe(true);
};

export const Validation = () => (
    <div style={stack}>
        <ChoiceGroup
            name="cg-required"
            legend="Did the session happen?"
            options={['Yes', 'No']}
            required
            error="Choose an answer."
        />
        <ChoiceGroup
            name="cg-required-checkbox"
            type="checkbox"
            legend="Who attended?"
            options={['Ava', 'Ben']}
            required
            error="Choose at least one student."
        />
    </div>
);
Validation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: /Did the session happen\?/ });

    // One error for the group, announced, and pointed at by the group.
    const alerts = canvas.getAllByRole('alert');
    await expect(alerts.map((a) => a.textContent)).toEqual(['Choose an answer.', 'Choose at least one student.']);
    await expect(group.getAttribute('aria-describedby')).toBe(alerts[0].id);
    await expect(group.getAttribute('aria-required')).toBe('true');

    // `required` sits on the group. On radios the platform enforces it, on
    // checkboxes it cannot without requiring every box, so it stays on the group.
    await expect(within(group).getAllByRole('radio').every((r) => r.required)).toBe(true);
    const boxes = within(canvas.getByRole('group', { name: /Who attended\?/ })).getAllByRole('checkbox');
    await expect(boxes.some((b) => b.required)).toBe(false);
};

export const TwoGroupsWithoutIds = () => (
    <div style={stack}>
        <ChoiceGroup legend="First" options={['A', 'B']} />
        <ChoiceGroup legend="Second" options={['A', 'B']} />
    </div>
);
TwoGroupsWithoutIds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = within(canvas.getByRole('radiogroup', { name: 'First' })).getAllByRole('radio');
    const second = within(canvas.getByRole('radiogroup', { name: 'Second' })).getAllByRole('radio');

    // No shared radio name and no shared ids, so answering one leaves the other.
    await expect(first[0].name).not.toBe(second[0].name);
    const ids = [...first, ...second].map((r) => r.id);
    await expect(new Set(ids).size).toBe(4);
    await userEvent.click(first[0]);
    await userEvent.click(second[1]);
    await expect(first[0].checked).toBe(true);
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.type === 'checkbox' ? [] : null);
    useEffect(() => {
        setValue(args.type === 'checkbox' ? [] : null);
    }, [args.type]);
    return (
        <div style={{ maxWidth: '560px' }}>
            <ChoiceGroup
                {...args}
                name="cg-interactive"
                options={args.leadingText || args.trailingText ? fivePoint : described}
                value={value}
                onChange={setValue}
            />
        </div>
    );
};
Interactive.args = {
    legend: 'How often?',
    type: 'radio',
    orientation: 'stacked',
    appearance: 'plain',
    size: 'medium',
    leadingText: '',
    trailingText: '',
    error: '',
    required: false,
    disabled: false,
    readOnly: false,
};
