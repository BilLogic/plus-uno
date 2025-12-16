import React from 'react';
import { SessionAdminSpec } from './SessionAdminSpec';
import { SpecOverview } from '../../SpecOverview';

export default {
    title: 'Specs/Admin/SessionAdmin',
    component: SessionAdminSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Session Admin"
        description="Administration dashboard for managing tutoring sessions, monitoring attendance, and tracking engagement metrics."
        categories={[
            {
                title: 'Key Features',
                items: [
                    'Session Metrics Overview',
                    'Detailed Session Tables',
                    'Filtering by School/Tutor/Date',
                    'Breakdown Modals'
                ]
            }
        ]}
    />
);

export const Dashboard = () => <SessionAdminSpec />;

export const WithModal = () => <SessionAdminSpec showModal={true} />;
