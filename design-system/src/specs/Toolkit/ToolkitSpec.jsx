import React from 'react';
import { SpecOverview } from '../SpecOverview';

export const ToolkitSpec = () => {
    return (
        <SpecOverview
            title="Toolkit Organism"
            description="The Toolkit organism combines multiple components to create complete toolkit experiences. It is organized into the following categories:"
            categories={[
                { name: 'Elements', description: 'Individual form elements and components' },
                { name: 'Cards', description: 'Card components (call-off alerts)' },
                { name: 'Tables', description: 'Table components (sessions, call-offs, sign-ups, reflections)' },
                { name: 'Modals', description: 'Modal dialogs (view tutors, session sign-up, etc.)' },
                { name: 'Sections', description: 'Section-level components' },
                { name: 'Pages', description: 'Complete page-level components (session info, dashboards)' },
            ]}
        />
    );
};
