/**
 * AdminDateRangeFilter Stories
 * 
 * Shared date range filter component used across all Admin sections.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262321
 */

import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import AdminDateRangeFilter from './AdminDateRangeFilter';
import './AdminDateRangeFilter.scss';

export default {
    title: 'Specs/Admin/Tutor/Elements/Admin Date Range Filter',
    component: AdminDateRangeFilter,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Shared date range filter component used across all Admin sections (Group Admin, Student Admin, Session Admin, Tutor Admin).

## Features
- **School**: a single Select scoping the view to one school, or all
- **Tutor**: a single Select scoping the view to one tutor, or all
- **Date range**: From and To Selects over the offered dates
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
 * Interactive - Full functionality demo with working filters
 */
export const Interactive = {
    render: () => {
        const [selectedSchool, setSelectedSchool] = React.useState('All Schools');
        const [selectedTutor, setSelectedTutor] = React.useState('All Tutors');
        const [dateFrom, setDateFrom] = React.useState('01/10/25');
        const [dateTo, setDateTo] = React.useState('02/10/25');

        const schoolOptions = ['All Schools', 'Lincoln High School', 'Washington Middle School', 'Jefferson Elementary'];
        const tutorOptions = ['All Tutors', 'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams'];
        const dateFromOptions = ['01/10/25', '12/01/24', '11/01/24', '10/01/24'];
        const dateToOptions = ['02/10/25', '01/31/25', '12/31/24', '11/30/24'];

        return (
            <div style={{ padding: '24px', backgroundColor: 'var(--color-surface, #f9f9fc)', minHeight: '400px' }}>
                <div style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: 'var(--elevation-light-1)'
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
                        onSchoolChange={setSelectedSchool}
                        onTutorChange={setSelectedTutor}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
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
                                <strong>School:</strong> <span data-testid="applied-school">{selectedSchool}</span>
                            </p>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                <strong>Tutor:</strong> <span data-testid="applied-tutor">{selectedTutor}</span>
                            </p>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                <strong>Date Range:</strong> {dateFrom} to {dateTo}
                            </p>
                        </div>
                        <p className="body3-txt" style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                            Pick a school, a tutor or a date to change the filters
                        </p>
                    </div>
                </div>
            </div>
        );
    }
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);

    await userEvent.click(canvas.getByRole('combobox', { name: 'School' }));
    await userEvent.click(await page.findByRole('option', { name: 'Jefferson Elementary' }));
    await expect(canvas.getByTestId('applied-school')).toHaveTextContent('Jefferson Elementary');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Tutor' }));
    await userEvent.click(await page.findByRole('option', { name: 'Jane Doe' }));
    await expect(canvas.getByTestId('applied-tutor')).toHaveTextContent('Jane Doe');
};
