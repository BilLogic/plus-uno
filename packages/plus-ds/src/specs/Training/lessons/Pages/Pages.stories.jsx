/**
 * Training/Lessons Specs - Pages Overview
 * 
 * Page components for lessons.
 * 
 * Components:
 * - LessonsOverviewPage: Full page with filter bar, lesson list table, and navigation
 * - LessonsDetailPage: Individual lesson detail page with 5 variants (P1-P5)
 */

import React from 'react';

export default {
    title: 'Specs/Training/Lessons/Pages',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Page components for Training Lessons interface.

## Available Pages

| Page | Description | Figma Node |
|------|-------------|------------|
| LessonsOverviewPage | Overview with filter bar, lesson list table, and navigation | 63-178237 |
| LessonsDetailPage | Individual lesson detail page with 5 variants (P1-P5) | 63-178289 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available page components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lessons Pages</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Page components for Training Lessons. Navigate to individual pages for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>LessonsOverviewPage</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for Lessons Overview. Contains filter bar with TrainingLessonStatusSelect,
                        SortControl, Expand All button, view toggle (list/grid), and expandable LessonsTable.
                        Uses PageLayout shell with TopBar, Sidebar, and main content area.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-178237
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>LessonsDetailPage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for individual lesson detail. Supports 5 page variants:
                    </p>
                    <ul className="body2-txt" style={{ marginTop: '8px', paddingLeft: '20px', color: 'var(--color-on-surface-variant)' }}>
                        <li>P1 - Intro/Content with ratings</li>
                        <li>P2 - Research Says with quotes</li>
                        <li>P3 - Conclusion & Feedback</li>
                        <li>P4 - Scenario/Assessment</li>
                        <li>P5 - Congratulations</li>
                    </ul>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-178289
                    </p>
                </div>
            </div>
        </div>
    )
};
