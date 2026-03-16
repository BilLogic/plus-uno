import React, { useState } from 'react';
import Cascader from './Cascader';

export default {
    title: 'Forms/Cascader',
    component: Cascader,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Cascader component allows hierarchical selection through multiple levels. When opened, it displays columns horizontally - each column represents a level in the hierarchy. Selecting an option with children opens a new column to the right.'
            }
        }
    },
    argTypes: {
        value: {
            control: 'object',
            description: 'Array of selected values representing the current path',
            table: { category: 'Content' }
        },
        options: {
            control: 'object',
            description: 'Hierarchical options structure with children arrays',
            table: { category: 'Content' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the cascader component',
            table: { category: 'Behavior' }
        },
        onChange: {
            action: 'changed',
            description: 'Callback function when selection changes',
            table: { category: 'Behavior' }
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text when no options are available',
            table: { category: 'Content' }
        }
    }
};

// Sample hierarchical data
const sampleOptions = [
    {
        text: 'Zhejiang',
        value: 'zhejiang',
        children: [
            {
                text: 'Hangzhou',
                value: 'hangzhou',
                children: [
                    { text: 'WestLake', value: 'westlake' },
                    { text: 'Xihu', value: 'xihu' }
                ]
            },
            {
                text: 'Ningbo',
                value: 'ningbo',
                children: [
                    { text: 'Jiangbei', value: 'jiangbei' },
                    { text: 'Haishu', value: 'haishu' }
                ]
            }
        ]
    },
    {
        text: 'Jiangsu',
        value: 'jiangsu',
        children: [
            {
                text: 'Nanjing',
                value: 'nanjing',
                children: [
                    { text: 'Xuanwu', value: 'xuanwu' },
                    { text: 'Qinhuai', value: 'qinhuai' }
                ]
            }
        ]
    }
];

/**
 * Overview
 * Comprehensive view of Cascader configurations.
 */
export const Overview = () => {
    const [value1, setValue1] = useState([]);
    const [value2, setValue2] = useState(['zhejiang', 'hangzhou', 'westlake']);
    const [value3, setValue3] = useState([]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Basic Usage */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Basic Usage</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Cascader allows users to navigate through hierarchical options. Click the input field to open the dropdown. Selecting an option with children opens a new column to the right. The selected path is displayed in the input field.
                </p>
                <Cascader
                    id="cascader-basic"
                    value={value1}
                    options={sampleOptions}
                    onChange={setValue1}
                />
            </section>

            {/* With Pre-selected Path */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Pre-selected Path</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    The cascader can be initialized with a pre-selected path. When opened, it will show all columns up to the selected level.
                </p>
                <Cascader
                    id="cascader-preselected"
                    value={value2}
                    options={sampleOptions}
                    onChange={setValue2}
                />
            </section>

            {/* Disabled State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled State</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    The cascader can be disabled, preventing all interactions with the input field and dropdown menu.
                </p>
                <Cascader
                    id="cascader-disabled"
                    value={value3}
                    options={sampleOptions}
                    onChange={setValue3}
                    disabled
                />
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize the Cascader attributes in real-time.
 */
export const Interactive = (args) => {
    const [value, setValue] = useState(args.value || []);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Cascader
                id="cascader-interactive"
                value={value}
                options={args.options || sampleOptions}
                onChange={(newValue) => {
                    setValue(newValue);
                    if (args.onChange) {
                        args.onChange(newValue);
                    }
                }}
                disabled={args.disabled}
                placeholder={args.placeholder}
            />
            {value.length > 0 && (
                <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Selected path: {value.join(' → ')}
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    value: [],
    options: sampleOptions,
    disabled: false,
    placeholder: 'Please select'
};

