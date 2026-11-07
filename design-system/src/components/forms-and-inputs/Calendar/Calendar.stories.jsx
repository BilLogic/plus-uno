import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Calendar from './Calendar';

export default {
    title: 'Components/Forms and inputs/Calendar',
    component: Calendar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'The month grid DatePicker and DateTimePicker open, on its own.',
            },
        },
    },
    argTypes: {
        className: { table: { disable: true } },
        size: {
            control: 'select',
            options: [28, 36, 44],
            description: 'Day cell width in pixels',
            table: { category: 'Design', defaultValue: { summary: '36' } },
        },
        minDate: {
            control: 'text',
            description: 'Optional minimum allowed date',
            table: { category: 'Behavior' },
        },
        maxDate: {
            control: 'text',
            description: 'Optional maximum allowed date',
            table: { category: 'Behavior' },
        },
    },
};

export const Overview = () => {
    const [viewDate, setViewDate] = useState(new Date(2026, 9, 1));
    const [selected, setSelected] = useState('2026-10-21');
    return (
        <Calendar
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            selected={selected}
            onPick={(date) => setSelected(date)}
        />
    );
};

export const Sizes = () => (
    <div style={{ display: 'flex', gap: 'var(--space-150)', flexWrap: 'wrap' }}>
        {[28, 36, 44].map((size) => (
            <Calendar
                key={size}
                size={size}
                viewDate={new Date(2026, 9, 1)}
                onViewDateChange={() => {}}
                selected="2026-10-21"
                onPick={() => {}}
            />
        ))}
    </div>
);

export const Bounds = () => (
    <Calendar
        viewDate={new Date(2026, 9, 1)}
        onViewDateChange={() => {}}
        minDate="2026-10-12"
        maxDate="2026-10-25"
        onPick={() => {}}
    />
);

export const PickADay = () => {
    const [viewDate, setViewDate] = useState(new Date(2026, 9, 1));
    const [selected, setSelected] = useState(null);
    return (
        <Calendar
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            selected={selected}
            onPick={setSelected}
        />
    );
};
PickADay.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const day = canvas.getByRole('button', { name: /October 21, 2026/ });
    await userEvent.click(day);
    await expect(day).toHaveAttribute('aria-pressed', 'true');
};

export const TurnMonths = () => {
    const [viewDate, setViewDate] = useState(new Date(2026, 9, 1));
    return <Calendar viewDate={viewDate} onViewDateChange={setViewDate} onPick={() => {}} />;
};
TurnMonths.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('October 2026')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(canvas.getByText('November 2026')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await expect(canvas.getByText('October 2026')).toBeVisible();
};

/** One story per state, for the Examples tab. */
const october = new Date(2026, 9, 1);
const none = () => {};
const day = (canvasElement, name) => within(canvasElement).getByRole('button', { name });

export const Default = {
    render: () => <Calendar viewDate={october} onViewDateChange={none} onPick={none} />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('October 2026')).toBeVisible();
        await expect(canvasElement.querySelectorAll('.plus-calendar-day')).toHaveLength(42);
    },
};

export const Selected = {
    render: () => <Calendar viewDate={october} onViewDateChange={none} selected="2026-10-21" onPick={none} />,
    play: async ({ canvasElement }) => {
        const picked = day(canvasElement, /October 21, 2026/);
        await expect(picked).toHaveAttribute('aria-pressed', 'true');
        await expect(picked).toHaveClass('plus-calendar-day--selected');
        await expect(getComputedStyle(picked).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Range = {
    render: () => <Calendar viewDate={october} onViewDateChange={none} rangeStart="2026-10-12" rangeEnd="2026-10-16" onPick={none} />,
    play: async ({ canvasElement }) => {
        await expect(day(canvasElement, /October 12, 2026/)).toHaveAttribute('aria-pressed', 'true');
        await expect(day(canvasElement, /October 16, 2026/)).toHaveAttribute('aria-pressed', 'true');
        const between = day(canvasElement, /October 14, 2026/);
        await expect(between).toHaveClass('plus-calendar-day--in-range');
        await expect(getComputedStyle(between).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
    },
};

export const Disabled = {
    render: () => <Calendar viewDate={october} onViewDateChange={none} minDate="2026-10-12" maxDate="2026-10-25" onPick={none} />,
    play: async ({ canvasElement }) => {
        const before = day(canvasElement, /October 5, 2026/);
        const inside = day(canvasElement, /October 14, 2026/);
        await expect(before).toBeDisabled();
        await expect(before).toHaveClass('plus-calendar-day--disabled');
        await expect(parseFloat(getComputedStyle(before).opacity)).toBeLessThan(1);
        await expect(inside).toBeEnabled();
    },
};

/** Hover takes the neutral subtle hovered step on an enabled day. */
export const HoveredState = {
    parameters: { docs: { disable: true } },
    render: () => <Calendar viewDate={october} onViewDateChange={none} selected="2026-10-21" onPick={none} />,
    play: async ({ canvasElement }) => {
        const plain = day(canvasElement, /October 14, 2026/);
        plain.style.transition = 'none';
        const hovered = withForcedPseudo(plain, ':hover', () => getComputedStyle(plain).backgroundColor);
        await expect(hovered).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered'));
        const picked = day(canvasElement, /October 21, 2026/);
        const stays = withForcedPseudo(picked, ':hover', () => getComputedStyle(picked).backgroundColor);
        await expect(stays, 'a picked day keeps its fill on hover').toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

/** Keyboard focus on a month button or a day draws the 2px ring, 2px off the edge. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => <Calendar viewDate={october} onViewDateChange={none} onPick={none} />,
    play: async ({ canvasElement }) => {
        const next = day(canvasElement, 'Next month');
        next.style.transition = 'none';
        next.focus({ focusVisible: true });
        const style = getComputedStyle(next);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(px(style.outlineOffset)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        next.blur();
        const picked = day(canvasElement, /October 14, 2026/);
        picked.style.transition = 'none';
        picked.focus({ focusVisible: true });
        const dayStyle = getComputedStyle(picked);
        await waitFor(() => expect(dayStyle.outlineStyle).toBe('solid'));
        await expect(px(dayStyle.outlineWidth), 'day ring width').toBe(2);
        await expect(dayStyle.outlineColor, 'day ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
        picked.blur();
    },
};
