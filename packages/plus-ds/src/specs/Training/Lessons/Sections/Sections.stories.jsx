/**
 * Training → Lessons → Sections
 * 
 * Section components for the Training Lessons specification.
 * 3 sections matching Figma design system exactly.
 */

import React from 'react';

// Import section components for preview
import StudentOverviewSection from './StudentOverviewSection/StudentOverviewSection';
import CompetencyHeaderSection from './CompetencyHeaderSection/CompetencyHeaderSection';
import WelcomeRowSection from './WelcomeRowSection/WelcomeRowSection';

export default {
    title: 'Specs/Training/Lessons/Sections',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Section components for Training Lessons. 3 total sections matching Figma design system exactly.',
            },
        },
    },
};

const sections = [
    { 
        name: 'StudentOverviewSection', 
        desc: '"My Students" section with table showing student name, status, and focus area',
        figmaNode: '686-296266'
    },
    { 
        name: 'CompetencyHeaderSection', 
        desc: '"Students Overview" section with horizontal scrollable cards',
        figmaNode: '63-178172'
    },
    { 
        name: 'WelcomeRowSection', 
        desc: 'Welcome section with tabs and jumbotron content',
        figmaNode: '63-178182'
    },
];

export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)', maxWidth: '900px' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                Training → Lessons → Sections
            </h2>
            <p className="body2-txt" style={{ marginBottom: 'var(--size-section-gap-lg, 32px)' }}>
                3 section-level components for the Training Lessons specification. Each section matches its Figma design exactly.
            </p>

            <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-card-gap-md, 16px)' 
            }}>
                {sections.map(item => (
                    <div key={item.name} style={{ 
                        padding: 'var(--size-card-pad-sm, 16px)', 
                        backgroundColor: 'var(--color-surface-container)', 
                        borderRadius: 'var(--size-element-radius-md, 8px)',
                        border: '1px solid var(--color-outline-variant)'
                    }}>
                        <span className="body1-txt" style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            {item.name}
                        </span>
                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '8px' }}>
                            {item.desc}
                        </span>
                        <span className="body3-txt" style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            Figma: {item.figmaNode}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    ),
};

export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-xl, 48px)'
        }}>
            {/* WelcomeRowSection */}
            <section>
                <h3 className="h4" style={{ marginBottom: '16px' }}>WelcomeRowSection</h3>
                <WelcomeRowSection />
            </section>
            
            {/* CompetencyHeaderSection */}
            <section>
                <h3 className="h4" style={{ marginBottom: '16px' }}>CompetencyHeaderSection</h3>
                <CompetencyHeaderSection />
            </section>
            
            {/* StudentOverviewSection */}
            <section>
                <h3 className="h4" style={{ marginBottom: '16px' }}>StudentOverviewSection</h3>
                <StudentOverviewSection />
            </section>
        </div>
    ),
};
