/**
 * Tutor Admin - Sections Overview
 * 
 * Overview of all section components in the Tutor Admin section.
 */

export default {
    title: 'Specs/Admin/Tutor Admin/Sections',
    parameters: {
        docs: {
            description: {
                component: `Section components for the Tutor Admin section.

## Components

### TutorPerformanceSection
Section displaying two donut charts for tutor performance (Figma Node: 258-262208)
- Attendance chart
- Sign-Up Rate chart
- Responsive layout

### TutorToolUsageSection
Section displaying tool usage metrics with multiple charts (Figma Node: 1009-130962)
- Recording Upload (Daily) - Bar Chart
- Reflection Completion (Weekly) - Line Chart
- Attendance Tracking (Weekly) - Line Chart
- Check-in Completion (Weekly) - Line Chart
- Horizontal scroll layout
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Sections</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorPerformanceSection</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Section displaying two donut charts for tutor performance overview.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-262208
                    </p>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorToolUsageSection</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Section displaying tool usage metrics with bar and line charts in a horizontal scroll layout.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 1009-130962
                    </p>
                </section>
            </div>
        </div>
    ),
};
