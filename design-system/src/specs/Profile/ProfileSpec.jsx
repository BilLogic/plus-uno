import React from 'react';
import { SpecOverview } from '../SpecOverview';

export const ProfileSpec = () => {
    return (
        <SpecOverview
            title="Profile Organism"
            description="The Profile organism combines multiple components to create complete profile management experiences. It is organized into the following categories:"
            categories={[
                { name: 'Elements', description: 'Individual form elements and UI components (tutor profile select dropdown)' },
                { name: 'Cards', description: 'Card components (to be added as needed)' },
                { name: 'Tables', description: 'Table components' },
                { name: 'Modals', description: 'Modal dialogs' },
                { name: 'Sections', description: 'Section-level components' },
                { name: 'Pages', description: 'Complete page-level components (tutor profile page)' },
            ]}
        />
    );
};
