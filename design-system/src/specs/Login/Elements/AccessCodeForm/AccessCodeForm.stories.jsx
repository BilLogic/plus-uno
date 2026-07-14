/**
 * AccessCodeForm - Login Element
 *
 * Required access-code field with helper caption and validation message.
 * Figma: Form / Access Code — node 113:38704
 */

import React from 'react';
import AccessCodeFormSpec from './AccessCodeForm';

export default {
    title: 'Specs/Login/Elements/Access Code Form',
    component: AccessCodeFormSpec,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Access-code form with default and invalid states.',
            },
        },
    },
};

/**
 * Overview — default and invalid states.
 */
export const Overview = {
    render: () => <AccessCodeFormSpec />,
};
