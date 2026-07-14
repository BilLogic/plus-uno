/**
 * LoginAlert - Login Element
 *
 * Primary dismissible alert for logged-out / session messages.
 * Figma: Alert — node 113:41804
 */

import React from 'react';
import LoginAlertBanner from './LoginAlert';

export default {
    title: 'Specs/Login/Elements/Login Alert',
    component: LoginAlertBanner,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Primary dismissible alert used above the login portal header.',
            },
        },
    },
};

/**
 * Overview — default logged-out message.
 */
export const Overview = {
    render: () => (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                maxWidth: '546px',
            }}
        >
            <h6
                className="h6"
                style={{ marginBottom: 'var(--size-section-pad-y-md)' }}
            >
                Login Alert
            </h6>
            <LoginAlertBanner>You have been logged out.</LoginAlertBanner>
        </div>
    ),
};
