import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DatePicker from './DatePicker';

/**
 * DatePicker, driven the way a page uses it: through its label, typed text,
 * the calendar, the keyboard and the form it sits in. The Storybook plays
 * cover the drawn result; these cover what the field, the typed-text check and
 * the calendar add up to.
 */

const field = (name = 'Session date') => screen.getByRole('combobox', { name });
const day = (text) => screen.getByRole('button', { name: new RegExp(text) });
const calendar = () => screen.queryByRole('dialog');
const submitted = (form) => [...new FormData(form).entries()];

describe('DatePicker, typing', () => {
    it('picks a typed date on Enter, reports it as ISO and shows it', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" onChange={onChange} />);
        await user.type(field(), '10/21/2026{Enter}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('2026-10-21');
        expect(field()).toHaveValue('10/21/2026');
        expect(field()).not.toHaveAttribute('aria-invalid');
    });

    it('accepts one-digit months and days', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" onChange={onChange} />);
        await user.type(field(), '3/4/2026{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('2026-03-04');
        expect(field()).toHaveValue('03/04/2026');
    });

    it('reads typed text when focus leaves the field', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" onChange={onChange} />);
        await user.type(field(), '10/21/2026');
        expect(onChange).not.toHaveBeenCalled();
        await user.tab();
        expect(onChange).toHaveBeenCalledWith('2026-10-21');
    });

    it.each(['13/45/2026', '02/31/2026', '10-21-2026', 'tomorrow'])('keeps %s as typed, marks it invalid and reports nothing', async (text) => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" onChange={onChange} />);
        await user.type(field(), `${text}{Enter}`);
        expect(field()).toHaveValue(text);
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('lifts the invalid mark as soon as the text changes', async () => {
        const user = userEvent.setup();
        render(<DatePicker aria-label="Session date" />);
        await user.type(field(), '99/99/2026{Enter}');
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        await user.type(field(), '1');
        expect(field()).not.toHaveAttribute('aria-invalid');
    });

    it('refuses a typed date outside minDate and maxDate, and accepts the edges', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" minDate="2026-10-12" maxDate="2026-10-25" onChange={onChange} />);
        await user.type(field(), '10/11/2026{Enter}');
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        await user.clear(field());
        await user.type(field(), '10/26/2026{Enter}');
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(onChange).not.toHaveBeenCalled();
        await user.clear(field());
        await user.type(field(), '10/12/2026{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('2026-10-12');
        await user.clear(field());
        await user.type(field(), '10/25/2026{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('2026-10-25');
    });

    it('reports an empty value when the text is erased after a pick', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" onChange={onChange} />);
        await user.clear(field());
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('reads a typed range of two dates joined by a dash', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Report period" range onChange={onChange} />);
        await user.type(field('Report period'), '10/05/2026 – 10/06/2026{Enter}');
        expect(onChange).toHaveBeenLastCalledWith(['2026-10-05', '2026-10-06']);
        expect(field('Report period')).toHaveValue('10/05/2026 – 10/06/2026');
    });

    it('refuses a typed range that ends before it starts', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Report period" range onChange={onChange} />);
        await user.type(field('Report period'), '10/06/2026 - 10/05/2026{Enter}');
        expect(field('Report period')).toHaveAttribute('aria-invalid', 'true');
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('DatePicker, the calendar', () => {
    it('opens on click with the value\'s month, and marks the value pressed', async () => {
        const user = userEvent.setup();
        render(<DatePicker aria-label="Session date" defaultValue="2026-08-17" />);
        await user.click(field());
        expect(await screen.findByRole('dialog', { name: 'Choose a date' })).toBeInTheDocument();
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        expect(await screen.findByRole('button', { name: /August 17, 2026/ })).toHaveAttribute('aria-pressed', 'true');
        expect(day('August 18, 2026')).toHaveAttribute('aria-pressed', 'false');
    });

    it('opens with ArrowDown, picks a day, reports it, closes and keeps focus in the field', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" today="2026-10-21" onChange={onChange} />);
        await user.tab();
        await user.keyboard('{ArrowDown}');
        await user.click(await screen.findByRole('button', { name: /October 14, 2026/ }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('2026-10-14');
        expect(field()).toHaveValue('10/14/2026');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        expect(field()).toHaveFocus();
    });

    it('closes on Escape and reports nothing', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" onChange={onChange} />);
        await user.click(field());
        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(calendar()).toBeNull());
        expect(onChange).not.toHaveBeenCalled();
        expect(field()).toHaveValue('10/21/2026');
    });

    it('cannot pick a day outside minDate and maxDate', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" minDate="2026-10-12" maxDate="2026-10-25" onChange={onChange} />);
        await user.click(field());
        await screen.findByRole('dialog');
        expect(day('October 11, 2026')).toBeDisabled();
        expect(day('October 26, 2026')).toBeDisabled();
        expect(day('October 12, 2026')).toBeEnabled();
        await user.click(day('October 11, 2026'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('follows the typed date: the calendar opens on its month', async () => {
        const user = userEvent.setup();
        render(<DatePicker aria-label="Session date" />);
        await user.type(field(), '03/09/2027{Enter}');
        await user.click(field());
        expect(await screen.findByRole('button', { name: /March 9, 2027/ })).toHaveAttribute('aria-pressed', 'true');
    });

    it('turns to the next month and picks a day there', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" onChange={onChange} />);
        await user.click(field());
        await user.click(await screen.findByRole('button', { name: 'Next month' }));
        await user.click(await screen.findByRole('button', { name: /November 3, 2026/ }));
        expect(onChange).toHaveBeenLastCalledWith('2026-11-03');
    });
});

describe('DatePicker, range', () => {
    it('sets the first day, then the last, and starts again when a third click comes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Report period" range defaultValue={['2026-10-05', '2026-10-06']} onChange={onChange} />);
        await user.click(field('Report period'));
        await user.click(await screen.findByRole('button', { name: /October 19, 2026/ }));
        expect(onChange).toHaveBeenLastCalledWith(['2026-10-19', null]);
        expect(calendar()).not.toBeNull();
        await user.click(day('October 23, 2026'));
        expect(onChange).toHaveBeenLastCalledWith(['2026-10-19', '2026-10-23']);
        await waitFor(() => expect(calendar()).toBeNull());
        expect(field('Report period')).toHaveValue('10/19/2026 – 10/23/2026');
    });

    it('starts again, not a backwards range, when the second click comes before the first day', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Report period" range defaultValue={['2026-10-19', null]} onChange={onChange} />);
        await user.click(field('Report period'));
        await user.click(await screen.findByRole('button', { name: /October 12, 2026/ }));
        expect(onChange).toHaveBeenLastCalledWith(['2026-10-12', null]);
        expect(calendar()).not.toBeNull();
    });
});

describe('DatePicker, with presets', () => {
    const Filter = ({ onChange }) => {
        const [value, setValue] = useState([null, null]);
        return (
            <DatePicker
                label="Created"
                today="2026-10-21"
                value={value}
                onChange={(next) => { setValue(next); onChange(next); }}
            />
        );
    };

    it('shows All time on its trigger and opens preset rows', async () => {
        const user = userEvent.setup();
        render(<Filter onChange={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Created: All time' }));
        const popup = await screen.findByRole('dialog', { name: 'Created' });
        expect(within(popup).getAllByRole('radio').map((r) => r.textContent)).toEqual(['All time', 'Today', 'Last 7 days', 'Last 30 days']);
        expect(within(popup).getByRole('button', { name: 'Apply' })).toBeDisabled();
    });

    it('applies a preset: reports the range and names the trigger after it', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Filter onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Created: All time' }));
        const popup = await screen.findByRole('dialog', { name: 'Created' });
        await user.click(within(popup).getByRole('radio', { name: 'Last 7 days' }));
        expect(onChange).not.toHaveBeenCalled();
        await user.click(within(popup).getByRole('button', { name: 'Apply' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['2026-10-15', '2026-10-21']);
        expect(screen.getByRole('button', { name: 'Created: Last 7 days' })).toBeInTheDocument();
    });

    it('cancels with Escape: a draft pick is dropped and nothing is reported', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Filter onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Created: All time' }));
        const popup = await screen.findByRole('dialog', { name: 'Created' });
        await user.click(within(popup).getByRole('radio', { name: 'Today' }));
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Created: All time' })).toBeInTheDocument();
        // Reopened, the draft starts from what was applied.
        await user.click(screen.getByRole('button', { name: 'Created: All time' }));
        const again = await screen.findByRole('dialog', { name: 'Created' });
        expect(within(again).getByRole('radio', { name: 'All time' })).toBeChecked();
    });

    it('does not offer days after today, and Apply waits for both ends', async () => {
        const user = userEvent.setup();
        render(<Filter onChange={vi.fn()} />);
        await user.click(screen.getByRole('button', { name: 'Created: All time' }));
        const popup = await screen.findByRole('dialog', { name: 'Created' });
        expect(within(popup).getByRole('button', { name: /October 22, 2026/ })).toBeDisabled();
        await user.click(within(popup).getByRole('button', { name: /October 8, 2026/ }));
        expect(within(popup).getByRole('button', { name: 'Apply' })).toBeDisabled();
        await user.click(within(popup).getByRole('button', { name: /October 13, 2026/ }));
        expect(within(popup).getByRole('button', { name: 'Apply' })).toBeEnabled();
    });
});

describe('DatePicker, clearing', () => {
    it('clears with the field button, reports an empty value and keeps focus in the field', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Clear session date' }));
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(field()).toHaveValue('');
        expect(field()).toHaveFocus();
    });

    it('reports a cleared range as two nulls', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Report period" range defaultValue={['2026-10-05', '2026-10-06']} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Clear report period' }));
        expect(onChange).toHaveBeenLastCalledWith([null, null]);
    });

    it('clears typed text that was never a date without reporting a change', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" onChange={onChange} />);
        await user.type(field(), 'soon{Enter}');
        await user.click(screen.getByRole('button', { name: 'Clear session date' }));
        expect(field()).toHaveValue('');
        expect(field()).not.toHaveAttribute('aria-invalid');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('clears from the calendar footer and closes it', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" onChange={onChange} />);
        await user.click(field());
        const dialog = await screen.findByRole('dialog');
        await user.click(within(dialog).getByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith('');
        await waitFor(() => expect(calendar()).toBeNull());
        expect(field()).toHaveFocus();
    });
});

describe('DatePicker, controlled and uncontrolled', () => {
    it('takes a new value from the parent, and follows a clear to an empty string', () => {
        const { rerender } = render(<DatePicker aria-label="Session date" value="2026-10-21" />);
        expect(field()).toHaveValue('10/21/2026');
        rerender(<DatePicker aria-label="Session date" value="2026-11-02" />);
        expect(field()).toHaveValue('11/02/2026');
        rerender(<DatePicker aria-label="Session date" value="" />);
        expect(field()).toHaveValue('');
    });

    it('starts on defaultValue', () => {
        render(<DatePicker aria-label="Session date" defaultValue="2026-10-21" />);
        expect(field()).toHaveValue('10/21/2026');
    });

    it('takes a valid typed date back out of an invalid state when the parent sets a value', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<DatePicker aria-label="Session date" value="" />);
        await user.type(field(), 'nope{Enter}');
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        rerender(<DatePicker aria-label="Session date" value="2026-10-21" />);
        expect(field()).toHaveValue('10/21/2026');
        expect(field()).not.toHaveAttribute('aria-invalid');
    });
});

describe('DatePicker, disabled and read-only', () => {
    it('does not open, take typing or change when disabled', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" isDisabled defaultValue="2026-10-21" onChange={onChange} />);
        expect(field()).toBeDisabled();
        await user.click(field());
        await user.keyboard('{ArrowDown}');
        expect(calendar()).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Clear session date' })).toBeNull();
    });

    it('shows the date, stays focusable and cannot be opened, typed in or cleared when read-only', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<DatePicker aria-label="Session date" isReadOnly defaultValue="2026-10-21" onChange={onChange} />);
        expect(field()).toHaveAttribute('aria-readonly', 'true');
        await user.tab();
        expect(field()).toHaveFocus();
        await user.keyboard('{ArrowDown}1{Enter}');
        await user.click(field());
        expect(calendar()).toBeNull();
        expect(field()).toHaveValue('10/21/2026');
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Clear session date' })).toBeNull();
    });
});

