/**
 * StrategyBadge - Training Onboarding Element
 * 
 * Badge component showing different file/strategy types.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121913
 */

import React from 'react';
import StrategyBadge from './StrategyBadge';
import './StrategyBadge.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/StrategyBadge',
    component: StrategyBadge,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Badge component showing different file/strategy types: image, video, audio, document, book, website, other. Used to indicate content type in onboarding modules.'
            }
        }
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['image', 'video', 'audio', 'document', 'book', 'website', 'other'],
            description: 'Badge type',
            table: { category: 'Content' }
        },
        showLabel: {
            control: 'boolean',
            description: 'Show label text',
            table: { category: 'Content' }
        }
    }
};

/**
 * Overview
 * Shows all strategy badge variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md, 24px)'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>All Types (Icon Only)</h6>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {['image', 'video', 'audio', 'document', 'book', 'website', 'other'].map(type => (
                        <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <StrategyBadge type={type} />
                            <span className="body3-txt" style={{ textTransform: 'capitalize' }}>{type}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>With Labels</h6>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-md, 24px)',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {['image', 'video', 'audio', 'document', 'book', 'website', 'other'].map(type => (
                        <StrategyBadge key={type} type={type} showLabel />
                    ))}
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        type: 'image',
        showLabel: false
    },
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)', 
            backgroundColor: 'var(--color-surface)' 
        }}>
            <StrategyBadge {...args} />
        </div>
    )
};
