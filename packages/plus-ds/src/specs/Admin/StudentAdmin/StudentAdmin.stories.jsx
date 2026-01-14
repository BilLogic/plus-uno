/**
 * Admin/StudentAdmin Specs
 * 
 * Components for student administration.
 */

import React from 'react';
import { StudentAdminSpec } from './StudentAdminSpec';

export default {
    title: 'Specs/Admin/Student Admin',
    component: StudentAdminSpec,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <StudentAdminSpec />,
};
