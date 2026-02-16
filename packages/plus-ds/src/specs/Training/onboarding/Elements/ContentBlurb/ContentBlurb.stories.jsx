/**
 * ContentBlurb - Training Onboarding Element
 * 
 * Content card with title, description, duration, and action button.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121991
 */

import React from 'react';
import ContentBlurb from './ContentBlurb';
import './ContentBlurb.scss';
import '../StrategyBadge/StrategyBadge.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/ContentBlurb',
    component: ContentBlurb,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Content card with title, description, duration, and action button. Used to display onboarding module information with a call-to-action to open the module.'
            }
        }
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Content title',
            table: { category: 'Content' }
        },
        description: {
            control: 'text',
            description: 'Content description',
            table: { category: 'Content' }
        },
        duration: {
            control: 'text',
            description: 'Duration text',
            table: { category: 'Content' }
        },
        estimatedTime: {
            control: 'text',
            description: 'Estimated time (explicit format)',
            table: { category: 'Content' }
        },
        badgeType: {
            control: { type: 'select' },
            options: ['image', 'video', 'audio', 'document', 'book', 'website', 'other'],
            description: 'Strategy badge type',
            table: { category: 'Content' }
        },
        buttonText: {
            control: 'text',
            description: 'Button text',
            table: { category: 'Content' }
        },
        onButtonClick: {
            action: 'buttonClicked',
            table: { category: 'Events' }
        }
    }
};

/**
 * Docs
 * Documentation overview of the component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 24px)' }}>
            <h3 className="h3" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>ContentBlurb</h3>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                A content card component that displays module information including title, description,
                duration with strategy badge, and a call-to-action button.
            </p>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-md, 8px)' }}>Components Used</h4>
            <ul className="body2-txt">
                <li><strong>StrategyBadge</strong>: Shows content type icon</li>
                <li><strong>Button</strong>: Primary outline button with external link icon</li>
            </ul>
        </div>
    )
};

/**
 * Overview
 * Shows content blurb variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg, 32px)'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Default</h6>
                <ContentBlurb 
                    title="Competence-building Narratives"
                    description="Learn effective strategies for building student confidence through positive narratives and growth mindset approaches."
                    duration="9 mins"
                    badgeType="image"
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Video Content</h6>
                <ContentBlurb 
                    title="Introduction to Active Learning"
                    description="Watch this video to understand the core principles of active learning techniques."
                    duration="15 mins"
                    badgeType="video"
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Document Content</h6>
                <ContentBlurb 
                    title="Session Planning Guide"
                    description="Download and review this comprehensive guide for planning effective tutoring sessions."
                    duration="20 mins"
                    badgeType="document"
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Different Badge Types</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                    {['image', 'video', 'audio', 'document', 'book', 'website'].map(type => (
                        <ContentBlurb 
                            key={type}
                            title={`${type.charAt(0).toUpperCase() + type.slice(1)} Module`}
                            description={`Example ${type} content module.`}
                            duration="5 mins"
                            badgeType={type}
                        />
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
        title: 'Competence-building Narratives',
        description: 'Learn effective strategies for building student confidence through positive narratives and growth mindset approaches.',
        duration: '9 mins',
        badgeType: 'image',
        buttonText: 'Open onboarding module in a new tab'
    },
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)', 
            backgroundColor: 'var(--color-surface)' 
        }}>
            <ContentBlurb {...args} />
        </div>
    )
};
