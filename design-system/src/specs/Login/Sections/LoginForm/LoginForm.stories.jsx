import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import LoginForm from './LoginForm';

export default {
    title: 'Specs/Login/Sections/Login Form',
    component: LoginForm,
    tags: ['!dev', '!autodocs'],
};

export const Default = {};

/**
 * "Remember me" holds a yes or a no, and the fields tell a password manager
 * what they are.
 *
 * The checkbox stored the change event instead of its checked state; an
 * event is always truthy, so once ticked the box could not be cleared.
 */
export const RemembersAndAutofills = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const remember = canvas.getByRole('checkbox', { name: 'Remember me for 30 days' });
        await userEvent.click(remember);
        await expect(remember.checked).toBe(true);
        await userEvent.click(remember);
        await expect(remember.checked).toBe(false);

        await expect(canvas.getByLabelText('Email Address').getAttribute('autocomplete')).toBe('email');
        await expect(canvas.getByLabelText('Password').getAttribute('autocomplete')).toBe('current-password');
    },
};
