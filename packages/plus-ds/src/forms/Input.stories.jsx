import React, { useState, useEffect } from 'react';
import Input from './Input';

export default {
    title: 'Forms/Input',
    component: Input,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Textual form controls like inputs. The labeled text input box allows users to enter textual inputs and receive validation feedback with message.'
            }
        }
    },
    argTypes: {
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
            description: 'Toggle the label? switch to show or hide the label.',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the input is required.',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'text',
            description: 'Leading visual (icon) displayed on the left side of the input',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'text',
            description: 'Trailing visual can be an icon class (e.g., "fa-solid fa-icons") or "dropdown" for a dropdown arrow. Matching the trailingVisual size to the form size.',
            table: { category: 'Content' }
        },
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url', 'search'],
            description: 'Input type',
            table: { category: 'Content' }
        },
        id: {
            control: 'text',
            description: 'Input ID',
            table: { category: 'Content' }
        },
        name: {
            control: 'text',
            description: 'Input name',
            table: { category: 'Content' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' }
        },
        value: {
            control: 'text',
            description: 'Input value',
            table: { category: 'Content' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Input configurations matching Figma specifications.
 */
export const Overview = () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('Value');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('Value');
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('Value');
    const [value7, setValue7] = useState('');
    const [value8, setValue8] = useState('Value');
    const [value9, setValue9] = useState('');
    const [value10, setValue10] = useState('Value');
    const [value11, setValue11] = useState('');
    const [value12, setValue12] = useState('Value');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '1200px' }}>
            {/* Size Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Available in 3 sizes: small, medium (default), large.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-small"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            size="small"
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-medium"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            size="medium"
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-large"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            size="large"
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
            </section>

            {/* State Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Text inputs have 3 states: default, disabled, focus, read-only.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <Input
                        id="input-default-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value={value1}
                        onChange={(e) => setValue1(e.target.value)}
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-default-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value={value2}
                        onChange={(e) => setValue2(e.target.value)}
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-hover-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value={value3}
                        onChange={(e) => setValue3(e.target.value)}
                        className="plus-input-hover"
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-focus-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value={value4}
                        onChange={(e) => setValue4(e.target.value)}
                        autoFocus
                        trailingVisual="fa-solid fa-icons"
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                    <Input
                        id="input-disabled-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        disabled
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-disabled-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value="Value"
                        disabled
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-readonly-placeholder"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        readonly
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-readonly-value"
                        label="Label"
                        required
                        placeholder="Placeholder"
                        value="Value"
                        readonly
                        trailingVisual="fa-solid fa-icons"
                    />
                </div>
            </section>

            {/* Input Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Input</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    There are 2 styles for the input box: placeholder, value. Placeholder has a lighter color for both box border and text, while value has a darker color for both.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-placeholder-style"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            value={value5}
                            onChange={(e) => setValue5(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-value-style"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            value={value6}
                            onChange={(e) => setValue6(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
            </section>

            {/* Validation Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Validation</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Validation types include: none, invalid, success. Adding validation changes border color and shows validation messages.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-validation-none"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            validation="none"
                            value={value7}
                            onChange={(e) => setValue7(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-validation-invalid"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            validation="invalid"
                            validationMessage="Validation message"
                            value={value8}
                            onChange={(e) => setValue8(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-validation-success"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            validation="success"
                            validationMessage="Validation message"
                            value={value9}
                            onChange={(e) => setValue9(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-validation-invalid-value"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            validation="invalid"
                            validationMessage="Validation message"
                            value={value10}
                            onChange={(e) => setValue10(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-validation-success-value"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            validation="success"
                            validationMessage="Validation message"
                            value={value11}
                            onChange={(e) => setValue11(e.target.value)}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
            </section>

            {/* Label Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Label?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the label? switch to show or hide the label.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-with-label"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            showLabel={true}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-without-label"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            showLabel={false}
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
            </section>

            {/* Required Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Required?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the required switch to show or hide a * next to the label to show if the input is required.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-required"
                            label="Label"
                            required={true}
                            placeholder="Placeholder"
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input
                            id="input-not-required"
                            label="Label"
                            required={false}
                            placeholder="Placeholder"
                            trailingVisual="fa-solid fa-icons"
                        />
                    </div>
                </div>
            </section>

            {/* LeadingVisual & TrailingVisual Section */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>LeadingVisual? & TrailingVisual?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    LeadingVisual and TrailingVisual are togglable switches. LeadingVisual is always an icon, and TrailingVisual can be an icon or a dropdown arrow. Emphasizes matching the TrailingVisual size to the form size.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <Input
                            id="input-with-visuals"
                            label="Label"
                            required
                            placeholder="Placeholder"
                            leadingVisual="fa-solid fa-network-wired"
                            trailingVisual="dropdown"
                            size="large"
                            value={value12}
                            onChange={(e) => setValue12(e.target.value)}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Input attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    // Update value when args.value changes (for controlled component)
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
                type={args.type}
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
                leadingVisual={args.leadingVisual || undefined}
                trailingVisual={args.trailingVisual === 'dropdown' ? 'dropdown' : (args.trailingVisual || undefined)}
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
    leadingVisual: '',
    trailingVisual: 'fa-solid fa-icons',
    type: 'text',
    id: 'input-interactive',
    name: 'input-interactive'
};
