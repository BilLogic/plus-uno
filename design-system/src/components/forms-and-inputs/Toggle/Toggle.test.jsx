import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Toggle from './Toggle';

/**
 * Toggle, driven the way a page uses it: through its label, the click, the
 * keyboard and the form it sits in. The Storybook plays cover the drawn result
 * (track colors, focus ring, motion); these cover what the switch reports.
 */

const toggle = (name = 'Session reminders') => screen.getByRole('switch', { name });
const submitted = (form) => [...new FormData(form).entries()];

const Controlled = ({ start = false, onChange, ...props }) => {
    const [on, setOn] = useState(start);
    return (
        <Toggle
            label="Session reminders"
            isChecked={on}
            onChange={(event) => {
                setOn(event.target.checked);
                onChange?.(event);
            }}
            {...props}
        />
    );
};

describe('Toggle, naming', () => {
    it('is named by its label, and by aria-label when the label sits elsewhere', () => {
        const { unmount } = render(<Toggle label="Session reminders" />);
        expect(toggle()).toBeInTheDocument();
        unmount();
        render(<Toggle aria-label="Session reminders" />);
        expect(toggle()).toBeInTheDocument();
    });

    it('is switched by clicking its label', async () => {
        const user = userEvent.setup();
        render(<Toggle label="Session reminders" />);
        await user.click(screen.getByText('Session reminders'));
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });

    it('keeps a described-by the page passes', () => {
        render(
            <>
                <Toggle label="Session reminders" aria-describedby="why" />
                <p id="why">Sent the evening before</p>
            </>,
        );
        expect(toggle()).toHaveAccessibleDescription('Sent the evening before');
    });
});

describe('Toggle, switching', () => {
    it('is uncontrolled: starts off, or from defaultChecked, and flips on click', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Toggle label="Session reminders" />);
        expect(toggle()).toHaveAttribute('aria-checked', 'false');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'false');
        unmount();
        render(<Toggle label="Session reminders" defaultChecked />);
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });

    it('reports name, value and the new state in the shape of a change event', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Toggle label="Session reminders" name="reminders" value="yes" onChange={onChange} />);
        await user.click(toggle());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'reminders', value: 'yes', checked: true } });
        await user.click(toggle());
        expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'reminders', value: 'yes', checked: false } });
    });

    it('is controlled: shows what the page holds', async () => {
        const user = userEvent.setup();
        render(<Controlled />);
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'false');
    });

    it('stays as it was when a controlled page refuses the change, though it reports it', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Toggle label="Session reminders" isChecked onChange={onChange} />);
        await user.click(toggle());
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ checked: false }) }));
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });

    it('follows isChecked when the page changes it from outside', () => {
        const { rerender } = render(<Toggle label="Session reminders" isChecked={false} onChange={() => {}} />);
        expect(toggle()).toHaveAttribute('aria-checked', 'false');
        rerender(<Toggle label="Session reminders" isChecked onChange={() => {}} />);
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });
});

describe('Toggle, keyboard', () => {
    it('takes focus with Tab, switches with Space, and leaves with Tab', async () => {
        const user = userEvent.setup();
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        render(<Toggle label="Session reminders" onFocus={onFocus} onBlur={onBlur} />);
        await user.tab();
        expect(toggle()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await user.keyboard(' ');
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        await user.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('currently switches with Enter as well as Space', async () => {
        // Design question: the switch pattern requires Space and leaves Enter optional;
        // Base UI's Switch is a button, so Enter flips it. Pinned so a change is seen.
        const user = userEvent.setup();
        render(<Toggle label="Session reminders" />);
        await user.tab();
        await user.keyboard('{Enter}');
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });

    it('is a stop in the tab order for each toggle, in page order', async () => {
        const user = userEvent.setup();
        render(
            <>
                <Toggle label="First" />
                <Toggle label="Second" />
            </>,
        );
        await user.tab();
        expect(toggle('First')).toHaveFocus();
        await user.tab();
        expect(toggle('Second')).toHaveFocus();
    });

    it('gives two toggles that share a name their own ids', () => {
        render(
            <>
                <Toggle label="First" name="same" />
                <Toggle label="Second" name="same" />
            </>,
        );
        expect(toggle('First').id).not.toBe(toggle('Second').id);
    });
});

describe('Toggle, disabled, read-only and loading', () => {
    it('is disabled: not focusable, not switchable, silent', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Toggle label="Session reminders" isDisabled onChange={onChange} />);
        await user.tab();
        expect(toggle()).not.toHaveFocus();
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'false');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('is read-only: announced read-only, focusable, and will not switch by click or key', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Toggle label="Session reminders" defaultChecked isReadOnly onChange={onChange} />);
        expect(toggle()).toHaveAttribute('aria-readonly', 'true');
        await user.tab();
        expect(toggle()).toHaveFocus();
        await user.keyboard(' ');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('is loading: says it is busy and saving, keeps its tab stop, and ignores changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Toggle label="Session reminders" defaultChecked isLoading onChange={onChange} />);
        expect(toggle()).toHaveAttribute('aria-busy', 'true');
        expect(toggle()).not.toHaveAttribute('aria-readonly');
        expect(screen.getByText('Saving')).toBeInTheDocument();
        await user.tab();
        expect(toggle()).toHaveFocus();
        await user.keyboard(' ');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('takes changes again once loading stops', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Toggle label="Session reminders" isLoading />);
        rerender(<Toggle label="Session reminders" />);
        expect(toggle()).not.toHaveAttribute('aria-busy');
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
    });
});

describe('Toggle, in a form', () => {
    it('submits its value under its name when on, and nothing when off', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <Toggle label="Session reminders" name="reminders" />
            </form>,
        );
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
        await user.click(toggle());
        expect(submitted(screen.getByTestId('form'))).toEqual([['reminders', 'on']]);
        await user.click(toggle());
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });

    it('submits the value it was given', () => {
        render(
            <form data-testid="form">
                <Toggle label="Session reminders" name="reminders" value="yes" defaultChecked />
            </form>,
        );
        expect(submitted(screen.getByTestId('form'))).toEqual([['reminders', 'yes']]);
    });

    it('leaves a disabled toggle out of the form', () => {
        render(
            <form data-testid="form">
                <Toggle label="Session reminders" name="reminders" defaultChecked isDisabled />
            </form>,
        );
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });

    it('is disabled by a fieldset around it: not switchable, and left out of the form', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <fieldset disabled>
                    <Toggle label="Session reminders" name="reminders" defaultChecked />
                </fieldset>
            </form>,
        );
        await user.click(toggle());
        expect(toggle()).toHaveAttribute('aria-checked', 'true');
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });

    it('does not submit the form by itself when switched', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <Toggle label="Session reminders" name="reminders" />
            </form>,
        );
        await user.click(toggle());
        await user.keyboard(' ');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('is reset with the form', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <Toggle label="Session reminders" name="reminders" />
                <button type="reset">Reset</button>
            </form>,
        );
        await user.click(toggle());
        await user.click(screen.getByRole('button', { name: 'Reset' }));
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });
});
