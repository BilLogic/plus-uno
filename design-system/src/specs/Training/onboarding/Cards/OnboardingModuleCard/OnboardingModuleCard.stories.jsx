/**
 * OnboardingModuleCard - Training Onboarding Card
 * 
 * Card component showing onboarding module with thumbnail/description, title, duration, badge, and status.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122003
 */

import React from 'react';
import OnboardingModuleCard from './OnboardingModuleCard';
import './OnboardingModuleCard.scss';
import '../../Elements/StrategyBadge/StrategyBadge.scss';
import '../../Elements/StatusIndicators/StatusIndicators.scss';

export default {
    title: 'Specs/Training/Onboarding/Cards/OnboardingModuleCard',
    component: OnboardingModuleCard,
    tags: ['autodocs'],
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
 * Docs
 * Documentation for OnboardingModuleCard component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>OnboardingModuleCard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Card component for displaying onboarding module information. Has two variants:
                        "thumbnail" (shows image placeholder) and "description" (shows text description area).
                        Both variants show duration, title, strategy badge, and status indicator.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>title</strong>: Module title text</li>
                        <li><strong>duration</strong>: Duration text (e.g., "9 mins")</li>
                        <li><strong>variant</strong>: "thumbnail" or "description"</li>
                        <li><strong>badgeType</strong>: Strategy badge type</li>
                        <li><strong>stage</strong>: Status indicator stage</li>
                        <li><strong>description</strong>: Description text (for description variant)</li>
                        <li><strong>imageUrl</strong>: Image URL for thumbnail</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 74-122003
                    </p>
                </section>
            </div>
        </div>
    ),
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
