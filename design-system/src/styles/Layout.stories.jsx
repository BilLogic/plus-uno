import React from 'react';

export default {
    title: 'Styles/Layout',
    tags: ['!dev'],
};

const TokenTable = ({ headers, rows }) => (
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
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.value}</td>
                    <td style={{ padding: '12px' }} className="body2-txt">{row.description}</td>
                    {row.extra && <td style={{ padding: '12px' }} className="body2-txt">{row.extra}</td>}
                </tr>
            ))}
        </tbody>
    </table>
);

export const Overview = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p className="body1-txt" style={{ marginBottom: '32px' }}>
            Layout tokens define breakpoints, container sizes, and spacing tokens for responsive design.
        </p>
    </div>
);

export const Columns = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p className="body1-txt" style={{ marginBottom: '24px' }}>
            The PLUS Design System uses a <strong>fluid 12-column grid</strong> that automatically adapts to the content container width.
        </p>

        {/* Visual Grid */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'var(--layout-grid-gap, 8px)',
            marginBottom: '24px'
        }}>
            {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                    height: '32px',
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: '4px',
                    border: '1px dashed var(--color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--color-on-surface-variant)'
                }}>
                    {i + 1}
                </div>
            ))}
        </div>

        <h4 className="h4" style={{ marginBottom: '16px' }}>Key Dimensions</h4>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--layout-grid-gap', value: '8px', description: 'Gap between columns (uses --size-element-gap-sm)' },
                { token: '--layout-sidebar-width', value: '164px', description: 'Fixed sidebar width (visible at Large+)' },
                { token: '--size-surface-pad-x', value: '32px', description: 'Content surface horizontal padding' },
                { token: '--size-surface-container-pad-x-sm', value: '16px', description: 'Outer layout horizontal padding' },
            ]}
        />

        <h4 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Column Reference Values</h4>
        <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
            Values at the <strong>minimum</strong> of each breakpoint:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid var(--color-outline-variant)' }}>
            <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }} className="body2-txt">Column</th>
                    <th style={{ padding: '12px', textAlign: 'right' }} className="body2-txt">Medium (768px)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }} className="body2-txt">Large (1024px)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }} className="body2-txt">X-Large (1440px)</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                    <td style={{ padding: '12px' }}><strong>Content Width</strong></td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>672px</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>748px</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>1164px</td>
                </tr>
                {[
                    { col: '--col-1', md: '48.67', lg: '55.00', xl: '89.67' },
                    { col: '--col-2', md: '105.33', lg: '118.00', xl: '187.33' },
                    { col: '--col-3', md: '162.00', lg: '181.00', xl: '285.00' },
                    { col: '--col-4', md: '218.67', lg: '244.00', xl: '382.67' },
                    { col: '--col-5', md: '275.33', lg: '307.00', xl: '480.33' },
                    { col: '--col-6', md: '332.00', lg: '370.00', xl: '578.00' },
                    { col: '--col-7', md: '388.67', lg: '433.00', xl: '675.67' },
                    { col: '--col-8', md: '445.33', lg: '496.00', xl: '773.33' },
                    { col: '--col-9', md: '502.00', lg: '559.00', xl: '871.00' },
                    { col: '--col-10', md: '558.67', lg: '622.00', xl: '968.67' },
                    { col: '--col-11', md: '615.33', lg: '685.00', xl: '1066.33' },
                    { col: '--col-12', md: '672.00', lg: '748.00', xl: '1164.00' },
                ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '12px' }}><code>{row.col}</code></td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.md}px</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.lg}px</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.xl}px</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <h4 className="h4" style={{ marginBottom: '16px' }}>Content Width Calculation</h4>
        <pre style={{
            backgroundColor: 'var(--color-surface-container-low)',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            marginBottom: '24px'
        }}>
            {`Medium:  768 - 32 (outer) - 64 (surface) = 672px
Large:   1024 - 32 - 164 (sidebar) - 16 (gap) - 64 = 748px
X-Large: 1440 - 32 - 164 - 16 - 64 = 1164px`}
        </pre>

        <h4 className="h4" style={{ marginBottom: '16px' }}>Common Column Usage</h4>
        <TokenTable
            headers={['Component', 'Typical Width', 'Notes']}
            rows={[
                { token: 'Dialog / Modal', value: '6–8 columns', description: 'Center-aligned.' },
                { token: 'Side Panel', value: '3–4 columns', description: 'Docked to left or right.' },
                { token: 'Data Table', value: '10–12 columns', description: 'Typically full-width.' },
                { token: 'Content Card Grid', value: '3–4 columns per row', description: 'Responsive grid.' },
            ]}
        />
    </div>
);

