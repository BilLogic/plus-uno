/**
 * Training/Lessons Specs - Elements Overview
 * 
 * Element components for lessons.
 * 
 * Components:
 * - Rating: Rating component with 5 rating singles
 * - RatingSingle: Single rating button
 * - AiIndicator: AI indicator icon button
 * - SortControl: Dropdown sort control
 * - TrainingLessonStatusSelect: Status filter dropdown
 */

import React from 'react';

// Import components for overview display
import Rating from './Rating/Rating';
import RatingSingle from './RatingSingle/RatingSingle';
import AiIndicator from './AiIndicator/AiIndicator';
import SortControl from './SortControl/SortControl';
import TrainingLessonStatusSelect from './TrainingLessonStatusSelect/TrainingLessonStatusSelect';

// Import styles
import './Rating/Rating.scss';
import './RatingSingle/RatingSingle.scss';
import './AiIndicator/AiIndicator.scss';
import './SortControl/SortControl.scss';
import './TrainingLessonStatusSelect/TrainingLessonStatusSelect.scss';

export default {
    title: 'Specs/Training/Lessons/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Element components for Training Lessons interface.

## Available Elements

| Element | Description | Figma Node |
|---------|-------------|------------|
| Rating | Rating component with 5 rating singles (1-5) | 63-177637 |
| RatingSingle | Single rating button (rest/selected states) | 63-177643 |
| AiIndicator | AI indicator icon button with sparkle SVG | 63-177685 |
| SortControl | Dropdown sort control with Sort by and Order sections | 747-54853 |
| TrainingLessonStatusSelect | Status filter dropdown with colored icons and counters | 779-75384 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available element components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lessons Elements</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Element components for Training Lessons. Navigate to individual elements for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>Rating</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                        Rating component with 5 rating singles (1-5). Used for confidence and experience ratings.
                    </p>
                    <div style={{ marginBottom: '8px' }}>
                        <Rating rating={3} />
                    </div>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-177637
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>RatingSingle</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                        Single rating button with rest and selected states.
                    </p>
                    <div style={{ marginBottom: '8px', display: 'flex', gap: '16px' }}>
                        <RatingSingle value={1} status="rest" />
                        <RatingSingle value={2} status="rest" />
                        <RatingSingle value={3} status="selected" />
                        <RatingSingle value={4} status="rest" />
                        <RatingSingle value={5} status="rest" />
                    </div>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-177643
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>AiIndicator</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                        AI indicator icon button with sparkle SVG. Used to indicate AI-powered features.
                    </p>
                    <div style={{ marginBottom: '8px' }}>
                        <AiIndicator onClick={() => console.log('AI Indicator clicked')} />
                    </div>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-177685
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>SortControl</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                        Dropdown sort control with Sort by (Name, Status, Competency Areas) and Order (A-Z, Z-A) sections.
                    </p>
                    <div style={{ marginBottom: '8px' }}>
                        <SortControl sortBy="Name" sortOrder="A-Z" />
                    </div>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 747-54853
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>TrainingLessonStatusSelect</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                        Status filter dropdown with colored icons and counters. Options: All, Assigned, In Progress, Completed, Not Started.
                    </p>
                    <div style={{ marginBottom: '8px' }}>
                        <TrainingLessonStatusSelect selectedStatus="All" />
                    </div>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 779-75384
                    </p>
                </div>
            </div>
        </div>
    )
};
