/**
 * InstitutionSelection - Login Element
 *
 * Dropdown states: empty · open · typing · filled.
 * Figma: Dropdown / Institution Selection — node 112:1815
 */

import React from 'react';
import InstitutionSelection from './InstitutionSelection';

export default {
    title: 'Specs/Login/Elements/Institution Selection',
    component: InstitutionSelection,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Institution selection dropdown with empty, open, typing, and filled states.',
            },
        },
    },
};

/**
 * Overview — all dropdown states in one spec strip.
 */
export const Overview = {
    render: () => <InstitutionSelection />,
};
