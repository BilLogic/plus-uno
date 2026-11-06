import React, { useEffect, useState } from 'react';
import { expect, within } from 'storybook/test';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid } from '../_internal/fieldStatePlays';
import TreeSelect from './TreeSelect';

export default {
    title: 'Components/Forms and inputs/Select/Tree select',
    component: TreeSelect,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'ADS props: `isMulti` replaces `multiple`, `isDisabled`, `isRequired`, `isInvalid`/`errorMessage`, `spacing` (default 40, compact 32); gained `label` and `caption` on the shared `_Field` base.' },
            { date: '2026-10-23', kind: 'changed', summary: 'A single-line field became 32, its text centered and its side padding 12.' },
        ],
        docs: {
            description: {
                component:
                    'Tree select allows selection from hierarchical data. The trigger input opens a panel of expandable tree nodes; in single mode clicking a node selects it, while with `isMulti` checkboxes cascade through the branch with indeterminate parent states.',
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
        isMulti: {
            control: 'boolean',
            description: 'Allow selecting multiple nodes with checkboxes',
            table: { category: 'Design' },
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
            description: 'Placeholder text when nothing is selected',
            table: { category: 'Content' },
        },
    },
};

const sampleOptions = [
    {
        label: 'Mathematics',
        value: 'mathematics',
        children: [
            {
                label: 'Algebra',
                value: 'algebra',
                children: [
                    { label: 'Linear equations', value: 'linear-equations' },
                    { label: 'Quadratic equations', value: 'quadratic-equations' },
                ],
            },
            {
                label: 'Geometry',
                value: 'geometry',
                children: [
                    { label: 'Triangles', value: 'triangles' },
                    { label: 'Circles', value: 'circles' },
                ],
            },
        ],
    },
    {
        label: 'Science',
        value: 'science',
        children: [
            {
                label: 'Biology',
                value: 'biology',
                children: [
                    { label: 'Cells', value: 'cells' },
                    { label: 'Genetics', value: 'genetics' },
                ],
            },
            { label: 'Chemistry', value: 'chemistry' },
        ],
    },
];

export const Overview = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={{ maxWidth: '600px', minHeight: 48, paddingBottom: 320 }}>
            <TreeSelect
                id="tree-select-overview"
                aria-label="Topic"
                value={value}
                options={sampleOptions}
                onChange={setValue}
                isMulti
                placeholder="Please select"
            />
        </div>
    );
};

export const Content = () => {
    const [single, setSingle] = useState('');
    const [multi, setMulti] = useState(['triangles', 'circles', 'geometry']);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
            <TreeSelect id="tree-select-single" label="Single select" caption="Clicking any node selects it and closes the panel." value={single} options={sampleOptions} onChange={setSingle} />
            <TreeSelect id="tree-select-multi" label="Multiple, pre-selected branch" caption="Checking a parent cascades to its children; partially checked branches show an indeterminate state." value={multi} options={sampleOptions} onChange={setMulti} isMulti />
        </div>
    );
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        <TreeSelect id="tree-select-default" label="Default" value={[]} options={sampleOptions} onChange={() => {}} isMulti />
        <TreeSelect id="tree-select-compact" label="Compact" spacing="compact" value={[]} options={sampleOptions} onChange={() => {}} isMulti />
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        <TreeSelect id="tree-select-disabled" label="Disabled" value={[]} options={sampleOptions} onChange={() => {}} isMulti isDisabled />
        <TreeSelect id="tree-select-invalid" label="Invalid" value={[]} options={sampleOptions} onChange={() => {}} isInvalid errorMessage="Pick a topic" />
    </div>
);

export const Interactive = (args) => {
    const presetValue = args.contentPreset === 'preselected'
        ? (args.isMulti ? ['triangles', 'circles', 'geometry'] : 'triangles')
        : (args.isMulti ? [] : '');
    const [value, setValue] = useState(presetValue);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? (args.isMulti ? ['triangles', 'circles', 'geometry'] : 'triangles')
            : (args.isMulti ? [] : ''));
    }, [args.contentPreset, args.isMulti]);

    const selectionSummary = args.isMulti
        ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : '')
        : (value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <TreeSelect
                id="tree-select-interactive"
                label={args.label}
                value={value}
                options={sampleOptions}
                onChange={setValue}
                isMulti={args.isMulti}
                isDisabled={args.isDisabled}
                placeholder={args.placeholder}
            />
            {selectionSummary && (
                <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--ds-text-subtle)' }}>
                    Selected: {selectionSummary}
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    contentPreset: 'empty',
    label: 'Topic',
    isMulti: true,
    isDisabled: false,
    placeholder: 'Please select',
};

/** One story per state, for the Examples tab. */
const controlOf = (canvasElement) => within(canvasElement).getByRole('combobox', { name: 'Topic' });
const wrap = { maxWidth: 'var(--width-2500)', minHeight: 'var(--height-250)' };

export const Rest = {
    render: () => <div style={wrap}><TreeSelect id="treeselect-ex-rest" label="Topic" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectRest(canvasElement, controlOf(canvasElement)),
};

export const Hovered = {
    render: () => <div style={wrap}><TreeSelect id="treeselect-ex-hover" label="Topic" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectHovered(canvasElement, controlOf(canvasElement)),
};

export const Focused = {
    render: () => <div style={wrap}><TreeSelect id="treeselect-ex-focus" label="Topic" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" /></div>,
    play: async ({ canvasElement }) => expectFocused(canvasElement, controlOf(canvasElement)),
};

export const FieldDisabled = {
    render: () => <div style={wrap}><TreeSelect id="treeselect-ex-disabled" label="Topic" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isDisabled /></div>,
    play: async ({ canvasElement }) => expectDisabled(canvasElement, controlOf(canvasElement)),
};

export const FieldInvalid = {
    render: () => <div style={wrap}><TreeSelect id="treeselect-ex-invalid" label="Topic" options={sampleOptions} value={[]} onChange={() => {}} placeholder="Please select" isInvalid errorMessage="Pick a topic." /></div>,
    play: async ({ canvasElement }) => expectInvalid(canvasElement, controlOf(canvasElement)),
};
