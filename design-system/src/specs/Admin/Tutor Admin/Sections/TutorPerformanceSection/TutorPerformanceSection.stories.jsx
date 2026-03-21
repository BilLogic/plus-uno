/**
 * TutorPerformanceSection - Tutor Admin Section
 * 
 * Section displaying tutor performance overview with donut charts.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262208
 */

import React from 'react';
import TutorPerformanceSection from './TutorPerformanceSection';
import './TutorPerformanceSection.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Sections/TutorPerformanceSection',
    component: TutorPerformanceSection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section component displaying two donut charts for tutor performance overview.

## Figma Reference
Node ID: 258-262208

## Charts
1. **Attendance** - Shows percentage of tutors who attended sessions
2. **Sign-Up Rate** - Shows percentage of tutors who signed up

## Features
- Responsive grid layout
- Info tooltips
- Loading states
`,
            },
        },
    },
    argTypes: {
        attendancePercentage: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Attendance percentage',
            table: { category: 'Data' },
        },
        signUpRatePercentage: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Sign-up rate percentage',
            table: { category: 'Data' },
        },
        loading: {
            control: 'boolean',
            description: 'Loading state',
            table: { category: 'State' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorPerformanceSection</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Section component displaying two donut charts for tutor performance overview
                        (Attendance and Sign-Up Rate).
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Performance Overview</h6>
            <TutorPerformanceSection
                attendancePercentage={95}
                signUpRatePercentage={85}
            />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                Performance Overview - Interactive
            </h6>
            <TutorPerformanceSection
                attendancePercentage={args.attendancePercentage}
                signUpRatePercentage={args.signUpRatePercentage}
                loading={args.loading}
            />
        </div>
    ),
    args: {
        attendancePercentage: 95,
        signUpRatePercentage: 85,
        loading: false,
    },
};

/**
 * Loading
 */
export const Loading = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Performance Overview - Loading</h6>
            <TutorPerformanceSection
                loading={true}
            />
        </div>
    ),
};
