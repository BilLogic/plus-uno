import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TextField from './TextField';

/**
 * TextField, driven the way a page uses it: through its label, typed text, the
 * keyboard and the form it sits in. The Storybook plays cover the drawn result
 * (colors, sizes, slots); these cover what the field reports and accepts.
 */

const field = (name = 'Email') => screen.getByRole('textbox', { name });
const submitted = (form) => [...new FormData(form).entries()];

const Controlled = ({ start = '', onChange, ...props }) => {
    const [value, setValue] = useState(start);
    return (
        <TextField
            label="Email"
            value={value}
            onChange={(event) => {
                setValue(event.target.value);
                onChange?.(event);
            }}
            {...props}
        />
    );
};

describe('TextField, naming', () => {
    it('is named by its label, and a hidden label still names it', () => {
        const { unmount } = render(<TextField label="Email" />);
        expect(field()).toBeInTheDocument();
        unmount();
        render(<TextField label="Search tutors" isLabelHidden />);
        expect(field('Search tutors')).toBeInTheDocument();
    });

    it('shows the placeholder without letting it stand in for the label', () => {
        render(<TextField label="Email" placeholder="name@school.edu" />);
        expect(field()).toHaveAttribute('placeholder', 'name@school.edu');
        expect(screen.getByLabelText('Email')).toBe(field());
    });

    it('describes the field with its caption', () => {
        render(<TextField label="Email" caption="We only use it for reminders." />);
        expect(field()).toHaveAccessibleDescription('We only use it for reminders.');
    });

    it('marks the field required for assistive technology', () => {
        render(<TextField label="Email" isRequired />);
        expect(field()).toHaveAttribute('aria-required', 'true');
    });
});

describe('TextField, typing', () => {
    it('is uncontrolled: starts from defaultValue, shows what is typed and reports each edit', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TextField label="Email" defaultValue="ada" onChange={onChange} />);
        expect(field()).toHaveValue('ada');
        await user.type(field(), '@x.edu');
        expect(field()).toHaveValue('ada@x.edu');
        expect(onChange).toHaveBeenCalledTimes(6);
        expect(onChange.mock.lastCall[0].target.value).toBe('ada@x.edu');
    });

    it('is controlled: shows the value it is given, and takes what the page keeps', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Controlled start="ada" onChange={onChange} />);
        await user.type(field(), 'm');
        expect(field()).toHaveValue('adam');
        await user.clear(field());
        expect(field()).toHaveValue('');
    });

    it('stays as it was when a controlled page refuses the edit', async () => {
        const user = userEvent.setup();
        render(<TextField label="Email" value="fixed" onChange={() => {}} />);
        await user.type(field(), 'x');
        expect(field()).toHaveValue('fixed');
    });

    it('reports focus and blur, and focus leaves on Tab', async () => {
        const user = userEvent.setup();
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        render(<TextField label="Email" onFocus={onFocus} onBlur={onBlur} />);
        await user.tab();
        expect(field()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await user.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('lets the page see a key before the field does', async () => {
        const user = userEvent.setup();
        const onKeyDown = vi.fn();
        render(<TextField label="Email" onKeyDown={onKeyDown} />);
        await user.type(field(), 'a');
        expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'a' }));
    });

    it('stops at maxLength and counts what is in the field', async () => {
        const user = userEvent.setup();
        render(<TextField label="Headline" maxLength={5} />);
        await user.type(field('Headline'), 'abcdefg');
        expect(field('Headline')).toHaveValue('abcde');
        expect(screen.getByText('5 / 5')).toBeInTheDocument();
        await user.clear(field('Headline'));
        expect(screen.getByText('0 / 5')).toBeInTheDocument();
    });

    it('hands the input to the page through inputRef', () => {
        const inputRef = React.createRef();
        render(<TextField label="Email" inputRef={inputRef} />);
        expect(inputRef.current).toBe(field());
    });
});

