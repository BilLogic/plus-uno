import React, { useState } from 'react';
import NumberInput from './NumberInput';

export default {
    title: 'Forms/Number Input',
    component: NumberInput,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Number Input component with increment and decrement buttons. Provides a numeric input field with integrated +/- controls for easy value adjustment.'
            }
        }
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant of the number input',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the number input',
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
            description: 'Validation state of the input',
            table: { category: 'Validation' }
        },
        validationMessage: {
            control: 'text',
            description: 'Validation message to display',
            table: { category: 'Validation' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text for the input',
            table: { category: 'Content' }
        },
        value: {
            control: 'number',
            description: 'Current value of the input',
            table: { category: 'Content' }
        },
        min: {
            control: 'number',
            description: 'Minimum value',
            table: { category: 'Constraints' }
        },
        max: {
            control: 'number',
            description: 'Maximum value',
            table: { category: 'Constraints' }
        },
        step: {
            control: 'number',
            description: 'Step increment/decrement value',
            table: { category: 'Constraints' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Number Input configurations matching Figma specifications.
 */
export const Overview = () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('');
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Default State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Default State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Default number input with placeholder text.
                </p>
                <NumberInput
                    id="number-input-default"
                    placeholder="Number"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                />
            </section>

            {/* Focus State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Focus State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Number input in focused state with primary border color.
                </p>
                <NumberInput
                    id="number-input-focus"
                    placeholder="Number"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    autoFocus
                />
            </section>

            {/* Disabled State - Variation 1 */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled State - Variation 1</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled number input with muted grey background and reduced opacity.
                </p>
                <NumberInput
                    id="number-input-disabled-1"
                    placeholder="Number"
                    value={value3}
                    onChange={(e) => setValue3(e.target.value)}
                    disabled
                />
            </section>

            {/* Disabled State - Variation 2 */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled State - Variation 2</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Alternative disabled state with slightly darker grey background.
                </p>
                <NumberInput
                    id="number-input-disabled-2"
                    placeholder="Number"
                    value={value4}
                    onChange={(e) => setValue4(e.target.value)}
                    disabled
                />
            </section>

            {/* Error State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Error State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Number input with error validation state and validation message.
                </p>
                <NumberInput
                    id="number-input-error"
                    placeholder="Number"
                    value={value5}
                    onChange={(e) => setValue5(e.target.value)}
                    validation="invalid"
                    validationMessage="Validation message"
                />
            </section>

            {/* Success State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Success State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Number input with success validation state and validation message.
                </p>
                <NumberInput
                    id="number-input-success"
                    placeholder="Number"
                    value={value6}
                    onChange={(e) => setValue6(e.target.value)}
                    validation="success"
                    validationMessage="Validation message"
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Number Input attributes in real-time.
 */
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
    step: 1
};

