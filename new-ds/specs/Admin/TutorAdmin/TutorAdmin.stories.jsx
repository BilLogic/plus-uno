import React from 'react';
import { TutorAdminSpec } from './TutorAdminSpec';
import { SpecOverview } from '../../SpecOverview';

export default {
    title: 'Specs/Admin/TutorAdmin',
    component: TutorAdminSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Tutor Admin"
        description="Comprehensive dashboard for managing tutor performance, status, and tools."
        categories={[
            {
                title: 'Tabs',
                items: [
                    'Tutor Performance',
                    'Status And Warnings',
                    'Tool Usage',
                    'Training Progress'
                ]
            }
        ]}
    />
);

export const Dashboard = () => <TutorAdminSpec />;
export const WithAddTutorModal = () => <TutorAdminSpec showModal={true} />;
