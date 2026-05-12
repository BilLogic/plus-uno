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
        docs: {
            description: {
                component: `Profile spec for tutor profile — same navigation model as **Specs / Admin**: use the sidebar groups (**Elements**, **Sections**, **Modals**, **Pages**, **Cards**, **Tables**) and open each component’s stories for canvas, controls, and docs.

[Figma — Tutor Profile](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5615-214865)
[Profile spec folder](https://github.com/BilLogic/plus-uno/tree/main/design-system/src/specs/Profile)

Start from **Overview** on this page for a category map. Each leaf profile spec lives in **one CSF file**: doc blocks use **parameters.docs.page** in that same file (no sibling `.mdx`). Open the **Docs** tab while viewing any story to see Figma/GitHub, canvases, and inline controls together. Category **Overview** / **Index** hubs still provide linkTo shortcuts.`,
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = {
    render: () => <ProfileSpec />,
};
