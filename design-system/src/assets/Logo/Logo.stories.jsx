import React from 'react';
import Logo from './Logo';

export default {
    title: 'Assets/Logo',
    component: Logo,
    tags: ['!dev'],
    argTypes: {
        // Appearance Group
        style: {
            control: 'select',
            options: ['colored', 'filled', 'outlined'],
            description: 'Visual style of the logo',
            table: { category: 'Appearance' }
        },
        size: {
            control: 'select',
            options: ['XS', 'S', 'M', 'L', 'XL'],
            description: 'Size variant',
            table: { category: 'Appearance' }
        },
        text: {
            control: 'boolean',
            description: 'Whether to show text wordmark',
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
                            color: 'var(--color-neutral-text-secondary)'
                        }}>
                            {style} Style
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            flexWrap: 'wrap',
                            alignItems: 'end',
                            padding: '32px',
                            backgroundColor: style === 'colored' ? 'var(--color-neutral-background-pure)' : 'var(--color-neutral-text-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-neutral-border-weak)'
                        }}>
                            {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <Logo style={style} size={size} />
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: style === 'colored' ? 'var(--color-neutral-text-tertiary)' : 'rgba(255,255,255,0.7)'
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
            <p className="body-2" style={{ marginBottom: '24px', color: 'var(--color-neutral-text-secondary)' }}>
                The text prop adds the "PLUS" wordmark. Available in all sizes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {['colored', 'filled', 'outlined'].map(style => (
                    <div key={style}>
                        <div style={{
                            marginBottom: '12px',
                            textTransform: 'capitalize',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--color-neutral-text-secondary)'
                        }}>
                            {style} Style
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '32px',
                            flexWrap: 'wrap',
                            alignItems: 'end',
                            padding: '32px',
                            backgroundColor: style === 'colored' ? 'var(--color-neutral-background-pure)' : 'var(--color-neutral-text-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-neutral-border-weak)'
                        }}>
                            {['XS', 'S', 'M'].map(size => (
                                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '12px' }}>
                                    <Logo style={style} size={size} text={true} />
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        color: style === 'colored' ? 'var(--color-neutral-text-tertiary)' : 'rgba(255,255,255,0.7)'
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

