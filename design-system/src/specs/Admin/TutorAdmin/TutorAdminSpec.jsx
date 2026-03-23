import React from 'react';
import { SpecOverview } from '../../SpecOverview';

export const TutorAdminSpec = () => {
    return (
        <SpecOverview
            title="Tutor Admin Spec"
            description="The Tutor Admin spec contains components for tutor administration, including performance monitoring, shift management, and tutor profile details."
            categories={[
                { name: 'Cards', description: 'Overview cards for tutor performance and metrics' },
                { name: 'Elements', description: 'Small UI elements specific to tutor admin' },
                { name: 'Modals', description: 'Dialogs for editing tutor info' },
                { name: 'Pages', description: 'Full page layouts for tutor management' },
                { name: 'Sections', description: 'Page sections and visualization blocks' },
                { name: 'Tables', description: 'Data tables for tutor records and shifts' },
            ]}
        />
    );
};
