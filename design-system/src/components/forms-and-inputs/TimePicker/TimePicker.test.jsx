import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimePicker, { parseTime } from './TimePicker';

vi.mock('@fortawesome/fontawesome-free', () => ({}));

describe('parseTime', () => {
    it.each([
        ['02:30 PM', '02:30 PM'],
        ['2:30pm', '02:30 PM'],
        ['2:30 p', '02:30 PM'],
        ['14:30', '02:30 PM'],
        ['1430', '02:30 PM'],
        ['930', '09:30 AM'],
        ['0930', '09:30 AM'],
        ['9', '09:00 AM'],
        ['00:15', '12:15 AM'],
        ['12:45', '12:45 PM'],
        ['12am', '12:00 AM'],
    ])('reads %s as %s', (text, expected) => {
        expect(parseTime(text)).toBe(expected);
    });

    it.each(['0199', '13pm', '24:00', 'abc', '', '9:5'])('refuses %s', (text) => {
        expect(parseTime(text)).toBeNull();
    });
});

describe('TimePicker', () => {
    it('is a combobox, with no separate AM/PM control', () => {
        const { container } = render(<TimePicker aria-label="Time" />);
        expect(screen.getByRole('combobox', { name: 'Time' })).toBeInTheDocument();
        expect(container.querySelector('.plus-field__trailing button[aria-haspopup="menu"]')).toBeNull();
    });

    it('shows a 24-hour value as the 12-hour time', () => {
        render(<TimePicker aria-label="Time" value="14:30" />);
        expect(screen.getByRole('combobox', { name: 'Time' })).toHaveValue('2:30 PM');
    });

    it('the input is the field control, drawing no box of its own', () => {
        render(<TimePicker aria-label="Time" />);
        expect(screen.getByRole('combobox', { name: 'Time' })).toHaveClass('plus-field__control');
    });

    it('offers every half hour of the day', () => {
        render(<TimePicker aria-label="Time" />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Time' }));
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(48);
        expect(options[0]).toHaveTextContent('12:00 AM');
        expect(options[19]).toHaveTextContent('9:30 AM');
    });

    it('reports a picked time as a 12-hour value', () => {
        const onChange = vi.fn();
        render(<TimePicker aria-label="Time" onChange={onChange} />);
        fireEvent.click(screen.getByRole('combobox', { name: 'Time' }));
        fireEvent.click(screen.getByRole('option', { name: '2:30 PM' }));
        expect(onChange).toHaveBeenLastCalledWith('02:30 PM');
    });

    it('draws the field invalid', () => {
        const { container } = render(<TimePicker aria-label="Time" isInvalid />);
        expect(container.querySelector('.plus-field')).toHaveClass('plus-field--invalid');
    });

    it('disables the combobox when disabled', () => {
        render(<TimePicker aria-label="Time" isDisabled value="02:30 PM" />);
        expect(screen.getByRole('combobox', { name: 'Time' })).toBeDisabled();
    });
});
