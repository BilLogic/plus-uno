/**
 * Training Specs Overview
 * 
 * Training organisms for lessons and onboarding interfaces.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=108-64429
 */

import React from 'react';

export default {
    title: 'Specs/Training',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Training organisms for lesson delivery and onboarding. Uses PLUS Design System components throughout.',
            },
        },
    },
};

/**
 * Overview
 * Training specs organization.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Training Organisms
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Training organisms are built using PLUS Design System components. All pages use
            PageLayout, Card, Table, Badge, Progress, Button, and other core components.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Lessons */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 12px)',
                border: '1px solid var(--color-outline-variant)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>
                    Lessons
                    <a 
                        href="https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178289" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '12px', marginLeft: '8px', color: 'var(--color-primary)' }}
                    >
                        View in Figma →
                    </a>
                </h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Training lessons module with overview and detail pages.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ 
                        padding: '16px', 
                        backgroundColor: 'var(--color-surface)', 
                        borderRadius: 'var(--size-element-radius-md, 8px)' 
                    }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>LessonsOverviewPage</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Main lessons list with progress tracking, status filters, and navigation.
                        </p>
                    </div>
                    <div style={{ 
                        padding: '16px', 
                        backgroundColor: 'var(--color-surface)', 
                        borderRadius: 'var(--size-element-radius-md, 8px)' 
                    }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>LessonsDetailPage (5 variants)</h6>
                        <p className="body3-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>
                            Individual lesson content with variant-based rendering:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            <li className="body3-txt">P1 - Intro/Content with ratings</li>
                            <li className="body3-txt">P2 - Research Says with quotes</li>
                            <li className="body3-txt">P3 - Conclusion & Feedback</li>
                            <li className="body3-txt">P4 - Scenario/Assessment</li>
                            <li className="body3-txt">P5 - Congratulations</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Onboarding */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 12px)',
                border: '1px solid var(--color-outline-variant)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Onboarding</h4>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Onboarding module (separate specification).
                </p>
            </section>

            {/* PLUS DS Components Used */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-sm, 12px)',
                border: '1px solid var(--color-outline-variant)'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>PLUS DS Components Used</h4>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Training pages are built using these core PLUS Design System components:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['PageLayout', 'NavTabs', 'Card', 'Table', 'Badge', 'Button', 'Progress', 'Pagination', 'Alert', 'Select', 'Input'].map(comp => (
                        <span 
                            key={comp} 
                            className="body3-txt"
                            style={{ 
                                padding: '4px 12px', 
                                backgroundColor: 'var(--color-primary-container)', 
                                color: 'var(--color-primary)',
                                borderRadius: 'var(--size-element-radius-pill, 20px)' 
                            }}
                        >
                            {comp}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    </div>
);
