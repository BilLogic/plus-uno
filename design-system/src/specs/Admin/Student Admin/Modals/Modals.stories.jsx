/**
 * Student Admin Modals Overview
 * 
 * Overview of all modal components in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Modals',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal components for the Student Admin interface.

## Components
- **StudentModal**: Modal for viewing/editing student info with tabs (Info, Sessions)

## Figma References
- StudentModal: Node ID 317-126488
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Modals</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    Modal components used in the Student Admin interface. Each modal follows the
                    PLUS design system patterns with proper focus management and scroll behavior.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>StudentModal</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Modal for viewing and editing student information. Features two tabs:
                            Student Info (form fields for name, email, status, school, tutors) and
                            Sessions (table showing session history with pagination). Includes
                            Delete, Cancel, and Save action buttons.
                        </p>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                            <strong>Figma Node:</strong> 317-126488
                        </p>
                    </div>
                </div>
            </section>
        </div>
    ),
};
