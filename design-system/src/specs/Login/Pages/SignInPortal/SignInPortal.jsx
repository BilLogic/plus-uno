import React from 'react';

import Logo from '@/components/_internal/Logo';
import { LoginPortal } from '@/specs/Login/Cards';

/**
 * Full-page sign-in portal matching the Figma Pages spec.
 *
 * Composes logo, Login Portal card (official · step 1), and help footer.
 *
 * @returns {React.ReactElement}
 */
export default function SignInPortal() {
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
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--size-spacing-medium-space-300)',
                    }}
                >
                    <Logo style="colored" size="S" text />
                </div>

                <LoginPortal type="official" step="1" showAlert />

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
}
