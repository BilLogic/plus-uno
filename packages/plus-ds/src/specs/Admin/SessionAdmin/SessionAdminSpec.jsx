import React from 'react';
import { SpecOverview } from '../../SpecOverview';

export const SessionAdminSpec = () => {
    return (
        <SpecOverview
            title="Session Admin Spec"
            description="Components for session administration, including dashboards, overview metrics, session details tables, and breakdown modals."
            categories={[
                { name: 'Cards', description: 'Metric cards for session statistics' },
                { name: 'Elements', description: 'Interactive elements specific to sessions' },
                { name: 'Modals', description: 'Breakdown and detail dialogs' },
                { name: 'Pages', description: 'Main Session Admin dashboard' },
                { name: 'Sections', description: 'Overview and detail sections' },
                { name: 'Tables', description: 'Sessions list and breakdown tables' },
            ]}
        />
    );
};
