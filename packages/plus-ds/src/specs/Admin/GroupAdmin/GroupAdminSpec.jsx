import React from 'react';
import { SpecOverview } from '../../SpecOverview';

export const GroupAdminSpec = () => {
    return (
        <SpecOverview
            title="Group Admin Spec"
            description="The Group Admin spec contains components for the group administration interface, allowing supervisors to manage groups, view training progress, and handle group-related tasks."
            categories={[
                { name: 'Cards', description: 'Overview and info cards for group metrics' },
                { name: 'Elements', description: 'Small UI elements specific to group admin' },
                { name: 'Modals', description: 'Dialogs for adding/editing groups' },
                { name: 'Pages', description: 'Full page layouts (Group Info, Training Progress)' },
                { name: 'Sections', description: 'Page sections and layout blocks' },
                { name: 'Tables', description: 'Data tables for groups and progress tracking' },
            ]}
        />
    );
};
