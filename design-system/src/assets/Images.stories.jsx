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

export const TutorBadges = () => {
    const assets = [
        // Unclaimed Badges
        {
            name: 'Unclaimed Badge - Thumbnail',
            file: '/assets/images/tutor-badges/unclaimed-v1-thumbnail.png',
            description: 'Thumbnail version of the unclaimed tutor badge placeholder.',
            category: 'Unclaimed'
        },
        {
            name: 'Unclaimed Badge - Modal',
            file: '/assets/images/tutor-badges/unclaimed-v1-modal.png',
            description: 'Modal version of the unclaimed tutor badge placeholder.',
            category: 'Unclaimed'
        },
        {
            name: 'Unclaimed Badge - Full',
            file: '/assets/images/tutor-badges/unclaimed-v1-full.png',
            description: 'Full-size version of the unclaimed tutor badge placeholder.',
            category: 'Unclaimed'
        },
        // Claimed Badges V1
        {
            name: 'Claimed Badge V1 - Thumbnail',
            file: '/assets/images/tutor-badges/claimed-v1-thumbnail.png',
            description: 'Thumbnail version of the claimed tutor badge (Version 1).',
            category: 'Claimed V1'
        },
        {
            name: 'Claimed Badge V1 - Modal',
            file: '/assets/images/tutor-badges/claimed-v1-modal.png',
            description: 'Modal version of the claimed tutor badge (Version 1).',
            category: 'Claimed V1'
        },
        {
            name: 'Claimed Badge V1 - Full',
            file: '/assets/images/tutor-badges/claimed-v1-full.png',
            description: 'Full-size version of the claimed tutor badge (Version 1).',
            category: 'Claimed V1'
        },
        // Claimed Badges V2
        {
            name: 'Claimed Badge V2 - Thumbnail',
            file: '/assets/images/tutor-badges/claimed-v2-thumbnail.png',
            description: 'Thumbnail version of the claimed tutor badge (Version 2).',
            category: 'Claimed V2'
        },
        {
            name: 'Claimed Badge V2 - Modal',
            file: '/assets/images/tutor-badges/claimed-v2-modal.png',
            description: 'Modal version of the claimed tutor badge (Version 2).',
            category: 'Claimed V2'
        },
        {
            name: 'Claimed Badge V2 - Full',
            file: '/assets/images/tutor-badges/claimed-v2-full.png',
            description: 'Full-size version of the claimed tutor badge (Version 2).',
            category: 'Claimed V2'
        },
    ];

    const categories = ['Unclaimed', 'Claimed V1', 'Claimed V2'];

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Badge Images</h2>
            <p className="body1-txt" style={{ marginBottom: '32px' }}>
                Badge images for tutor certification status. These are used to display tutor certification badges in various contexts (thumbnail, modal, and full-size).
            </p>

            {categories.map(category => {
                const categoryAssets = assets.filter(asset => asset.category === category);
                return (
                    <div key={category} style={{ marginBottom: '48px' }}>
                        <h3 className="h3" style={{ marginBottom: '24px' }}>{category} Badges</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '24px'
                        }}>
                            {categoryAssets.map(asset => (
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
                                        width: '100%',
                                        minHeight: '150px',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-outline-variant)',
                                        padding: '16px'
                                    }}>
                                        <img 
                                            src={asset.file} 
                                            alt={asset.name} 
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: '100%',
                                                objectFit: 'contain'
                                            }} 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div style="color: var(--color-on-surface-variant); text-align: center;">Image not found</div>';
                                            }}
                                        />
                                    </div>
                                    <div className="body1-txt">{asset.name}</div>
                                    <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{asset.file}</code>
                                    <p className="body2-txt">{asset.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
