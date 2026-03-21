/**
 * Tutor Admin - Cards Overview
 * 
 * Overview of all card components in the Tutor Admin section.
 */

export default {
    title: 'Specs/Admin/Tutor Admin/Cards',
    parameters: {
        docs: {
            description: {
                component: `Card components for the Tutor Admin section.

## Components

### TutorDataCard
Data card with donut chart for displaying tutor metrics (Figma Node: 258-262197)
- Donut chart visualization
- Title with optional info tooltip
- Percentage display in center
- Color-coded legend
- Loading state
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Cards</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorDataCard</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Data card with donut chart for displaying tutor metrics (Attendance, Sign-Up Rate).
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-262197
                    </p>
                </section>
            </div>
        </div>
    ),
};
