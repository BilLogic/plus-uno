import React from 'react';
import { SpecOverview } from '../../SpecOverview';

export const TutorAdminSpec = () => {
    return (
        <SpecOverview
            title="Tutor Admin Spec"
            description="The Tutor Admin spec contains components for tutor administration, including performance dashboards, status monitoring, and tutor record management."
            categories={[
                { name: 'Cards', description: 'Overview and data visualization cards for tutor metrics' },
                { name: 'Elements', description: 'Interactive elements and shared filters' },
                { name: 'Modals', description: 'Dialogs for editing tutor profiles and session history' },
                { name: 'Pages', description: 'Full page layouts for tutor performance and management' },
                { name: 'Sections', description: 'Page sections and data visualization blocks' },
                { name: 'Tables', description: 'Data tables for tutor records and performance details' },
            ]}
        />
    );
};
