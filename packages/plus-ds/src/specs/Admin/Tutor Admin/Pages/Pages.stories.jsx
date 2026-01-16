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

### TutorStatusWarningsPage
Full page layout for Status and Warnings (Figma Node: 258-263229)
- Tab navigation and action buttons
- Status Overview section with filters
- Status Distribution (Latest) - Pie chart
- Status Trend (Weekly) - Stacked bar chart
- Status Details table with pagination
- Tutor modal on row click

### TutorToolUsagePage
Full page layout for Tool Usage (Figma Node: 258-263367)
- Tab navigation and action buttons
- Tool Usage section with filters
- Recording Upload (Daily) - Bar chart
- Reflection Completion (Weekly) - Line chart
- Help Center Usage - Line chart
- Tool Usage Details table with search and pagination
- Export CSV functionality
- Tutor modal on row click

### TutorTrainingProgressPage
Full page layout for Training Progress (Figma Node: 367-146235)
- Tab navigation and action buttons
- Training Progress Overview with view selector (By Tutor / By Lesson)
- Four overview cards (Tutor Need, Avg Completion Rate, Badge Completions, Onboarding)
- Training Progress Details table with search and pagination
- Export CSV functionality
- Tutor modal on row click
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

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorStatusWarningsPage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Full page layout for the Status and Warnings section with status distribution chart,
                        trend graph, and status details table.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-263229
                    </p>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorToolUsagePage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Full page layout for the Tool Usage section with multiple usage charts and
                        details table with search functionality.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-263367
                    </p>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorTrainingProgressPage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Full page layout for the Training Progress section with overview cards,
                        view selector, and training details table.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 367-146235
                    </p>
                </section>
            </div>
        </div>
    ),
};
