/**
 * Admin/TutorAdmin Specs
 * 
 * Components for tutor administration.
 */

import React from 'react';
import { TutorAdminSpec } from './TutorAdminSpec';

export default {
    title: 'Specs/Admin/Tutor Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing tutors.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <TutorAdminSpec />,
};
