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
 */

import React from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';

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
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>Home Elements</h2>
        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Building blocks for home page cards and sections.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
            {[
                { name: 'ResourceType', desc: 'Icons for: pdf, link, video, image, slides' },
                { name: 'ProductAreaDropdown', desc: 'Dropdown for selecting product area' },
                { name: 'CardBadges', desc: 'Increase/decrease indicator badges' },
                { name: 'ButtonContainer', desc: 'Button container with enabled/disabled states' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: '16px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-container)'
                }}>
                    <h4 className="h4">{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * ResourceType Icons
 * Icons for different resource types.
 */
export const ResourceTypeIcons = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Resource Type Icons</h6>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
);

/**
 * CardBadges
 * Badges showing metric changes.
 */
export const CardBadges = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Card Badges</h6>
        <div style={{ display: 'flex', gap: '16px' }}>
            <Badge text="+12%" style="success" />
            <Badge text="-5%" style="danger" />
            <Badge text="New" style="primary" />
            <Badge text="Updated" style="info" />
        </div>
    </div>
);

/**
 * ButtonContainer
 * Action buttons for cards.
 */
export const ButtonContainer = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Button Container</h6>
        <div style={{ display: 'flex', gap: '12px' }}>
            <Button text="View Details" style="primary" />
            <Button text="Dismiss" style="ghost" />
            <Button text="Disabled" style="primary" disabled />
        </div>
    </div>
);
