import React from 'react';
import { expect, within } from 'storybook/test';
import { Status } from '@/components';
import Agenda from './Agenda';
import { AGENDA } from '../../data/mock';
import { DARK_WITH_LEGACY, LIGHT, onSurface } from '../storyModes';

/** Agenda: today as a timeline; the entry happening now is marked. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Agenda',
    component: Agenda,
    decorators: [(Story) => <div style={{ width: 340 }}><Story /></div>, onSurface],
    args: {
        label: 'Today',
        items: AGENDA.map((a) => ({ ...a, href: `#${a.id}`, status: a.status ? <Status style="info">{a.status}</Status> : undefined })),
    },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const now = canvas.getByRole('link', { name: 'Math 7' }).closest('li');
        await expect(now).toHaveAttribute('aria-current', 'time');
        await expect(canvas.getByRole('link', { name: /Reacting to Errors/ })).toHaveTextContent('(done)');
    },
};
export const Dark = { ...DARK_WITH_LEGACY };
