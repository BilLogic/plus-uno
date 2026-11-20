import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TextArea from './TextArea';

/**
 * TextArea, driven the way a page uses it: through its label, typed text, the
 * keyboard and the form it sits in. The Storybook plays cover the drawn result
 * (rows, colors, focus ring); these cover what the field reports and accepts.
 */

const field = (name = 'Session notes') => screen.getByRole('textbox', { name });
const submitted = (form) => [...new FormData(form).entries()];

const Controlled = ({ start = '', ...props }) => {
    const [value, setValue] = useState(start);
    return <TextArea label="Session notes" value={value} onChange={(event) => setValue(event.target.value)} {...props} />;
};

describe('TextArea, naming', () => {
    it('is named by its label, and a hidden label still names it', () => {
        const { unmount } = render(<TextArea label="Session notes" />);
        expect(field()).toBeInTheDocument();
        unmount();
        render(<TextArea label="Notes" isLabelHidden />);
        expect(field('Notes')).toBeInTheDocument();
    });

    it('describes the field with its caption, and marks it required for assistive technology', () => {
        render(<TextArea label="Session notes" caption="Visible to your supervisor." isRequired />);
        expect(field()).toHaveAccessibleDescription('Visible to your supervisor.');
        expect(field()).toHaveAttribute('aria-required', 'true');
    });

    it('shows the placeholder and the number of rows it was given', () => {
        render(<TextArea label="Session notes" placeholder="What did you cover?" rows={6} />);
        expect(field()).toHaveAttribute('placeholder', 'What did you cover?');
        expect(field()).toHaveAttribute('rows', '6');
    });
});

describe('TextArea, typing', () => {
    it('is uncontrolled: starts from defaultValue and keeps what is typed, new lines included', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<TextArea label="Session notes" defaultValue="Slope." onChange={onChange} />);
        expect(field()).toHaveValue('Slope.');
        await user.type(field(), '{Enter}Intercepts.');
        expect(field()).toHaveValue('Slope.\nIntercepts.');
        expect(onChange).toHaveBeenCalled();
    });

    it('is controlled: shows the value the page holds', async () => {
        const user = userEvent.setup();
        render(<Controlled start="Slope." />);
        await user.type(field(), ' Done.');
        expect(field()).toHaveValue('Slope. Done.');
    });

    it('stays as it was when a controlled page refuses the edit', async () => {
        const user = userEvent.setup();
        render(<TextArea label="Session notes" value="fixed" onChange={() => {}} />);
        await user.type(field(), 'x');
        expect(field()).toHaveValue('fixed');
    });

    it('reports focus and blur', async () => {
        const user = userEvent.setup();
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        render(<TextArea label="Session notes" onFocus={onFocus} onBlur={onBlur} />);
        await user.tab();
        expect(field()).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
        await user.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('stops at maxLength and counts what is in the field, typed or controlled', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<TextArea label="Session notes" maxLength={6} />);
        await user.type(field(), 'abcdefgh');
        expect(field()).toHaveValue('abcdef');
        expect(screen.getByText('6 / 6')).toBeInTheDocument();
        unmount();
        render(<Controlled start="abc" maxLength={10} />);
        expect(screen.getByText('3 / 10')).toBeInTheDocument();
        await user.type(field(), 'de');
        expect(screen.getByText('5 / 10')).toBeInTheDocument();
    });
});

