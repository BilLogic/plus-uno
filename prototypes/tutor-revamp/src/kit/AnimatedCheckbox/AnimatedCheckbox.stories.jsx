import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import AnimatedCheckbox from './AnimatedCheckbox';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** AnimatedCheckbox: the tick draws in on check; no motion under reduced motion. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Animated checkbox',
    component: AnimatedCheckbox,
    decorators: [onSurface],
    render: (args) => {
        const [checked, setChecked] = useState(args.checked ?? false);
        return <AnimatedCheckbox {...args} checked={checked} onChange={setChecked} />;
    },
    args: { label: 'Warm up on unlike denominators' },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const box = within(canvasElement).getByRole('checkbox', { name: 'Warm up on unlike denominators' });
        await expect(box).not.toBeChecked();
        await userEvent.click(box);
        await expect(box).toBeChecked();
        await userEvent.keyboard(' ');
        await expect(box).not.toBeChecked();
    },
};
export const Dark = { ...DARK, args: { checked: true } };
