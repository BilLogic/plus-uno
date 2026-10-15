/**
 * AccessCodeForm - Login Element
 *
 * Required access-code field with helper caption and validation message.
 * Figma: Form / Access Code — node 113:38704
 */

import React from 'react';
import { expect, within } from 'storybook/test';
import AccessCodeFormSpec, { LoginAccessCodeField } from './AccessCodeForm';

export default {
    title: 'Specs/Login/Elements/Access Code Form',
    component: AccessCodeFormSpec,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Access-code form with default and invalid states.',
            },
        },
    },
};

/**
 * Overview — default and invalid states.
 */
export const Overview = {
    render: () => <AccessCodeFormSpec />,
};

/**
 * The access code is a one-time code, and says so: the browser or a password
 * manager can offer a code it has just received instead of the user retyping it.
 */
export const OffersOneTimeCodeAutofill = {
    render: () => <LoginAccessCodeField id="login-access-code-autofill" />,
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', { name: /Enter Your Access Code/ });
        await expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    },
};
