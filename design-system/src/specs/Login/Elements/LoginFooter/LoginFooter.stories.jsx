/**
 * LoginFooter - Login Element
 *
 * Page-level version / copyright / terms strip.
 * Figma: Footer — node 113:38671
 */

import React from 'react';
import LoginFooter from './LoginFooter';

export default {
    title: 'Specs/Login/Elements/Login Footer',
    component: LoginFooter,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Footer for login pages with version, copyright, and terms.',
            },
        },
    },
};

/**
 * Overview — default login footer on a surface-container well.
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Login Footer</h6>
            <LoginFooter />
        </div>
    ),
};
