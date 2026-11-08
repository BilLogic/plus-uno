import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Checkbox from './Checkbox';
import Fieldset from '../Fieldset';

export default {
    title: 'Components/Forms and inputs/Checkbox',
    component: Checkbox,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A checkbox lets a person select one or more options from a list, or confirm a single setting. It supports controlled and uncontrolled use, and a mixed state for a parent of partly selected children.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Text that names the checkbox',
            table: { category: 'Content' },
        },
        isChecked: { table: { disable: true, category: 'Development' } },
        isIndeterminate: {
            control: 'boolean',
            description: 'Mixed state, for a parent of partly selected children',
            table: { category: 'State' },
        },
        isInvalid: {
            control: 'boolean',
            description: 'Marks the unselected box as failing validation',
            table: { category: 'State' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the checkbox',
            table: { category: 'Behavior' },
        },
        isRequired: {
            control: 'boolean',
            description: 'Show the required marker and require it natively',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            description: 'Shown and announced, not changeable',
            table: { category: 'Behavior' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { table: { disable: true, category: 'Development' } },
        value: { table: { disable: true, category: 'Development' } },
        defaultChecked: { table: { disable: true, category: 'Development' } },
        onChange: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxWidth: 'var(--size-2500)' };

export const Overview = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <Checkbox id="cb-overview" name="cb-overview" label="Option" defaultChecked />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formCheckbox }
    }
};

/** Unselected, selected, mixed and disabled. */
export const States = () => (
    <div style={stack}>
        <Checkbox id="cb-unchecked" label="Unselected" />
        <Checkbox id="cb-checked" label="Selected" defaultChecked />
        <Checkbox id="cb-indeterminate" label="Mixed" isIndeterminate />
        <Checkbox id="cb-disabled" label="Disabled" isDisabled />
        <Checkbox id="cb-disabled-on" label="Disabled and selected" isDisabled defaultChecked />
    </div>
);

/** A long label wraps inside its row; the required marker follows the label. */
export const Content = () => (
    <div style={stack}>
        <Checkbox id="cb-content-long" label="Longer label text used in forms and filters" />
        <Checkbox id="cb-content-required" label="Required field" isRequired />
    </div>
);

/**
 * Invalid marks the unselected box with a danger edge. A selected or mixed box
 * keeps its Lagoon fill, so the red edge never fights the mark.
 */
export const Invalid = () => (
    <div style={stack}>
        <Checkbox id="cb-invalid" label="I accept the terms" isInvalid />
        <Checkbox id="cb-invalid-on" label="Selected stays selected" isInvalid defaultChecked />
    </div>
);
Invalid.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('checkbox', { name: 'I accept the terms' });
    const on = canvas.getByRole('checkbox', { name: 'Selected stays selected' });
    await expect(off.getAttribute('aria-invalid')).toBe('true');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(off).borderTopColor, `${mode}: unselected invalid edge`).toBe(token('--ds-border-danger'));
        await expect(getComputedStyle(on).borderTopColor, `${mode}: selected keeps its edge`).toBe(token('--ds-border-selected'));
        await expect(getComputedStyle(on).backgroundColor, `${mode}: selected keeps its fill`).toBe(token('--ds-background-selected-bold'));
    });
};

/** A parent box shows the mixed state while some, not all, children are selected. */
export const SelectAll = () => {
    const [picked, setPicked] = useState({ mon: true, tue: false, wed: false });
    const keys = Object.keys(picked);
    const count = keys.filter((k) => picked[k]).length;
    const toggleAll = (event) => setPicked(Object.fromEntries(keys.map((k) => [k, event.target.checked])));
    return (
        <div style={stack}>
            <Checkbox
                id="cb-all"
                label="All days"
                isChecked={count === keys.length}
                isIndeterminate={count > 0 && count < keys.length}
                onChange={toggleAll}
            />
            {keys.map((k) => (
                <div key={k} style={{ paddingLeft: 'var(--stack-lg)' }}>
                    <Checkbox
                        id={`cb-${k}`}
                        label={k}
                        isChecked={picked[k]}
                        onChange={(event) => setPicked({ ...picked, [k]: event.target.checked })}
                    />
                </div>
            ))}
        </div>
    );
};
SelectAll.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'All days' });
    await expect(all.getAttribute('aria-checked')).toBe('mixed');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'tue' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'wed' }));
    await waitFor(() => expect(all.getAttribute('aria-checked')).not.toBe('mixed'));
    await expect(all.getAttribute('aria-checked')).toBe('true');
};

