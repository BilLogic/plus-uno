/**
 * Tutor Admin - Tables Overview
 * 
 * Overview of all table components in the Tutor Admin section.
 */

export default {
    title: 'Specs/Admin/Tutor Admin/Tables',
    parameters: {
        docs: {
            description: {
                component: `Table components for the Tutor Admin section.

## Components

### TutorsPerformanceTable
Main table showing tutor performance data (Figma Node: 258-262435)
- Tutor Name, Signed-Up, % Attendance, Sessions, Students columns
- Color-coded attendance badges (≥80% green, 50-79% yellow, <50% red)
- Lead tutor badges
- Sortable columns
- Add Tutor button

## Additional Tables (To Be Implemented)
- TutorsStatusWarningsTable
- TutorsToolUsageTable
- TutorsTrainingProgressTable
- TutorSessionsTable
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Tables</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>TutorsPerformanceTable</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Main table for displaying tutor performance metrics with color-coded badges.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-262435
                    </p>
                </section>
            </div>
        </div>
    ),
};
