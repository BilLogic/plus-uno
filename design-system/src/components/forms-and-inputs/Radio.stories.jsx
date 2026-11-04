import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import Radio from './Radio';

export default {
    title: 'Components/Forms and inputs/Radio',
    component: Radio,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Props follow Atlassian: `isChecked`, `isInvalid`, `isDisabled`, `isRequired`. One size, a 24 row with a 14/20 label. `isInvalid` marks the unselected radio only.' },
            { date: '2026-10-25', kind: 'changed', summary: 'Colors move to the new tokens: the input fill and border at rest, a Lagoon checked fill (`background.selected.bold`) that steps to its opaque hovered step on hover, a dot drawn in `icon.inverse`, the disabled fill, edge and dot, and the focus ring in `border.focused`.' },
        ],
        docs: {
            description: {
                component:
                    'A radio lets a person choose one option from a set. Radios that share a name form a group; the group is usually a RadioGroup.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the first radio',
            table: { category: 'Content' },
        },
        secondLabel: {
            control: 'text',
            description: 'Label text for the second option',
            table: { category: 'Content' },
        },
        thirdLabel: {
            control: 'text',
            description: 'Label text for the third option',
            table: { category: 'Content' },
        },
        isInvalid: {
            control: 'boolean',
            description: 'Marks the unselected radios as failing validation',
            table: { category: 'State' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the radios',
            table: { category: 'Behavior' },
        },
        isRequired: {
            control: 'boolean',
            description: 'Require an answer natively',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Shown and focusable, not changeable',
            table: { category: 'Behavior' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { table: { disable: true, category: 'Development' } },
        value: { table: { disable: true, category: 'Development' } },
        defaultChecked: { table: { disable: true, category: 'Development' } },
        isChecked: { table: { disable: true, category: 'Development' } },
        onChange: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxWidth: '360px' };

/** A controlled group of radios sharing one name. */
const Group = ({ name, options, initial, ...radioProps }) => {
    const [value, setValue] = useState(initial);
    return (
        <div style={stack}>
            {options.map(({ value: optionValue, label }) => (
                <Radio
                    key={optionValue}
                    id={`${name}-${optionValue}`}
                    name={name}
                    label={label}
                    value={optionValue}
                    isChecked={value === optionValue}
                    onChange={(e) => setValue(e.target.value)}
                    {...radioProps}
                />
            ))}
        </div>
    );
};

const OPTIONS = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
];

export const Overview = () => <Group name="radio-overview" options={OPTIONS.slice(0, 2)} initial="option1" />;
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formRadio }
    }
};

/** Concise labels, listed in a logical order, stacked. */
export const Content = () => <Group name="radio-content" options={OPTIONS} initial="option1" />;

/** Selected, unselected and disabled. */
export const States = () => (
    <div style={stack}>
        <Radio id="radio-s1" name="radio-states" label="Selected" value="a" defaultChecked />
        <Radio id="radio-s2" name="radio-states" label="Unselected" value="b" />
        <Radio id="radio-s3" name="radio-states-dis" label="Disabled" value="c" isDisabled />
        <Radio id="radio-s4" name="radio-states-dis-on" label="Disabled and selected" value="d" isDisabled defaultChecked />
    </div>
);

/**
 * Invalid marks the unselected radios with a danger edge. A selected radio
 * keeps its Lagoon fill.
 */
export const Invalid = () => (
    <div style={stack}>
        <Radio id="radio-invalid-1" name="radio-invalid" label="Weekly" value="weekly" isInvalid />
        <Radio id="radio-invalid-2" name="radio-invalid" label="Monthly" value="monthly" isInvalid defaultChecked />
    </div>
);
Invalid.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('radio', { name: 'Weekly' });
    const on = canvas.getByRole('radio', { name: 'Monthly' });
    await expect(off.getAttribute('aria-invalid')).toBe('true');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(off).borderTopColor, `${mode}: unselected invalid edge`).toBe(token('--ds-border-danger'));
        await expect(getComputedStyle(on).borderTopColor, `${mode}: selected keeps its edge`).toBe(token('--ds-border-selected'));
    });
};

export const Interactive = (args) => {
    const [value, setValue] = useState('option1');
    const shared = { name: 'radio-interactive', isInvalid: args.isInvalid, isDisabled: args.isDisabled, isReadOnly: args.isReadOnly, isRequired: args.isRequired };

    return (
        <div style={stack}>
            {[['option1', args.label], ['option2', args.secondLabel], ['option3', args.thirdLabel]].map(([optionValue, label]) => (
                <Radio
                    key={optionValue}
                    id={`radio-int-${optionValue}`}
                    label={label}
                    value={optionValue}
                    isChecked={value === optionValue}
                    onChange={(e) => setValue(e.target.value)}
                    {...shared}
                />
            ))}
        </div>
    );
};

Interactive.args = {
    label: 'Option 1',
    secondLabel: 'Option 2',
    thirdLabel: 'Option 3',
    isInvalid: false,
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
};

/**
 * Read-only: the answer is shown at full contrast and stays in the tab order,
 * and clicking does not change it. ARIA has no `aria-readonly` for a lone
 * radio, so a read-only question goes in a RadioGroup, which announces it.
 */