/** Checkbox group: Checkboxes inside a Fieldset with a legend, picking any number. */
export const CheckboxGroup = () => {
    const [picked, setPicked] = useState([]);
    const options = [
        { value: 'fewer-tutors', label: 'Fewer tutors than expected' },
        { value: 'more-students', label: 'More students than expected' },
        { value: 'schedule-change', label: 'Schedule changed' },
    ];
    const toggle = (value, checked) => {
        setPicked((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
    };
    return (
        <div style={stack}>
            <Fieldset legend="Reason for request" isRequired>
                {options.map((option) => (
                    <Checkbox
                        key={option.value}
                        name="checkbox-group-overview"
                        value={option.value}
                        label={option.label}
                        isChecked={picked.includes(option.value)}
                        onChange={(event) => toggle(option.value, event.target.checked)}
                    />
                ))}
            </Fieldset>
            <p className="body-default m-0" data-testid="checkbox-group-value">Picked: {picked.join(', ') || 'none'}</p>
        </div>
    );
};
CheckboxGroup.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Reason for request/ });
    await expect(group.tagName).toBe('FIELDSET');
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Schedule changed' }));
    await expect(canvas.getByTestId('checkbox-group-value').textContent).toBe('Picked: schedule-change');
};

export const Interactive = (args) => {
    const [checked, setChecked] = useState(false);

    return (
        <Checkbox
            id="checkbox-interactive"
            name="checkbox-interactive"
            label={args.label}
            isChecked={checked}
            isIndeterminate={args.isIndeterminate}
            isInvalid={args.isInvalid}
            isDisabled={args.isDisabled}
            isRequired={args.isRequired}
            isReadOnly={args.isReadOnly}
            onChange={(e) => setChecked(e.target.checked)}
        />
    );
};

Interactive.args = {
    label: 'Checkbox label',
    isIndeterminate: false,
    isInvalid: false,
    isDisabled: false,
    isRequired: false,
    isReadOnly: false,
};

/**
 * Read-only: the answer is shown at full contrast and stays in the tab order,
 * and clicking or pressing Space does not change it.
 */
export const ReadOnly = () => (
    <div style={stack}>
        <Checkbox id="checkbox-readonly-on" label="Background check complete" defaultChecked isReadOnly />
        <Checkbox id="checkbox-readonly-off" label="Training complete" isReadOnly />
    </div>
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const on = canvas.getByRole('checkbox', { name: 'Background check complete' });
    await expect(on.getAttribute('aria-readonly')).toBe('true');
    await expect(on.getAttribute('aria-disabled')).not.toBe('true');
    await userEvent.click(on);
    await expect(on.getAttribute('aria-checked')).toBe('true');

    const off = canvas.getByRole('checkbox', { name: 'Training complete' });
    off.focus();
    await userEvent.keyboard(' ');
    await expect(off.getAttribute('aria-checked')).toBe('false');
};

/** A description under the label, and the card appearance. */
export const DescriptionAndCard = () => (
    <div style={stack}>
        <Checkbox id="checkbox-desc" label="Email reminders" description="Sent the evening before." />
        <Checkbox id="checkbox-card" label="Text reminders" description="Sent an hour before." appearance="card" defaultChecked />
    </div>
);
DescriptionAndCard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Email reminders' });
    const desc = canvasElement.ownerDocument.getElementById(box.getAttribute('aria-describedby'));
    await expect(desc.textContent).toBe('Sent the evening before.');
};

/** Keyboard focus: the focus-ring role, 2px wide and 2px off the box's edge. */
export const KeyboardFocus = () => <Checkbox id="checkbox-focus" label="Send reminders" defaultChecked />;
KeyboardFocus.parameters = { docs: { disable: true } };
KeyboardFocus.play = async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Send reminders' });
    box.style.transition = 'none';
    await userEvent.tab();
    await expect(document.activeElement).toBe(box);
    const style = getComputedStyle(box);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), 'ring width').toBe(2);
    await expect(px(style.outlineOffset), 'ring gap').toBe(2);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(style.outlineColor, `${mode}: ring color`).toBe(token('--ds-border-focused'));
    });
};

/** Keyboard: Space toggles the box; Enter does not (it would submit a form instead). */
export const Keyboard = () => <Checkbox id="checkbox-keyboard" label="Receive updates" />;
Keyboard.parameters = { docs: { disable: true } };
Keyboard.play = async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Receive updates' });
    await expect(box.getAttribute('role')).toBe('checkbox');
    await expect(box.getAttribute('aria-checked')).toBe('false');
    box.focus();
    await userEvent.keyboard(' ');
    await expect(box.getAttribute('aria-checked')).toBe('true');
    await userEvent.keyboard('{Enter}');
    await expect(box.getAttribute('aria-checked'), 'Enter does not toggle a checkbox').toBe('true');
    await userEvent.keyboard(' ');
    await expect(box.getAttribute('aria-checked')).toBe('false');
};

/**
 * Hover on a checked box keeps its check and steps its Lagoon fill and edge to
 * the opaque hovered step; an unchecked box takes the input's hovered fill and
 * the brand edge. A disabled checked box takes the disabled fill, edge and mark.
 */
