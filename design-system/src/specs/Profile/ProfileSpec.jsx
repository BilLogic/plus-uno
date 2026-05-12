import React from 'react';
import { SpecOverview } from '../SpecOverview';

export const ProfileSpec = () => {
    return (
        <SpecOverview
            title="Profile Spec"
            description="The Profile spec contains components for tutor profile management — form elements, sections, modals, and the full tutor profile page. It is organized into the following categories:"
            categories={[
                { name: 'Cards', description: 'Card-level profile specs (placeholder until designs land)' },
                { name: 'Elements', description: 'Form controls, tooltips, and small profile UI pieces' },
                { name: 'Modals', description: 'Dialogs such as preview image and unsaved changes' },
                { name: 'Pages', description: 'Full tutor profile shell and responsive layouts' },
                { name: 'Sections', description: 'Profile page sections (basic info, background, status)' },
                { name: 'Tables', description: 'Table-level profile specs (placeholder until designs land)' },
            ]}
        />
    );
};
