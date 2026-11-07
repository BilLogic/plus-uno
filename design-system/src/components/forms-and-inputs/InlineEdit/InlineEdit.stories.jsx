import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import InlineEdit from './InlineEdit';
import InlineEditableTextfield from '../InlineEditableTextfield';

/**
 * `InlineEdit` and `InlineEditableTextfield`: text that becomes a field when pressed.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser and assert what a person could observe: that Enter and
 * leaving the field confirm and Escape cancels, that a refused value keeps the
 * editor open with its message, that the buttons can be left off, and that the
 * read view and the edit view are the same height in every color mode.
 */

export default {
    title: 'Components/Forms and inputs/Inline edit',
    component: InlineEdit,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A read view that opens into an edit view when pressed, at the same size so nothing moves. '
                    + 'Enter or leaving the field confirms; Escape cancels. Not for use inside a form.',
            },
        },
    },
};

const column = { display: 'flex', flexDirection: 'column', gap: 'var(--space-200)', maxWidth: 'var(--width-2500)' };

const height = (el) => Math.round(el.getBoundingClientRect().height);

/** A confirm that takes a moment, as a save does. */
const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 80));

/* ----------------------------------------------------------- the textfield */

export const Textfield = (args) => (
    <div style={column}>
        <InlineEditableTextfield
            label="Display name"
            defaultValue="Ada Lovelace"
            onConfirm={args.onConfirm}
            onCancel={args.onCancel}
        />
    </div>
);
Textfield.args = { onConfirm: fn(), onCancel: fn() };

Textfield.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // The read view is a button named by the label and the text.
    const read = canvas.getByRole('button', { name: 'Display name Ada Lovelace' });
    await expect(canvas.queryByRole('textbox')).toBeNull();

    // Pressing it opens the field, with the text in it and the caret there.
    await userEvent.click(read);
    const field = canvas.getByRole('textbox', { name: 'Display name' });
    await expect(field).toHaveValue('Ada Lovelace');
    await expect(field).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Confirm' })).toBeTruthy();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeTruthy();

    // Enter confirms, closes the field and puts the focus back on the read view.
    await userEvent.type(field, ' King{Enter}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledWith('Ada Lovelace King');
    const again = canvas.getByRole('button', { name: 'Display name Ada Lovelace King' });
    await expect(again).toHaveFocus();

    // Escape cancels and keeps the old text.
    await userEvent.click(again);
    await userEvent.type(canvas.getByRole('textbox'), ' Byron{Escape}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('button', { name: 'Display name Ada Lovelace King' })).toHaveFocus();

    // The confirm button confirms; the cancel button cancels.
    await userEvent.click(canvas.getByRole('button', { name: 'Display name Ada Lovelace King' }));
    await userEvent.type(canvas.getByRole('textbox'), '!');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Display name Ada Lovelace King!' })).toBeTruthy());
    await expect(args.onConfirm).toHaveBeenLastCalledWith('Ada Lovelace King!');

    await userEvent.click(canvas.getByRole('button', { name: 'Display name Ada Lovelace King!' }));
    await userEvent.type(canvas.getByRole('textbox'), 'x');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Display name Ada Lovelace King!' })).toBeTruthy());
    await expect(args.onCancel).toHaveBeenCalledTimes(2);
};

/* --------------------------------------------------------- leaving confirms */

export const LeavingConfirms = (args) => (
    <div style={column}>
        <InlineEditableTextfield label="Nickname" defaultValue="Ada" onConfirm={args.onConfirm} />
        <button type="button">Somewhere else</button>
    </div>
);
LeavingConfirms.args = { onConfirm: fn() };

LeavingConfirms.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Nickname Ada' }));
    await userEvent.type(canvas.getByRole('textbox'), 'm');
    await userEvent.click(canvas.getByRole('button', { name: 'Somewhere else' }));
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledWith('Adam');
    await expect(canvas.getByRole('button', { name: 'Nickname Adam' })).toBeTruthy();
    // Focus went where the person sent it, not back to the read view.
    await expect(canvas.getByRole('button', { name: 'Somewhere else' })).toHaveFocus();
};

