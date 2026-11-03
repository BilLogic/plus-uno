import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import FieldBox from './FieldBox';
import FieldFrame, { FieldCaption, FieldLabel } from './FieldFrame';

/**
 * _FieldFrame — the part that stacks a label, a field and a caption, and
 * marks `data-invalid`/`data-dirty`/`data-touched` on Base UI's `Field.Root`.
 *
 * Unpublished in Figma and absent from the barrel: it is never placed on a
 * screen by itself, so it has stories and no docs page.
 */
export default {
    title: 'Components/Forms and inputs/_FieldFrame',
    component: FieldFrame,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Label, field and caption stacked, with the field\'s invalid/dirty/touched state on the frame.',
            },
        },
    },
};

const control = (id, extra = {}) => (
    <input id={id} className="plus-field__control" {...extra} />
);

/** The label's `htmlFor` names the control; clicking it focuses the input. */
export const LabelAssociation = () => (
    <FieldFrame>
        <FieldLabel htmlFor="label-assoc-input" required>Tutor name</FieldLabel>
        <FieldBox><input id="label-assoc-input" className="plus-field__control" /></FieldBox>
    </FieldFrame>
);

LabelAssociation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await userEvent.click(canvas.getByText('Tutor name'));
    await expect(document.activeElement).toBe(input);
};

/** A caption's message id is named by the control's `aria-describedby`. */
export const DescriptionAssociation = () => (
    <FieldFrame>
        <FieldLabel htmlFor="desc-assoc-input">Session notes</FieldLabel>
        <FieldBox>
            {control('desc-assoc-input', { 'aria-describedby': 'desc-assoc-input-message' })}
        </FieldBox>
        <FieldCaption messageId="desc-assoc-input-message" message="Visible to the tutor only." tone="help" />
    </FieldFrame>
);

DescriptionAssociation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    const message = canvas.getByText('Visible to the tutor only.');
    await expect(input.getAttribute('aria-describedby')).toBe(message.closest('[id]').id);
};

/** An invalid frame carries `data-invalid`, and the error is announced. */
export const ErrorAssociation = () => (
    <FieldFrame invalid>
        <FieldLabel htmlFor="error-assoc-input">Email</FieldLabel>
        <FieldBox invalid>
            {control('error-assoc-input', { 'aria-describedby': 'error-assoc-input-message', 'aria-invalid': true })}
        </FieldBox>
        <FieldCaption messageId="error-assoc-input-message" message="Enter a valid email." tone="invalid" />
    </FieldFrame>
);

ErrorAssociation.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvasElement.querySelector('.plus-field-stack');
    await expect(frame.getAttribute('data-invalid')).not.toBeNull();
    const error = canvas.getByRole('alert');
    await expect(error).toHaveTextContent('Enter a valid email.');
};
