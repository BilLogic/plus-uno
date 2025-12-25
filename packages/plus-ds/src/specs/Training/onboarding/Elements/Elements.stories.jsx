/**
 * Training/Onboarding Specs - Elements
 * 
 * Element-level components for onboarding.
 * 
 * Components:
 * - ContentBlurb: Text content section
 * - CtaButtons: Call-to-action buttons
 * - StatusIndicators: Progress status indicators
 * - StrategyBadge: Strategy type badge
 */

import React from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';

export default {
    title: 'Specs/Training/Onboarding/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Element-level components for onboarding interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Onboarding Elements</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'ContentBlurb', desc: 'Text content sections for onboarding steps' },
                { name: 'CtaButtons', desc: 'Call-to-action buttons (Start, Continue, Skip)' },
                { name: 'StatusIndicators', desc: 'Progress indicators (Not Started, In Progress, Complete)' },
                { name: 'StrategyBadge', desc: 'Strategy type badges' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4">{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * CtaButtons
 */
export const CtaButtons = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Call-to-Action Buttons</h6>
        <div style={{ display: 'flex', gap: '12px' }}>
            <Button text="Get Started" style="primary" />
            <Button text="Continue" style="secondary" />
            <Button text="Skip for Now" style="ghost" />
        </div>
    </div>
);

/**
 * StatusIndicators
 */
export const StatusIndicators = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Status Indicators</h6>
        <div style={{ display: 'flex', gap: '12px' }}>
            <Badge text="Not Started" style="secondary" />
            <Badge text="In Progress" style="info" />
            <Badge text="Complete" style="success" />
            <Badge text="Skipped" style="warning" />
        </div>
    </div>
);

/**
 * StrategyBadge
 */
export const StrategyBadge = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Strategy Badges</h6>
        <div style={{ display: 'flex', gap: '12px' }}>
            <Badge text="Growth Mindset" style="primary" />
            <Badge text="Active Learning" style="info" />
            <Badge text="Relationship Building" style="success" />
        </div>
    </div>
);
