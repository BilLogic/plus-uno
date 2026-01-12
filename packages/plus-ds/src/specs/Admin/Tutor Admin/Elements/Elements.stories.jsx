/**
 * Tutor Admin - Elements Overview
 * 
 * Overview of element components in the Tutor Admin section.
 */

import React from 'react';
import CardTitleHeader from './CardTitleHeader/CardTitleHeader';
import ExportSearchFilterBar from './ExportSearchFilterBar/ExportSearchFilterBar';
import TutorChartsElement from './TutorChartsElement/TutorChartsElement';
import { AdminDateRangeFilter } from '../../../Elements';
import './CardTitleHeader/CardTitleHeader.scss';
import './ExportSearchFilterBar/ExportSearchFilterBar.scss';
import './TutorChartsElement/TutorChartsElement.scss';
import '../../../Elements/AdminDateRangeFilter/AdminDateRangeFilter.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements',
    parameters: {
        docs: {
            description: {
                component: `Element components used in the Tutor Admin section.

## Elements (4 total)

### 1. AdminDateRangeFilter (Shared)
School/tutor/date range filters (Figma Node: 258-262321)
- **Location**: \`Admin/Elements/AdminDateRangeFilter\` (shared across all Admin sections)
- **Usage**: Import from \`Admin/Elements\` - do not duplicate

### 2. CardTitleHeader
Simple header with title and info icon (Figma Node: 258-262205)
- Title text with h4 styling
- Optional info icon with tooltip
- Used in card headers and section titles

### 3. ExportSearchFilterBar
Action bar with Export CSV, search, and filters (Figma Node: 433-370346)
- Export CSV button with download icon
- Search input with magnifying glass
- Multiple filter dropdowns
- Sortable filter support

### 4. TutorChartsElement
Three chart types: Donut, Stacked Bar, Line (Figma Node: 258-262214)
- Donut chart with percentage and legend
- Stacked bar chart with segment values
- Line chart with trend visualization
`,
            },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '1200px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Elements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* Element 1: AdminDateRangeFilter (Shared) */}
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>1. AdminDateRangeFilter (Shared)</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        School/tutor/date range filters - shared across all Admin sections.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                        Figma Node: 258-262321 | Location: Admin/Elements (shared)
                    </p>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <AdminDateRangeFilter
                            onSchoolChange={() => console.log('School clicked')}
                            onTutorChange={() => console.log('Tutor clicked')}
                            onDateFromChange={() => console.log('Date from clicked')}
                            onDateToChange={() => console.log('Date to clicked')}
                        />
                    </div>
                </section>

                {/* Element 2: CardTitleHeader */}
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>2. CardTitleHeader</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Simple header element with title text and optional info icon.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                        Figma Node: 258-262205
                    </p>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <CardTitleHeader
                            title="Card Title"
                            tooltip="This is a tooltip"
                        />
                    </div>
                </section>

                {/* Element 3: ExportSearchFilterBar */}
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>3. ExportSearchFilterBar</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Action bar with Export CSV button, search input, and filter dropdowns.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                        Figma Node: 433-370346
                    </p>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <ExportSearchFilterBar
                            filters={[
                                { key: 'lessons', label: 'All Lessons' },
                                { key: 'startDate', label: 'All Start Date' },
                                { key: 'name', label: 'Name', sortable: true },
                            ]}
                            onExport={() => console.log('Export clicked')}
                            onSearch={(value) => console.log('Search:', value)}
                            onFilterChange={(key) => console.log('Filter changed:', key)}
                            onSort={(key) => console.log('Sort:', key)}
                        />
                    </div>
                </section>

                {/* Element 4: TutorChartsElement */}
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>4. TutorChartsElement</h4>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>
                        Element displaying three chart types: Donut, Stacked Bar, and Line charts.
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                        Figma Node: 258-262214
                    </p>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container)', borderRadius: '8px' }}>
                        <TutorChartsElement
                            donutPercentage={0}
                            donutSubtitle="ABC"
                        />
                    </div>
                </section>
            </div>
        </div>
    ),
};