export const ReadOnly = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <Radio id="radio-readonly-1" name="radio-readonly" label="In person" value="in-person" defaultChecked isReadOnly/>
        <Radio id="radio-readonly-2" name="radio-readonly" label="Online" value="online" isReadOnly/>
    </div>
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const online = canvas.getByRole('radio', { name: 'Online' });
    await expect(online.nextElementSibling.disabled).toBe(false);
    await userEvent.click(online);
    await expect(online.nextElementSibling.checked).toBe(false);
    await expect(canvas.getByRole('radio', { name: 'In person' }).nextElementSibling.checked).toBe(true);
};

/** A description under the label, and the card appearance. */
export const DescriptionAndCard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxWidth: '360px' }}>
        <Radio id="radio-desc" name="radio-desc" label="Weekly" value="weekly" description="Every week at the same time."/>
        <Radio id="radio-card" name="radio-card" label="Just once" value="once" description="A single session." appearance="card" defaultChecked/>
    </div>
);
DescriptionAndCard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const weekly = canvas.getByRole('radio', { name: 'Weekly' });
    const desc = canvasElement.ownerDocument.getElementById(weekly.getAttribute('aria-describedby'));
    await expect(desc.textContent).toBe('Every week at the same time.');
};

/**
 * Keyboard focus on a checked radio: the focus-ring role, 2px wide and 2px off
 * the radio's edge, the gap Checkbox and Button keep. A ring touching the
 * checked primary border merged into it and stopped reading as focus.
 */
export const KeyboardFocus = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <Radio id="radio-focus-1" name="radio-focus" label="Morning" value="morning" defaultChecked/>
        <Radio id="radio-focus-2" name="radio-focus" label="Evening" value="evening"/>
    </div>
);
KeyboardFocus.parameters = { docs: { disable: true } };
KeyboardFocus.play = async ({ canvasElement }) => {
    const radio = within(canvasElement).getByRole('radio', { name: 'Morning' });
    radio.style.transition = 'none';
    await userEvent.tab();
    await expect(document.activeElement).toBe(radio);
    const style = getComputedStyle(radio);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), 'ring width').toBe(2);
    await expect(px(style.outlineOffset), 'ring gap').toBe(2);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(style.outlineColor, `${mode}: ring color`).toBe(token('--ds-border-focused'));
        await expect(style.borderTopColor, `${mode}: the focused edge`).toBe(token('--ds-border-brand'));
        await expect(style.backgroundColor, `${mode}: the checked fill stays`).toBe(token('--ds-background-selected-bold'));
    });
};

/**
 * Hover steps the fill: the input's hovered fill and the brand edge when
 * unchecked, the opaque hovered Lagoon step when checked. The dot is drawn in
 * `icon.inverse` in every mode, and in `icon.disabled` on a disabled radio.
 */
export const HoverStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <Radio id="radio-hover-1" name="radio-hover" label="Checked" value="checked" defaultChecked/>
        <Radio id="radio-hover-2" name="radio-hover" label="Unchecked" value="unchecked"/>
        <Radio id="radio-hover-3" name="radio-hover-disabled" label="Disabled" value="disabled" defaultChecked isDisabled/>
    </div>
);
HoverStep.parameters = { docs: { disable: true } };
HoverStep.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = (name) => canvas.getByRole('radio', { name });
    const dot = (el) => el.querySelector('.plus-form-radio-indicator');
    const paint = (el) => {
        const { backgroundColor, borderTopColor } = getComputedStyle(el);
        return { backgroundColor, borderTopColor, dot: getComputedStyle(dot(el)).backgroundColor };
    };
    const hovered = (name) => withForcedPseudo(radio(name), ':hover', () => paint(radio(name)));
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        const checked = paint(radio('Checked'));
        await expect(checked.backgroundColor, `${mode}: checked fill`).toBe(token('--ds-background-selected-bold'));
        await expect(checked.borderTopColor, `${mode}: checked edge`).toBe(token('--ds-border-selected'));
        await expect(checked.dot, `${mode}: the dot`).toBe(token('--ds-icon-inverse'));
        const unchecked = paint(radio('Unchecked'));
        await expect(unchecked.backgroundColor, `${mode}: unchecked fill`).toBe(token('--ds-background-input'));
        await expect(unchecked.borderTopColor, `${mode}: unchecked border`).toBe(token('--ds-border-input'));
        const disabled = paint(radio('Disabled'));
        await expect(disabled.backgroundColor, `${mode}: disabled fill`).toBe(token('--ds-background-disabled'));
        await expect(disabled.borderTopColor, `${mode}: disabled edge`).toBe(token('--ds-border-disabled'));
        await expect(disabled.dot, `${mode}: the disabled dot`).toBe(token('--ds-icon-disabled'));
        const checkedHover = hovered('Checked');
        await expect(checkedHover.backgroundColor, `${mode}: the hovered step`).toBe(token('--ds-background-selected-bold-hovered'));
        await expect(checkedHover.dot, `${mode}: the dot stays`).toBe(token('--ds-icon-inverse'));
        const uncheckedHover = hovered('Unchecked');
        await expect(uncheckedHover.backgroundColor, `${mode}: unchecked hover fill`).toBe(token('--ds-background-input-hovered'));
        await expect(uncheckedHover.borderTopColor, `${mode}: unchecked hover edge`).toBe(token('--ds-border-brand'));
    });
};
