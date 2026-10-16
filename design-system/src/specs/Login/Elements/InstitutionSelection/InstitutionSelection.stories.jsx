/**
 * InstitutionSelection - Login Element
 *
 * Dropdown states: empty · open · typing · filled.
 * Figma: Dropdown / Institution Selection — node 112:1815
 */

import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import InstitutionSelection from './InstitutionSelection';

export default {
    title: 'Specs/Login/Elements/Institution Selection',
    component: InstitutionSelection,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Institution selection dropdown with empty, open, typing, and filled states.',
            },
        },
    },
};

/**
 * Overview — all dropdown states in one spec strip. The two open lists are
 * the Select's own, filtered by what is typed, and neither covers the field
 * under it.
 */
export const Overview = {
    render: () => <InstitutionSelection />,
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);
        const fields = within(canvasElement).getAllByRole('combobox', { name: 'Select your institution' });
        await expect(fields).toHaveLength(4);
        await expect(fields[3]).toHaveValue('Aspen Heights Middle School');

        const lists = await body.findAllByRole('listbox', { name: 'Select your institution' });
        await expect(lists).toHaveLength(2);
        const [open, typing] = lists;
        await expect(within(open).getAllByRole('option')).toHaveLength(7);
        await waitFor(() => expect(within(typing).getAllByRole('option')).toHaveLength(2));

        await waitFor(() => {
            expect(open.getBoundingClientRect().bottom).toBeLessThanOrEqual(fields[2].getBoundingClientRect().top);
            expect(typing.getBoundingClientRect().bottom).toBeLessThanOrEqual(fields[3].getBoundingClientRect().top);
        });
    },
};
