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
        label: {
            control: 'text',
            description: 'Visible field label',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Toggle the required switch to show or hide a * next to the label to show if the input is required.',
            table: { category: 'Content' }
        },
        leadingVisual: {
            control: 'select',
            options: ['none', 'icon'],
            description: 'Leading visual preset',
            table: { category: 'Content' }
        },
        trailingVisual: {
            control: 'select',
            options: ['none', 'icon', 'dropdown'],
            description: 'Trailing visual preset',
            table: { category: 'Content' }
        },
        type: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text',
            table: { category: 'Content' }
        },
        value: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' }
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
                leadingVisual={args.leadingVisual === 'icon' ? 'fa-solid fa-icons' : undefined}
                trailingVisual={args.trailingVisual === 'dropdown'
                    ? 'dropdown'
                    : (args.trailingVisual === 'icon' ? 'fa-solid fa-icons' : undefined)}
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
    leadingVisual: 'none',
    trailingVisual: 'icon',
};
