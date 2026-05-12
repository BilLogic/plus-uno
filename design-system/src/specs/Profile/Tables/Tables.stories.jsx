/**
 * Profile - Tables
 *
 * Index for this category. Add table-level profile stories here when specs exist.
 */
import React from 'react';

export default {
    title: 'Specs/Profile/Tables',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `Table-level Profile specs — add stories here when designs exist.

Browse **Specs / Profile** in the sidebar (same structure as Admin specs) for elements, sections, and pages.

[Profile Tables folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile/Tables)`,
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
            No table-level profile specs in this folder yet. Use other Profile categories in the sidebar.
        </p>
    ),
};