describe('TextField, validation', () => {
    it('shows isInvalid as aria-invalid with the error message tied by aria-describedby', () => {
        render(<TextField label="Email" isInvalid errorMessage="Enter an email like name@school.edu." />);
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(field()).toHaveAccessibleDescription('Enter an email like name@school.edu.');
        expect(screen.getByRole('alert')).toHaveTextContent('Enter an email like name@school.edu.');
    });

    it('falls back to the caption when invalid with no error message', () => {
        render(<TextField label="Email" isInvalid caption="Required." />);
        expect(field()).toHaveAccessibleDescription('Required.');
    });

    it('keeps a described-by the page passed, beside its own message', () => {
        render(
            <>
                <TextField label="Email" isInvalid errorMessage="Wrong." aria-describedby="page-note" />
                <p id="page-note">Used for reminders</p>
            </>,
        );
        expect(field()).toHaveAccessibleDescription(expect.stringContaining('Used for reminders'));
        expect(field()).toHaveAccessibleDescription(expect.stringContaining('Wrong.'));
    });

    it('validates on blur when the page does: the error shows after leaving and goes once fixed', async () => {
        const user = userEvent.setup();
        const Page = () => {
            const [value, setValue] = useState('');
            const [touched, setTouched] = useState(false);
            const bad = touched && !value.includes('@');
            return (
                <TextField
                    label="Email"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onBlur={() => setTouched(true)}
                    isInvalid={bad}
                    errorMessage="Enter an email."
                />
            );
        };
        render(<Page />);
        await user.type(field(), 'ada');
        expect(field()).not.toHaveAttribute('aria-invalid');
        await user.tab();
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        await user.click(field());
        await user.type(field(), '@x.edu');
        expect(field()).not.toHaveAttribute('aria-invalid');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('draws a warning as a description, not as an error', () => {
        render(<TextField label="Link" warningMessage="This link is not secure." />);
        expect(field('Link')).not.toHaveAttribute('aria-invalid');
        expect(field('Link')).toHaveAccessibleDescription('This link is not secure.');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('describes a success message too', () => {
        render(<TextField label="Link" successMessage="Link works." />);
        expect(field('Link')).toHaveAccessibleDescription('Link works.');
    });

    it('lets an error win over a warning and a success', () => {
        render(<TextField label="Link" isInvalid errorMessage="Bad." warningMessage="Hmm." successMessage="Good." />);
        expect(field('Link')).toHaveAccessibleDescription('Bad.');
    });

    it('currently only announces isRequired: an empty required field still submits', async () => {
        // Design question: isRequired sets aria-required and never `required`, so the
        // browser does not block submit. Pages must validate themselves.
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <TextField label="Email" name="email" isRequired />
                <button type="submit">Send</button>
            </form>,
        );
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(field()).not.toHaveAttribute('required');
    });
});

describe('TextField, disabled and read-only', () => {
    it('is disabled: not focusable, not typeable, and left out of the form', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <TextField label="Email" name="email" defaultValue="ada@x.edu" isDisabled />
            </form>,
        );
        expect(field()).toBeDisabled();
        await user.tab();
        expect(field()).not.toHaveFocus();
        await user.type(field(), 'zzz');
        expect(field()).toHaveValue('ada@x.edu');
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });

    it('is read-only: focusable, readable, not editable, and still submitted', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <form data-testid="form">
                <TextField label="Email" name="email" defaultValue="ada@x.edu" isReadOnly onChange={onChange} />
            </form>,
        );
        await user.tab();
        expect(field()).toHaveFocus();
        await user.type(field(), 'zzz');
        expect(field()).toHaveValue('ada@x.edu');
        expect(onChange).not.toHaveBeenCalled();
        expect(submitted(screen.getByTestId('form'))).toEqual([['email', 'ada@x.edu']]);
    });
});

describe('TextField, in a form', () => {
    it('submits its value under its name, and the Enter key submits the form', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => {
            event.preventDefault();
            return submitted(event.currentTarget);
        });
        render(
            <form onSubmit={onSubmit}>
                <TextField label="Email" name="email" />
                <button type="submit">Send</button>
            </form>,
        );
        await user.type(field(), 'ada@x.edu{Enter}');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.results[0].value).toEqual([['email', 'ada@x.edu']]);
    });

    it('submits what a controlled page holds', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <Controlled name="email" start="ada" />
            </form>,
        );
        await user.type(field(), '@x.edu');
        expect(submitted(screen.getByTestId('form'))).toEqual([['email', 'ada@x.edu']]);
    });
});

