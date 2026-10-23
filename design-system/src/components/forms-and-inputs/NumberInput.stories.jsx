import React, { useState } from 'react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import NumberInput from './NumberInput';

export default {
    title: 'Components/Forms and inputs/Number input',
    component: NumberInput,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Number Input component with increment and decrement buttons. Provides a numeric input field with integrated +/- controls for easy value adjustment.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Optional field label',
            table: { category: 'Content' },
        },
        required: {
            control: 'boolean',
            description: 'Show required indicator',
            table: { category: 'Content' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the number input',
            table: { category: 'Behavior' },
        },
        readOnly: {
            control: 'boolean',
            description: 'Make the input read-only. Hides the steppers.',
            table: { category: 'Behavior' },
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation state of the input',
            table: { category: 'Validation' },
        },
        validationMessage: {
            control: 'text',
            description: 'Validation message to display',
            table: { category: 'Validation' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text for the input',
            table: { category: 'Content' },
        },
        value: {
            table: { disable: true, category: 'Development' },
        },
        min: {
            control: 'number',
            description: 'Minimum value',
            table: { category: 'Constraints' },
        },
        max: {
            control: 'number',
            description: 'Maximum value',
            table: { category: 'Constraints' },
        },
        step: {
            control: 'number',
            description: 'Step increment/decrement value',
            table: { category: 'Constraints' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            table: { disable: true, category: 'Development' },
        },
        defaultValue: {
            table: { disable: true, category: 'Development' },
        },
        onChange: {
            table: { disable: true, category: 'Development' },
        },
        onIncrement: { table: { disable: true } },
        onDecrement: { table: { disable: true } },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <div style={{ maxWidth: '800px' }}>
        <NumberInput id="number-input-overview" label="Number of sessions" placeholder="Number" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formNumber }
    }
};

export const Content = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ maxWidth: '800px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Placeholder and typing in the default field.
            </p>
            <NumberInput
                id="number-input-content"
                placeholder="Number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

export const Styles = () => {
    const [v1, setV1] = useState('');
    const [v2, setV2] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <div>
                <h6 className="h6 mb-2">Invalid</h6>
                <NumberInput
                    id="number-input-error"
                    label="Invalid example"
                    showLabel={false}
                    placeholder="Number"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    validation="invalid"
                    validationMessage="Validation message"
                />
            </div>
            <div>
                <h6 className="h6 mb-2">Success</h6>
                <NumberInput
                    id="number-input-success"
                    label="Success example"
                    showLabel={false}
                    placeholder="Number"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    validation="success"
                    validationMessage="Validation message"
                />
            </div>
        </div>
    );
};

export const InteractionStates = () => {
    const [v1, setV1] = useState('');
    const [v2, setV2] = useState('42');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
                <NumberInput
                    id="number-input-default"
                    placeholder="Number"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FOCUS</span>
                <NumberInput
                    id="number-input-focus"
                    placeholder="Number"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    autoFocus
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <NumberInput id="number-input-disabled" placeholder="Number" disabled />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ-ONLY</span>
                <NumberInput id="number-input-readonly" label="Read-only number" showLabel={false} placeholder="Number" value="12" readOnly />
            </div>
        </div>
    );
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <NumberInput
                id="number-input-interactive"
                label={args.label}
                required={args.required}
                placeholder={args.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={args.disabled}
                readOnly={args.readOnly}
                validation={args.validation}
                validationMessage={args.validationMessage}
                min={args.min}
                max={args.max}
                step={args.step}
            />
        </div>
    );
};

Interactive.args = {
    label: undefined,
    required: false,
    placeholder: 'Number',
    value: '',
    disabled: false,
    readOnly: false,
    validation: 'none',
    validationMessage: '',
    min: undefined,
    max: undefined,
    step: 1,
};

/**
 * Steppers — in the field's Trailing slot, minus before plus, named for the
 * field they change. Small buttons cut to the 20 text line, so the field stays 32 high.
 */
