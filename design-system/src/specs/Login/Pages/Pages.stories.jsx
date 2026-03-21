/**
 * Login Specs - Pages
 * 
 * Complete page-level components for login/authentication.
 * 
 * Components:
 * - SignInPortal: Complete sign-in portal page with full login experience
 */

import React from 'react';
import Logo from '@/components/Logo';
import { LoginPortal } from '@/specs/Login/Cards';

export default {
    title: 'Specs/Login/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Complete page-level components for login/authentication. These are full-page experiences that combine multiple elements, cards, and sections.',
            },
        },
    },
};

/**
 * Overview
 * Login pages summary.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '800px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Pages
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Complete page-level components for login/authentication.
        </p>

        <div style={{
            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
            backgroundColor: 'var(--color-surface-container)'
        }}>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>SignInPortal</h4>
            <p className="body2-txt">
                Figma-accurate sign-in portal page that combines login cards and elements into a full-page experience. This is the main entry point for the login/authentication flow.
            </p>
        </div>
    </div>
);

/**
 * SignInPortal
 * Primary sign-in portal page matching the Figma spec.
 *
 * Uses:
 * - `Logo` (brand mark + wordmark)
 * - `LoginPortal` card (Specs/Login/Cards)
 *
 * Layout:
 * - Surface-container background
 * - Centered login card with alert, auth buttons, divider, and "Try a demo" action
 * - Page-level help footer text ("Need help? Contact us.")
 */
export const SignInPortal = () => {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container-low)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--size-section-gap-lg)',
                    width: '100%',
                    maxWidth: '1024px',
                }}
            >
                {/* Logo row – 64px logo + wordmark (spacing/medium/space-300) */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--size-spacing-medium-space-300)',
                    }}
                >
                    {/* Use the small logo variant; sizing details are owned by
                       the Logo component itself so the asset can be tuned
                       independently later. */}
                    <Logo style="colored" size="S" text />
                </div>

                {/* Login portal card (official / step 1) */}
                <LoginPortal type="official" step="1" showAlert />

                {/* Help footer text */}
                <div
                    className="body1-txt"
                    style={{
                        marginTop: 'var(--size-section-pad-y-lg)',
                        color: 'var(--color-on-surface)',
                        textAlign: 'center',
                    }}
                >
                    Need help?{' '}
                    <span
                        style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                            fontWeight: 'var(--font-weight-semibold)',
                        }}
                    >
                        Contact us
                    </span>
                    .
                </div>
            </div>
        </div>
    );
};

// Note: An interactive variant for SignInPortal used to live here, but the
// primary design reference is the single Figma-aligned SignInPortal page
// above. Additional interactive permutations should be documented under
// Specs/Login/Cards if needed.
