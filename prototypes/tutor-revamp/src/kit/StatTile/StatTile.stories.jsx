import React from 'react';
import { expect, within } from 'storybook/test';
import StatTile from './StatTile';
import GoalMeter from '../GoalMeter';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** StatTile: one number, one label, one caption, on a tint. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Stat tile',
    component: StatTile,
    decorators: [onSurface],
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-100)', width: 960 }}>
            <StatTile as="a" href="#session" tone="teal" icon="clock" label="Next session" value="1:00 pm" caption="Math 7, Lincoln Middle School" />
            <StatTile as="a" href="#overdue" tone="yellow" icon="inbox" label="Waiting on you" value="2" caption="A reflection and a lesson" />
            <StatTile tone="blue" icon="user-group" label="Math 7 students" value="4" caption="2 need support this week" />
            <StatTile
                tone="green"
                icon="chart-simple"
                label="Paid hours this week"
                value="16.8"
                unit="of 20"
                caption="Includes prep and training"
                meter={<GoalMeter value={16.8} max={20} target={20} size="sm" interactive={false} label="16.8 of 20 paid hours" />}
            />
        </div>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('link', { name: /Next session 1:00 pm/ })).toHaveAttribute('href', '#session');
        await expect(canvas.getByRole('meter', { name: '16.8 of 20 paid hours' })).toBeInTheDocument();
    },
};
export const Dark = { ...DARK };
