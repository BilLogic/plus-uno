import React, { useState } from 'react';
import LinearScale from './LinearScale';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Linear Scale',
    component: LinearScale,
    parameters: { layout: 'padded' },
};

const galleryLabel = {
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-on-surface-variant)',
    fontWeight: 600,
    display: 'block',
    marginBottom: 'var(--size-element-gap-sm)',
};

/**
 * Empty + selected (4) — matches Figma Sections · Linear Scale.
 */
export const Overview = {
    render: function LinearScaleOverview() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-lg)',
                    maxWidth: 'var(--col-8)',
                }}
            >
                <section>
                    <span style={galleryLabel}>Empty</span>
                    <LinearScale name="linear-scale-empty" value={0} />
                </section>
                <section>
                    <span style={galleryLabel}>Selected</span>
                    <LinearScale name="linear-scale-selected" value={4} />
                </section>
            </div>
        );
    },
};

/**
 * Clickable 1–5 scale (Self Reflection copy).
 */
export const Interactive = {
    render: function LinearScaleInteractive() {
        const [value, setValue] = useState(4);
        return (
            <div style={{ maxWidth: 'var(--col-8)' }}>
                <LinearScale value={value} onChange={setValue} />
            </div>
        );
    },
};
