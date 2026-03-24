import React from 'react';
import Badge from './Badge';

export default {
    title: 'Components/Badge',
    component: Badge,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Internal subcomponents of the Badge: The Badge Content (Text + Visuals) and the Counter.',
            },
        },
    },
};

/**
 * Badge Content
 * Demonstrates the composition of text and visuals (Leading/Trailing).
 */
export const BadgeContent = () => (
    <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--color-on-surface-variant)', margin: 0, marginBottom: '8px' }}>
            Note: Badges displayed in their natural state (minimal styling) to demonstrate structure.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Badge text="Text Only" style="secondary" fill="outline" />
            <Badge text="Text + Leading Visual" leadingVisual={<i className="fa-solid fa-star"></i>} style="secondary" fill="outline" />
            <Badge text="Text + Trailing Visual" trailingVisual={<i className="fa-solid fa-check"></i>} style="secondary" fill="outline" />
        </div>
    </div>
);

/**
 * Counter
 * The numeric or text indicator within a badge.
 */
export const Counter = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Visualizing Counter in context */}
        <Badge text="Inbox" counter="12" style="primary" />
        <Badge text="Messages" counter="99+" style="secondary" />
    </div>
);
