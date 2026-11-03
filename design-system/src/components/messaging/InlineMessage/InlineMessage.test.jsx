import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import InlineMessage from './InlineMessage';

describe('InlineMessage', () => {
    it('uses the label as the trigger\'s accessible name and tooltip', () => {
        render(<InlineMessage label="More information">Details.</InlineMessage>);
        const trigger = screen.getByRole('button', { name: 'More information' });
        expect(trigger).toHaveAttribute('title', 'More information');
    });

    it('opens a popup with the title, secondary text and children', async () => {
        render(
            <InlineMessage label="More information" title="Why this matters" secondaryText="Try another.">
                The body of the message.
            </InlineMessage>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'More information' }));
        await waitFor(() => expect(screen.getByText('Why this matters')).toBeInTheDocument());
        expect(screen.getByText('Try another.')).toBeInTheDocument();
        expect(screen.getByText('The body of the message.')).toBeInTheDocument();
    });

    it('draws the appearance glyph', () => {
        const { container, rerender } = render(<InlineMessage appearance="warning" label="Warning info">Message</InlineMessage>);
        expect(container.querySelector('i')).toHaveClass('fa-solid', 'fa-triangle-exclamation');
        rerender(<InlineMessage appearance="danger" label="Danger info">Message</InlineMessage>);
        expect(container.querySelector('i')).toHaveClass('fa-circle-exclamation');
    });
});
