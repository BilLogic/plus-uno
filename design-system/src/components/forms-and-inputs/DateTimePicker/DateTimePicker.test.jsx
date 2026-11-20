import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import DateTimePicker from './DateTimePicker';

const submitted = (form) => [...new FormData(form).entries()];

describe('DateTimePicker, in a form', () => {
    it('submits the date part as ISO while the field keeps the typed text', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <form>
                <DateTimePicker name="starts" label="Session start" />
            </form>,
        );
        const form = container.querySelector('form');
        const date = screen.getByRole('combobox', { name: /Date/ });
        await user.type(date, '10/21/2026{Enter}');
        expect(date).toHaveValue('10/21/2026');
        expect(submitted(form).find(([key]) => key === 'starts-date')).toEqual(['starts-date', '2026-10-21']);
    });
});
