import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
