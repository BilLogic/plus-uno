import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import SegmentedControl from './SegmentedControl';
import { expectNoSilentClip, expectInsideWell } from '../../_internal/overflowPlays';

const FORMATS = [
    { value: 'table', label: 'Table', icon: 'table-list' },
    { value: 'cards', label: 'Cards', icon: 'grip' },
];
const ICON_FORMATS = FORMATS.map((option) => ({ ...option, isIconOnly: true }));
const RANGES = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-2xl) var(--inline-2xl)', alignItems: 'center' };

export default {
    title: 'Components/Forms and inputs/Segmented control',
    component: SegmentedControl,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A segmented control switches how the same content is shown. One segment is always selected and the view changes at once.',
            },
        },
    },
    argTypes: {
        label: { control: 'text', description: "The group's accessible name.", table: { category: 'Content' } },
        options: { control: 'object', description: 'The segments: `{ value, label, icon, isIconOnly, isDisabled }`.', table: { category: 'Content' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], description: '`default` is 32 high; `compact` is 24.', table: { category: 'Design' } },
        shouldFitContainer: { control: 'boolean', description: 'Segments share the container width equally.', table: { category: 'Layout' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        value: { table: { disable: true } },
        defaultValue: { table: { disable: true } },
        onChange: { table: { disable: true } },
        className: { control: false, table: { disable: true } },
        testId: { table: { disable: true } },
    },
    args: { label: 'Calendar range', options: RANGES, spacing: 'default', shouldFitContainer: false, isDisabled: false },
};

const Controlled = (props) => {
    const [value, setValue] = useState(props.options[0].value);
    return <SegmentedControl {...props} value={value} onChange={setValue} />;
};

export const Overview = {
    render: (args) => <Controlled {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('group', { name: 'Calendar range' });
        await expect(within(group).getAllByRole('button')).toHaveLength(3);
        await expect(canvas.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.queryByRole('radiogroup')).toBeNull();
        await expect(canvas.queryByRole('tablist')).toBeNull();
    },
};

/** Select by click: the pressed segment changes, exactly one is ever pressed, and pressing the selected one keeps it. */
export const SelectByClick = {
    render: () => <Controlled label="Format" options={FORMATS} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Cards' }));
        await expect(canvas.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'false');
        await userEvent.click(canvas.getByRole('button', { name: 'Cards' }));
        await expect(canvas.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
    },
};

/** Arrow keys move focus between segments and wrap; Space or Enter selects the focused one. */
export const KeyboardArrows = {
    render: () => <Controlled label="Calendar range" options={RANGES} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Day' })).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(canvas.getByRole('button', { name: 'Week' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        await expect(canvas.getByRole('button', { name: 'Month' })).toHaveFocus();
    },
};

/** Segments with an icon beside the text. */
export const WithIcons = {
    render: () => <Controlled label="Format" options={FORMATS} />,
    play: async ({ canvasElement }) => {
        const table = within(canvasElement).getByRole('button', { name: 'Table' });
        await expect(table.querySelector('.plus-segmented-control__icon')).not.toBeNull();
        await expect(table.querySelector('.plus-segmented-control__text')).not.toBeNull();
    },
};

/** Icon only: the label is the accessible name and opens in a Tooltip on hover and focus. */
export const IconOnly = {
    render: () => <Controlled label="Format" options={ICON_FORMATS} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const cards = canvas.getByRole('button', { name: 'Cards' });
        await expect(cards.querySelector('.plus-segmented-control__text')).toBeNull();
        await expect(cards.getBoundingClientRect().width).toBe(cards.getBoundingClientRect().height);
        await userEvent.hover(cards);
        const tip = await within(canvasElement.ownerDocument.body).findByRole('tooltip');
        await expect(tip).toHaveTextContent('Cards');
        await userEvent.unhover(cards);
    },
};

export const Spacing = {
    render: () => (
        <div style={row}>
            <Controlled label="Default range" options={RANGES} />
            <Controlled label="Compact range" options={RANGES} spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('group', { name: 'Default range' }).getBoundingClientRect().height).toBe(32);
        await expect(canvas.getByRole('group', { name: 'Compact range' }).getBoundingClientRect().height).toBe(24);
    },
};

/** `shouldFitContainer`: the segments share the width of a narrow container equally. */
export const FitContainer = {
    render: () => (
        <div style={{ width: '280px' /* demo frame */ }}>
            <Controlled label="Format" options={FORMATS} shouldFitContainer />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('group', { name: 'Format' });
        const [a, b] = within(group).getAllByRole('button');
        await expect(Math.round(group.getBoundingClientRect().width)).toBe(280);
        await expect(Math.abs(a.getBoundingClientRect().width - b.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    },
};

export const Disabled = {
    render: () => (
        <div style={row}>
            <SegmentedControl label="Whole control" options={RANGES} defaultValue="week" isDisabled />
            <SegmentedControl label="One segment" options={[...RANGES.slice(0, 2), { ...RANGES[2], isDisabled: true }]} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const whole = within(canvas.getByRole('group', { name: 'Whole control' })).getAllByRole('button');
        for (const button of whole) await expect(button).toBeDisabled();
        await expect(getComputedStyle(whole[0]).pointerEvents, 'a pointer never reaches a disabled segment').toBe('none');
        await expect(whole[1]).toHaveAttribute('aria-pressed', 'true');
    },
};

/** The selected segment is the raised surface; an unselected one is clear on the neutral track. */
export const SelectedLook = {
    render: () => <Controlled label="Calendar range" options={RANGES} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('group', { name: 'Calendar range' });
        const selected = canvas.getByRole('button', { name: 'Day' });
        await expect(getComputedStyle(group).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await expect(getComputedStyle(selected).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-raised'));
        await expect(getComputedStyle(canvas.getByRole('button', { name: 'Week' })).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    },
};

/** The indicator glides on `spatial.fast`; under reduced motion it does not glide. */
export const Motion = {
    render: () => <Controlled label="Calendar range" options={RANGES} />,
    beforeEach: async () => async () => { await emulateReducedMotion(null); },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = canvas.getByRole('group', { name: 'Calendar range' });
        await userEvent.click(canvas.getByRole('button', { name: 'Month' }));
        await expect(canvas.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() => expect(group.dataset.gliding).toBeUndefined());
        if (!(await emulateReducedMotion('reduce'))) return;
        await userEvent.click(canvas.getByRole('button', { name: 'Day' }));
        await expect(canvas.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
        await expect(group.dataset.gliding, 'no glide under reduced motion').toBeUndefined();
    },
};

/** Overflow: in a narrow well the segments shrink and long labels end in an ellipsis; the group stays on one line. */
export const Overflow = {
    render: () => (
        <div style={{ width: '260px' /* demo frame */ }}>
            <Controlled
                label="Report"
                options={[
                    { value: 'a', label: 'Two-step linear equations with variables on both sides' },
                    { value: 'b', label: 'Word problems and graphing' },
                ]}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('group', { name: 'Report' });
        const clipped = await expectNoSilentClip(canvasElement);
        await expect(clipped.length).toBeGreaterThan(0);
        await expectInsideWell(group, canvasElement.firstElementChild);
    },
};

export const Interactive = {
    render: (args) => <Controlled {...args} />,
};
