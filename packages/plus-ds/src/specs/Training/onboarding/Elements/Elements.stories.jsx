/**
 * Training/Onboarding Specs - Elements Overview
 * 
 * Element-level components for onboarding.
 * Each element has its own subfolder with component, styles, and stories.
 * 
 * Components:
 * - StatusIndicators: Status indicator icons (not started, in progress, completed)
 * - StrategyBadge: File/strategy type badge (image, video, audio, document, book, website, other)
 * - CtaButtons: Call-to-action buttons (Get Started, Continue, Review)
 * - DropdownListOptions: Dropdown menu with sorting options
 * - SortingDropdown: Dropdown button with open/closed states
 * - ContentBlurb: Content card with title, description, duration, and action button
 */

import React from 'react';

// Import components for overview display
import StatusIndicators from './StatusIndicators/StatusIndicators';
import StrategyBadge from './StrategyBadge/StrategyBadge';
import CtaButtons from './CtaButtons/CtaButtons';
import DropdownListOptions from './DropdownListOptions/DropdownListOptions';
import SortingDropdown from './SortingDropdown/SortingDropdown';
import ContentBlurb from './ContentBlurb/ContentBlurb';

// Import styles
import './StatusIndicators/StatusIndicators.scss';
import './StrategyBadge/StrategyBadge.scss';
import './CtaButtons/CtaButtons.scss';
import './DropdownListOptions/DropdownListOptions.scss';
import './SortingDropdown/SortingDropdown.scss';
import './ContentBlurb/ContentBlurb.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Element-level components for Training Onboarding interface.
                
Each element is organized in its own subfolder with dedicated component, styles, and stories files.

## Available Elements

| Element | Description | Figma Node |
|---------|-------------|------------|
| StatusIndicators | Status icons for not started/in progress/completed | 74-121906 |
| StrategyBadge | Content type badges (image, video, audio, etc.) | 74-121913 |
| CtaButtons | Action buttons based on progress state | 74-121928 |
| DropdownListOptions | Sorting menu with options | 74-121962 |
| SortingDropdown | Dropdown trigger with menu | 74-121969 |
| ContentBlurb | Module content card | 74-121991 |
`
            },
        },
    },
};

/**
 * Overview - All Elements
 * Shows all onboarding elements in a single view
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)', 
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg, 32px)'
        }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>Training Onboarding Elements</h2>
            <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Element-level components for Training Onboarding. Navigate to individual elements for detailed documentation.
            </p>

            {/* StatusIndicators */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>StatusIndicators</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Status indicator icons showing different stages: not started, in progress, completed.
                </p>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <StatusIndicators stage="not started" />
                    <StatusIndicators stage="in progress" />
                    <StatusIndicators stage="completed" />
                </div>
            </section>

            {/* StrategyBadge */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>StrategyBadge</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Badge component showing different file/strategy types.
                </p>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {['image', 'video', 'audio', 'document', 'book', 'website', 'other'].map(type => (
                        <StrategyBadge key={type} type={type} showLabel />
                    ))}
                </div>
            </section>

            {/* CtaButtons */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>CtaButtons</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    CTA button component with different states based on user progress.
                </p>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <CtaButtons state="not started" />
                    <CtaButtons state="in progress" />
                    <CtaButtons state="completed" />
                </div>
            </section>

            {/* DropdownListOptions */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>DropdownListOptions</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Dropdown menu with sorting options (name, duration, progress).
                </p>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <DropdownListOptions type="name" />
                </div>
            </section>

            {/* SortingDropdown */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)',
                minHeight: '300px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>SortingDropdown</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Dropdown button with open/closed states for sorting.
                </p>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                    <div>
                        <span className="body3-txt" style={{ display: 'block', marginBottom: '8px' }}>Closed</span>
                        <SortingDropdown isOpen={false} label="Name" />
                    </div>
                    <div>
                        <span className="body3-txt" style={{ display: 'block', marginBottom: '8px' }}>Open</span>
                        <SortingDropdown isOpen={true} label="Name" onToggle={() => {}} />
                    </div>
                </div>
            </section>

            {/* ContentBlurb */}
            <section style={{ 
                padding: 'var(--size-card-pad-y-md, 16px) var(--size-card-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 8px)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>ContentBlurb</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Content card with title, description, duration, and action button.
                </p>
                <ContentBlurb 
                    title="Competence-building Narratives"
                    description="Learn effective strategies for building student confidence."
                    duration="9 mins"
                    badgeType="image"
                />
            </section>
        </div>
    )
};
