/**
 * StudentOverviewSection - Training Lessons Section
 * 
 * Section with "My Students" title, "View All" button, and student table.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=686-296266
 */

import React from 'react';
import StudentOverviewSection from './StudentOverviewSection';
import './StudentOverviewSection.scss';

export default {
    title: 'Specs/Training/Lessons/Sections/StudentOverviewSection',
    component: StudentOverviewSection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: '"My Students" section with table showing student name, status, and focus area.',
            },
        },
    },
    argTypes: {
        onViewAll: {
            action: 'viewAll',
            description: 'View All button click handler',
            table: { category: 'Actions' }
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
            <h3 className="h3" style={{ marginBottom: '16px' }}>StudentOverviewSection</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Section with "My Students" title, "View All" button, and student table showing name, status, and focus area.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Section container with surface-container-low background</li>
                <li>Header row with H4 title and "View All" text button</li>
                <li>Table with 3 columns: Student Name, Status, Focus Area</li>
                <li>Focus Area displays SMART competency badges</li>
                <li>Horizontal and vertical scrolling support</li>
            </ul>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 686-296266
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
            <StudentOverviewSection 
                onViewAll={() => console.log('View All clicked')}
            />
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
            <StudentOverviewSection
                onViewAll={() => {
                    console.log('View All clicked');
                    args.onViewAll && args.onViewAll();
                }}
            />
        </div>
    )
};
