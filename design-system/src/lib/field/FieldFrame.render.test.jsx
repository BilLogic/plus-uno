import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldCaption, FieldFrame, FieldLabel } from './index';

describe('FieldFrame, FieldLabel and FieldCaption through the field module', () => {
    it('stacks a label, a control and a caption in one frame', () => {
        const { container } = render(
            <FieldFrame>
                <FieldLabel htmlFor="name">Student</FieldLabel>
                <input id="name" />
                <FieldCaption messageId="name-msg" message="Use the roster name." />
            </FieldFrame>,
        );
        expect(container.querySelector('.plus-field-stack')).not.toBeNull();
        expect(screen.getByLabelText('Student')).toBeInTheDocument();
        expect(screen.getByText('Use the roster name.')).toBeInTheDocument();
    });

    it('marks the frame disabled, invalid and dirty from what the host reports', () => {
        const { container } = render(<FieldFrame disabled invalid dirty><input aria-label="x" /></FieldFrame>);
        const stack = container.querySelector('.plus-field-stack');
        expect(stack).toHaveClass('plus-field-stack--disabled');
        expect(stack).toHaveAttribute('data-invalid');
        expect(stack).toHaveAttribute('data-dirty');
        expect(stack).toHaveAttribute('data-disabled');
    });

    it('announces an error caption and leaves a help caption quiet', () => {
        const { rerender } = render(<FieldCaption messageId="m" message="Too short." tone="invalid" />);
        expect(screen.getByRole('alert')).toHaveTextContent('Too short.');
        rerender(<FieldCaption messageId="m" message="A hint." tone="help" />);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('renders nothing for a label with no text, and hides a hidden label visually only', () => {
        const { container, rerender } = render(<FieldLabel htmlFor="a" />);
        expect(container).toBeEmptyDOMElement();
        rerender(<FieldLabel htmlFor="a" hidden>Hidden name</FieldLabel>);
        expect(container.querySelector('label')).toHaveClass('plus-field-label--hidden');
        expect(container.querySelector('label')).toHaveTextContent('Hidden name');
    });
});
