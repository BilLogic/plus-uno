/**
 * Training Specs Overview
 * 
 * Training organisms for lessons and onboarding interfaces.
 */

import React from 'react';

export default {
    title: 'Specs/Training',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Training organisms for lesson delivery and onboarding. Organized by: Lessons (Elements, Cards, Tables, Sections, Pages) and Onboarding (Elements, Cards, Pages).',
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
            Training organisms are specific to training interfaces. Organized by: Lessons and Onboarding.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Lessons */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Lessons</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Elements</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>Rating, LikertScale</li>
                            <li>AIIndicator, SortControl</li>
                            <li>StatusSelect</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Cards</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>LessonCard</li>
                            <li>SupervisorAlert</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Tables</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>LessonListItem (expandable)</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Sections</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>StudentOverview</li>
                            <li>WelcomeRow, CompetencyHeader</li>
                        </ul>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Pages</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>LessonsOverview, LessonDetail</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Onboarding */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Onboarding</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Elements</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>CtaButtons</li>
                            <li>StatusIndicators</li>
                            <li>StrategyBadge</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Cards</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>OnboardingAlertCard</li>
                            <li>OnboardingModuleCard</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Pages</h6>
                        <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>OnboardingOverview</li>
                            <li>OnboardingModulePage</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    </div>
);
