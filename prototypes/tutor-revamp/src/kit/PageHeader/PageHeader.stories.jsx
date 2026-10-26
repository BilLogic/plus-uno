import React from 'react';
import { expect, within } from 'storybook/test';
import { Button, Status } from '@/components';
import PageHeader from './PageHeader';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** PageHeader: eyebrow, the h1, a status slot, a meta line and actions. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Page header',
    component: PageHeader,
    decorators: [onSurface],
    args: { eyebrow: 'Monday, January 22', title: 'Good afternoon, Boyuan' },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { level: 1, name: 'Good afternoon, Boyuan' })).toBeInTheDocument();
        await expect(canvas.getByText('Monday, January 22')).toBeInTheDocument();
    },
};
export const Dark = { ...DARK };

/** A record's tab: XL title, a status, the meta line and one action. */
export const Detail = {
    ...LIGHT,
    args: {
        detail: true,
        eyebrow: 'Mon, Jan 22, 2024',
        title: 'Math 7',
        status: <Status type="date" style="warning">Starts in 25 min</Status>,
        meta: 'Today, 1:00–2:00 pm at Lincoln Middle School with Ms. Rivera',
        actions: <Button text="Join session" style="primary" fill="filled" disabled />,
    },
};