describe('DatePicker, focus events', () => {
    it('reports focus, and reports blur after the typed text was checked', async () => {
        const user = userEvent.setup();
        const order = [];
        render(
            <DatePicker
                aria-label="Session date"
                onFocus={() => order.push('focus')}
                onChange={() => order.push('change')}
                onBlur={() => order.push('blur')}
            />,
        );
        await user.type(field(), '10/21/2026');
        await user.tab();
        expect(order).toEqual(['focus', 'change', 'blur']);
    });
});

describe('DatePicker, in a form', () => {
    it('submits under its name, and the entry is the typed MM/DD/YYYY text, not the ISO date', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <form>
                <DatePicker aria-label="Session date" name="starts" />
            </form>,
        );
        const form = container.querySelector('form');
        expect(submitted(form)).toEqual([['starts', '']]);
        await user.type(field(), '10/21/2026{Enter}');
        expect(submitted(form)).toEqual([['starts', '10/21/2026']]);
    });

    it('does not submit a disabled field', () => {
        const { container } = render(
            <form>
                <DatePicker aria-label="Session date" name="starts" isDisabled defaultValue="2026-10-21" />
            </form>,
        );
        expect(submitted(container.querySelector('form'))).toEqual([]);
    });

    it('does not submit the form when Enter commits a typed date', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <DatePicker aria-label="Session date" name="starts" />
            </form>,
        );
        await user.type(field(), '10/21/2026{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
