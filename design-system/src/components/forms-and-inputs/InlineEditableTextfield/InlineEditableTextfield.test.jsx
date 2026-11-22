import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import InlineEditableTextfield from './InlineEditableTextfield';

describe('InlineEditableTextfield, invalid icon', () => {
    it('draws the danger icon once when a refused edit leaves the field open, and none before', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <InlineEditableTextfield
                label="Display name"
                defaultValue="Ada"
                startWithEditViewOpen
                validate={() => 'Use at least four letters.'}
            />,
        );
        expect(container.querySelector('.plus-field__invalid-icon')).toBeNull();
        await user.click(screen.getByRole('button', { name: /confirm/i }));
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true'));
        const icons = container.querySelectorAll('.plus-field__invalid-icon');
        expect(icons).toHaveLength(1);
        expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    });
});
