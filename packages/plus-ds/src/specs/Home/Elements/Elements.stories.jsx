/**
 * Home Specs - Elements
 * 
 * Individual form elements and UI components used in home page flows.
 * 
 * Components:
 * - ResourceType: Icons for different resource types (pdf, link, video, image, slides)
 * - ProductAreaDropdown: Dropdown for selecting product area
 * - CardBadges: Badges showing increase/decrease states
 * - ButtonContainer: Button container with enabled/disabled states
 * - CertifiedTutorBadge: Hexagonal badges for certified tutors (unclaimed, claimed-v1, claimed-v2 in thumbnail/modal/full sizes)
 */

import React from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { CertifiedTutorBadge } from './CertifiedTutorBadge';

export default {
    title: 'Specs/Home/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Individual form elements and UI components used in home page flows.',
            },
        },
    },
};

/**
 * Overview
 * All home page elements.
 */
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
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '1400px', margin: '0 auto' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>Home Elements</h2>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
                Building blocks for home page cards and sections.
            </p>

            {/* Resource Type Icons */}
            <div style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Resource Type Icons</h3>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Icons for different resource types: pdf, link, video, image, slides
                </p>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                        { icon: 'file-pdf', label: 'PDF' },
                        { icon: 'link', label: 'Link' },
                        { icon: 'video', label: 'Video' },
                        { icon: 'image', label: 'Image' },
                        { icon: 'file-powerpoint', label: 'Slides' }
                    ].map(item => (
                        <div key={item.icon} style={{ textAlign: 'center' }}>
                            <i className={`fas fa-${item.icon}`} style={{ fontSize: '24px', color: 'var(--color-primary)' }} />
                            <p className="body3-txt" style={{ marginTop: '8px' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card Badges */}
            <div style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Card Badges</h3>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Badges showing metric changes and status indicators
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Badge text="+12%" style="success" />
                    <Badge text="-5%" style="danger" />
                    <Badge text="New" style="primary" />
                    <Badge text="Updated" style="info" />
                </div>
            </div>

            {/* Button Container */}
            <div style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Button Container</h3>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Action buttons for cards with different states
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button text="View Details" style="primary" />
                    <Button text="Dismiss" style="ghost" />
                    <Button text="Disabled" style="primary" disabled />
                </div>
            </div>

            {/* Certified Tutor Badges */}
            <div style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Certified Tutor Badges</h3>
                <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                    Hexagonal badges for certified tutors. All badge types and sizes available.
                </p>
                
                {badgeTypes.map(badgeType => (
                    <div key={badgeType.type} style={{ marginBottom: '32px' }}>
                        <h6 className="h6" style={{ marginBottom: '12px', fontSize: '14px' }}>{badgeType.label}</h6>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {sizes.map(size => (
                                <div key={size.size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <CertifiedTutorBadge type={badgeType.type} size={size.size} />
                                    <span className="body3-txt">{size.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