export const Steppers = () => (
    <div style={{ maxWidth: '320px' }}>
        <NumberInput id="number-input-steppers" label="Tutors per session" defaultValue="3" min={1} max={5} />
    </div>
);

Steppers.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Tutors per session' });
    const decrease = canvas.getByRole('button', { name: 'Decrease Tutors per session' });
    const increase = canvas.getByRole('button', { name: 'Increase Tutors per session' });

    // Minus comes first in the DOM, as in Figma, and both sit in Trailing.
    await expect(decrease.compareDocumentPosition(increase) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await expect(decrease.closest('.plus-field__trailing')).not.toBeNull();
    await expect(Math.round(increase.getBoundingClientRect().height)).toBe(20);
    await expect(Math.round(field.closest('.plus-field').getBoundingClientRect().height)).toBe(32);

    await userEvent.click(increase);
    await expect(field).toHaveValue('4');
    await userEvent.click(increase);
    await expect(field).toHaveValue('5');
    // At the bound, the stepper that would leave it is off.
    await expect(increase).toBeDisabled();
    await userEvent.click(decrease);
    await expect(field).toHaveValue('4');
};

/** EmptyIsNotZero — an empty field stays empty, and stepping from it starts at 0 or the bound. */
export const EmptyIsNotZero = () => {
    const [value, setValue] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '320px' }}>
            <NumberInput id="number-input-empty" label="Hours" value={value} onChange={(e) => setValue(e.target.value)} />
            <output data-testid="held">{JSON.stringify(value)}</output>
            <NumberInput id="number-input-floor" label="Students" min={5} />
        </div>
    );
};

EmptyIsNotZero.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hours = canvas.getByRole('textbox', { name: 'Hours' });

    // Empty is shown and held as empty, not as 0.
    await expect(hours).toHaveValue('');
    await userEvent.click(hours);
    await userEvent.tab();
    await expect(hours).toHaveValue('');
    await expect(canvas.getByTestId('held')).toHaveTextContent('""');

    // 0 is a value of its own, and survives a blur.
    await userEvent.type(hours, '0');
    await userEvent.tab();
    await expect(hours).toHaveValue('0');
    await expect(canvas.getByTestId('held')).toHaveTextContent('"0"');
    await userEvent.clear(hours);
    await expect(canvas.getByTestId('held')).toHaveTextContent('""');

    // From empty, a step starts at the floor rather than below it.
    await userEvent.click(canvas.getByRole('button', { name: 'Increase Students' }));
    await expect(canvas.getByRole('textbox', { name: 'Students' })).toHaveValue('5');
};

/** ClampOnBlur — a typed value outside min and max is brought inside when the field loses focus. */
export const ClampOnBlur = () => (
    <div style={{ maxWidth: '320px' }}>
        <NumberInput id="number-input-clamp" label="Sessions" min={1} max={10} />
    </div>
);

ClampOnBlur.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Sessions' });

    // Not while typing: "1" on the way to "12" is not clamped.
    await userEvent.type(field, '12');
    await expect(field).toHaveValue('12');
    await userEvent.tab();
    await expect(field).toHaveValue('10');

    await userEvent.clear(field);
    await userEvent.type(field, '-3');
    await userEvent.tab();
    await expect(field).toHaveValue('1');
};

/** WheelLeavesTheValue — scrolling over a focused field does not change the number. */
export const WheelLeavesTheValue = () => (
    <div style={{ maxWidth: '320px' }}>
        <NumberInput id="number-input-wheel" label="Capacity" defaultValue="4" />
    </div>
);

WheelLeavesTheValue.play = async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Capacity' });
    await userEvent.click(field);
    await fireEvent.wheel(field, { deltaY: -120 });
    await fireEvent.wheel(field, { deltaY: 120 });
    await expect(field).toHaveValue('4');
    await expect(field.getAttribute('type')).toBe('text');
};