export const HoverStep = () => (
    <div style={stack}>
        <Checkbox id="checkbox-hover" label="Checked" defaultChecked />
        <Checkbox id="checkbox-hover-off" label="Unchecked" />
        <Checkbox id="checkbox-hover-disabled" label="Disabled" defaultChecked isDisabled />
    </div>
);
HoverStep.parameters = { docs: { disable: true } };
HoverStep.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Checked' });
    const off = canvas.getByRole('checkbox', { name: 'Unchecked' });
    const disabled = canvas.getByRole('checkbox', { name: 'Disabled' });
    const mark = (el) => el.querySelector('.plus-form-checkbox-indicator');
    const resting = { transform: getComputedStyle(mark(box)).transform };
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(box).backgroundColor, `${mode}: checked fill`).toBe(token('--ds-background-selected-bold'));
        await expect(getComputedStyle(box).borderTopColor, `${mode}: checked edge`).toBe(token('--ds-border-selected'));
        await expect(getComputedStyle(mark(box)).backgroundColor, `${mode}: the check`).toBe(token('--ds-icon-inverse'));
        await expect(getComputedStyle(off).backgroundColor, `${mode}: unchecked fill`).toBe(token('--ds-background-input'));
        await expect(getComputedStyle(off).borderTopColor, `${mode}: unchecked border`).toBe(token('--ds-border-input'));
        await expect(getComputedStyle(disabled).backgroundColor, `${mode}: disabled fill`).toBe(token('--ds-background-disabled'));
        await expect(getComputedStyle(disabled).borderTopColor, `${mode}: disabled edge`).toBe(token('--ds-border-disabled'));
        await expect(getComputedStyle(mark(disabled)).backgroundColor, `${mode}: disabled check`).toBe(token('--ds-icon-disabled'));
        const hovered = withForcedPseudo(box, ':hover', () => {
            const { backgroundColor, borderTopColor } = getComputedStyle(box);
            const markStyle = getComputedStyle(mark(box));
            return { backgroundColor, borderTopColor, transform: markStyle.transform, color: markStyle.backgroundColor };
        });
        await expect(hovered.backgroundColor, `${mode}: the hovered step`).toBe(token('--ds-background-selected-bold-hovered'));
        await expect(hovered.borderTopColor, `${mode}: the hovered edge`).toBe(token('--ds-background-selected-bold-hovered'));
        await expect(hovered.transform, 'the check stays drawn at its resting size').toBe(resting.transform);
        await expect(hovered.color, `${mode}: the check keeps its inverse color`).toBe(token('--ds-icon-inverse'));
        const offHovered = withForcedPseudo(off, ':hover', () => {
            const { backgroundColor, borderTopColor } = getComputedStyle(off);
            return { backgroundColor, borderTopColor };
        });
        await expect(offHovered.backgroundColor, `${mode}: unchecked hover fill`).toBe(token('--ds-background-input-hovered'));
        await expect(offHovered.borderTopColor, `${mode}: unchecked hover edge`).toBe(token('--ds-border-brand'));
    });
};

/** One story per state, for the Examples tab. */
const box = (canvasElement, name) => within(canvasElement).getByRole('checkbox', { name });

export const Unselected = {
    render: () => <Checkbox id="cb-ex-off" label="Email me a summary" />,
    play: async ({ canvasElement }) => {
        await expect(box(canvasElement, 'Email me a summary')).toHaveAttribute('aria-checked', 'false');
    },
};

export const Selected = {
    render: () => <Checkbox id="cb-ex-on" label="Email me a summary" defaultChecked />,
    play: async ({ canvasElement }) => {
        const el = box(canvasElement, 'Email me a summary');
        await expect(el).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Mixed = {
    render: () => <Checkbox id="cb-ex-mixed" label="All days" isIndeterminate />,
    play: async ({ canvasElement }) => {
        await expect(box(canvasElement, 'All days')).toHaveAttribute('aria-checked', 'mixed');
    },
};

export const Disabled = {
    render: () => <Checkbox id="cb-ex-disabled" label="Not available" isDisabled />,
    play: async ({ canvasElement }) => {
        const el = box(canvasElement, 'Not available');
        await expect(el).toHaveAttribute('data-disabled');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
    },
};

export const Required = {
    render: () => <Checkbox id="cb-ex-required" label="I accept the terms" isRequired />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-form-checkbox-wrapper')).toHaveClass('plus-form-checkbox-required');
        await expect(canvasElement.querySelector('.plus-field-required')).toHaveAttribute('aria-hidden', 'true');
    },
};

export const Description = {
    render: () => <Checkbox id="cb-ex-desc" label="Email reminders" description="Sent the evening before." />,
    play: async ({ canvasElement }) => {
        const el = box(canvasElement, 'Email reminders');
        const desc = canvasElement.ownerDocument.getElementById(el.getAttribute('aria-describedby'));
        await expect(desc.textContent).toBe('Sent the evening before.');
    },
};

export const Card = {
    render: () => <Checkbox id="cb-ex-card" label="Text reminders" description="Sent an hour before." appearance="card" defaultChecked />,
    play: async ({ canvasElement }) => {
        await expect(box(canvasElement, 'Text reminders')).toHaveAttribute('aria-checked', 'true');
    },
};
