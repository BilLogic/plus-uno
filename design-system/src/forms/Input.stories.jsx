import React, { useState, useEffect } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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
        inputRef: { table: { disable: true } },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },}
};

/** Overview — Default field for docs landing. */
export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <Input
            id="input-overview"
            showLabel
            label="Label"
            placeholder="Placeholder"
            value=""
            required
            trailingVisual="fa-solid fa-icons"
        />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formInput }
    }
};

/** Content — Placeholder vs value, label, required, and visuals. */
export const Content = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PLACEHOLDER</span>
            <Input id="doc-content-placeholder" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VALUE</span>
            <Input id="doc-content-value" placeholder="Placeholder" value="Value" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LABEL</span>
            <Input id="doc-content-label" placeholder="Placeholder" value="" showLabel label="Label" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">REQUIRED</span>
            <Input id="doc-content-required" placeholder="Placeholder" value="" label="Label" required trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LEADING VISUAL</span>
            <Input id="doc-content-leading" placeholder="Placeholder" value="" leadingVisual="fa-solid fa-icons" trailingVisual="dropdown" />
        </div>
    </div>
);

/** Styles — Validation treatments: none, invalid, and success. */
export const Styles = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NONE</span>
            <Input id="doc-style-none" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INVALID</span>
            <Input id="doc-style-invalid" placeholder="Placeholder" value="" validation="invalid" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUCCESS</span>
            <Input id="doc-style-success" placeholder="Placeholder" value="" validation="success" validationMessage="Validation message" trailingVisual="fa-solid fa-icons" />
        </div>
    </div>
);

/** Sizes — Available in medium (default) size. */
export const Sizes = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
            <Input id="doc-size-medium" placeholder="Placeholder" value="" size="medium" trailingVisual="fa-solid fa-icons" />
        </div>
    </div>
);

/** InteractionStates — Default, hover, focus, disabled, and read-only. */
export const InteractionStates = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
            <Input id="doc-state-default" placeholder="Placeholder" value="" trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <Input id="doc-state-disabled" placeholder="Placeholder" value="" disabled trailingVisual="fa-solid fa-icons" />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">READ ONLY</span>
            <Input id="doc-state-readonly" placeholder="Placeholder" value="" readonly trailingVisual="fa-solid fa-icons" />
        </div>
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