/* ------------------------------------------------------------ keep it open */

export const KeepOpenOnBlur = (args) => (
    <div style={column}>
        <InlineEditableTextfield
            label="Bio"
            defaultValue="Tutor"
            keepEditViewOpenOnBlur
            onConfirm={args.onConfirm}
        />
        <button type="button">Somewhere else</button>
    </div>
);
KeepOpenOnBlur.args = { onConfirm: fn() };

KeepOpenOnBlur.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Bio Tutor' }));
    await userEvent.type(canvas.getByRole('textbox'), 's');
    await userEvent.click(canvas.getByRole('button', { name: 'Somewhere else' }));
    // Leaving did not confirm.
    await expect(canvas.getByRole('textbox')).toHaveValue('Tutors');
    await expect(args.onConfirm).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledWith('Tutors');
};

/* -------------------------------------------------------------- validation */

const refuse = (value) => (value.trim() ? undefined : 'Enter a name.');

export const Validation = (args) => (
    <div style={column}>
        <InlineEditableTextfield
            label="Course name"
            defaultValue="Algebra I"
            validate={refuse}
            onConfirm={args.onConfirm}
        />
    </div>
);
Validation.args = { onConfirm: fn() };

Validation.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Course name Algebra I' }));
    const field = canvas.getByRole('textbox', { name: 'Course name' });
    await userEvent.clear(field);
    await userEvent.keyboard('{Enter}');

    // The value is refused: the field stays open, marked invalid, with the message.
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Enter a name.'));
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onConfirm).not.toHaveBeenCalled();

    // Typing clears the message.
    await userEvent.type(field, 'Geometry');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledWith('Geometry');
};

export const FailedConfirm = () => (
    <div style={column}>
        <InlineEditableTextfield
            label="Email"
            defaultValue="ada@example.com"
            onConfirm={async () => { await later(); throw new Error('That address is taken.'); }}
        />
    </div>
);

FailedConfirm.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Email ada@example.com' }));
    await userEvent.type(canvas.getByRole('textbox'), 'm{Enter}');
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('That address is taken.'));
    // It stays open and keeps what was typed.
    await expect(canvas.getByRole('textbox')).toHaveValue('ada@example.comm');
};

/* ------------------------------------------------------------ no buttons */

export const WithoutButtons = (args) => (
    <div style={column}>
        <InlineEditableTextfield
            label="Title"
            defaultValue="Warm-up"
            hideActionButtons
            onConfirm={args.onConfirm}
        />
    </div>
);
WithoutButtons.args = { onConfirm: fn() };

WithoutButtons.play = async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Title Warm-up' }));
    await expect(canvas.queryByRole('button', { name: 'Confirm' })).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Cancel' })).toBeNull();
    await userEvent.type(canvas.getByRole('textbox'), ' up{Enter}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    await expect(args.onConfirm).toHaveBeenCalledWith('Warm-up up');
};

/* ------------------------------------------------------------ start open */

export const StartsOpen = () => (
    <div style={column}>
        <InlineEditableTextfield label="Session title" defaultValue="Fractions" startWithEditViewOpen />
    </div>
);

StartsOpen.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Session title' });
    await expect(field).toHaveValue('Fractions');
    await expect(field).toHaveFocus();
};

/* -------------------------------------------------- same height, both views */

export const SameHeight = () => (
    <div style={column}>
        <InlineEditableTextfield label="Regular" defaultValue="Ada Lovelace" />
        <InlineEditableTextfield label="Compact" defaultValue="Ada Lovelace" compact />
    </div>
);

