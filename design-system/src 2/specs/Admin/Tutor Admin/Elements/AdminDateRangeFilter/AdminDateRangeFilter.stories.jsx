/**
 * AdminDateRangeFilter Stories
 * 
 * Shared date range filter component used across all Admin sections.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262321
 */

import React from 'react';
import AdminDateRangeFilter from './AdminDateRangeFilter';
import './AdminDateRangeFilter.scss';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements/AdminDateRangeFilter',
    component: AdminDateRangeFilter,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Shared date range filter component used across all Admin sections (Group Admin, Student Admin, Session Admin, Tutor Admin).

## Features
- **School Dropdown**: Filter by school with selectable options
- **Tutor Dropdown**: Filter by tutor with selectable options
- **Date Range**: From/To date pickers with primary outlined buttons
- **Consistent Spacing**: 12px gap between groups, 8px gap within groups

Matches Figma: node-id=258-262321`
            }
        }
    }
};

/**
 * Overview - Default state with all filters
 */
export const Overview = {
    args: {
        selectedSchool: 'All Schools',
        selectedTutor: 'All Tutors',
        dateFrom: '01/10/25',
        dateTo: '02/10/25'
    },
    render: (args) => (
        <div style={{ padding: '24px', backgroundColor: 'var(--color-surface, #f9f9fc)' }}>
            <h3 className="h3" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                Admin Date Range Filter
            </h3>
            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Shared filter component with school, tutor, and date range selectors.
            </p>
            <div style={{
                padding: '20px',
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '8px',
                border: '1px solid var(--color-outline-variant)'
            }}>
                <AdminDateRangeFilter {...args} />
            </div>
        </div>
    )
};

/**
 * Interactive - Full functionality demo with working dropdowns
 */
export const Interactive = {
    render: () => {
        const [selectedSchool, setSelectedSchool] = React.useState('All Schools');
        const [selectedTutor, setSelectedTutor] = React.useState('All Tutors');
        const [dateFrom, setDateFrom] = React.useState('01/10/25');
        const [dateTo, setDateTo] = React.useState('02/10/25');

        const schoolOptions = [
            { text: 'All Schools', onClick: () => setSelectedSchool('All Schools') },
            { text: 'Lincoln High School', onClick: () => setSelectedSchool('Lincoln High School') },
            { text: 'Washington Middle School', onClick: () => setSelectedSchool('Washington Middle School') },
            { text: 'Jefferson Elementary', onClick: () => setSelectedSchool('Jefferson Elementary') }
        ];

        const tutorOptions = [
            { text: 'All Tutors', onClick: () => setSelectedTutor('All Tutors') },
            { text: 'John Smith', onClick: () => setSelectedTutor('John Smith') },
            { text: 'Jane Doe', onClick: () => setSelectedTutor('Jane Doe') },
            { text: 'Mike Johnson', onClick: () => setSelectedTutor('Mike Johnson') },
            { text: 'Sarah Williams', onClick: () => setSelectedTutor('Sarah Williams') }
        ];

        const dateFromOptions = [
            { text: '01/10/25', onClick: () => setDateFrom('01/10/25') },
            { text: '12/01/24', onClick: () => setDateFrom('12/01/24') },
            { text: '11/01/24', onClick: () => setDateFrom('11/01/24') },
            { text: '10/01/24', onClick: () => setDateFrom('10/01/24') }
        ];

        const dateToOptions = [
            { text: '02/10/25', onClick: () => setDateTo('02/10/25') },
            { text: '01/31/25', onClick: () => setDateTo('01/31/25') },
            { text: '12/31/24', onClick: () => setDateTo('12/31/24') },
            { text: '11/30/24', onClick: () => setDateTo('11/30/24') }
        ];

        return (
            <div style={{ padding: '24px', backgroundColor: 'var(--color-surface, #f9f9fc)', minHeight: '400px' }}>
                <div style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: 'var(--elevation-1)'
                }}>
                    <h4 className="h4" style={{ marginBottom: '16px', color: 'var(--color-on-surface)' }}>
                        Filter Controls
                    </h4>

                    <AdminDateRangeFilter
                        selectedSchool={selectedSchool}
                        selectedTutor={selectedTutor}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        schoolOptions={schoolOptions}
                        tutorOptions={tutorOptions}
                        dateFromOptions={dateFromOptions}
                        dateToOptions={dateToOptions}
                    />

                    <div style={{
                        marginTop: '32px',
                        padding: '16px',
                        backgroundColor: 'var(--color-surface-container)',
                        borderRadius: '8px'
                    }}>
                        <h5 className="h6" style={{ marginBottom: '12px', color: 'var(--color-on-surface)' }}>
                            Current Filters:
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                <strong>School:</strong> {selectedSchool}
                            </p>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                <strong>Tutor:</strong> {selectedTutor}
                            </p>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                <strong>Date Range:</strong> {dateFrom} to {dateTo}
                            </p>
                        </div>
                        <p className="body3-txt" style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                            Click the dropdowns to select different options
                        </p>
                    </div>
                </div>
            </div>
        );
    }
};
