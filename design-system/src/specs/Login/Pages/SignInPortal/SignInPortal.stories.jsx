/**
 * SignInPortal - Login Page
 *
 * Full-page sign-in portal matching the Figma Pages spec.
 * Figma: Pages · Sign-in Portal — node 115:5078
 */

import React from 'react';
import SignInPortal from './SignInPortal';

export default {
    title: 'Specs/Login/Pages/Sign-in Portal',
    component: SignInPortal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Complete sign-in portal page with logo, login card, and help footer.',
            },
        },
    },
};

/**
 * Overview — official step-1 portal page.
 */
export const Overview = {
    render: () => <SignInPortal />,
};