SameHeight.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const measure = async (name, expected) => {
        const read = canvas.getByRole('button', { name });
        const readBox = read.getBoundingClientRect();
        await expect(Math.round(readBox.height)).toBe(expected);
        await userEvent.click(read);
        const field = canvas.getByRole('textbox').closest('.plus-field');
        const fieldBox = field.getBoundingClientRect();
        // Same height, same left edge, same top edge: nothing moved.
        await expect(Math.round(fieldBox.height)).toBe(expected);
        await expect(Math.round(fieldBox.left)).toBe(Math.round(readBox.left));
        await expect(Math.round(fieldBox.top)).toBe(Math.round(readBox.top));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    };

    await measure('Regular Ada Lovelace', 40);
    await measure('Compact Ada Lovelace', 32);

    // The read view's text starts where the field's text does.
    const read = canvas.getByRole('button', { name: 'Regular Ada Lovelace' });
    const readText = read.querySelector('.plus-inline-edit__text').getBoundingClientRect().left;
    await userEvent.click(read);
    const input = canvas.getByRole('textbox');
    const inputLeft = input.getBoundingClientRect().left;
    await expect(Math.round(readText)).toBe(Math.round(inputLeft));
    await userEvent.keyboard('{Escape}');

    // The sizes hold in every color mode, and the edit view is a visible box.
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        const readButton = canvas.getByRole('button', { name: 'Regular Ada Lovelace' });
        await expect(px(getComputedStyle(readButton).height), mode).toBe(40);
        await expect(getComputedStyle(readButton).borderTopColor, mode).toBe('rgba(0, 0, 0, 0)');
        await userEvent.click(readButton);
        const box = canvas.getByRole('textbox').closest('.plus-field');
        await expect(px(getComputedStyle(box).height), mode).toBe(40);
        await expect(getComputedStyle(box).borderTopColor, mode).toBe(token('--ds-border-input'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
    });
};

/** One story per spacing, for the Examples tab. */
export const SpacingDefault = () => (
    <div style={column}>
        <InlineEditableTextfield label="Display name" defaultValue="Ada Lovelace" />
    </div>
);

export const SpacingCompact = () => (
    <div style={column}>
        <InlineEditableTextfield label="Display name" defaultValue="Ada Lovelace" compact />
    </div>
);

/* ----------------------------------------------- the buttons add no height */

export const ButtonsDoNotMoveThePage = () => (
    <div style={column}>
        <InlineEditableTextfield label="Name" defaultValue="Ada" />
        <p id="below">Content below the field.</p>
    </div>
);

ButtonsDoNotMoveThePage.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const below = canvasElement.querySelector('#below');
    const before = below.getBoundingClientRect().top;
    await userEvent.click(canvas.getByRole('button', { name: 'Name Ada' }));
    await expect(canvas.getByRole('button', { name: 'Confirm' })).toBeTruthy();
    await expect(Math.round(below.getBoundingClientRect().top)).toBe(Math.round(before));
};

/* -------------------------------------------------- the general component */

export const WithAnotherEditView = () => {
    const [level, setLevel] = useState('Intermediate');
    return (
        <div style={column}>
            <InlineEdit
                label="Level"
                defaultValue={level}
                readView={() => level}
                onConfirm={(next) => setLevel(next)}
                editView={({ id, value, onChange }) => (
                    <select id={id} value={value} onChange={onChange}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </select>
                )}
            />
        </div>
    );
};

WithAnotherEditView.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Level Intermediate' }));
    const select = canvas.getByRole('combobox', { name: 'Level' });
    await expect(select).toHaveFocus();
    await userEvent.selectOptions(select, 'Advanced');
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Level Advanced' })).toBeTruthy());
};

/* --------------------------------------------------------------- placeholder */

export const Placeholder = () => (
    <div style={column}>
        <InlineEditableTextfield label="Nickname" defaultValue="" placeholder="Add a nickname" />
    </div>
);

Placeholder.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Nickname Add a nickname' })).toBeTruthy();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => (
    <div style={column}>
        <InlineEditableTextfield {...args} />
    </div>
);
Interactive.args = {
    label: 'Display name',
    defaultValue: 'Ada Lovelace',
    placeholder: 'Add a name',
    compact: false,
    keepEditViewOpenOnBlur: false,
    hideActionButtons: false,
    readViewFitContainerWidth: false,
};
