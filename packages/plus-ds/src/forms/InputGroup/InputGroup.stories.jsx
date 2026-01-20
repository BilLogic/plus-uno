import React, { useState } from 'react';
import InputGroup from './InputGroup';

export default {
    title: 'Forms/Input Group',
    component: InputGroup,
    tags: ['autodocs'],
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
        leadingVisual: {
            control: 'select',
            options: ['checkbox', 'radio', 'icon', 'text', 'button', 'dropdown'],
            description: 'Addon type for the leading (left) side',
            table: { category: 'Addons' }
        },
        trailingVisual: {
            control: 'select',
            options: ['checkbox', 'radio', 'icon', 'text', 'button', 'dropdown'],
            description: 'Addon type for the trailing (right) side',
            table: { category: 'Addons' }
        }
    }
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

/**
 * Interactive Playground
 * Customize the Input Group attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <InputGroup
                placeholder={args.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                size={args.size}
                disabled={args.disabled}
                readonly={args.readonly}
                leadingVisual={args.leadingVisual ? { type: args.leadingVisual } : undefined}
                trailingVisual={args.trailingVisual ? { type: args.trailingVisual } : undefined}
            />
        </div>
    );
};

Interactive.args = {
    placeholder: 'Placeholder',
    size: 'medium',
    disabled: false,
    readonly: false,
    leadingVisual: undefined,
    trailingVisual: undefined
};

