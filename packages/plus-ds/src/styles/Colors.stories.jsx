import React from 'react';

export default {
    title: 'Styles/Colors',
    tags: ['autodocs'],
};

const ColorRow = ({ token, value, description, color }) => (
    <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
        <td style={{ padding: '12px' }}><code>{token}</code></td>
        <td style={{ padding: '12px', fontFamily: 'monospace' }}>{value}</td>
        {color && (
            <td style={{ padding: '12px' }}>
                <div style={{
                    width: '60px',
                    height: '40px',
                    backgroundColor: value,
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '4px'
                }} />
            </td>
        )}
        <td style={{ padding: '12px' }} className="body2-txt">{description}</td>
    </tr>
);

const ColorTable = ({ headers, rows, hasColor = true }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid var(--color-outline-variant)' }}>
        <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                {headers.map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }} className="body2-txt">{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => <ColorRow key={i} {...row} color={hasColor} />)}
        </tbody>
    </table>
);

export const Overview = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="h1" style={{ marginBottom: '24px' }}>Colors</h1>
        <p className="body1-txt" style={{ marginBottom: '32px' }}>
            PLUS follows Material Design 3 color guidance. All colors follow Material Design 3 roles and are sourced from Figma design system variables.
        </p>
    </div>
);

export const AccentColors = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Accent Colors</h2>

        <h3 className="h3" style={{ marginBottom: '16px' }}>Primary</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-primary', value: '#0472a8', description: 'Main primary color' },
                { token: '--color-primary-text', value: '#00547e', description: 'Primary text color' },
                { token: '--color-on-primary', value: '#ffffff', description: 'Content color on primary' },
                { token: '--color-primary-container', value: '#61b5cf', description: 'Primary container background' },
                { token: '--color-on-primary-container', value: '#001e2e', description: 'Content color on primary container' },
            ]}
        />

        <h3 className="h3" style={{ marginBottom: '16px', marginTop: '32px' }}>Secondary</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-secondary', value: '#445c6a', description: 'Main secondary color' },
                { token: '--color-secondary-text', value: '#3b525f', description: 'Secondary text color' },
                { token: '--color-on-secondary', value: '#ffffff', description: 'Content color on secondary' },
                { token: '--color-secondary-container', value: '#5e849b', description: 'Secondary container background' },
                { token: '--color-on-secondary-container', value: '#09171f', description: 'Content color on secondary container' },
            ]}
        />

        <h3 className="h3" style={{ marginBottom: '16px', marginTop: '32px' }}>Tertiary</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-tertiary', value: '#0e8175', description: 'Main tertiary color' },
                { token: '--color-tertiary-text', value: '#005a50', description: 'Tertiary text color' },
                { token: '--color-on-tertiary', value: '#ffffff', description: 'Content color on tertiary' },
                { token: '--color-tertiary-container', value: '#85ecd5', description: 'Tertiary container background' },
                { token: '--color-on-tertiary-container', value: '#005a50', description: 'Content color on tertiary container' },
            ]}
        />
    </div>
);

export const StatusColors = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Status Colors</h2>

        <h3 className="h3" style={{ marginBottom: '16px' }}>Success</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-success', value: '#3e691a', description: 'Main success color' },
                { token: '--color-success-text', value: '#2c5609', description: 'Success text color' },
                { token: '--color-on-success', value: '#ffffff', description: 'Content color on success' },
                { token: '--color-success-container', value: '#a1eb83', description: 'Success container background' },
                { token: '--color-on-success-container', value: '#0c2000', description: 'Content color on success container' },
            ]}
        />

        <h3 className="h3" style={{ marginBottom: '16px', marginTop: '32px' }}>Danger</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-danger', value: '#ba1a1a', description: 'Main danger color' },
                { token: '--color-danger-text', value: '#9b0606', description: 'Danger text color' },
                { token: '--color-on-danger', value: '#ffffff', description: 'Content color on danger' },
                { token: '--color-danger-container', value: '#ffdad6', description: 'Danger container background' },
                { token: '--color-on-danger-container', value: '#410002', description: 'Content color on danger container' },
            ]}
        />

        <h3 className="h3" style={{ marginBottom: '16px', marginTop: '32px' }}>Warning</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-warning', value: '#9f8205', description: 'Main warning color' },
                { token: '--color-warning-text', value: '#5b4a00', description: 'Warning text color' },
                { token: '--color-on-warning', value: '#ffffff', description: 'Content color on warning' },
                { token: '--color-warning-container', value: '#ffe17a', description: 'Warning container background' },
                { token: '--color-on-warning-container', value: '#231b00', description: 'Content color on warning container' },
            ]}
        />
    </div>
);

export const NeutralColors = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Neutral Colors</h2>

        <h3 className="h3" style={{ marginBottom: '16px' }}>Text</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-on-surface', value: '#191c1e', description: 'Primary text color' },
                { token: '--color-on-surface-variant', value: '#3f484a', description: 'Secondary text color' },
            ]}
        />

        <h3 className="h3" style={{ marginBottom: '16px', marginTop: '32px' }}>Outline</h3>
        <ColorTable
            headers={['Token', 'Value', 'Color', 'Description']}
            rows={[
                { token: '--color-outline', value: '#6f797a', description: 'Outer borders' },
                { token: '--color-outline-variant', value: '#bec8ca', description: 'Inner dividers' },
            ]}
        />
    </div>
);
