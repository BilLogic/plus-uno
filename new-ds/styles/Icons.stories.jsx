import React from 'react';

export default {
    title: 'Styles/Icons',
    tags: ['autodocs'],
};

const IconTokenTable = ({ rows }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid var(--color-outline-variant)' }}>
        <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                {['Token', 'Size', 'Line Height', 'Description'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }} className="body2-txt">{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <td style={{ padding: '12px' }}><code>{row.token}</code></td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.size}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.lineHeight}</td>
                    <td style={{ padding: '12px' }} className="body2-txt">{row.description}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export const Overview = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h3" style={{ marginBottom: '16px' }}>Font Awesome Free Icon Library</h2>
        <p className="body2-txt" style={{ marginBottom: '24px' }}>
            PLUS Design System uses <strong>Font Awesome's free icon library</strong> for all icons.
        </p>

        <h3 className="h4" style={{ marginBottom: '16px' }}>Icon Styles</h3>
        <ul className="body2-txt" style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li><strong>Solid (fas)</strong>: Filled icons for emphasis or primary actions</li>
            <li><strong>Regular (far)</strong>: Outlined icons for secondary actions or lighter emphasis</li>
        </ul>

        <h3 className="h4" style={{ marginBottom: '16px' }}>Usage Example</h3>
        <pre style={{
            backgroundColor: 'var(--color-surface-container-low)',
            padding: '16px',
            borderRadius: '4px',
            fontFamily: 'monospace'
        }}>
            {`<i class="fas fa-star"></i>
<i class="far fa-star"></i>`}
        </pre>
    </div>
);

export const IconSizeTokensSolid = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h3" style={{ marginBottom: '24px' }}>Font Awesome Solid Icon Tokens</h2>

        <h3 className="h4" style={{ marginBottom: '16px' }}>Headline Icons</h3>
        <IconTokenTable
            rows={[
                { token: '--font-size-fa-h1-solid', size: '36px (2.25rem)', lineHeight: '177.8%', description: 'H1 headline icon size' },
                { token: '--font-size-fa-h2-solid', size: '28px (1.75rem)', lineHeight: '171.4%', description: 'H2 headline icon size' },
                { token: '--font-size-fa-h3-solid', size: '24px (1.5rem)', lineHeight: '166.7%', description: 'H3 headline icon size' },
                { token: '--font-size-fa-h4-solid', size: '20px (1.25rem)', lineHeight: '160%', description: 'H4 headline icon size' },
                { token: '--font-size-fa-h5-solid', size: '16px (1rem)', lineHeight: '175%', description: 'H5 headline icon size' },
                { token: '--font-size-fa-h6-solid', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'H6 headline icon size' },
            ]}
        />

        <h3 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Body Icons</h3>
        <IconTokenTable
            rows={[
                { token: '--font-size-fa-body1-solid', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'Body 1 icon size' },
                { token: '--font-size-fa-body2-solid', size: '12px (0.75rem)', lineHeight: '183.3%', description: 'Body 2 icon size (default)' },
                { token: '--font-size-fa-body3-solid', size: '10px (0.625rem)', lineHeight: '200%', description: 'Body 3 icon size' },
            ]}
        />
    </div>
);

export const IconSizeTokensRegular = () => (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="h3" style={{ marginBottom: '24px' }}>Font Awesome Regular Icon Tokens</h2>

        <h3 className="h4" style={{ marginBottom: '16px' }}>Headline Icons</h3>
        <IconTokenTable
            rows={[
                { token: '--font-size-fa-h1-regular', size: '36px (2.25rem)', lineHeight: '177.8%', description: 'H1 headline icon size' },
                { token: '--font-size-fa-h2-regular', size: '28px (1.75rem)', lineHeight: '171.4%', description: 'H2 headline icon size' },
                { token: '--font-size-fa-h3-regular', size: '24px (1.5rem)', lineHeight: '166.7%', description: 'H3 headline icon size' },
                { token: '--font-size-fa-h4-regular', size: '20px (1.25rem)', lineHeight: '160%', description: 'H4 headline icon size' },
                { token: '--font-size-fa-h5-regular', size: '16px (1rem)', lineHeight: '175%', description: 'H5 headline icon size' },
                { token: '--font-size-fa-h6-regular', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'H6 headline icon size' },
            ]}
        />

        <h3 className="h4" style={{ marginBottom: '16px', marginTop: '32px' }}>Body Icons</h3>
        <IconTokenTable
            rows={[
                { token: '--font-size-fa-body1-regular', size: '14px (0.875rem)', lineHeight: '171.4%', description: 'Body 1 icon size' },
                { token: '--font-size-fa-body2-regular', size: '12px (0.75rem)', lineHeight: '183.3%', description: 'Body 2 icon size (default)' },
                { token: '--font-size-fa-body3-regular', size: '10px (0.625rem)', lineHeight: '200%', description: 'Body 3 icon size' },
            ]}
        />
    </div>
);

export const CommonIcons = () => {
    const commonIcons = [
        { name: 'circle-check', label: 'Check', class: 'fas' },
        { name: 'xmark', label: 'Close', class: 'fas' },
        { name: 'user', label: 'User', class: 'far' },
        { name: 'house', label: 'Home', class: 'fas' },
        { name: 'gear', label: 'Settings', class: 'fas' },
        { name: 'magnifying-glass', label: 'Search', class: 'fas' },
        { name: 'bell', label: 'Notification', class: 'far' },
        { name: 'envelope', label: 'Message', class: 'far' },
        { name: 'heart', label: 'Favorite', class: 'far' },
        { name: 'star', label: 'Star', class: 'fas' },
        { name: 'arrow-right', label: 'Arrow Right', class: 'fas' },
        { name: 'arrow-left', label: 'Arrow Left', class: 'fas' },
        { name: 'chevron-down', label: 'Chevron Down', class: 'fas' },
        { name: 'chevron-up', label: 'Chevron Up', class: 'fas' },
        { name: 'plus', label: 'Add', class: 'fas' },
        { name: 'minus', label: 'Remove', class: 'fas' },
        { name: 'pen-to-square', label: 'Edit', class: 'far' },
        { name: 'trash-can', label: 'Delete', class: 'far' },
        { name: 'download', label: 'Download', class: 'fas' },
        { name: 'upload', label: 'Upload', class: 'fas' },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="h3" style={{ marginBottom: '24px' }}>Common Icons</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '16px'
            }}>
                {commonIcons.map(icon => (
                    <div key={icon.name} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--color-surface-container-low)',
                        borderRadius: '4px'
                    }}>
                        <i className={`${icon.class} fa-${icon.name}`} style={{ fontSize: '1.5rem', color: 'var(--color-on-surface-variant)' }} aria-hidden="true"></i>
                        <div className="body3-txt">{icon.label}</div>
                        <div className="body3-txt" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                            fa-{icon.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
