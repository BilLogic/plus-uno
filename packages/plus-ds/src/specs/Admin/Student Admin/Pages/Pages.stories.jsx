/**
 * Student Admin Pages Overview
 * 
 * Overview of all page components in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Pages',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Page components for the Student Admin interface.

## Components
- **StudentAdminPage**: Full page layout with overview charts and students table

## Figma References
- StudentAdminPage: Node ID 1006-258597
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Pages</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    Full page layouts for the Student Admin interface. Pages use the shared PageLayout
                    component with TopBar and Sidebar, and compose the tables, sections, and modals.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>StudentAdminPage</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Full page layout for the Student Admin section. Includes:
                        </p>
                        <ul className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '20px', marginTop: '8px' }}>
                            <li>TopBar with breadcrumbs (Home / Student Admin)</li>
                            <li>Sidebar navigation (supervisor user type)</li>
                            <li>Student Overview section with filters and charts</li>
                            <li>Student Details section with table and pagination</li>
                            <li>Student modal on row click</li>
                        </ul>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                            <strong>Figma Node:</strong> 1006-258597
                        </p>
                    </div>
                </div>
            </section>
        </div>
    ),
};
