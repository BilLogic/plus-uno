import React, { useEffect, useState } from 'react';
import TreeSelect from './TreeSelect';

export default {
    title: 'Components/Forms and inputs/Tree select',
    component: TreeSelect,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'TreeSelect component allows selection from hierarchical data. The trigger input opens a panel of expandable tree nodes; in single mode clicking a node selects it, while in multiple mode checkboxes cascade through the branch with indeterminate parent states.',
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
        multiple: {
            control: 'boolean',
            description: 'Allow selecting multiple nodes with checkboxes',
            table: { category: 'Behavior' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the tree select component',
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
                value={value}
                options={sampleOptions}
                onChange={setValue}
                multiple
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
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SINGLE SELECT</span>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Clicking any node selects it and closes the panel.
                </p>
                <TreeSelect id="tree-select-single" value={single} options={sampleOptions} onChange={setSingle} />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MULTIPLE WITH PRE-SELECTED BRANCH</span>
                <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Checking a parent cascades to its children; partially checked branches show an indeterminate state.
                </p>
                <TreeSelect id="tree-select-multi" value={multi} options={sampleOptions} onChange={setMulti} multiple />
            </div>
        </div>
    );
};

export const Layout = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={{ maxWidth: '800px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Each hierarchy level is indented beneath its parent; carets expand and collapse branches in place.
            </p>
            <TreeSelect id="tree-select-layout" value={value} options={sampleOptions} onChange={setValue} multiple />
        </div>
    );
};

export const InteractionStates = () => (
    <div style={{ maxWidth: '800px' }}>
        <TreeSelect
            id="tree-select-disabled"
            value={[]}
            options={sampleOptions}
            onChange={() => {}}
            multiple
            disabled
        />
    </div>
);

export const Interactive = (args) => {
    const presetValue = args.contentPreset === 'preselected'
        ? (args.multiple ? ['triangles', 'circles', 'geometry'] : 'triangles')
        : (args.multiple ? [] : '');
    const [value, setValue] = useState(presetValue);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? (args.multiple ? ['triangles', 'circles', 'geometry'] : 'triangles')
            : (args.multiple ? [] : ''));
    }, [args.contentPreset, args.multiple]);

    const selectionSummary = args.multiple
        ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : '')
        : (value || '');

    return (
        <div style={{ maxWidth: '600px' }}>
            <TreeSelect
                id="tree-select-interactive"
                value={value}
                options={sampleOptions}
                onChange={setValue}
                multiple={args.multiple}
                disabled={args.disabled}
                placeholder={args.placeholder}
            />
            {selectionSummary && (
                <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Selected: {selectionSummary}
                </p>
            )}
        </div>
    );
};

Interactive.args = {
    contentPreset: 'empty',
    multiple: true,
    disabled: false,
    placeholder: 'Please select',
};
