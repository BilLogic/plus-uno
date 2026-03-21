/**
 * Student Admin Sections Overview
 * 
 * Overview of all section components in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Sections',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section components for the Student Admin interface.

## Components
- **StudentOverviewSection**: Charts section with Needs Distribution, Attendance, and Engagement

## Figma References
- StudentOverviewSection: Node ID 999-109007
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Sections</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    Section components used in the Student Admin interface. Each section is designed
                    to be reusable and follows the PLUS design system patterns.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>StudentOverviewSection</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Displays three stacked bar charts side by side: Student Needs Distribution (Weekly),
                            Student Attendance (Weekly), and Student Engagement (Weekly). Each chart shows
                            color-coded segments with legends.
                        </p>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                            <strong>Figma Node:</strong> 999-109007
                        </p>
                    </div>
                </div>
            </section>
        </div>
    ),
};
