/**
 * StudentOverviewSection - Admin Student Admin Section
 * 
 * Section showing student analytics charts: Needs Distribution, Attendance, Engagement.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=999-109007
 */

import React from 'react';
import StudentOverviewSection from './StudentOverviewSection';
import './StudentOverviewSection.scss';

export default {
    title: 'Specs/Admin/Student Admin/Sections/StudentOverviewSection',
    component: StudentOverviewSection,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section component displaying student analytics through three stacked bar charts: Student Needs Distribution (Weekly), Student Attendance (Weekly), and Student Engagement (Weekly).

## Figma Reference
Node ID: 999-109007

## Features
- Three stacked bar charts side by side
- Color-coded segments with legends
- Weekly data visualization
- Info buttons for additional context
`,
            },
        },
    },
};

/**
 * Overview
 * Shows section with all three charts matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 24px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Student Overview Charts</h6>
                <StudentOverviewSection
                    needsData={[
                        { label: '06/03/24', values: [12, 6] },
                        { label: '06/10/24', values: [16, 8] },
                        { label: '06/17/24', values: [12, 5] },
                        { label: '06/24/24', values: [12, 1] },
                        { label: '07/01/24', values: [12, 1] },
                    ]}
                    attendanceData={[
                        { label: '06/03/24', values: [12, 6] },
                        { label: '06/10/24', values: [16, 8] },
                        { label: '06/17/24', values: [12, 5] },
                        { label: '06/24/24', values: [12, 1] },
                        { label: '07/01/24', values: [12, 1] },
                    ]}
                    engagementData={[
                        { label: '06/03/24', values: [12, 6] },
                        { label: '06/10/24', values: [8, 5, 16] },
                        { label: '06/17/24', values: [5, 12] },
                        { label: '06/24/24', values: [12, 1] },
                        { label: '07/01/24', values: [12, 1] },
                    ]}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Student Overview Charts - Interactive</h6>
            <StudentOverviewSection />
        </div>
    ),
};