export const Breakpoints = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <TokenTable
            headers={['Token Name', 'Value', 'Description']}
            rows={[
                { token: '--breakpoint-md-min', value: '768px', description: 'Minimum width for medium screens (tablets)' },
                { token: '--breakpoint-md-max', value: '1023.98px', description: 'Maximum width for medium screens' },
                { token: '--breakpoint-lg-min', value: '1024px', description: 'Minimum width for large screens (desktops)' },
                { token: '--breakpoint-lg-max', value: '1439.98px', description: 'Maximum width for large screens' },
                { token: '--breakpoint-xl-min', value: '1440px', description: 'Minimum width for extra large screens (HD)' },
                { token: '--breakpoint-xl-max', value: '1919.98px', description: 'Maximum width for extra large screens' },
                { token: '--breakpoint-xxl-min', value: '1920px', description: 'Minimum width for 2x large screens' },
            ]}
        />
    </div>
);

export const ElementSpacings = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        <h4 className="h4" style={{ marginBottom: '16px' }}>Padding</h4>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-element-pad-x-lg', value: '16px', description: 'Large horizontal padding' },
                { token: '--size-element-pad-x-md', value: '12px', description: 'Medium horizontal padding' },
                { token: '--size-element-pad-x-sm', value: '8px', description: 'Small horizontal padding' },
                { token: '--size-element-pad-y-lg', value: '8px', description: 'Large vertical padding' },
                { token: '--size-element-pad-y-md', value: '6px', description: 'Medium vertical padding' },
                { token: '--size-element-pad-y-sm', value: '4px', description: 'Small vertical padding' },
            ]}
        />

        <h4 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Gap</h4>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-element-gap-lg', value: '12px', description: 'Large gap' },
                { token: '--size-element-gap-md', value: '10px', description: 'Medium gap' },
                { token: '--size-element-gap-sm', value: '8px', description: 'Small gap' },
                { token: '--size-element-gap-xs', value: '4px', description: 'Extra small gap' },
            ]}
        />

        <h4 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Radius</h4>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-element-radius-sm', value: '4px', description: 'Small radius (radius-100)' },
                { token: '--size-element-radius-md', value: '4px', description: 'Medium radius (radius-100)' },
                { token: '--size-element-radius-lg', value: '8px', description: 'Large radius (radius-200)' },
                { token: '--size-element-radius-full', value: '999px', description: 'Pill shape (radius-1000)' },
            ]}
        />
    </div>
);

export const CardSpacings = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-card-pad-x-sm', value: '16px', description: 'Small horizontal padding' },
                { token: '--size-card-pad-x-md', value: '20px', description: 'Medium horizontal padding' },
                { token: '--size-card-pad-x-lg', value: '24px', description: 'Large horizontal padding' },
                { token: '--size-card-pad-y-sm', value: '16px', description: 'Small vertical padding' },
                { token: '--size-card-pad-y-md', value: '20px', description: 'Medium vertical padding' },
                { token: '--size-card-pad-y-lg', value: '24px', description: 'Large vertical padding' },
                { token: '--size-card-gap-sm', value: '10px', description: 'Small gap' },
                { token: '--size-card-gap-md', value: '16px', description: 'Medium gap' },
                { token: '--size-card-gap-lg', value: '20px', description: 'Large gap' },
                { token: '--size-card-radius-sm', value: '12px', description: 'Small border radius' },
                { token: '--size-card-radius-md', value: '16px', description: 'Medium border radius' },
                { token: '--size-card-radius-full', value: '999px', description: 'Pill shape' },
                { token: '--size-card-border-sm', value: '1px', description: 'Small border' },
                { token: '--size-card-border-md', value: '1.5px', description: 'Medium border' },
                { token: '--size-card-border-lg', value: '2px', description: 'Large border' },
            ]}
        />
    </div>
);

