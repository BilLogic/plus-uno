import React, { useState } from 'react';
import Cascader from './Cascader';

export default {
    title: 'Forms/Cascader',
    component: Cascader,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Cascader component allows hierarchical selection through multiple levels. When opened, it displays columns horizontally - each column represents a level in the hierarchy. Selecting an option with children opens a new column to the right.',
            },
        },
    },
    argTypes: {
        value: {
            control: 'object',
            description: 'Array of selected values representing the current path',
            table: { category: 'Content' },
        },
        options: {
            control: 'object',
            description: 'Hierarchical options structure with children arrays',
            table: { category: 'Content' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the cascader component',
            table: { category: 'Behavior' },
        },
        onChange: {
            action: 'changed',
            description: 'Callback function when selection changes',
            table: { category: 'Behavior' },
        },
        placeholder: {
            control: 'text',
            description: 'Placeholder text when no options are available',
            table: { category: 'Content' },
        },
    },
};

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
                    { text: 'Xihu', value: 'xihu' },
                ],
            },
            {
                text: 'Ningbo',
                value: 'ningbo',
                children: [
                    { text: 'Jiangbei', value: 'jiangbei' },
                    { text: 'Haishu', value: 'haishu' },
                ],
            },
        ],
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
                    { text: 'Qinhuai', value: 'qinhuai' },
                ],
            },
        ],
    },
];

export const Content = () => {
    const [value1, setValue1] = useState([]);
    const [value2, setValue2] = useState(['zhejiang', 'hangzhou', 'westlake']);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <div>
                <h6 className="h6 mb-2">Empty selection</h6>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Opens the menu and builds a path from the hierarchy.
                </p>
                <Cascader id="cascader-basic" value={value1} options={sampleOptions} onChange={setValue1} />
            </div>
            <div>
                <h6 className="h6 mb-2">Pre-selected path</h6>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Value shown in the field; opening reveals columns up to the current level.
                </p>
                <Cascader id="cascader-preselected" value={value2} options={sampleOptions} onChange={setValue2} />
            </div>
        </div>
    );
};

export const Layout = () => (
    <div style={{ maxWidth: '800px' }}>
        <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
            Each level opens as an additional column to the right of the previous one.
        </p>
        <Cascader id="cascader-layout" value={[]} options={sampleOptions} onChange={() => {}} />
    </div>
);

export const InteractionStates = () => {
    const [value3, setValue3] = useState([]);

    return (
        <div style={{ maxWidth: '800px' }}>
            <Cascader
                id="cascader-disabled"
                value={value3}
                options={sampleOptions}
                onChange={setValue3}
                disabled
            />
        </div>
    );
};

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
    placeholder: 'Please select',
};
