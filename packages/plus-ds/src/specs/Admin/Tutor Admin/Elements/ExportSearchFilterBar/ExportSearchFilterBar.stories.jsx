/**
 * ExportSearchFilterBar - Tutor Admin Element
 * 
 * Action bar with Export CSV, search, and filter dropdowns.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370346
 */

import React, { useState } from 'react';
import ExportSearchFilterBar from './ExportSearchFilterBar';
import './ExportSearchFilterBar.scss';

const defaultFilters = [
    { key: 'lessons', label: 'All Lessons' },
    { key: 'startDate', label: 'All Start Date' },
    { key: 'name', label: 'Name', sortable: true },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/ExportSearchFilterBar',
    component: ExportSearchFilterBar,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Action bar component with Export CSV button, search input, and filter dropdowns.

## Figma Reference
Node ID: 433-370346

## Features
- Export CSV button with download icon
- Search input with magnifying glass icon
- Multiple filter dropdowns
- Sortable filter support (double caret for Name)
`,
            },
        },
    },
    argTypes: {
        exportLabel: {
            control: 'text',
            description: 'Export button label',
            table: { category: 'Content' },
        },
        searchPlaceholder: {
            control: 'text',
            description: 'Search input placeholder',
            table: { category: 'Content' },
        },
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>ExportSearchFilterBar</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Action bar component combining export functionality, search, and multiple filter dropdowns.
                        Used in Tutor Admin tables and data views.
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Export Search Filter Bar</h6>
            <ExportSearchFilterBar
                filters={defaultFilters}
                onExport={() => console.log('Export clicked')}
                onSearch={(value) => console.log('Search:', value)}
                onFilterChange={(key) => console.log('Filter changed:', key)}
                onSort={(key) => console.log('Sort:', key)}
            />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [selectedFilters, setSelectedFilters] = useState({});

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Export Search Filter Bar - Interactive
                </h6>
                <ExportSearchFilterBar
                    exportLabel={args.exportLabel}
                    searchPlaceholder={args.searchPlaceholder}
                    filters={defaultFilters}
                    selectedFilters={selectedFilters}
                    onExport={() => console.log('Export clicked')}
                    onSearch={(value) => console.log('Search:', value)}
                    onFilterChange={(key) => {
                        console.log('Filter changed:', key);
                        setSelectedFilters({ ...selectedFilters, [key]: 'Selected' });
                    }}
                    onSort={(key) => console.log('Sort:', key)}
                />
            </div>
        );
    },
    args: {
        exportLabel: 'Export CSV',
        searchPlaceholder: 'Search',
    },
};
