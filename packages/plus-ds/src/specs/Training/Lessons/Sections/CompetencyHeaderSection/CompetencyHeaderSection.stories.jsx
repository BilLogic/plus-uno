/**
 * CompetencyHeaderSection - Training Lessons Section
 * 
 * Section with "Students Overview" title and horizontal scrollable cards.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178172
 */

import React from 'react';
import CompetencyHeaderSection from './CompetencyHeaderSection';
import './CompetencyHeaderSection.scss';

export default {
    title: 'Specs/Training/Lessons/Sections/CompetencyHeaderSection',
    component: CompetencyHeaderSection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: '"Students Overview" section with horizontal scrollable cards showing Student Need, Status, Effort, and Progress.',
            },
        },
    },
    argTypes: {
        studentNeed: {
            control: 'object',
            description: 'Student need data',
            table: { category: 'Data' }
        },
        status: {
            control: 'object',
            description: 'Status data',
            table: { category: 'Data' }
        },
        effort: {
            control: 'object',
            description: 'Effort data',
            table: { category: 'Data' }
        },
        progress: {
            control: 'object',
            description: 'Progress data',
            table: { category: 'Data' }
        }
    }
};

/**
 * Docs
 * Documentation page
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>CompetencyHeaderSection</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Section with "Students Overview" title and horizontal scrollable cards showing metrics.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Section container with surface-container-low background</li>
                <li>H4 title "Students Overview"</li>
                <li>Horizontal scrollable cards container</li>
                <li>4 OverviewCards: Student Need, Status, Effort, Progress</li>
                <li>Custom scrollbar styling</li>
            </ul>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 63-178172
            </p>
        </div>
    )
};

/**
 * Overview
 * Default section with sample data
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <CompetencyHeaderSection />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <CompetencyHeaderSection
                studentNeed={args.studentNeed}
                status={args.status}
                effort={args.effort}
                progress={args.progress}
            />
        </div>
    ),
    args: {
        studentNeed: { competencyArea: 'relationships', count: 3, total: 3 },
        status: { percentage: 37.5, status: 'outstanding' },
        effort: { completed: 2, total: 10, percentage: 20 },
        progress: { completed: 2, total: 10, percentage: 20 }
    }
};
