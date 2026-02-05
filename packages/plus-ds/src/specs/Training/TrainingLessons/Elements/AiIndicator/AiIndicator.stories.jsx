/**
 * AIIndicator Stories
 * 
 * AI indicator icon button component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177685
 */

import React from 'react';
import AIIndicator from './AIIndicator';
import './AIIndicator.scss';

export default {
    title: 'Specs/Training/TrainingLessons/Elements/AIIndicator',
    component: AIIndicator,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'AI indicator icon button with sparkle SVG. Used to indicate AI-powered features in lessons.',
            },
        },
    },
};

/**
 * Default
 * Default AI indicator
 */
export const Default = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <AIIndicator onClick={() => console.log('AI Indicator clicked')} />
        </div>
    )
};

/**
 * Interactive
 * Interactive AI indicator with click handler
 */
export const Interactive = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <AIIndicator
                onClick={() => alert('AI Indicator clicked!')}
            />
        </div>
    )
};

/**
 * In Context
 * AI indicator used in a lesson row context
 */
export const InContext = {
    render: () => (
        <div style={{
            padding: 'var(--size-section-pad-y-lg, 32px)',
            backgroundColor: 'var(--color-surface)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <span className="body2-txt">Lesson Title</span>
                <AIIndicator />
            </div>
        </div>
    )
};
