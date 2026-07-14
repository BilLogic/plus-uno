import React from 'react';

import Button from '@/components/actions/Button';

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
                    style="primary"
                    fill="tonal"
                    block
                />

                <Button
                    text="Back to log in portal"
                    style="primary"
                    fill="tonal"
                    block
                />

                <Button
                    text="Continue"
                    style="primary"
                    fill="tonal"
                    block
                />

                <div
                    style={{
                        backgroundColor: 'var(--color-on-surface-state-12)',
                        borderRadius: 'var(--size-element-radius-md)',
                        opacity: 'var(--color-disabled-opacity)',
                    }}
                >
                    <Button
                        text="Continue"
                        style="default"
                        fill="text"
                        block
                        disabled
                    />
                </div>

                <Button
                    text="Log in"
                    style="primary"
                    fill="filled"
                    block
                />

                <div
                    style={{
                        backgroundColor: 'var(--color-on-surface-state-12)',
                        borderRadius: 'var(--size-element-radius-md)',
                        opacity: 'var(--color-disabled-opacity)',
                    }}
                >
                    <Button
                        text="Log in"
                        style="secondary"
                        fill="text"
                        block
                        disabled
                    />
                </div>
            </div>
        </div>
    );
}
