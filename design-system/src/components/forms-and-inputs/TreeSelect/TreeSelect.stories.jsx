import { withReducedMotion, expectMenuExit } from '@/storybook-docs/lib/overlay-motion-plays';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
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
        children: {
            storyOnly: true,
            table: { disable: true },
        },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: { table: { disable: true } },
        contentPreset: {
            storyOnly: true,
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
        label: 'Algebra',
        value: 'algebra',
        children: [
            {
                label: 'Linear equations',
                value: 'linear-equations',
                children: [
                    { label: 'Two-step equations', value: 'two-step' },
                    { label: 'Slope and intercept', value: 'slope-intercept' },
                ],
            },
            {
                label: 'Quadratics',
                value: 'quadratics',
                children: [
                    { label: 'Factoring', value: 'factoring' },
                    { label: 'Quadratic formula', value: 'quadratic-formula' },
                ],
            },
        ],
    },
    {
        label: 'Geometry',
        value: 'geometry',
        children: [
            {
                label: 'Triangles',
                value: 'triangles',
                children: [
                    { label: 'Pythagorean theorem', value: 'pythagorean' },
                    { label: 'Congruence and similarity', value: 'congruence' },
                ],
            },
            { label: 'Circles and arcs', value: 'circles' },
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
    const [value, setValue] = useState(['factoring', 'quadratic-formula', 'quadratics']);
    return (
        <div style={fieldWrap}>
            <TreeSelect id="tree-select-multi" label="Topics" value={value} options={sampleOptions} onChange={setValue} isMulti />
        </div>
    );
};
MultiSelect.play = async ({ canvasElement }) => {
    // Its picks read as one line of text, so the field stays at the control height however many are picked.
    const box = within(canvasElement).getByRole('combobox', { name: 'Topics' }).closest('.plus-field');
    await expect(box.getBoundingClientRect().height).toBe(40);
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
        ? (args.isMulti ? ['factoring', 'quadratic-formula', 'quadratics'] : 'factoring')
        : (args.isMulti ? [] : '');
    const [value, setValue] = useState(presetValue);

    useEffect(() => {
        setValue(args.contentPreset === 'preselected'
            ? (args.isMulti ? ['factoring', 'quadratic-formula', 'quadratics'] : 'factoring')
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
                <p style={{ marginTop: 'var(--stack-md)', font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>
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
    play: async ({ canvasElement }) => {
        await expectRest(canvasElement, controlOf(canvasElement));
        await expect(px(getComputedStyle(canvasElement.querySelector('.plus-tree-select-arrow')).fontSize), 'tree select caret is --icon-sm').toBe(tokenLength(canvasElement, '--icon-sm'));
    },
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
/** It opens and closes with a plain fade on appearance.fast: no clip, scale or travel. */
export const OpensWithAFade = {
    render: () => <TreeSelect label="Student" options={motionTreeOptions} />,
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('combobox'));
        const parent = await within(canvasElement.ownerDocument.body).findByRole('treeitem', { name: 'Lincoln School' });
        const surface = parent.closest('.plus-tree-select-menu');
        await expectMenuExit(surface, () => parent.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), false);
    },
};

const treeMotionPlay = (reduced = false) => async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    const popup = within(canvasElement.ownerDocument.body);
    const parent = await popup.findByRole('treeitem', { name: 'Lincoln School' });
    parent.focus();
    await userEvent.keyboard('{ArrowRight}');
    const child = await popup.findByRole('treeitem', { name: 'Ana Ruiz' });
    const reveal = child.parentElement;
    await expect(reveal.style.height).not.toBe('');
    if (reduced) await expect(reveal.style.height).toBe('auto');
    await waitFor(() => expect(reveal.getBoundingClientRect().height).toBeGreaterThan(0));
    await userEvent.keyboard('{ArrowLeft}');
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
    await expect(child.isConnected).toBe(true);
    await waitFor(() => expect(child.isConnected).toBe(false));
    const surface = parent.closest('.plus-tree-select-menu');
    await expectMenuExit(surface, () => parent.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), reduced);
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
