/**
 * Profile Specs Overview
 *
 * Profile organism: elements, sections, modals, and full tutor profile page layouts.
 */

import React from 'react';
import { ProfileSpec } from './ProfileSpec';

export default {
    title: 'Specs/Profile',
    component: ProfileSpec,
    tags: ['!autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <ProfileSpec />,
};
