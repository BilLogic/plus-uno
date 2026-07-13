/**
 * OnboardingModuleCard - Training Onboarding Card
 * 
 * Card component showing onboarding module with thumbnail/description, title, duration, badge, and status.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122003
 */

import React from 'react';
import OnboardingModuleCard from './OnboardingModuleCard';
import './OnboardingModuleCard.scss';
import '@/specs/Training/Onboarding/Elements/StrategyBadge/StrategyBadge.scss';
import '@/specs/Training/Onboarding/Elements/StatusIndicators/StatusIndicators.scss';

export default {
    title: 'Specs/Training/Onboarding/Cards/Onboarding Module Card',
    component: OnboardingModuleCard,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card component for displaying onboarding module information. Shows thumbnail/description area, title, duration, strategy badge, and status indicator.',
            },
        },
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Module title',
            table: { category: 'Content' },
        },
        duration: {
            control: 'text',
            description: 'Duration text',
            table: { category: 'Content' },
        },
        variant: {
            control: { type: 'select' },
            options: ['thumbnail', 'description'],
            description: 'Card variant',
            table: { category: 'Design' },
        },
        badgeType: {
            control: { type: 'select' },
            options: ['image', 'video', 'audio', 'document', 'book', 'website', 'other'],
            description: 'Strategy badge type',
            table: { category: 'Content' },
        },
        stage: {
            control: { type: 'select' },
            options: ['not started', 'in progress', 'completed'],
            description: 'Status indicator stage',
            table: { category: 'State' },
        },
        description: {
            control: 'text',
            description: 'Description text (for description variant)',
            table: { category: 'Content' },
        },
    },
};

/**
 * Overview
 * Shows card variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Thumbnail Variant - All States</h6>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <OnboardingModuleCard 
                            title="Module Title"
                            duration="9 mins"
                            variant="thumbnail"
                            badgeType="other"
                            stage="not started"
                        />
                        <span className="body3-txt">Not Started</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <OnboardingModuleCard 
                            title="Module Title"
                            duration="15 mins"
                            variant="thumbnail"
                            badgeType="video"
                            stage="in progress"
                        />
                        <span className="body3-txt">In Progress</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <OnboardingModuleCard 
                            title="Module Title"
                            duration="12 mins"
                            variant="thumbnail"
                            badgeType="document"
                            stage="completed"
                        />
                        <span className="body3-txt">Completed</span>
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Description Variant</h6>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <OnboardingModuleCard 
                        title="Module Title"
                        duration="9 mins"
                        variant="description"
                        badgeType="other"
                        stage="not started"
                        description="Add description here"
                    />
                </div>
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        title: 'Introduction to Tutoring',
        duration: '15 mins',
        variant: 'thumbnail',
        badgeType: 'video',
        stage: 'not started',
        description: 'This module covers the basics of tutoring.',
    },
    render: (args) => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <OnboardingModuleCard {...args} />
        </div>
    ),
};
