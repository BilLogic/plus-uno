/**
 * Profile - Cards
 *
 * Index for this category. Add card-level profile stories here when specs exist.
 */
import React from 'react';

export default {
    title: 'Specs/Profile/Cards',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Card-level components for Profile pages (none published in Storybook yet).',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
            No card-level profile specs in this folder yet. Use other Profile categories in the sidebar.
        </p>
    ),
};
