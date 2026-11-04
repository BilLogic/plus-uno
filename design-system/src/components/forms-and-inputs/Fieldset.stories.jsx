import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import Fieldset from './Fieldset';
import Checkbox from './Checkbox';

export default {
    title: 'Components/Forms and inputs/Fieldset',
    component: Fieldset,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Fieldset: a legend plus the fields it groups. The base every grouped field in Forms and inputs — Radio group and a Checkbox group — composes on top of.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        legend: { control: 'text', table: { category: 'Content' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isRequired: { control: 'boolean', table: { category: 'Behavior' } },
        error: { control: 'text', table: { category: 'Behavior' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)', maxWidth: '480px' };

export const Default = () => (
    <Fieldset legend="Your details">
        <Checkbox name="fs-updates" label="Email me updates" />
        <Checkbox name="fs-sms" label="Text me reminders" />
    </Fieldset>
);
Default.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Your details' });
    await expect(group.tagName).toBe('FIELDSET');
    await expect(within(group).getAllByRole('checkbox')).toHaveLength(2);
};

/** A Checkbox group: Checkboxes inside a Fieldset with a legend. */
export const CheckboxGroup = () => {
    const [reasons, setReasons] = useState([]);
    const toggle = (value, checked) => {
        setReasons((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
    };
    return (
        <Fieldset legend="Reason for request" isRequired>
            {[
                { value: 'fewer-tutors', label: 'Fewer tutors than expected' },
                { value: 'more-students', label: 'More students than expected' },
            ].map((option) => (
                <Checkbox
                    key={option.value}
                    name="checkbox-group-reason"
                    value={option.value}
                    label={option.label}
                    isChecked={reasons.includes(option.value)}
                    onChange={(event) => toggle(option.value, event.target.checked)}
                />
            ))}
        </Fieldset>
    );
};
CheckboxGroup.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Reason for request/ });
    await userEvent.click(within(group).getByRole('checkbox', { name: 'More students than expected' }));
    await expect(within(group).getByRole('checkbox', { name: 'More students than expected' }).nextElementSibling.checked).toBe(true);
};

export const WithRequiredAndError = () => (
    <div style={stack}>
        <Fieldset legend="Required" isRequired>
            <Checkbox name="fs-required" label="I agree" />
        </Fieldset>
        <Fieldset legend="Invalid" error="Choose at least one.">
            <Checkbox name="fs-invalid" label="Option" />
        </Fieldset>
        <Fieldset legend="Disabled" isDisabled>
            <Checkbox name="fs-disabled" label="Option" />
        </Fieldset>
    </div>
);
