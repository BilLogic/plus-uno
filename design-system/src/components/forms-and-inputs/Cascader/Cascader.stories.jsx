import React, { useEffect, useState } from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid } from '../_internal/fieldStatePlays';
import Cascader from './Cascader';

export default {
    title: 'Components/Forms and inputs/Select/Cascader',
    component: Cascader,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'ADS props: `isDisabled`, `isRequired`, `isInvalid`/`errorMessage`, `spacing` (default 40, compact 32); gained `label` and `caption` on the shared `_Field` base.' },
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12.' },
        ],
        docs: {
            description: {
                component:
                    'Cascader allows hierarchical selection through multiple levels. When opened, it displays columns horizontally - each column represents a level in the hierarchy. Selecting an option with children opens a new column to the right.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        contentPreset: {
            control: 'select',
            options: ['empty', 'preselected'],
            description: 'Preset selection state for the interactive demo',
            table: { category: 'Content' },
        },
        options: {
            table: { disable: true, category: 'Development' },
        },
        value: {
            table: { disable: true, category: 'Development' },
        },
        label: {
            control: 'text',
            table: { category: 'Content' },
        },
        spacing: {
            control: { type: 'inline-radio' },
            options: ['default', 'compact'],
            table: { category: 'Design' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isInvalid: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        onChange: {
            table: { disable: true, category: 'Development' },
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

export const Overview = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={{ maxWidth: '600px', minHeight: 48, paddingBottom: 360 }}>
            <Cascader
                id="cascader-overview"
                aria-label="Region"
                value={value}
                options={sampleOptions}
                onChange={setValue}
                placeholder="Please select"
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formCascader }
    }
};

export const Content = () => {
    const [value1, setValue1] = useState([]);
    const [value2, setValue2] = useState(['zhejiang', 'hangzhou', 'westlake']);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <Cascader id="cascader-basic" label="Empty selection" caption="Opens the menu and builds a path from the hierarchy." value={value1} options={sampleOptions} onChange={setValue1} />
            <Cascader id="cascader-preselected" label="Pre-selected path" caption="Value shown in the field; opening reveals columns up to the current level." value={value2} options={sampleOptions} onChange={setValue2} />
        </div>
    );
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        <Cascader id="cascader-default" label="Default" value={[]} options={sampleOptions} onChange={() => {}} />
        <Cascader id="cascader-compact" label="Compact" spacing="compact" value={[]} options={sampleOptions} onChange={() => {}} />
    </div>
);

export const InteractionStates = () => {
    const [value3, setValue3] = useState([]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
            <Cascader id="cascader-disabled" label="Disabled" value={value3} options={sampleOptions} onChange={setValue3} isDisabled />
            <Cascader id="cascader-invalid" label="Invalid" value={[]} options={sampleOptions} onChange={() => {}} isInvalid errorMessage="Pick a region" />
        </div>
    );
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.contentPreset === 'preselected'
        ? ['zhejiang', 'hangzhou', 'westlake']
        : []);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? ['zhejiang', 'hangzhou', 'westlake']
            : []);
    }, [args.contentPreset]);

    return (
        <div style={{ maxWidth: '600px' }}>
            <Cascader
                id="cascader-interactive"
                label={args.label}
                value={value}
                options={sampleOptions}
                onChange={(newValue) => {
                    setValue(newValue);
                }}
                isDisabled={args.isDisabled}
                placeholder={args.placeholder}
            />
            {value.length > 0 && (
                <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--ds-text-subtle)' }}>
                    Selected path: {value.join(' → ')}
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    contentPreset: 'empty',
    label: 'Region',
    isDisabled: false,
    placeholder: 'Please select',
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('combobox', { name: 'Region' });
const wrap = { maxWidth: 'var(--width-2500)', minHeight: 'var(--height-250)' };

export const Rest = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-rest" label="Region" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-hover" label="Region" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-focus" label="Region" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-disabled" label="Region" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-invalid" label="Region" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isInvalid errorMessage="Pick a region." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};
