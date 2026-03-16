/**
 * TutorToolUsageSection Stories
 * 
 * Displays tool usage metrics with bar and line charts.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1009-130962
 */

import React from 'react';
import TutorToolUsageSection from './TutorToolUsageSection';

export default {
    title: 'Specs/Admin/Tutor Admin/Sections/TutorToolUsageSection',
    component: TutorToolUsageSection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section component displaying tutor tool usage metrics with multiple chart cards.
                
## Features
- Recording Upload (Daily) with bar chart
- Reflection Completion (Weekly) with line chart
- Attendance Tracking (Weekly) with line chart
- Check-in Completion (Weekly) with line chart
- Horizontal scroll for multiple cards
- Loading state support

## Figma Reference
Node ID: 1009-130962
`,
            },
        },
    },
};

/**
 * Default state with all charts
 */
export const Default = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 40px)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h3 className="h3" style={{ marginBottom: '24px', color: 'var(--color-on-surface)' }}>
                Tool Usage Metrics
            </h3>
            <TutorToolUsageSection />
        </div>
    ),
};

/**
 * Loading state
 */
export const Loading = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 40px)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h3 className="h3" style={{ marginBottom: '24px', color: 'var(--color-on-surface)' }}>
                Tool Usage Metrics - Loading
            </h3>
            <TutorToolUsageSection loading={true} />
        </div>
    ),
};

/**
 * With custom data
 */
export const CustomData = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 40px)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h3 className="h3" style={{ marginBottom: '24px', color: 'var(--color-on-surface)' }}>
                Tool Usage Metrics - Custom Data
            </h3>
            <TutorToolUsageSection
                recordingUploadData={[
                    { label: '10/20', values: [15, 3] },
                    { label: '10/21', values: [18, 5] },
                    { label: '10/22', values: [14, 7] },
                    { label: '10/23', values: [20, 2] },
                    { label: '10/24', values: [16, 4] },
                    { label: '10/25', values: [22, 1] },
                ]}
                reflectionCompletionData={[
                    { label: '07/01/24', values: [40, 15] },
                    { label: '07/08/24', values: [65, 35] },
                    { label: '07/15/24', values: [70, 50] },
                    { label: '07/22/24', values: [60, 40] },
                ]}
            />
        </div>
    ),
};
