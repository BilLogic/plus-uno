import React from 'react';

export default {
    title: 'Styles/Elevation',
    tags: ['!dev'],
};

const ElevationTable = ({ headers, rows }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid var(--color-outline-variant)' }}>
        <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                {headers.map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }} className="body2-txt">{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <td style={{ padding: '12px' }}><code>{row.token}</code></td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{row.value}</td>
                    <td style={{ padding: '12px' }}>
                        <div style={{
                            width: '100px',
                            height: '60px',
                            backgroundColor: 'var(--color-surface-container)',
                            borderRadius: '12px',
                            boxShadow: row.value,
                            margin: '0 auto'
                        }} />
                    </td>
                    <td style={{ padding: '12px' }} className="body2-txt">{row.description}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export const Overview = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p className="body1-txt" style={{ marginBottom: '32px' }}>
            Elevation tokens provide box-shadow values for creating depth and hierarchy in the UI.
        </p>

        <h4 className="h2" style={{ marginBottom: '16px' }}>Elevation Principles</h4>
        <ul className="body2-txt" style={{ paddingLeft: '24px' }}>
            <li style={{ marginBottom: '8px' }}>Use elevation tokens: Always use elevation tokens instead of custom box-shadow values</li>
            <li style={{ marginBottom: '8px' }}>Match elevation to importance: Use higher elevation for more important/urgent content</li>
            <li style={{ marginBottom: '8px' }}>Consider context: Modals typically use elevation 3-5, cards use elevation 1-2</li>
        </ul>
    </div>
);

export const AllElevations = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <ElevationTable
            headers={['Token', 'Value', 'Visual', 'Use Case']}
            rows={[
                {
                    token: '--elevation-light-1',
                    value: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
                    description: 'Subtle elevation, cards at rest'
                },
                {
                    token: '--elevation-light-2',
                    value: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
                    description: 'Slightly raised elements, hover states'
                },
                {
                    token: '--elevation-light-3',
                    value: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
                    description: 'Modals, dialogs, raised cards'
                },
                {
                    token: '--elevation-light-4',
                    value: '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
                    description: 'Prominent modals, important overlays'
                },
                {
                    token: '--elevation-light-5',
                    value: '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
                    description: 'Maximum elevation, critical dialogs'
                },
            ]}
        />
    </div>
);
