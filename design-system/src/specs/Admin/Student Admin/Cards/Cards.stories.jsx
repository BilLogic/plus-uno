/**
 * Student Admin Cards Overview
 * 
 * Overview of card components used in Student Admin spec.
 */

export default {
    title: 'Specs/Admin/Student Admin/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Card components used in the Student Admin interface.

## Implementation Note
No separate card components are defined for Student Admin. The chart cards in the Student Overview
section are implemented inline within the StudentOverviewSection component.

## Charts as Cards
The overview section displays three stacked bar charts, each within a card-like container:
- Student Needs Distribution (Weekly)
- Student Attendance (Weekly)
- Student Engagement (Weekly)
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>Student Admin Cards</h4>
                <p className="body2-txt" style={{ marginBottom: '24px' }}>
                    No separate card components are defined for Student Admin. Chart cards are
                    implemented inline within the StudentOverviewSection component.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px' }}>Chart Cards</h6>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            The StudentOverviewSection displays three chart cards:
                        </p>
                        <ul className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '20px', marginTop: '8px' }}>
                            <li>Student Needs Distribution (Weekly) - Pink/purple stacked bars</li>
                            <li>Student Attendance (Weekly) - Green/orange stacked bars</li>
                            <li>Student Engagement (Weekly) - Green/yellow/pink stacked bars</li>
                        </ul>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
                            See <strong>Specs/Admin/Student Admin/Sections/StudentOverviewSection</strong> for the implementation.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    ),
};
