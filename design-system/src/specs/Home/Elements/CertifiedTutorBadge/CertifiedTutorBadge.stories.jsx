import React from 'react';
import { CertifiedTutorBadge } from './CertifiedTutorBadge';

export default {
    title: 'Specs/Home/Elements/CertifiedTutorBadge',
    component: CertifiedTutorBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export const Overview = () => {
    const badgeTypes = [
        { type: 'unclaimed', label: 'Unclaimed' },
        { type: 'claimed-v1', label: 'Claimed V1' },
        { type: 'claimed-v2', label: 'Claimed V2' }
    ];

    const sizes = [
        { size: 'thumbnail', label: 'Thumbnail' },
        { size: 'modal', label: 'Modal' },
        { size: 'full', label: 'Full' }
    ];

    return (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg)', 
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            <h2 className="h2" style={{ marginBottom: 'var(--size-section-gap-md)' }}>
                Certified Tutor Badges
            </h2>
            <p className="body2-txt" style={{ marginBottom: 'var(--size-section-gap-lg)', color: 'var(--color-on-surface-variant)' }}>
                Hexagonal badges for certified tutors. All badge types and sizes are displayed using PNG images.
            </p>

            {badgeTypes.map(badgeType => (
                <div key={badgeType.type} style={{ marginBottom: '48px' }}>
                    <h3 className="h3" style={{ marginBottom: '24px' }}>{badgeType.label} Badges</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '24px',
                        marginBottom: '32px'
                    }}>
                        {sizes.map(size => (
                            <div key={size.size} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: 'var(--color-surface-container-lowest)',
                                borderRadius: '12px',
                                padding: '24px',
                                border: '1px solid var(--color-outline-variant)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    minHeight: size.size === 'full' ? '200px' : size.size === 'modal' ? '150px' : '100px'
                                }}>
                                    <CertifiedTutorBadge type={badgeType.type} size={size.size} />
                                </div>
                                <span className="body2-txt font-weight-semibold">{size.label}</span>
                                <code style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                                    {badgeType.type} / {size.size}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

