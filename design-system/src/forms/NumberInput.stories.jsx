import React, { useState } from 'react';
import NumberInput from './NumberInput';

export default {
    title: 'Forms/Number Input',
    component: NumberInput,
    tags: ['!dev'],
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
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the number input',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the number input',
            table: { category: 'Behavior' },
        },
        readonly: {
            control: 'boolean',
            description: 'Make the input read-only',
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

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
        <NumberInput id="ni-s" placeholder="Small" size="small" />
        <NumberInput id="ni-m" placeholder="Medium" size="medium" />
        <NumberInput id="ni-l" placeholder="Large" size="large" />
    </div>
);

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
                <NumberInput id="number-input-readonly" placeholder="Number" value="12" readonly />
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
                size={args.size}
                disabled={args.disabled}
                readonly={args.readonly}
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
    size: 'medium',
    disabled: false,
    readonly: false,
    validation: 'none',
    validationMessage: '',
    min: undefined,
    max: undefined,
    step: 1,
};
