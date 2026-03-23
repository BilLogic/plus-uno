/**
 * Session Admin - Cards Overview
 * 
 * Overview of card usage in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Cards',
    parameters: {
        docs: {
            description: {
                component: `Card components used in the Session Admin section.

## Inline Implementation

The donut chart cards (Time Allocation, Attendance, Engagement, etc.) are implemented 
inline within the **SessionOverviewSection** component rather than as separate card components.

This approach was chosen because:
- The charts are tightly coupled to the Session Overview context
- They share common styling and data patterns
- No reuse outside of SessionOverviewSection is anticipated

See **SessionOverviewSection** under Sections for the chart card implementation.
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Cards</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Inline Chart Cards</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px' }}>
                        The donut chart cards are implemented inline within the SessionOverviewSection component:
                    </p>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li>Time Allocation by Student Needs</li>
                        <li>Student Attendance</li>
                        <li>Student Engagement</li>
                        <li>Tutor Attendance</li>
                        <li>Check-in Completion</li>
                    </ul>
                </section>
            </div>
        </div>
    ),
};
