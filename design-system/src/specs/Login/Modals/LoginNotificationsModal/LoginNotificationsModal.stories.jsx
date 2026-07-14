/**
 * LoginNotificationsModal - Login Modal
 *
 * Notification modals used in login/authentication flows.
 * Figma: Modals · Notifications — node 115:4973
 */

import React from 'react';

import LoginNotificationsModal from './LoginNotificationsModal';
import './LoginNotificationsModal.scss';

export default {
    title: 'Specs/Login/Modals/Login Notifications Modal',
    component: LoginNotificationsModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Login notification modals — type A and type B variants.',
            },
        },
    },
};

const modalWellStyle = {
    padding: 'var(--size-section-pad-y-lg)',
    backgroundColor: 'var(--color-surface-variant)',
};

/**
 * Overview — type A and type B side by side.
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

export const TypeA = () => (
    <div style={modalWellStyle}>
        <LoginNotificationsModal type="A" />
    </div>
);

export const TypeB = () => (
    <div style={modalWellStyle}>
        <LoginNotificationsModal type="B" institutionName="{Text}" />
    </div>
);
