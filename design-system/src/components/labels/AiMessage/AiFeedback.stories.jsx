import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

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
        await expect(canvas.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'true');
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

/** Escape or Skip closes the reason popup and hands focus back to the Bad answer thumb, still pressed. */
export const ReasonPopupReturnsFocus = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        const thumb = canvas.getByRole('button', { name: 'Bad answer' });

        await userEvent.click(thumb);
        const box = await body.findByRole('textbox', { name: 'What went wrong?' });
        await waitFor(() => expect(box.closest('[role="dialog"]')?.contains(canvasElement.ownerDocument.activeElement) ?? box.contains(canvasElement.ownerDocument.activeElement)).toBe(true));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('textbox', { name: 'What went wrong?' })).toBeNull());
        await waitFor(() => expect(thumb).toHaveFocus());
        await expect(thumb).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(thumb);
        await userEvent.click(thumb);
        await userEvent.click(await body.findByRole('button', { name: 'Skip' }));
        await waitFor(() => expect(body.queryByRole('textbox', { name: 'What went wrong?' })).toBeNull());
        await waitFor(() => expect(thumb).toHaveFocus());
        await expect(thumb).toHaveAttribute('aria-pressed', 'true');
    },
};

/** The playground. */
export const Interactive = {};
