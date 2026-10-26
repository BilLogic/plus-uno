import React from 'react';
import { expect, within } from 'storybook/test';
import Avatar, { AvatarGroup } from './Avatar';
import { STUDENTS } from '../../data/mock';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** Avatar: initials on an accent; AvatarGroup overlaps a class. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Avatar',
    component: Avatar,
    decorators: [onSurface],
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--space-200)', alignItems: 'center' }}>
            <Avatar initials="AM" tone="blue" label="Arlene McCoy" />
            <AvatarGroup people={STUDENTS} label="Your students: Arlene, Morgan, Taylor, Casey" />
        </div>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', { name: 'Arlene McCoy' })).toHaveTextContent('AM');
        await expect(canvas.getByRole('img', { name: /Your students/ })).toBeInTheDocument();
    },
};
export const Dark = { ...DARK };
