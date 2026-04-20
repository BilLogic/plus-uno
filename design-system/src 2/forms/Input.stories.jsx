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
 * Matches Figma content/copy, using the standard Forms overview vertical layout.
 */
export const Overview = () => {
    const DemoBlock = ({ children }) => (
        <div
            style={{
                backgroundColor: 'rgba(221, 227, 234, 0.16)',
                borderRadius: 8,
                padding: 64,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
            }}
        >
            {children}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size</h6>
                <div className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    <div>Available in the following size:</div>
                    <ul style={{ margin: 0, paddingLeft: 21 }}>
                        <li>medium (default)</li>
                    </ul>
                </div>
                <DemoBlock>
                    <Input id="input-size-medium" placeholder="Placeholder" value="" size="medium" trailingVisual="fa-solid fa-icons" />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>State</h6>
                <div className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    <div>Text inputs have 4 states:</div>
                    <ul style={{ margin: 0, paddingLeft: 21 }}>
                        <li>default</li>
                        <li>disabled</li>
                        <li>focus</li>
                        <li>read-only</li>
                    </ul>
                </div>
                <DemoBlock>
                    <Input id="input-state-default" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
                    <Input id="input-state-disabled" placeholder="Placeholder" value="" disabled trailingVisual="fa-solid fa-icons" />
                    <Input id="input-state-focus" placeholder="Placeholder" value="" autoFocus trailingVisual="fa-solid fa-icons" />
                    <Input id="input-state-readonly" placeholder="Placeholder" value="" readonly trailingVisual="fa-solid fa-icons" />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Input</h6>
                <div className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    <div>There are 2 styles for the input box:</div>
                    <ul style={{ margin: 0, paddingLeft: 21 }}>
                        <li>placeholder: for displaying placeholder text. It has a lighter color for both the box border and the text inside.</li>
                        <li>value: for displaying text entered by the user. It has a darker color for both the box border and the text inside.</li>
                    </ul>
                </div>
                <DemoBlock>
                    <Input id="input-style-placeholder" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
                    <Input id="input-style-value" placeholder="Placeholder" value="Value" trailingVisual="fa-solid fa-icons" />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Validation</h6>
                <div className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    <div>Add validation to any text input when the value needs to be within a set of parameters. Validation is represented with a color change in the border color. You can edit the validation message by clicking into the text.</div>
                    <div style={{ marginTop: 8 }}>Validation types include:</div>
                    <ul style={{ margin: 0, paddingLeft: 21 }}>
                        <li>none</li>
                        <li>invalid</li>
                        <li>success</li>
                    </ul>
                </div>
                <DemoBlock>
                    <Input id="input-validation-none" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
                    <Input
                        id="input-validation-invalid"
                        placeholder="Placeholder"
                        value=""
                        validation="invalid"
                        validationMessage="Validation message"
                        trailingVisual="fa-solid fa-icons"
                    />
                    <Input
                        id="input-validation-success"
                        placeholder="Placeholder"
                        value=""
                        validation="success"
                        validationMessage="Validation message"
                        trailingVisual="fa-solid fa-icons"
                    />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Label?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the label? switch to show or hide the label.
                </p>
                <DemoBlock>
                    <Input id="input-label-on" placeholder="Placeholder" value="" showLabel label="Label" trailingVisual="fa-solid fa-icons" />
                    <Input id="input-label-off" placeholder="Placeholder" value="" showLabel={false} label="Label" trailingVisual="fa-solid fa-icons" />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Required?</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Toggle the required switch to show or hide a <span style={{ color: 'var(--color-danger)' }}>*</span> next to the label to show if the input is required.
                </p>
                <DemoBlock>
                    <Input id="input-required-on" placeholder="Placeholder" value="" label="Label" required trailingVisual="fa-solid fa-icons" />
                    <Input id="input-required-off" placeholder="Placeholder" value="" label="Label" trailingVisual="fa-solid fa-icons" />
                </DemoBlock>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>LeadingVisual? & TrailingVisual?</h6>
                <div className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    <div>To toggle the leadingVisual? and trailingVisual? switches, you need to double-click on the form component to get into <strong>_Form</strong> component.</div>
                    <div style={{ marginTop: 8 }}>The leadingVisual is always an icon, and the trailingVisual can be an icon or a dropdown arrow.</div>
                    <div style={{ marginTop: 8 }}>If you change the trailingVisual to an arrow, make sure to select the proper trailingVisual size to match the form size.</div>
                </div>
                <DemoBlock>
                    <Input
                        id="input-visuals"
                        placeholder="Placeholder"
                        value=""
                        leadingVisual="fa-solid fa-icons"
                        trailingVisual="dropdown"
                    />
                </DemoBlock>
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