export const SectionSpacings = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-section-pad-x-lg', value: '36px', description: 'Large horizontal padding' },
                { token: '--size-section-pad-x-md', value: '24px', description: 'Medium horizontal padding' },
                { token: '--size-section-pad-x-sm', value: '16px', description: 'Small horizontal padding' },
                { token: '--size-section-pad-y-lg', value: '36px', description: 'Large vertical padding' },
                { token: '--size-section-pad-y-md', value: '24px', description: 'Medium vertical padding' },
                { token: '--size-section-pad-y-sm', value: '16px', description: 'Small vertical padding' },
                { token: '--size-section-gap-lg', value: '24px', description: 'Large gap' },
                { token: '--size-section-gap-md', value: '16px', description: 'Medium gap' },
                { token: '--size-section-gap-sm', value: '8px', description: 'Small gap' },
                { token: '--size-section-radius-sm', value: '8px', description: 'Small border radius' },
                { token: '--size-section-radius-md', value: '12px', description: 'Medium border radius (radius-300)' },
                { token: '--size-section-radius-lg', value: '16px', description: 'Large border radius' },
            ]}
        />
    </div>
);

export const ModalSpacings = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-modal-pad-x-sm', value: '10px', description: 'Small horizontal padding' },
                { token: '--size-modal-pad-x-md', value: '16px', description: 'Medium horizontal padding' },
                { token: '--size-modal-pad-x-lg', value: '20px', description: 'Large horizontal padding' },
                { token: '--size-modal-pad-y-sm', value: '8px', description: 'Small vertical padding' },
                { token: '--size-modal-pad-y-md', value: '12px', description: 'Medium vertical padding' },
                { token: '--size-modal-pad-y-lg', value: '16px', description: 'Large vertical padding' },
                { token: '--size-modal-gap-sm', value: '8px', description: 'Small gap' },
                { token: '--size-modal-gap-md', value: '12px', description: 'Medium gap' },
                { token: '--size-modal-gap-lg', value: '20px', description: 'Large gap' },
                { token: '--size-modal-radius-sm', value: '4px', description: 'Small border radius' },
                { token: '--size-modal-radius-md', value: '6px', description: 'Medium border radius' },
                { token: '--size-modal-radius-lg', value: '12px', description: 'Large border radius' },
                { token: '--size-modal-radius-full', value: '999px', description: 'Pill shape' },
                { token: '--size-modal-border-sm', value: '1px', description: 'Small border' },
                { token: '--size-modal-border-md', value: '1.5px', description: 'Medium border' },
                { token: '--size-modal-border-lg', value: '2px', description: 'Large border' },
            ]}
        />
    </div>
);

export const CornerRadiusApplication = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <p className="body1-txt" style={{ marginBottom: '32px' }}>
            Corner radius should match padding/gap size tier.
        </p>

        <h4 className="h4" style={{ marginBottom: '16px' }}>Elements Layer</h4>
        <TokenTable
            headers={['Token', 'Value', 'Use With', 'Best For']}
            rows={[
                { token: '--size-element-radius-sm', value: '4px', description: 'element-pad-sm', extra: 'Small buttons' },
                { token: '--size-element-radius-md', value: '4px', description: 'element-pad-md', extra: 'Standard buttons' },
                { token: '--size-element-radius-lg', value: '4px', description: 'element-pad-lg', extra: 'Large buttons' },
                { token: '--size-element-radius-full', value: '999px', description: 'Pill shape', extra: 'Badges, chips' },
            ]}
        />

        <h4 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Cards Layer</h4>
        <TokenTable
            headers={['Token', 'Value', 'Use With', 'Best For']}
            rows={[
                { token: '--size-card-radius-sm', value: '12px', description: 'card-pad-sm', extra: 'Compact cards' },
                { token: '--size-card-radius-md', value: '16px', description: 'card-pad-md/lg', extra: 'Standard cards' },
            ]}
        />
    </div>
);
CornerRadiusApplication.storyName = 'Corner Radius Application';

export const PageSpacings = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <TokenTable
            headers={['Token', 'Value', 'Description']}
            rows={[
                { token: '--size-surface-pad-x', value: '32px', description: 'Horizontal padding' },
                { token: '--size-surface-pad-y', value: '24px', description: 'Vertical padding' },
                { token: '--size-surface-gap-lg', value: '32px', description: 'Large gap' },
                { token: '--size-surface-gap-md', value: '24px', description: 'Medium gap' },
                { token: '--size-surface-gap-sm', value: '16px', description: 'Small gap' },
                { token: '--size-surface-radius', value: '16px', description: 'Border radius' },
                { token: '--size-surface-border', value: '2px', description: 'Border width' },
            ]}
        />
    </div>
);
