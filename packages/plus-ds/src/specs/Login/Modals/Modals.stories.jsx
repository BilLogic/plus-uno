/**
 * Login - Modals
 * Modal-level components for Login.
 *
 * Components:
 * - LoginNotificationsModal
 */
import React from 'react';

import { LoginNotificationsModal } from './index';

export default {
    title: 'Specs/Login/Modals',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Modal dialogs used in login/authentication flows. These modals provide important notifications and confirmations during the login process.',
            },
        },
    },
};

/**
 * Overview
 * Shows all Login modals and their variants.
 */
export const Overview = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
            maxWidth: '1200px',
            margin: '0 auto',
        }}
    >
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Modals
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)', maxWidth: '70ch' }}>
            Modal dialogs used in login/authentication flows. These components mirror the Figma specs for
            login notifications.
        </p>

        <div
            style={{
                backgroundColor: 'var(--color-surface-variant)',
                padding: 'var(--size-section-pad-y-md)',
                borderRadius: 'var(--size-section-radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-md)',
                alignItems: 'flex-start',
            }}
        >
            <LoginNotificationsModal type="A" />
            <LoginNotificationsModal type="B" institutionName="{Text}" />
        </div>
    </div>
);

export const LoginNotificationsModalTypeA = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface-variant)',
        }}
    >
        <LoginNotificationsModal type="A" />
    </div>
);

export const LoginNotificationsModalTypeB = () => (
    <div
        style={{
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface-variant)',
        }}
    >
        <LoginNotificationsModal type="B" institutionName="{Text}" />
    </div>
);

