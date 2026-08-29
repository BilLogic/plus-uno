import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import DatePicker from './DatePicker/DatePicker';

/**
 * What a day in the calendar announces itself as.
 *
 * WHY THIS FILE EXISTS (#331). Every day button carried its date number and
 * nothing else, so a screen-reader user heard "17, button" — with the month and
 * year only in a header that is not read with it, no indication of which day was
 * selected, and no indication of which day is today. Thirty-one buttons called
 * 1 to 31, in a widget whose entire job is picking one specific day.
 *
 * axe is quiet: every button has an accessible name. "17" IS a name. It is just
 * not an answer to "which day is this", which no rule can ask.
 */

export default {
    title: 'Components/Forms and inputs/Date picker day names',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #331: a day says which day it is, whether it is '
                    + 'chosen, and whether it is today.',
            },
        },
    },
};

export const DaysAnnounceTheirDate = () => {
    const [date, setDate] = useState('2026-08-17');
    return (
        <div style={{ maxWidth: '360px' }}>
            <label htmlFor="dpd-starts">Session date</label>
            <DatePicker id="dpd-starts" value={date} onChange={setDate} />
        </div>
    );
};

DaysAnnounceTheirDate.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Session date' });

    await userEvent.click(trigger);

    // The full date, not the number. The month and year travel with the day
    // rather than living in a header nothing reads alongside it. The exact
    // wording is the locale's — `toLocaleDateString` — so the assertion matches
    // loosely rather than pinning a format this component does not choose.
    const seventeenth = await waitFor(() => canvas.getByRole('button', { name: /August 17, 2026/ }));
    await expect(seventeenth).toBeTruthy();

    // Which day is chosen is in the tree, not only in the fill colour.
    await expect(seventeenth.getAttribute('aria-pressed')).toBe('true');

    const pressed = canvas.getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true');
    await expect(pressed).toHaveLength(1);

    // A different day is a day, and is not the chosen one.
    const eighteenth = canvas.getByRole('button', { name: /August 18, 2026/ });
    await expect(eighteenth.getAttribute('aria-pressed')).toBe('false');
};
