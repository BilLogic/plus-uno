/**
 * Session Admin - Sections Overview
 * 
 * Overview of all section components in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Sections',
    parameters: {
        docs: {
            description: {
                component: `Section components for the Session Admin section.

## Components

### SessionOverviewSection
Section displaying 5 donut charts for session metrics (Figma Node: 987-127692)
- Time Allocation by Student Needs (pink donut)
- Student Attendance (green donut)
- Student Engagement (green donut)
- Tutor Attendance (green donut)
- Check-in Completion (green donut)
- Horizontally scrollable on narrow viewports
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Sections</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>SessionOverviewSection</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Section displaying 5 donut charts for session metrics overview.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 987-127692
                    </p>
                </section>
            </div>
        </div>
    ),
};
