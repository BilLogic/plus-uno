/**
 * Session Admin - Pages Overview
 * 
 * Overview of all page components in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Pages',
    parameters: {
        docs: {
            description: {
                component: `Page components for the Session Admin section.

## Components

### SessionAdminPage
Full page layout for Session Admin (Figma Node: 987-128734)
- TopBar with breadcrumbs
- Sidebar navigation
- Tab navigation (Warnings, Current Tutors, Incoming Tutors, Details)
- Session Overview section with filters
- 5 donut charts (Time Allocation, Attendance, Engagement, Tutor Attendance, Check-in)
- Session Details table with pagination
- Session breakdown modal on row click
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Pages</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>SessionAdminPage</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Full page layout for the Session Admin section with tabs, filters, charts, 
                        table, and modal.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 987-128734
                    </p>
                </section>
            </div>
        </div>
    ),
};
