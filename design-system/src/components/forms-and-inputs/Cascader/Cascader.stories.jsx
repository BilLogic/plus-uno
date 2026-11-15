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
            table: { disable: true },
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
            table: { category: 'Content' },
        },
    },
};

const sampleOptions = [
    {
        text: 'North District',
        value: 'north',
        children: [
            {
                text: 'Lincoln Middle',
                value: 'lincoln',
                children: [
                    { text: 'Grade 6', value: 'grade-6' },
                    { text: 'Grade 7', value: 'grade-7' },
                ],
            },
            {
                text: 'Roosevelt Elementary',
                value: 'roosevelt',
                children: [
                    { text: 'Grade 4', value: 'grade-4' },
                    { text: 'Grade 5', value: 'grade-5' },
                ],
            },
        ],
    },
    {
        text: 'South District',
        value: 'south',
        children: [
            {
                text: 'Jefferson Middle',
                value: 'jefferson',
                children: [
                    { text: 'Grade 7', value: 'grade-7' },
                    { text: 'Grade 8', value: 'grade-8' },
                ],
            },
        ],
    },
];

export const Overview = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
            <Cascader
                id="cascader-overview"
                aria-label="Location"
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

/** The menu opens on press: from an empty field it builds the path column by column. */
export const EmptyPath = () => {
    const [value, setValue] = useState([]);
    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
            <Cascader id="cascader-empty" label="Location" value={value} options={sampleOptions} onChange={setValue} />
        </div>
    );
};

/** A chosen path shows in the field; opening reveals the columns up to its level. */
export const PreselectedPath = () => {
    const [value, setValue] = useState(['north', 'lincoln', 'grade-6']);
    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
            <Cascader id="cascader-preselected" label="Location" value={value} options={sampleOptions} onChange={setValue} />
        </div>
    );
};

export const SpacingDefault = () => (
    <div style={{ maxWidth: 'var(--width-2500)' }}>
        <Cascader id="cascader-default" label="Location" value={[]} options={sampleOptions} onChange={() => {}} />
    </div>
);

export const SpacingCompact = () => (
    <div style={{ maxWidth: 'var(--width-2500)' }}>
        <Cascader id="cascader-compact" label="Location" spacing="compact" value={[]} options={sampleOptions} onChange={() => {}} />
    </div>
);

export const Interactive = (args) => {
    const [value, setValue] = useState(args.contentPreset === 'preselected'
        ? ['north', 'lincoln', 'grade-6']
        : []);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? ['north', 'lincoln', 'grade-6']
            : []);
    }, [args.contentPreset]);

    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
            <Cascader
                id="cascader-interactive"
                label={args.label}
                value={value}
                options={sampleOptions}
                onChange={(newValue) => {
                    setValue(newValue);
                }}
                spacing={args.spacing}
                isDisabled={args.isDisabled}
                isInvalid={args.isInvalid}
                errorMessage={args.isInvalid ? 'Pick a location.' : undefined}
                placeholder={args.placeholder}
            />
            {value.length > 0 && (
                <p style={{ marginTop: 'var(--stack-md)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                    Selected path: {value.join(' → ')}
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    contentPreset: 'empty',
    label: 'Location',
    spacing: 'default',
    isDisabled: false,
    isInvalid: false,
    placeholder: 'Please select',
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('combobox', { name: 'Location' });
const wrap = { maxWidth: 'var(--width-2500)', minHeight: 'var(--height-250)' };

export const Rest = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-rest" label="Location" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-hover" label="Location" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-focus" label="Location" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-disabled" label="Location" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><Cascader id="cascader-ex-invalid" label="Location" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isInvalid errorMessage="Pick a location." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};
