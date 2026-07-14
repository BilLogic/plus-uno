/**
 * InstitutionForm - Login Element
 *
 * Labeled field + caption for registering with an institution vs entering a name.
 * Figma: Form / Institution Selection — node 113:41985
 */

import React from 'react';
import InstitutionFormSpec from './InstitutionForm';

export default {
    title: 'Specs/Login/Elements/Institution Form',
    component: InstitutionFormSpec,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Institution selection form variants: official and independent.',
            },
        },
    },
};

/**
 * Overview — official and independent variants.
 */
export const Overview = {
    render: () => <InstitutionFormSpec />,
};
