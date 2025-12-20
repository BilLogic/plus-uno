import React, { useState } from 'react';
import OptionList from './OptionList';

export default {
    title: 'Forms/OptionList',
    component: OptionList,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'OptionList component displays a list of selectable options with chevron icons. Each option is clickable and can trigger an action when selected.'
            }
        }
    },
    argTypes: {
        options: {
            control: 'object',
            description: 'Array of option strings or objects with text/value properties',
            table: { category: 'Content' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the entire option list',
            table: { category: 'Behavior' }
        },
        onSelect: {
            action: 'selected',
            description: 'Callback function when an option is selected',
            table: { category: 'Behavior' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of OptionList configurations.
 */
export const Overview = () => {
    const [selected1, setSelected1] = useState(null);
    const [selected2, setSelected2] = useState(null);
    const [selected3, setSelected3] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Basic Usage */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Basic Usage</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    OptionList displays a list of selectable options. Each option shows text with a right-pointing chevron icon.
                </p>
                <OptionList
                    id="option-list-basic"
                    options={['Option', 'Option', 'Option']}
                    onSelect={(option, index) => {
                        setSelected1({ option, index });
                        console.log('Selected:', option, 'at index:', index);
                    }}
                />
            </section>

            {/* With Different Number of Options */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Varying Number of Options</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    The component can display any number of options. The number of options is configurable.
                </p>
                <OptionList
                    id="option-list-variable"
                    options={['Option', 'Option', 'Option', 'Option', 'Option']}
                    onSelect={(option, index) => {
                        setSelected2({ option, index });
                        console.log('Selected:', option, 'at index:', index);
                    }}
                />
            </section>

            {/* Disabled State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    The entire option list can be disabled, preventing all interactions.
                </p>
                <OptionList
                    id="option-list-disabled"
                    options={['Option', 'Option', 'Option']}
                    disabled
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the OptionList attributes in real-time.
 */
export const Interactive = (args) => {
    const [selected, setSelected] = useState(null);

    // Generate options based on count
    const generateOptions = (count) => {
        return Array.from({ length: count }, (_, i) => `Option ${i + 1}`);
    };

    const options = generateOptions(args.optionCount || 3);

    return (
        <div style={{ maxWidth: '600px' }}>
            <OptionList
                id="option-list-interactive"
                options={options}
                disabled={args.disabled}
                onSelect={(option, index) => {
                    setSelected({ option, index });
                    if (args.onSelect) {
                        args.onSelect(option, index);
                    }
                }}
            />
            {selected && (
                <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Selected: {selected.option} (index: {selected.index})
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    optionCount: 3,
    disabled: false
};

Interactive.argTypes = {
    optionCount: {
        control: { type: 'number', min: 1, max: 10, step: 1 },
        description: 'Number of options to display',
        table: { category: 'Content' }
    }
};

