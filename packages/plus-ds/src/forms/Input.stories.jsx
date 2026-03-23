import React, { useState, useEffect } from 'react';
import Input from './Input';

export default {
    title: 'Forms/Input',
    component: Input,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Textual form controls like inputs. The labeled text input box allows users to enter textual inputs and receive validation feedback with message.',
            },
        },
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Available in 3 sizes: small, medium (default), large.',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the input component',
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
            description: 'Validation types include: none, invalid, success.',
            table: { category: 'Validation' },
        },
        validationMessage: {
            control: 'text',
            description: 'Validation message displayed below the input',
            table: { category: 'Validation' },
        },
        showLabel: {
            control: 'boolean',
            description: 'Toggle the label? switch to show or hide the label.',
            table: { category: 'Content' },
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the input is required.',
            table: { category: 'Content' },
        },
        leadingVisual: {
            control: 'text',
            description: 'Leading visual (icon) displayed on the left side of the input',
            table: { category: 'Content' },
        },
        trailingVisual: {
            control: 'text',
            description:
                'Trailing visual can be an icon class (e.g., "fa-solid fa-icons") or "dropdown" for a dropdown arrow. Matching the trailingVisual size to the form size.',
            table: { category: 'Content' },
        },
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url', 'search'],
            description: 'Input type',
            table: { category: 'Content' },
        },
        id: {
            control: 'text',
            description: 'Input ID',
            table: { category: 'Content' },
        },
        name: {
            control: 'text',
            description: 'Input name',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' },
        },
        value: {
            control: 'text',
            description: 'Input value',
            table: { category: 'Content' },
        },
    },
};

const pageWrap = { maxWidth: '1200px' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function InputContentDemos() {
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('Value');
    const [value12, setValue12] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>
                    Input
                </h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Placeholder versus filled value: lighter treatment for empty placeholder state, darker for value.
                </p>
                <div style={contentVariantCard}>
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
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>
                    Label
                </h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Show or hide the visible label while keeping the field usable.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <Input
                                id="input-with-label"
                                label="Label"
                                required
                                placeholder="Placeholder"
                                showLabel
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
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>
                    Required
                </h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Optional required indicator next to the label.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <Input
                                id="input-required"
                                label="Label"
                                required
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
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '8px' }}>
                    Leading and trailing visuals
                </h6>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Leading visual is an icon; trailing can be an icon or a dropdown affordance. Match trailing size to
                    field size.
                </p>
                <div style={contentVariantCard}>
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
                </div>
            </section>
        </div>
    );
}

function InputVariantsDemos() {
    const [value7, setValue7] = useState('');
    const [value8, setValue8] = useState('');
    const [value9, setValue9] = useState('');
    const [value10, setValue10] = useState('Value');
    const [value11, setValue11] = useState('Value');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="body2-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>
                Validation: none, invalid, and success — border and message treatment.
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
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
        </div>
    );
}

function InputSizesDemos() {
    return (
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
    );
}

function InputInteractionStatesDemos() {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('Value');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('Value');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Default, hover (simulated class), focus, disabled, and read-only.
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
        </div>
    );
}

export const Content = () => (
    <div style={pageWrap}>
        <InputContentDemos />
    </div>
);

export const Styles = () => (
    <div style={pageWrap}>
        <InputVariantsDemos />
    </div>
);

export const Sizes = () => (
    <div style={pageWrap}>
        <InputSizesDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={pageWrap}>
        <InputInteractionStatesDemos />
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

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
                trailingVisual={
                    args.trailingVisual === 'dropdown' ? 'dropdown' : args.trailingVisual || undefined
                }
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
    name: 'input-interactive',
};
