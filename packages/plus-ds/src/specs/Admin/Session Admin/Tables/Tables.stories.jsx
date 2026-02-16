/**
 * Session Admin - Tables Overview
 * 
 * Overview of all table components in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Tables',
    parameters: {
        docs: {
            description: {
                component: `Table components for the Session Admin section.

## Components

### SessionsTable
Main table showing session data with metrics (Figma Node: 987-127618)
- Day (Date), Shift (ET), School, Teacher columns
- Metric columns with color-coded badges (Attended students, Engaged student, Attended tutors, Completed Check-in)
- Color thresholds: ≥80% green, 50-79% yellow, <50% red

### SessionBreakdownTable
Table shown inside the Session Modal (Figma Node: 987-127671)
- Student Name, Student Status, Tutor Name, Tutor Type, Time Spent columns
- Badge styling for status and tutor type
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Tables</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>SessionsTable</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Main table for displaying session data with color-coded metric badges.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 987-127618
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>SessionBreakdownTable</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Table for session breakdown details, used inside the Session Modal.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 987-127671
                    </p>
                </section>
            </div>
        </div>
    ),
};
