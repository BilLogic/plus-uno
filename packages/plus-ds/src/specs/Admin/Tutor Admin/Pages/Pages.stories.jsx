/**
 * Tutor Admin - Pages Overview
 * 
 * Overview of all page components in the Tutor Admin section.
 */

export default {
    title: 'Specs/Admin/Tutor Admin/Pages',
    parameters: {
        docs: {
            description: {
                component: `Page components for the Tutor Admin section.

## Components

### TutorPerformancePage
Full page layout for Tutor Performance (Figma Node: 258-262669)
- TopBar with breadcrumbs
- Sidebar navigation
- Tab navigation (Tutor Performance, Status And Warnings, Tool Usage, Training Progress)
- Action buttons (Email Tutors, Export Reflection Data)
- Performance Overview section with filters
- Two donut charts (Attendance, Sign-Up Rate)
- Performance Details table with pagination
- Tutor modal on row click

## Additional Pages (To Be Implemented)
- TutorStatusWarningsPage (Figma Node: 258-263229)
- TutorToolUsagePage (Figma Node: 258-263367)
- TutorTrainingProgressPage (Figma Node: 367-146235)
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Pages</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorPerformancePage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Full page layout for the Tutor Performance section with tabs, filters, charts,
                        table, and modal.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-262669
                    </p>
                </section>
            </div>
        </div>
    ),
};