describe('TextField, number', () => {
    const number = (props) => render(<TextField label="Grade" type="number" {...props} />);
    const input = () => screen.getByRole('textbox', { name: 'Grade' });
    const press = (name) => userEvent.click(screen.getByRole('button', { name: `${name} Grade` }));

    it('steps up and down by step, and reports each as a change', async () => {
        const onChange = vi.fn();
        number({ defaultValue: 5, step: 2, onChange });
        await press('Increase');
        expect(input()).toHaveValue('7');
        await press('Decrease');
        await press('Decrease');
        expect(input()).toHaveValue('3');
        expect(onChange).toHaveBeenLastCalledWith({ target: { name: undefined, value: '3', type: 'number' } });
    });

    it('starts from 0 when empty: empty is not 0', async () => {
        number({});
        expect(input()).toHaveValue('');
        await press('Increase');
        expect(input()).toHaveValue('1');
    });

    it('stops the steppers at min and max', async () => {
        number({ defaultValue: 9, min: 8, max: 10 });
        await press('Increase');
        expect(screen.getByRole('button', { name: 'Increase Grade' })).toBeDisabled();
        await press('Decrease');
        await press('Decrease');
        expect(input()).toHaveValue('8');
        expect(screen.getByRole('button', { name: 'Decrease Grade' })).toBeDisabled();
    });

    it('keeps a typed value until focus leaves, then clamps it to the bounds', async () => {
        const user = userEvent.setup();
        number({ min: 1, max: 12 });
        await user.type(input(), '40');
        expect(input()).toHaveValue('40');
        await user.tab();
        expect(input()).toHaveValue('12');
    });

    it('adds decimals without float noise', async () => {
        number({ defaultValue: 0.1, step: 0.2 });
        await press('Increase');
        expect(input()).toHaveValue('0.3');
    });

    it('hides the steppers when read-only and disables them when disabled', () => {
        const { unmount } = number({ defaultValue: 4, isReadOnly: true });
        expect(screen.queryByRole('button')).toBeNull();
        unmount();
        number({ defaultValue: 4, isDisabled: true });
        expect(screen.getByRole('button', { name: 'Increase Grade' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Decrease Grade' })).toBeDisabled();
    });
});

describe('TextField, subtle (edit in place)', () => {
    it('saves on Enter, and shows the saved value', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn(() => Promise.resolve());
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th grade" onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.clear(field('Grade level'));
        await user.type(field('Grade level'), '9th grade{Enter}');
        await waitFor(() => expect(onSave).toHaveBeenCalledWith('9th grade'));
        await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
        expect(field('Grade level')).toHaveValue('9th grade');
    });

    it('saves on blur', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th" onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.type(field('Grade level'), '!');
        await user.tab();
        await waitFor(() => expect(onSave).toHaveBeenCalledWith('8th!'));
    });

    it('cancels on Escape: the old text returns and nothing is saved', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th" onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.type(field('Grade level'), 'xyz{Escape}');
        expect(field('Grade level')).toHaveValue('8th');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('does not save an unchanged value', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th" onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.tab();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('keeps what was typed and shows the error when the save fails', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn(() => Promise.reject(new Error('Could not save.')));
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th" onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.type(field('Grade level'), '!{Enter}');
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not save.');
        expect(field('Grade level')).toHaveValue('8th!');
        expect(field('Grade level')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not edit in place when read-only', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        render(<TextField label="Grade level" appearance="subtle" defaultValue="8th" isReadOnly onSave={onSave} />);
        await user.click(field('Grade level'));
        await user.keyboard('x{Enter}');
        expect(field('Grade level')).toHaveValue('8th');
        expect(onSave).not.toHaveBeenCalled();
    });
});
