import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expectChoiceReadOnly } from '@/storybook-docs/lib/field-states.js';
import Radio from './Radio';

export default {
    title: 'Components/Forms and inputs/Radio/Radio',
    component: Radio,
    tags: ['!dev', '!autodocs'],
    parameters: {
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
            table: { category: 'State' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isRequired: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
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

    await expectChoiceReadOnly(canvasElement, online, 'unchecked radio');
    await expectChoiceReadOnly(canvasElement, canvas.getByRole('radio', { name: 'In person' }), 'checked radio');
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
    // The choice card rounds at radius-lg.
    const card = canvas.getByRole('radio', { name: 'Just once' }).closest('.plus-choice-card');
    await expect(parseFloat(getComputedStyle(card).borderTopLeftRadius), 'choice card radius').toBe(8);
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

/** One story per state, for the Examples tab. */
const radioOf = (canvasElement, name) => within(canvasElement).getByRole('radio', { name });

export const Unselected = {
    render: () => <Radio id="radio-ex-off" name="radio-ex-off" label="Online" value="online" />,
    play: async ({ canvasElement }) => {
        const el = radioOf(canvasElement, 'Online');
        await expect(el).toHaveAttribute('aria-checked', 'false');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-input'));
        // A lone Radio is the full round control, not a squeezed sliver.
        const box = el.getBoundingClientRect();
        const size = px(getComputedStyle(el).getPropertyValue('--radio-control-size'));
        await expect(box.width, 'a lone Radio keeps its control width').toBe(size);
        await expect(box.width).toBe(box.height);
    },
};

export const Selected = {
    render: () => <Radio id="radio-ex-on" name="radio-ex-on" label="In person" value="in-person" defaultChecked />,
    play: async ({ canvasElement }) => {
        const el = radioOf(canvasElement, 'In person');
        await expect(el).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Hovered = {
    render: () => <Radio id="radio-ex-hover" name="radio-ex-hover" label="Online" value="online" />,
    play: async ({ canvasElement }) => {
        const el = radioOf(canvasElement, 'Online');
        el.style.transition = 'none';
        const { backgroundColor, borderTopColor } = withForcedPseudo(el, ':hover', () => ({
            backgroundColor: getComputedStyle(el).backgroundColor,
            borderTopColor: getComputedStyle(el).borderTopColor,
        }));
        await expect(backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-input-hovered'));
        await expect(borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-brand'));
    },
};

export const Focused = {
    render: () => <Radio id="radio-ex-focus" name="radio-ex-focus" label="Online" value="online" />,
    play: async ({ canvasElement }) => {
        const el = radioOf(canvasElement, 'Online');
        el.style.transition = 'none';
        el.focus({ focusVisible: true });
        const style = getComputedStyle(el);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        el.blur();
    },
};

export const Disabled = {
    render: () => <Radio id="radio-ex-disabled" name="radio-ex-disabled" label="Not available" value="na" isDisabled />,
    play: async ({ canvasElement }) => {
        const el = radioOf(canvasElement, 'Not available');
        await expect(el).toHaveAttribute('data-disabled');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
    },
};

/** An option disabled for a prerequisite the person can fix here; its description says what to do. */
export const DisabledWithReason = {
    render: () => <Radio id="radio-ex-reason" name="radio-ex-reason" label="Text message" value="text" description="Add a phone number first." isDisabled />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const el = radioOf(canvasElement, 'Text message');
        await expect(el).toHaveAttribute('data-disabled');
        const reason = canvas.getByText('Add a phone number first.');
        await expect(reason).toBeVisible();
        await expect(getComputedStyle(reason.closest('.plus-field-caption')).opacity).toBe('1');
    },
};

export const Required = {
    render: () => <Radio id="radio-ex-required" name="radio-ex-required" label="Weekly" value="weekly" isRequired />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-form-radio-wrapper')).toHaveClass('plus-form-radio-required');
        await expect(canvasElement.querySelector('.plus-field-required')).toHaveAttribute('aria-hidden', 'true');
    },
};
