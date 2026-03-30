import React, { useEffect, useState } from 'react';
import Range from './Range';

export default {
    title: 'Forms/Range',
    component: Range,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'Range input controls allow users to select a numeric value within a specified range by dragging a slider. The range input provides visual feedback with a filled track indicating the current value position.',
            },
        },
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Available in 3 sizes: small, medium (default), large.',
            table: { category: 'Design' },
        },
        value: {
            control: { type: 'range', min: 0, max: 100, step: 1 },
            description: 'Current slider value',
            table: { category: 'Content' },
        },
        min: {
            control: 'number',
            description: 'Minimum slider value',
            table: { category: 'Behavior' },
        },
        max: {
            control: 'number',
            description: 'Maximum slider value',
            table: { category: 'Behavior' },
        },
        step: {
            control: 'number',
            description: 'Slider increment',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        defaultValue: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        onChange: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        onInput: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        style: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Sizes = () => {
    const [value1, setValue1] = useState(50);
    const [value2, setValue2] = useState(50);
    const [value3, setValue3] = useState(50);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Small, medium (default), and large track and thumb.
            </p>
            <Range
                id="range-small"
                min={0}
                max={100}
                value={value1}
                onChange={(e) => setValue1(parseFloat(e.target.value))}
                size="small"
            />
            <Range
                id="range-medium"
                min={0}
                max={100}
                value={value2}
                onChange={(e) => setValue2(parseFloat(e.target.value))}
                size="medium"
            />
            <Range
                id="range-large"
                min={0}
                max={100}
                value={value3}
                onChange={(e) => setValue3(parseFloat(e.target.value))}
                size="large"
            />
        </div>
    );
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value);

    useEffect(() => {
        setValue(args.value);
    }, [args.value]);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Range
                id="range-interactive"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
                size={args.size}
                min={args.min}
                max={args.max}
                step={args.step}
            />
        </div>
    );
};

Interactive.args = {
    size: 'medium',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
};
