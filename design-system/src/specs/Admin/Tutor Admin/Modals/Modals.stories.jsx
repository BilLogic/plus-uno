/**
 * Tutor Admin - Modals Overview
 * 
 * Overview of all modal components in the Tutor Admin section.
 */

export default {
    title: 'Specs/Admin/Tutor Admin/Modals',
    parameters: {
        docs: {
            description: {
                component: `Modal components for the Tutor Admin section.

## Components

### TutorModal
Modal for viewing and editing tutor information (Figma Node: 258-262330)
- Two tabs: Tutor Info and Sessions
- Form fields for tutor details
- Sessions table with pagination
- Delete/Cancel/Save actions

## Additional Modals (To Be Implemented)
- DeleteTutorModal / AddTutorModal (Figma Node: 258-262383)
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Modals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorModal</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Modal for viewing and editing tutor information with tabs for Info and Sessions.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-262330
                    </p>
                </section>
            </div>
        </div>
    ),
};
