/**
 * Student Admin Tables Overview
 * 
 * Overview of all table components in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Tables',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table components for the Student Admin interface.

## Components
- **StudentsTable**: Main table showing student details (name, school, teacher, status, action)

## Figma References
- StudentsTable: Node ID 999-108965
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Tables</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    Table components used in the Student Admin interface. Each table follows the
                    PLUS design system patterns with sortable columns, hover states, and action buttons.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>StudentsTable</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Displays student information with columns: Student, School, Teacher, Latest Status, Action.
                            Features sortable columns, status badges, and "View goals" action buttons.
                        </p>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                            <strong>Figma Node:</strong> 999-108965
                        </p>
                    </div>
                </div>
            </section>
        </div>
    ),
};
