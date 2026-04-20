import React from 'react';
import { SpecOverview } from '../../SpecOverview';

export const StudentAdminSpec = () => {
    return (
        <SpecOverview
            title="Student Admin Spec"
            description="The Student Admin spec contains components for student administration, including profile management, performance tracking, and shift scheduling."
            categories={[
                { name: 'Cards', description: 'Overview and detail cards for student metrics' },
                { name: 'Elements', description: 'Small UI elements specific to student admin' },
                { name: 'Modals', description: 'Dialogs for editing student info and viewing sessions' },
                { name: 'Pages', description: 'Full page layouts for student management' },
                { name: 'Sections', description: 'Page sections and visualization blocks' },
                { name: 'Tables', description: 'Data tables for student records and analytics' },
            ]}
        />
    );
};
