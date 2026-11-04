import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimePicker from './TimePicker';

vi.mock('@fortawesome/fontawesome-free', () => ({}));

/** The toggle's own text, read by class since its role is `button` and an open menu's row is `menuitem`. */
const toggleText = (container) => container.querySelector('.plus-time-picker__period-toggle').textContent.trim();

describe('TimePicker', () => {
    it('splits a 24-hour value into the hour it can show and the period', () => {
        const { container } = render(<TimePicker aria-label="Time" value="14:30" />);
        expect(screen.getByRole('textbox', { name: 'Time' })).toHaveValue('02:30');
        expect(toggleText(container)).toBe('PM');
    });

    it('shows a 12-hour value as given', () => {
        render(<TimePicker aria-label="Time" value="02:30 PM" />);
        expect(screen.getByRole('textbox', { name: 'Time' })).toHaveValue('02:30');
        expect(screen.queryByRole('textbox', { name: 'Time' })).not.toHaveValue('14:30');
    });

    it('commits a typed time on blur', () => {
        const onChange = vi.fn();
        render(<TimePicker aria-label="Time" onChange={onChange} />);
        const input = screen.getByRole('textbox', { name: 'Time' });
        fireEvent.change(input, { target: { value: '0930' } });
        expect(onChange).not.toHaveBeenCalled();
        fireEvent.blur(input);
        expect(input).toHaveValue('09:30');
        expect(onChange).toHaveBeenLastCalledWith('09:30 AM');
    });

    it('commits a typed time on Enter', () => {
        const onChange = vi.fn();
        render(<TimePicker aria-label="Time" onChange={onChange} />);
        const input = screen.getByRole('textbox', { name: 'Time' });
        fireEvent.change(input, { target: { value: '9:05' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(input).toHaveValue('09:05');
        expect(onChange).toHaveBeenLastCalledWith('09:05 AM');
    });

    it('refuses a minute past 59, keeping the typed text and marking it invalid', () => {
        const onChange = vi.fn();
        render(<TimePicker aria-label="Time" onChange={onChange} />);
        const input = screen.getByRole('textbox', { name: 'Time' });
        fireEvent.change(input, { target: { value: '0199' } });
        fireEvent.blur(input);
        expect(input).toHaveValue('0199');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('reports immediately when the AM/PM toggle changes, with whichever half is set', () => {
        const onChange = vi.fn();
        const { container } = render(<TimePicker aria-label="Time" value="09:15 AM" onChange={onChange} />);
        fireEvent.click(container.querySelector('.plus-time-picker__period-toggle'));
        fireEvent.click(screen.getByRole('menuitem', { name: 'PM' }));
        expect(onChange).toHaveBeenLastCalledWith('09:15 PM');
    });

    it('draws the field invalid', () => {
        const { container } = render(<TimePicker aria-label="Time" isInvalid />);
        expect(container.querySelector('.plus-field')).toHaveClass('plus-field--invalid');
    });

    it('disables the period toggle when disabled', () => {
        const { container } = render(<TimePicker aria-label="Time" isDisabled value="02:30 PM" />);
        expect(container.querySelector('.plus-time-picker__period-toggle')).toBeDisabled();
    });
});
