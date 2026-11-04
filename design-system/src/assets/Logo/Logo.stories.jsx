import React from 'react';
import Logo from './Logo';

export default {
    title: 'Components/Images and icons/Logo',
    component: Logo,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        // Appearance Group
        appearance: {
            control: 'select',
            options: ['colored', 'filled', 'outlined'],
            description: 'Colorway of the logo',
            table: { category: 'Appearance' }
        },
        size: {
            control: 'select',
            options: [60, 96, 132, 192, 224],
            description: 'Frame height in pixels',
            table: { category: 'Appearance' }
        },
        wordmark: {
            control: 'boolean',
            description: 'Show the PLUS wordmark beside the logomark',
            table: { category: 'Appearance' }
        },
        // Development Group
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of all Logo styles, sizes, and variations.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* 1. Style Showcase */}
        <section>
            <h6 className="h6" style={{ marginBottom: '24px' }}>Styles & Sizes</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {['colored', 'filled', 'outlined'].map(style => (
                    <div key={style}>
                        <div style={{
                            marginBottom: '12px',
                            textTransform: 'capitalize',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--ds-text-subtle)'
                        }}>
                            {style} Style
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            flexWrap: 'wrap',
                            alignItems: 'end',
                            padding: '32px',
                            backgroundColor: style === 'colored' ? 'var(--ds-surface-raised)' : 'var(--ds-background-neutral-bold)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-outline-variant)'
                        }}>
                            {[60, 96, 132, 192, 224].map(size => (
                                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <Logo appearance={style} size={size} />
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: style === 'colored' ? 'var(--ds-text-subtle)' : 'rgba(255,255,255,0.7)'
                                    }}>
                                        {size}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* 2. With Text Wordmark */}
        <section>
            <h6 className="h6" style={{ marginBottom: '24px' }}>With Wordmark</h6>
            <p className="body-2" style={{ marginBottom: '24px', color: 'var(--ds-text-subtle)' }}>
                The wordmark prop adds the "PLUS" wordmark. Available in all sizes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {['colored', 'filled', 'outlined'].map(style => (
                    <div key={style}>
                        <div style={{
                            marginBottom: '12px',
                            textTransform: 'capitalize',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--ds-text-subtle)'
                        }}>
                            {style} Style
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '32px',
                            flexWrap: 'wrap',
                            alignItems: 'end',
                            padding: '32px',
                            backgroundColor: style === 'colored' ? 'var(--ds-surface-raised)' : 'var(--ds-background-neutral-bold)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-outline-variant)'
                        }}>
                            {[60, 96, 132].map(size => (
                                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '12px' }}>
                                    <Logo appearance={style} size={size} wordmark />
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: style === 'colored' ? 'var(--ds-text-subtle)' : 'rgba(255,255,255,0.7)'
                                    }}>
                                        {size}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

