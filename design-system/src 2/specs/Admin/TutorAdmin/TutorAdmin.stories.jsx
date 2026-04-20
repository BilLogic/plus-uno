/**
 * Admin/TutorAdmin Specs
 * 
 * Components for tutor administration.
 */

import React from 'react';
import { TutorAdminSpec } from './TutorAdminSpec';

export default {
    title: 'Specs/Admin/Tutor Admin',
    component: TutorAdminSpec,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <TutorAdminSpec />,
};
