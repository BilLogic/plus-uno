import { withReducedMotion, expectOverlayExit } from '@/storybook-docs/lib/overlay-motion-plays';
import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectRest, expectHovered, expectFocused, expectDisabled, expectInvalid } from '../_internal/fieldStatePlays';
import TreeSelect from './TreeSelect';

export default {
    title: 'Components/Forms and inputs/Select/Tree select',
    component: TreeSelect,
    tags: ['!dev', '!autodocs'],
    parameters: {
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
        isMulti: {
            control: 'boolean',
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
            table: { category: 'Content' },
        },
    },
};

const sampleOptions = [
    {
        label: 'Middle schools',
        value: 'middle-schools',
        children: [
            {
                label: 'Lincoln Middle',
                value: 'lincoln-middle',
                children: [
                    { label: 'Tuesday 4:00 PM', value: 'lincoln-tue' },
                    { label: 'Thursday 4:00 PM', value: 'lincoln-thu' },
                ],
            },
            {
                label: 'Roosevelt K-8',
                value: 'roosevelt-k8',
                children: [
                    { label: 'Monday 3:30 PM', value: 'roosevelt-mon' },
                    { label: 'Wednesday 3:30 PM', value: 'roosevelt-wed' },
                ],
            },
        ],
    },
    {
        label: 'High schools',
        value: 'high-schools',
        children: [
            {
                label: 'North High',
                value: 'north-high',
                children: [
                    { label: 'Friday 3:30 PM', value: 'north-fri-early' },
                    { label: 'Friday 4:15 PM', value: 'north-fri-late' },
                ],
            },
            { label: 'South High', value: 'south-high' },
        ],
    },
];

export const Overview = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
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

const fieldWrap = { maxWidth: 'var(--width-2500)' };

/** Single select: clicking any node selects it and closes the panel. */
export const SingleSelect = () => {
    const [value, setValue] = useState('');
    return (
        <div style={fieldWrap}>
            <TreeSelect id="tree-select-single" label="Topic" value={value} options={sampleOptions} onChange={setValue} />
        </div>
    );
};

/** Multi select: a parent's check cascades to its children; a partly checked branch is indeterminate. */
export const MultiSelect = () => {
    const [value, setValue] = useState(['roosevelt-mon', 'roosevelt-wed', 'roosevelt-k8']);
    return (
        <div style={fieldWrap}>
            <TreeSelect id="tree-select-multi" label="Topics" value={value} options={sampleOptions} onChange={setValue} isMulti />
        </div>
    );
};

export const SpacingDefault = () => (
    <div style={fieldWrap}>
        <TreeSelect id="tree-select-default" label="Topics" value={[]} options={sampleOptions} onChange={() => {}} isMulti />
    </div>
);

export const SpacingCompact = () => (
    <div style={fieldWrap}>
        <TreeSelect id="tree-select-compact" label="Topics" spacing="compact" value={[]} options={sampleOptions} onChange={() => {}} isMulti />
    </div>
);

export const Interactive = (args) => {
    const presetValue = args.contentPreset === 'preselected'
        ? (args.isMulti ? ['roosevelt-mon', 'roosevelt-wed', 'roosevelt-k8'] : 'roosevelt-mon')
        : (args.isMulti ? [] : '');
    const [value, setValue] = useState(presetValue);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? (args.isMulti ? ['roosevelt-mon', 'roosevelt-wed', 'roosevelt-k8'] : 'roosevelt-mon')
            : (args.isMulti ? [] : ''));
    }, [args.contentPreset, args.isMulti]);

    const selectionSummary = args.isMulti
        ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : '')
        : (value || '');

    return (
        <div style={{ maxWidth: 'var(--width-2500)' }}>
            <TreeSelect
                id="tree-select-interactive"
                label={args.label}
                value={value}
                options={sampleOptions}
                onChange={setValue}
                isMulti={args.isMulti}
                spacing={args.spacing}
                isDisabled={args.isDisabled}
                isInvalid={args.isInvalid}
                errorMessage={args.isInvalid ? 'Pick a topic.' : undefined}
                placeholder={args.placeholder}
            />
            {selectionSummary && (
                <p style={{ marginTop: 'var(--stack-md)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
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
    spacing: 'default',
    isDisabled: false,
    isInvalid: false,
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

const motionTreeOptions = [{ value: 'school', label: 'Lincoln School', children: [{ value: 'student', label: 'Ana Ruiz' }] }];
const treeMotionPlay = (reduced = false) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    const parent = await canvas.findByRole('treeitem', { name: 'Lincoln School' });
    parent.focus();
    await userEvent.keyboard('{ArrowRight}');
    const child = await canvas.findByRole('treeitem', { name: 'Ana Ruiz' });
    const reveal = child.parentElement;
    await expect(reveal.style.height).not.toBe('');
    if (reduced) await expect(reveal.style.height).toBe('auto');
    await waitFor(() => expect(reveal.getBoundingClientRect().height).toBeGreaterThan(0));
    await userEvent.keyboard('{ArrowLeft}');
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
    await expect(child.isConnected).toBe(true);
    await waitFor(() => expect(child.isConnected).toBe(false));
    const surface = parent.closest('.plus-tree-select-menu');
    await expectOverlayExit(surface, () => parent.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), reduced);
};
export const MotionOpenClose = { render: () => <TreeSelect label="Student" options={motionTreeOptions} />, play: treeMotionPlay() };
export const MotionReduced = { ...MotionOpenClose, decorators: [withReducedMotion], play: treeMotionPlay(true) };

export const MotionKeyboardOpen = {
    ...MotionOpenClose,
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByRole('combobox');
        field.focus();
        await userEvent.keyboard('{ArrowDown}');
        const surface = await waitFor(() => {
            const element = canvasElement.ownerDocument.querySelector('.plus-listbox');
            expect(element).not.toBeNull();
            return element;
        });
        await expect(getComputedStyle(surface).animationName).toBe('none');
        await expect(surface).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(surface.isConnected).toBe(false));
    },
};
