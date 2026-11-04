import React from 'react';

import Button from '@/components/forms-and-inputs/Button';

/**
 * Non-interactive spec strip for login action buttons (enabled and disabled).
 *
 * @returns {React.ReactElement}
 */
export default function LoginButtons() {
    return (
        <div
            style={{
                padding: 'var(--size-section-pad-y-lg)',
                maxWidth: '560px',
            }}
        >
            <h6 className="h6" style={{ marginBottom: '16px' }}>Login Action Buttons</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Button
                    text="Try a demo"
                    shouldFitContainer
                />

                <Button
                    text="Back to log in portal"
                    shouldFitContainer
                />

                <Button
                    text="Continue"
                    shouldFitContainer
                />

                <div
                    style={{
                        backgroundColor: 'var(--ds-background-disabled)',
                        borderRadius: 'var(--radius-md)',
                        opacity: 'var(--color-disabled-opacity)',
                    }}
                >
                    <Button
                        text="Continue"
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
                    />
                </div>

                <Button
                    text="Log in"
                    appearance="primary"
                    shouldFitContainer
                />

                <div
                    style={{
                        backgroundColor: 'var(--ds-background-disabled)',
                        borderRadius: 'var(--radius-md)',
                        opacity: 'var(--color-disabled-opacity)',
                    }}
                >
                    <Button
                        text="Log in"
                        appearance="subtle"
                        shouldFitContainer
                        isDisabled
                    />
                </div>
            </div>
        </div>
    );
}
