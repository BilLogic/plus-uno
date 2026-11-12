import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AiFeedback } from './AiFeedback';

/**
 * `AiFeedback` -- thumbs up and down on an AI answer.
 *
 * THE TEST SEAM IS THIS FILE. Each play presses what a person presses and
 * reads what is reported and what is pressed.
 */
export default {
    title: 'AI UI/Components/AI message/AI feedback',
    component: AiFeedback,
    tags: ['!dev', '!autodocs'],
    args: { onFeedback: fn() },
    argTypes: {
        value: { control: 'select', options: [undefined, 'up', 'down', null], table: { category: 'Content' } },
        defaultValue: { control: 'select', options: [null, 'up', 'down'], table: { category: 'Content' } },
        onFeedback: { table: { category: 'Development' } },
        className: { table: { disable: true } },
    },
};

/** Two buttons in a group named "Rate this answer". */
export const Overview = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('group', { name: 'Rate this answer' })).toBeTruthy();
        await userEvent.click(canvas.getByRole('button', { name: 'Good answer' }));
        await expect(args.onFeedback).toHaveBeenCalledWith({ rating: 'up' });
        await expect(canvas.getByRole('button', { name: 'Good answer' })).toHaveAccessibleDescription('Selected');
    },
};

/** Rated up. */
export const RatedUp = { args: { defaultValue: 'up' } };

/** Rated down. */
export const RatedDown = { args: { defaultValue: 'down' } };

/** Thumbs down opens a popup for an optional comment, sent with the rating. */
export const AskForComment = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Bad answer' }));
        await expect(args.onFeedback).toHaveBeenCalledWith({ rating: 'down' });
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.type(await body.findByRole('textbox', { name: 'What went wrong?' }), 'Too long');
        await userEvent.click(body.getByRole('button', { name: 'Send' }));
        await expect(args.onFeedback).toHaveBeenCalledWith({ rating: 'down', comment: 'Too long' });
    },
};

/** The playground. */
export const Interactive = {};
