import React from 'react';
import { SessionAdminSpec } from './SessionAdminSpec';

export default {
    title: 'Specs/Admin/Session Admin',
    component: SessionAdminSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = {
    render: () => <SessionAdminSpec />,
};
