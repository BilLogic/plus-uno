import React from 'react';

export default {
    title: 'Assets/Images',
    tags: ['autodocs'],
};

export const AuthProviders = () => {
    const assets = [
        {
            name: 'Google Icon',
            file: '/assets/images/auth-providers/google-icon.svg',
            description: 'Google auth provider logo used for Google sign-in buttons.',
        },
        {
            name: 'Clever Image',
            file: '/assets/images/auth-providers/clever-image.png',
            description: 'Clever auth provider image used for Clever sign-in buttons.',
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Auth Provider Images</h2>
            <p className="body1-txt" style={{ marginBottom: '32px' }}>
                Static image assets for authentication providers.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px'
            }}>
                {assets.map(asset => (
                    <div key={asset.name} style={{
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        borderRadius: '12px',
                        padding: '24px',
                        border: '1px solid var(--color-outline-variant)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--color-outline-variant)'
                        }}>
                            <img src={asset.file} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        </div>
                        <div className="body1-txt">{asset.name}</div>
                        <code>{asset.file}</code>
                        <p className="body2-txt">{asset.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
