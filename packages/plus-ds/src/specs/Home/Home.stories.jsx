/**
 * Home Specs Overview
 * 
 * Home organisms for dashboard and home page interfaces.
 */

import React from 'react';

export default {
    title: 'Specs/Home',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Home organisms for dashboard and home page interfaces. Components organized by: Elements, Cards, Tables, Sections, Modals, Pages.',
            },
        },
    },
};

/**
 * Overview
 * Home specs organization.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Home Organisms
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Home organisms combine multiple components for dashboard and home page experiences.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
                { title: 'Elements', items: ['ResourceType', 'ProductAreaDropdown', 'CardBadges', 'ButtonContainer'] },
                { title: 'Cards', items: ['OverviewCard', 'MetricsCard', 'ResourceCard', 'DataVisualization', 'RecommendedLessons', 'TrainingProgressCard'] },
                { title: 'Tables', items: ['(To be added)'] },
                { title: 'Sections', items: ['HomepageJumbotron', 'BottomDiv'] },
                { title: 'Modals', items: ['UserFeedbackModal'] },
                { title: 'Pages', items: ['HomePage', 'SkillsOverview'] }
            ].map(section => (
                <section key={section.title} style={{
                    padding: '24px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>{section.title}</h4>
                    <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                        {section.items.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    </div>
);
