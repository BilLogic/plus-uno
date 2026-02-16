/**
 * Session Admin - Modals Overview
 * 
 * Overview of all modal components in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Modals',
    parameters: {
        docs: {
            description: {
                component: `Modal components for the Session Admin section.

## Components

### SessionModal
Modal for viewing session breakdown details (Figma Node: 987-127605)
- Shows date in title
- Contains SessionBreakdownTable
- Close button in header
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Modals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>SessionModal</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Modal for viewing session breakdown with student-tutor pairings and time spent.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 987-127605
                    </p>
                </section>
            </div>
        </div>
    ),
};
