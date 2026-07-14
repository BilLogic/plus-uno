/**
 * LoginButtons - Login Element
 *
 * Primary tonal / filled actions used across portal steps.
 * Figma: Button / Misc — node 113:38836
 */

import React from 'react';
import LoginButtons from './LoginButtons';

export default {
    title: 'Specs/Login/Elements/Login Buttons',
    component: LoginButtons,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Misc login action buttons: try demo, back, continue, log in (enabled/disabled).',
            },
        },
    },
};

/**
 * Overview — all misc action button states.
 */
export const Overview = {
    render: () => <LoginButtons />,
};
