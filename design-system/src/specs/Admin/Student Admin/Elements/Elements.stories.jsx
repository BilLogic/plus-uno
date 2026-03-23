/**
 * Student Admin Elements Overview
 * 
 * Overview of element components used in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Element components used in the Student Admin interface.

## Shared Components
No custom elements are defined for Student Admin. The following shared PLUS DS components are used:

- **Button**: Primary, secondary, danger, text buttons
- **Badge**: Status badges (info, secondary)
- **Pagination**: Page navigation
- **Form Controls**: Input fields, switches

These components are imported directly from the PLUS design system.
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Elements</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    No custom element components are defined for Student Admin. The interface uses
                    shared components from the PLUS design system.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Shared Components Used</h6>
                        <ul className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '20px' }}>
                            <li>Button - For actions (Add Student, View goals, Cancel, Save, Delete)</li>
                            <li>Badge - For status display (info badges for student status)</li>
                            <li>Pagination - For table navigation</li>
                            <li>Form.Control - For modal input fields</li>
                            <li>Form.Check - For toggle switches</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    ),
};
