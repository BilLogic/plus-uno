/**
 * Session Admin - Elements Overview
 * 
 * Overview of element usage in the Session Admin section.
 */

export default {
    title: 'Specs/Admin/Session Admin/Elements',
    parameters: {
        docs: {
            description: {
                component: `Element components used in the Session Admin section.

## Shared PLUS DS Components

Session Admin uses shared PLUS Design System components:

- **Button**: Filter dropdowns, navigation
- **Badge**: Metric values (success/warning/danger), status badges, tutor type badges
- **NavTabs**: Tab navigation
- **Pagination**: Table pagination

No custom element components are defined for this section.
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Elements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Shared PLUS DS Components</h4>
                    <p className="body2-txt" style={{ marginBottom: '12px' }}>
                        Session Admin uses shared PLUS Design System components:
                    </p>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Button</strong>: Filter dropdowns, navigation actions</li>
                        <li><strong>Badge</strong>: Metric values with color thresholds, status badges, tutor type badges</li>
                        <li><strong>NavTabs</strong>: Tab navigation (Warnings, Current Tutors, etc.)</li>
                        <li><strong>Pagination</strong>: Table pagination controls</li>
                    </ul>
                </section>
            </div>
        </div>
    ),
};
