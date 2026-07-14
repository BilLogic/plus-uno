/**
 * AuthButtons - Login Element
 *
 * SSO continue buttons using dedicated auth-provider assets.
 * Figma: Button / Auths — node 113:38903
 */

import React from 'react';
import LoginAuthButtons from './AuthButtons.jsx';

export default {
    title: 'Specs/Login/Elements/Auth Buttons',
    component: LoginAuthButtons,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Authentication provider buttons (Google, Clever).',
            },
        },
    },
};

/**
 * Overview — Google and Clever provider buttons.
 */
export const Overview = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
        }}
    >
        <h6 className="h6" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Authentication Provider Buttons
        </h6>

        <div
            style={{
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-section-pad-y-md)',
                borderRadius: 'var(--size-card-radius-sm)',
                border: '1px dashed var(--color-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-md)',
                maxWidth: '420px',
            }}
        >
            <LoginAuthButtons />
        </div>
    </div>
);
