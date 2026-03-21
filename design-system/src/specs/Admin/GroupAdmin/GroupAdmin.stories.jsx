/**
 * Admin/GroupAdmin Specs
 * 
 * Components for group administration.
 */

import React from 'react';
import { GroupAdminSpec } from './GroupAdminSpec';

export default {
    title: 'Specs/Admin/Group Admin',
    component: GroupAdminSpec,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <GroupAdminSpec />,
};
