/**
 * ExportSearchFilterBar - Tutor Admin Element
 *
 * Action bar with Export CSV, search, filters and sort.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370346
 */

import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import ExportSearchFilterBar from './ExportSearchFilterBar';
import './ExportSearchFilterBar.scss';

export default {
    title: 'Specs/Admin/Tutor/Elements/Export Search Filter Bar',
    component: ExportSearchFilterBar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Action bar component with Export CSV button, search input, filters and sort.

## Figma Reference
Node ID: 433-370346

## Features
- Export CSV button with download icon
- Search input with magnifying glass icon
- Filters as Selects: pick-many filters apply when their list closes; with nothing picked they read "All …"
- Sort as a single Select
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
 * Overview
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Export Search Filter Bar</h6>
            <ExportSearchFilterBar />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [selectedFilters, setSelectedFilters] = useState({ lessons: [], startDate: '' });
        const [sortBy, setSortBy] = useState('name-az');

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)', minHeight: '320px' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>
                    Export Search Filter Bar - Interactive
                </h6>
                <ExportSearchFilterBar
                    exportLabel={args.exportLabel}
                    searchPlaceholder={args.searchPlaceholder}
                    selectedFilters={selectedFilters}
                    onFilterChange={(key, value) => setSelectedFilters({ ...selectedFilters, [key]: value })}
                    sortBy={sortBy}
                    onSort={setSortBy}
                />
                <p className="body3-txt" style={{ marginTop: 'var(--size-element-gap-lg)' }}>
                    Lessons: <strong data-testid="applied-lessons">{selectedFilters.lessons.join(', ') || 'all'}</strong>
                    {' · '}Sort: <strong data-testid="applied-sort">{sortBy}</strong>
                </p>
            </div>
        );
    },
    args: {
        exportLabel: 'Export CSV',
        searchPlaceholder: 'Search',
    },
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const lessons = canvas.getByTestId('applied-lessons');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Lessons' }));
    await userEvent.click(await page.findByRole('option', { name: 'Math 101' }));
    await userEvent.click(await page.findByRole('option', { name: 'History 101' }));
    await expect(lessons).toHaveTextContent('all');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(lessons).toHaveTextContent('math-101, history-101'));

    await userEvent.click(canvas.getByRole('combobox', { name: 'Sort' }));
    await userEvent.click(await page.findByRole('option', { name: 'Name Z-A' }));
    await expect(canvas.getByTestId('applied-sort')).toHaveTextContent('name-za');
};
