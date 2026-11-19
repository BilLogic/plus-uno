import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Rating from './Rating';

/**
 * Rating is a radio group of five, on Base UI's RadioGroup: one tab stop, the
 * arrow keys move the value, and the value goes out with its form.
 */
const Controlled = (props) => {
    const [score, setScore] = useState(props.value ?? 0);
    return (
        <>
            <Rating label="Confidence" {...props} value={score} onChange={setScore} />
            <output data-testid="score">{score}</output>
        </>
    );
};

const score = () => screen.getByTestId('score').textContent;

describe('Rating', () => {
    it('is a named radio group of five radios, the chosen one checked', () => {
        render(<Controlled value={3} />);
        const group = screen.getByRole('radiogroup', { name: 'Confidence' });
        const radios = screen.getAllByRole('radio');
        expect(group).toBeInTheDocument();
        expect(radios).toHaveLength(5);
        expect(screen.getByRole('radio', { name: 'Rate 3' })).toHaveAttribute('aria-checked', 'true');
    });

    it('submits its value with its form under `name`', () => {
        const { container } = render(
            <form>
                <Rating name="confidence" label="Confidence" value={4} onChange={() => {}} />
            </form>,
        );
        expect(new FormData(container.querySelector('form')).get('confidence')).toBe('4');
    });

    it('sets the value on a click', async () => {
        const user = userEvent.setup();
        render(<Controlled />);
        await user.click(screen.getByRole('radio', { name: 'Rate 2' }));
        expect(score()).toBe('2');
    });

    it('has one tab stop, and the arrow keys move the value', async () => {
        const user = userEvent.setup();
        render(<Controlled value={3} />);
        await user.tab();
        expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Rate 3' }));
        await user.keyboard('{ArrowRight}');
        expect(score()).toBe('4');
        await user.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(score()).toBe('2');
    });

    it('does not change when disabled, and stays announced', async () => {
        const user = userEvent.setup();
        render(<Controlled value={4} isDisabled />);
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(5);
        await user.click(screen.getByRole('radio', { name: 'Rate 2' }));
        expect(score()).toBe('4');
        radios.forEach((radio) => expect(radio).toHaveAttribute('aria-disabled', 'true'));
    });

    it('bases stagger delay on distance from the previous value', async () => {
        const user = userEvent.setup();
        render(<Controlled value={0} />);

        await user.click(screen.getByRole('radio', { name: 'Rate 4' }));
        expect(screen.getByRole('radio', { name: 'Rate 1' }).style.getPropertyValue('--plus-rating-stagger')).toBe('0ms');
        expect(screen.getByRole('radio', { name: 'Rate 2' }).style.getPropertyValue('--plus-rating-stagger')).toBe('20ms');
        expect(screen.getByRole('radio', { name: 'Rate 3' }).style.getPropertyValue('--plus-rating-stagger')).toBe('40ms');
        expect(screen.getByRole('radio', { name: 'Rate 4' }).style.getPropertyValue('--plus-rating-stagger')).toBe('60ms');

        await user.click(screen.getByRole('radio', { name: 'Rate 5' }));
        expect(screen.getByRole('radio', { name: 'Rate 5' }).style.getPropertyValue('--plus-rating-stagger')).toBe('0ms');
    });

    it('drops the stagger once the select has settled, so hover-out returns at once', async () => {
        const user = userEvent.setup();
        render(<Controlled value={0} />);
        await user.click(screen.getByRole('radio', { name: 'Rate 3' }));
        expect(screen.getByRole('radio', { name: 'Rate 3' }).style.getPropertyValue('--plus-rating-stagger')).toBe('40ms');
        await waitFor(() => expect(screen.getByRole('radio', { name: 'Rate 3' }).style.getPropertyValue('--plus-rating-stagger')).toBe(''), { timeout: 2000 });
    });

    it('`type` picks the content: numbers above each item for numeric, a caption below for comments', () => {
        const { container, rerender } = render(<Rating label="Confidence" type="numeric" value={2} onChange={() => {}} />);
        expect(container.querySelectorAll('.plus-rating-item-label')).toHaveLength(5);
        expect(screen.queryByText('Comments')).toBeNull();
        rerender(<Rating label="Confidence" type="comments" value={2} onChange={() => {}} />);
        expect(container.querySelectorAll('.plus-rating-item-label')).toHaveLength(0);
        expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    it('has no `variant` prop: the old name no longer picks the content', () => {
        const { container } = render(<Rating label="Confidence" variant="numeric" value={2} onChange={() => {}} />);
        expect(container.querySelectorAll('.plus-rating-item-label')).toHaveLength(0);
        expect(screen.getByText('Comments')).toBeInTheDocument();
    });
});
