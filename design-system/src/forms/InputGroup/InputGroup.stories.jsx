import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import InputGroup from './InputGroup';

export default {
    title: 'Forms/Input Group',
    component: InputGroup,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Input Group component extends form controls by adding text, checkbox, radio, icon, button, or dropdown addons on either side of textual inputs. Supports multiple addons on each side and various size variants.'
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
            description: 'Size variant of the input group',
            table: { category: 'Design' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the input group',
            table: { category: 'Behavior' }
        },
        readonly: {
            control: 'boolean',
            description: 'Make the input read-only',
            table: { category: 'Behavior' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text for the input',
            table: { category: 'Content' }
        },
        addonPreset: {
            control: 'select',
            options: ['baseline', 'selection', 'action', 'dropdown'],
            description: 'Curated addon combination for the interactive demo',
            table: { category: 'Content' }
        },
        leadingVisual: {
            table: { disable: true, category: 'Development' }
        },
        trailingVisual: {
            table: { disable: true, category: 'Development' }
        },
        value: {
            table: { disable: true, category: 'Development' }
        },
        onChange: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        name: {
            table: { disable: true, category: 'Development' }
        },
        trailingVisual2: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },}
};

const addonDropdownItems = [
    { text: 'Action' },
    { text: 'Another action' },
    { text: 'Something else' },
];

const docsCol = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' };

export const Overview = () => {
    const [value, setValue] = useState('');

    return (
        <div style={{ maxWidth: '800px' }}>
            <InputGroup
                id="input-group-overview"
                placeholder="Placeholder"
                leadingVisual={{ type: 'text', children: 'https://' }}
                trailingVisual="icon"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.formInputGroup }
    }
};

export const Content = () => {
    const [value, setValue] = useState('');

    return (
        <div style={docsCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">BASELINE INPUT GROUP</span>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Text addon on the left with an icon addon on the right.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual={{ type: 'text', children: 'https://' }}
                    trailingVisual="icon"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </section>
        </div>
    );
};

export const Variants = () => {
    const [checkboxValue, setCheckboxValue] = useState('');
    const [radioValue, setRadioValue] = useState('');
    const [buttonValue, setButtonValue] = useState('');
    const [dropdownValue, setDropdownValue] = useState('');

    return (
        <div style={docsCol}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SELECTION ADDONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Checkbox addons"
                        leadingVisual="checkbox"
                        trailingVisual="checkbox"
                        value={checkboxValue}
                        onChange={(e) => setCheckboxValue(e.target.value)}
                    />
                    <InputGroup
                        placeholder="Radio addons"
                        leadingVisual={{ type: 'radio', checked: true }}
                        trailingVisual={{ type: 'radio', checked: false }}
                        value={radioValue}
                        onChange={(e) => setRadioValue(e.target.value)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ACTION ADDONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Button addons"
                        leadingVisual="button"
                        trailingVisual="button"
                        value={buttonValue}
                        onChange={(e) => setButtonValue(e.target.value)}
                    />
                    <InputGroup
                        placeholder="Dropdown addons"
                        leadingVisual={{ type: 'dropdown', text: 'Menu', items: addonDropdownItems }}
                        trailingVisual={{ type: 'dropdown', text: 'More', items: addonDropdownItems }}
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(e.target.value)}
                    />
                </div>
            </section>
        </div>
    );
};

export const Sizes = () => (
    <div style={docsCol}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SIZES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputGroup
                    placeholder="Small"
                    size="small"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Medium"
                    size="medium"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Large"
                    size="large"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
            </div>
        </section>
    </div>
);

export const InteractionStates = () => (
    <div style={docsCol}>
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INTERACTION STATES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <InputGroup
                    placeholder="Default"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Disabled"
                    disabled
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
                <InputGroup
                    placeholder="Read-only"
                    readonly
                    value="Read-only value"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                />
            </div>
        </section>
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState('');
    const addonPresets = {
        baseline: {
            leadingVisual: { type: 'text', children: 'https://' },
            trailingVisual: 'icon'
        },
        selection: {
            leadingVisual: 'checkbox',
            trailingVisual: { type: 'radio', checked: false }
        },
        action: {
            leadingVisual: 'button',
            trailingVisual: 'button'
        },
        dropdown: {
            leadingVisual: { type: 'dropdown', text: 'Menu', items: addonDropdownItems },
            trailingVisual: { type: 'dropdown', text: 'More', items: addonDropdownItems }
        }
    };
    const visuals = addonPresets[args.addonPreset] || addonPresets.baseline;

    return (
        <div style={{ maxWidth: '600px' }}>
            <InputGroup
                size={args.size}
                disabled={args.disabled}
                readonly={args.readonly}
                placeholder={args.placeholder}
                leadingVisual={visuals.leadingVisual}
                trailingVisual={visuals.trailingVisual}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};
Interactive.args = {
    size: 'medium',
    disabled: false,
    readonly: false,
    placeholder: 'Placeholder',
    addonPreset: 'baseline',
};

/**
 * Overview
 * Comprehensive view of Input Group configurations matching Figma specifications.
 */

