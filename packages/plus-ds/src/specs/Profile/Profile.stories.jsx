import React from 'react';
import { ProfileSpec } from './ProfileSpec';

export default {
    title: 'Specs/Profile',
    component: ProfileSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => <ProfileSpec />;
