import React, { useState } from 'react';
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
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const addonDropdownItems = [
    { text: 'Action' },
    { text: 'Another action' },
    { text: 'Something else' },
];

const docsCol = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' };

export const Content = () => {
    const [value, setValue] = useState('');

    return (
        <div style={docsCol}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Baseline input group</h6>
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>Selection addons</h6>
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>Action addons</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sizes</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Interaction states</h6>
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
export const Overview = () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState('');
    const [value4, setValue4] = useState('');
    const [value5, setValue5] = useState('');
    const [value6, setValue6] = useState('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Checkbox Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Checkbox Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with checkbox addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual="checkbox"
                    trailingVisual="checkbox"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                />
            </section>

            {/* Icon Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Icon Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with plus icon addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual="icon"
                    trailingVisual="icon"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                />
            </section>

            {/* Radio Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Radio Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with radio button addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual={{ type: 'radio', checked: true }}
                    trailingVisual={{ type: 'radio', checked: false }}
                    value={value3}
                    onChange={(e) => setValue3(e.target.value)}
                />
            </section>

            {/* Text Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Text Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with text addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                    value={value4}
                    onChange={(e) => setValue4(e.target.value)}
                />
            </section>

            {/* Button Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Button Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with button addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual="button"
                    trailingVisual="button"
                    value={value5}
                    onChange={(e) => setValue5(e.target.value)}
                />
            </section>

            {/* Dropdown Input Group */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Dropdown Input Group</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with dropdown addons on both sides.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual="dropdown"
                    trailingVisual="dropdown"
                    value={value6}
                    onChange={(e) => setValue6(e.target.value)}
                />
            </section>

            {/* Multiple Addons */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Addons</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input group with multiple addons on the trailing side.
                </p>
                <InputGroup
                    placeholder="Placeholder"
                    leadingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual={{ type: 'text', children: 'Text' }}
                    trailingVisual2={{ type: 'text', children: 'Text' }}
                />
            </section>

            {/* Size Variants */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size Variants</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input groups in small, medium, and large sizes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Placeholder"
                        size="small"
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                    <InputGroup
                        placeholder="Placeholder"
                        size="medium"
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                    <InputGroup
                        placeholder="Placeholder"
                        size="large"
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                </div>
            </section>

            {/* States */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>States</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Input groups in different states: default, disabled, and read-only.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <InputGroup
                        placeholder="Placeholder"
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                    <InputGroup
                        placeholder="Placeholder"
                        disabled
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                    <InputGroup
                        placeholder="Placeholder"
                        readonly
                        value="Read-only value"
                        leadingVisual={{ type: 'text', children: 'Text' }}
                        trailingVisual={{ type: 'text', children: 'Text' }}
                    />
                </div>
            </section>
        </div>
    );
};

