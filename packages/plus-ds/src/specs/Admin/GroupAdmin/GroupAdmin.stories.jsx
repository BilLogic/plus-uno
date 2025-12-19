import React from 'react';
import { GroupAdminSpec } from './GroupAdminSpec';
import { SpecOverview } from '../../SpecOverview';

export default {
    title: 'Specs/Admin/GroupAdmin',
    component: GroupAdminSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Group Admin"
        description="Dashboard for managing student groups and tracking group-level training progress."
        categories={[
            {
                title: 'Features',
                items: [
                    'Group List Management',
                    'Add/Edit Groups',
                    'Training Progress Tracking (Tab)'
                ]
            }
        ]}
    />
);

export const Dashboard = () => <GroupAdminSpec />;
