import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Range from './Range';

export default {
    title: 'Components/Forms and inputs/Range',
    component: Range,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-23', kind: 'changed', summary: 'The slider is a 32 control at every size, its label 14/20.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="large"` was deprecated: it draws like `medium` and warns in development.' },
        ],
        docs: {
            description: {
                component:
                    'Range input controls allow users to select a numeric value within a specified range by dragging a slider. The range input provides visual feedback with a filled track indicating the current value position.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Small or medium (default). Large is deprecated and draws like medium.',
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
    },
};

export const Overview = () => {
    const [value, setValue] = useState(50);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Range
                id="range-overview"
                aria-label="Range value"
                min={0}
                max={100}
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value))}
                size="medium"
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formRange }
    }
};

export const Sizes = () => {
    const [value1, setValue1] = useState(50);
    const [value2, setValue2] = useState(50);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
            <Range
                id="range-small"
                aria-label="Small range value"
                min={0}
                max={100}
                value={value1}
                onChange={(e) => setValue1(parseFloat(e.target.value))}
                size="small"
            />
            <Range
                id="range-medium"
                aria-label="Medium range value"
                min={0}
                max={100}
                value={value2}
                onChange={(e) => setValue2(parseFloat(e.target.value))}
                size="medium"
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
                aria-label="Range value"
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
