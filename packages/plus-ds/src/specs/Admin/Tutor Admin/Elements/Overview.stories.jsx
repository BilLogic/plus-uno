/**
 * Tutor Admin - Elements Overview
 * 
 * Overview of all element components in the Tutor Admin section.
 */

import React from 'react';
import CardTitleHeader from './CardTitleHeader/CardTitleHeader';
import ExportSearchFilterBar from './ExportSearchFilterBar/ExportSearchFilterBar';
import TutorChartsElement from './TutorChartsElement/TutorChartsElement';
import AdminDateRangeFilter from './AdminDateRangeFilter/AdminDateRangeFilter';
import TutorViewSelector from './TutorViewSelector/TutorViewSelector';

import './CardTitleHeader/CardTitleHeader.scss';
import './ExportSearchFilterBar/ExportSearchFilterBar.scss';
import './TutorChartsElement/TutorChartsElement.scss';
import './AdminDateRangeFilter/AdminDateRangeFilter.scss';
import './TutorViewSelector/TutorViewSelector.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements',
    parameters: {
        docs: {
            description: {
                component: `Overview of all element components used in the Tutor Admin section.
                
## Elements Included:
- **CardTitleHeader**: Header component for cards with title and optional action button
- **ExportSearchFilterBar**: Combined search and filter bar with export functionality
- **TutorChartsElement**: Chart visualization component (Pie, Bar, Line variants)
- **AdminDateRangeFilter**: Date range filter with school and tutor dropdowns
- **TutorViewSelector**: View mode selector (Table/Card toggle)
`,
            },
        },
    },
};

/**
 * Overview - All Elements
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 40px)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h2 className="h2" style={{ marginBottom: '32px', color: 'var(--color-on-surface)' }}>
                Tutor Admin - Elements
            </h2>

            {/* Card Title Header */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Card Title Header
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <CardTitleHeader
                        title="Performance Overview"
                        actionText="View Details"
                        onActionClick={() => console.log('Action clicked')}
                    />
                </div>
            </section>

            {/* Tutor View Selector */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Tutor View Selector
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <TutorViewSelector
                        selectedView="table"
                        onViewChange={(view) => console.log('View changed:', view)}
                    />
                </div>
            </section>

            {/* Admin Date Range Filter */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Admin Date Range Filter
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <AdminDateRangeFilter
                        selectedSchool="All Schools"
                        selectedTutor="All Tutors"
                        dateFrom="01/10/25"
                        dateTo="02/10/25"
                        onSchoolChange={(school) => console.log('School:', school)}
                        onTutorChange={(tutor) => console.log('Tutor:', tutor)}
                        onDateFromChange={(date) => console.log('From:', date)}
                        onDateToChange={(date) => console.log('To:', date)}
                    />
                </div>
            </section>

            {/* Export Search Filter Bar */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Export Search Filter Bar
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <ExportSearchFilterBar
                        searchPlaceholder="Search tutors..."
                        onSearch={(query) => console.log('Search:', query)}
                        onExport={() => console.log('Export clicked')}
                        filters={[
                            { label: 'All Schools', value: 'all' },
                            { label: 'School A', value: 'school-a' },
                            { label: 'School B', value: 'school-b' },
                        ]}
                        selectedFilter="all"
                        onFilterChange={(filter) => console.log('Filter:', filter)}
                    />
                </div>
            </section>

            {/* Tutor Charts Element - Pie */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Tutor Charts Element - Pie (Donut)
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <TutorChartsElement
                        variant="Pie"
                        data={{ percentage: 85, label: 'Attended' }}
                        legend={[
                            { label: 'Attended', color: '#61b5cf' },
                            { label: 'Missed', color: '#85ecd5' }
                        ]}
                    />
                </div>
            </section>

            {/* Tutor Charts Element - Bar */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Tutor Charts Element - Bar (Stacked)
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <TutorChartsElement
                        variant="Bar"
                        data={[
                            { label: '10/11', values: [12, 6] },
                            { label: '10/12', values: [16, 8] },
                            { label: '10/13', values: [12, 5] },
                            { label: '10/17', values: [12, 1] },
                            { label: '10/18', values: [20, 2] },
                        ]}
                        legend={[
                            { label: 'Attended', color: '#61b5cf' },
                            { label: 'Missed', color: '#85ecd5' }
                        ]}
                    />
                </div>
            </section>

            {/* Tutor Charts Element - Line */}
            <section style={{ marginBottom: '48px' }}>
                <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                    Tutor Charts Element - Line
                </h3>
                <div style={{
                    backgroundColor: 'var(--color-surface-container-lowest, white)',
                    padding: '24px',
                    borderRadius: '12px'
                }}>
                    <TutorChartsElement
                        variant="Line"
                        data={[
                            { label: '06/03/24', values: [5, 0] },
                            { label: '06/10/24', values: [60, 20] },
                            { label: '06/17/24', values: [55, 75] },
                            { label: '06/24/24', values: [65, 30] },
                            { label: '07/01/24', values: [20, 40] },
                        ]}
                        legend={[
                            { label: 'Tutors', color: '#004b6b' },
                            { label: 'Students', color: '#85ecd5' }
                        ]}
                    />
                </div>
            </section>
        </div>
    ),
};