describe('TextArea, validation', () => {
    it('shows isInvalid as aria-invalid with the error message tied by aria-describedby', () => {
        render(<TextArea label="Session notes" isInvalid errorMessage="Add a little more detail." />);
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(field()).toHaveAccessibleDescription('Add a little more detail.');
        expect(screen.getByRole('alert')).toHaveTextContent('Add a little more detail.');
    });

    it('lifts the error as soon as the page stops saying invalid', async () => {
        const user = userEvent.setup();
        const Page = () => {
            const [value, setValue] = useState('short');
            return (
                <TextArea
                    label="Session notes"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    isInvalid={value.length < 10}
                    errorMessage="Add more detail."
                />
            );
        };
        render(<Page />);
        const area = field();
        expect(area).toHaveAttribute('aria-invalid', 'true');
        await user.type(area, ' and more');
        expect(area).not.toHaveAttribute('aria-invalid');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('draws a warning as a description, not as an error', () => {
        render(<TextArea label="Session notes" warningMessage="Shorter than most notes." />);
        expect(field()).not.toHaveAttribute('aria-invalid');
        expect(field()).toHaveAccessibleDescription('Shorter than most notes.');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('currently only announces isRequired: an empty required field still submits', async () => {
        // Design question: isRequired sets aria-required and never `required`, so the
        // browser does not block submit. Pages must validate themselves.
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <TextArea label="Session notes" name="notes" isRequired />
                <button type="submit">Send</button>
            </form>,
        );
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(field()).not.toHaveAttribute('required');
    });
});

describe('TextArea, disabled and read-only', () => {
    it('is disabled: not focusable, not typeable, and left out of the form', async () => {
        const user = userEvent.setup();
        render(
            <form data-testid="form">
                <TextArea label="Session notes" name="notes" defaultValue="Slope." isDisabled />
            </form>,
        );
        expect(field()).toBeDisabled();
        await user.tab();
        expect(field()).not.toHaveFocus();
        await user.type(field(), 'zzz');
        expect(field()).toHaveValue('Slope.');
        expect(submitted(screen.getByTestId('form'))).toEqual([]);
    });

    it('is read-only: focusable, readable, not editable, and still submitted', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <form data-testid="form">
                <TextArea label="Session notes" name="notes" defaultValue="Slope." isReadOnly onChange={onChange} />
            </form>,
        );
        await user.tab();
        expect(field()).toHaveFocus();
        await user.type(field(), 'zzz');
        expect(field()).toHaveValue('Slope.');
        expect(onChange).not.toHaveBeenCalled();
        expect(submitted(screen.getByTestId('form'))).toEqual([['notes', 'Slope.']]);
    });
});

describe('TextArea, in a form', () => {
    it('submits its text under its name, and Enter adds a line rather than submitting', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form data-testid="form" onSubmit={onSubmit}>
                <TextArea label="Session notes" name="notes" />
                <button type="submit">Send</button>
            </form>,
        );
        await user.type(field(), 'Slope.{Enter}Intercepts.');
        expect(onSubmit).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(submitted(screen.getByTestId('form'))).toEqual([['notes', 'Slope.\nIntercepts.']]);
    });
});

describe('TextArea, subtle (edit in place)', () => {
    const subtle = (props) => render(<TextArea label="Session notes" appearance="subtle" defaultValue="Slope." {...props} />);
    const button = (name) => screen.getByRole('button', { name });

    it('shows Save and Cancel only while editing', async () => {
        const user = userEvent.setup();
        subtle();
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        await user.click(field());
        expect(button('Save')).toBeInTheDocument();
        expect(button('Cancel')).toBeInTheDocument();
    });

    it('stays open and saves nothing when focus leaves', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        subtle({ onSave });
        await user.click(field());
        await user.type(field(), ' More.');
        await user.tab({ shift: true });
        expect(onSave).not.toHaveBeenCalled();
        expect(button('Save')).toBeInTheDocument();
    });

    it('saves with the Save button, and with Ctrl+Enter', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn(() => Promise.resolve());
        subtle({ onSave });
        await user.click(field());
        await user.type(field(), ' More.');
        await user.click(button('Save'));
        await waitFor(() => expect(onSave).toHaveBeenLastCalledWith('Slope. More.'));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Save' })).toBeNull());
        await user.click(field());
        await user.type(field(), ' Again.');
        await user.keyboard('{Control>}{Enter}{/Control}');
        await waitFor(() => expect(onSave).toHaveBeenLastCalledWith('Slope. More. Again.'));
    });

    it('cancels with the Cancel button and with Escape, and the old text returns', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        subtle({ onSave });
        await user.click(field());
        await user.type(field(), ' Scratch.');
        await user.click(button('Cancel'));
        expect(field()).toHaveValue('Slope.');
        await user.click(field());
        await user.type(field(), ' Scratch.{Escape}');
        expect(field()).toHaveValue('Slope.');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('keeps what was typed, the buttons and the error when the save fails', async () => {
        const user = userEvent.setup();
        subtle({ onSave: () => Promise.reject(new Error('Notes could not be saved.')) });
        await user.click(field());
        await user.type(field(), ' More.');
        await user.click(button('Save'));
        expect(await screen.findByRole('alert')).toHaveTextContent('Notes could not be saved.');
        expect(field()).toHaveValue('Slope. More.');
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(button('Save')).toBeInTheDocument();
    });

    it('adds a line on plain Enter instead of saving', async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        subtle({ onSave });
        await user.click(field());
        await user.type(field(), '{Enter}Next.');
        expect(field()).toHaveValue('Slope.\nNext.');
        expect(onSave).not.toHaveBeenCalled();
    });
});
