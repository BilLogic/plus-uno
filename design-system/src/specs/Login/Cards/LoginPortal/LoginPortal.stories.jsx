/**
 * LoginPortal - Login Card
 *
 * Figma-accurate login portal card variants built with Login Elements + token-driven layout.
 * Figma: Cards · Login Portal — node 113:42363
 */

import React from 'react';
import LoginPortal from './LoginPortal';
import './LoginPortal.scss';

export default {
    title: 'Specs/Login/Cards/Login Portal',
    component: LoginPortal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Login portal card variants: official/demo × steps 1–3b.',
            },
        },
    },
};

const variantWellStyle = {
    padding: 'var(--size-section-pad-y-lg)',
    backgroundColor: 'var(--color-surface-variant)',
};

/**
 * Overview — all portal variants in one strip.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '1100px',
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

export const OfficialStep1 = () => (
    <div style={variantWellStyle}>
        <LoginPortal type="official" step="1" showAlert />
    </div>
);

export const DemoStep1 = () => (
    <div style={variantWellStyle}>
        <LoginPortal type="demo" step="1" showAlert />
    </div>
);

export const OfficialStep2 = () => (
    <div style={variantWellStyle}>
        <LoginPortal type="official" step="2" />
    </div>
);

export const OfficialStep3a = () => (
    <div style={variantWellStyle}>
        <LoginPortal type="official" step="3a" />
    </div>
);

export const OfficialStep3b = () => (
    <div style={variantWellStyle}>
        <LoginPortal type="official" step="3b" />
    </div>
);
