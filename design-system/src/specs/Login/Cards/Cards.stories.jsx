/**
 * Login Specs - Cards
 *
 * Card components that contain login forms and authentication interfaces.
 * Built by composing established Login Elements + token-driven layout.
 */

import React from 'react';
import LoginPortal from './LoginPortal/LoginPortal';

export default {
    title: 'Specs/Login/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card components that contain login forms and authentication interfaces. These are complete, self-contained login experiences.',
            },
        },
    },
};

/**
 * Overview
 * All login card variants.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '1100px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Cards
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)', maxWidth: '70ch' }}>
            Figma-accurate login portal card variants built with existing DS components and tokens.
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
                justifyContent: 'flex-start',
            }}
        >
            <LoginPortal type="official" step="1" showAlert />
            <LoginPortal type="demo" step="1" showAlert />
            <LoginPortal type="official" step="2" />
            <LoginPortal type="official" step="3a" />
            <LoginPortal type="official" step="3b" />
        </div>
    </div>
);

export const LoginPortalOfficialStep1 = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-variant)' }}>
        <LoginPortal type="official" step="1" showAlert />
    </div>
);

export const LoginPortalDemoStep1 = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-variant)' }}>
        <LoginPortal type="demo" step="1" showAlert />
    </div>
);

export const LoginPortalOfficialStep2 = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-variant)' }}>
        <LoginPortal type="official" step="2" />
    </div>
);

export const LoginPortalOfficialStep3a = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-variant)' }}>
        <LoginPortal type="official" step="3a" />
    </div>
);

export const LoginPortalOfficialStep3b = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-variant)' }}>
        <LoginPortal type="official" step="3b" />
    </div>
);
