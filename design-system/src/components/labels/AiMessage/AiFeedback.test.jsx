import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AiMessage, { AiFeedback } from '.';

const up = () => screen.getByRole('button', { name: 'Good answer' });
const down = () => screen.getByRole('button', { name: 'Bad answer' });

describe('AiFeedback', () => {
    it('is a named group of two buttons, neither chosen at first', () => {
        render(<AiFeedback onFeedback={() => {}} />);
        expect(screen.getByRole('group', { name: 'Rate this answer' })).toBeInTheDocument();
        expect(up()).not.toHaveAccessibleDescription('Selected');
        expect(down()).not.toHaveAccessibleDescription('Selected');
        expect(up()).not.toHaveAttribute('aria-pressed');
        expect(down()).not.toHaveAttribute('aria-pressed');
    });

    it('keeps one selected at a time, reports it, and clears on a second press', () => {
        const onFeedback = vi.fn();
        render(<AiFeedback onFeedback={onFeedback} />);
        fireEvent.click(up());
        expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'up' });
        expect(up()).toHaveAccessibleDescription('Selected');
        fireEvent.click(down());
        expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'down' });
        expect(up()).not.toHaveAccessibleDescription('Selected');
        expect(down()).toHaveAccessibleDescription('Selected');
        fireEvent.click(down());
        expect(onFeedback).toHaveBeenLastCalledWith({ rating: null });
        expect(down()).not.toHaveAccessibleDescription('Selected');
    });

    it('announces a calm thanks once rated', () => {
        render(<AiFeedback onFeedback={() => {}} />);
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('');
        fireEvent.click(up());
        expect(status).toHaveTextContent('Thanks. Marked as a good answer.');
    });

    it('offers an optional comment on thumbs down and sends it', async () => {
        const onFeedback = vi.fn();
        render(<AiFeedback onFeedback={onFeedback} />);
        fireEvent.click(down());
        const field = await screen.findByRole('textbox', { name: /What went wrong/ });
        fireEvent.change(field, { target: { value: 'Wrong student' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));
        expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'down', comment: 'Wrong student' });
        await waitFor(() => expect(screen.queryByRole('textbox', { name: /What went wrong/ })).toBeNull());
    });

    it('lets the comment be skipped', async () => {
        const onFeedback = vi.fn();
        render(<AiFeedback onFeedback={onFeedback} />);
        fireEvent.click(down());
        fireEvent.click(await screen.findByRole('button', { name: 'Skip' }));
        await waitFor(() => expect(screen.queryByRole('textbox', { name: /What went wrong/ })).toBeNull());
        expect(onFeedback).toHaveBeenCalledTimes(1);
        expect(down()).toHaveAccessibleDescription('Selected');
    });

    it('follows a controlled value', () => {
        render(<AiFeedback value="up" onFeedback={() => {}} />);
        expect(up()).toHaveAccessibleDescription('Selected');
    });
});

describe('AiMessage feedback', () => {
    it('offers thumbs on a finished answer when onFeedback is given', () => {
        const { rerender } = render(<AiMessage text="Done." />);
        expect(screen.queryByRole('group', { name: 'Rate this answer' })).toBeNull();
        rerender(<AiMessage text="Done." onFeedback={() => {}} />);
        expect(screen.getByRole('group', { name: 'Rate this answer' })).toBeInTheDocument();
        rerender(<AiMessage status="streaming" text="Do" onFeedback={() => {}} />);
        expect(screen.queryByRole('group', { name: 'Rate this answer' })).toBeNull();
    });
});
