import React, { useState, useEffect } from 'react';
import Input from './Input';

export default {
    title: 'Forms/Input',
    component: Input,
    tags: ['!dev'],
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

/** Content — Placeholder vs value, label, required, and visuals. */
export const Content = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Input id="doc-content-placeholder" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-content-value" placeholder="Placeholder" value="Value" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-content-label" placeholder="Placeholder" value="" showLabel label="Label" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-content-required" placeholder="Placeholder" value="" label="Label" required trailingVisual="fa-solid fa-icons" />
        <Input id="doc-content-leading" placeholder="Placeholder" value="" leadingVisual="fa-solid fa-icons" trailingVisual="dropdown" />
    </div>
);

/** Styles — Validation treatments: none, invalid, and success. */
export const Styles = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Input id="doc-style-none" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-style-invalid" placeholder="Placeholder" value="" validation="invalid" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-style-success" placeholder="Placeholder" value="" validation="success" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
    </div>
);

/** Sizes — Available in medium (default) size. */
export const Sizes = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Input id="doc-size-medium" placeholder="Placeholder" value="" size="medium" trailingVisual="fa-solid fa-icons" />
    </div>
);

/** InteractionStates — Default, hover, focus, disabled, and read-only. */
export const InteractionStates = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Input id="doc-state-default" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        <Input id="doc-state-disabled" placeholder="Placeholder" value="" disabled trailingVisual="fa-solid fa-icons" />
        <Input id="doc-state-readonly" placeholder="Placeholder" value="" readonly trailingVisual="fa-solid fa-icons" />
    </div>
);

/**
 * Interactive Playground
 * Customize the Input attributes in real-time.
 */
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
