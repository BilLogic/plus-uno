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
                component: `Card-level Profile specs — add stories here when designs exist.

Browse **Elements**, **Sections**, and **Pages** under **Specs / Profile** for live profile pieces until card-level specs exist.

[Profile Cards folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Cards)`,
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
