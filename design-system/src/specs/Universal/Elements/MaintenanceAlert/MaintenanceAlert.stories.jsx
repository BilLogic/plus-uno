/**
 * MaintenanceAlert - Universal Element
 *
 * Scheduled maintenance banner shown at the top of the main content area.
 * Figma Spec: node-id=2370-194322
 */

import React from 'react';
import MaintenanceAlert from './MaintenanceAlert';

export default {
    title: 'Specs/Universal/Elements/Maintenance Alert',
    component: MaintenanceAlert,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Scheduled-maintenance announcement banner. Built on top of the PLUS Alert component with the warning style, a fixed title, and a maintenance-window message with emphasized start/end times.`
            }
        }
    }
};

/**
 * Overview
 * Default maintenance banner with the canonical message from Figma.
 */
export const Overview = {
    render: () => (
        <div style={{ maxWidth: '672px' }}>
            <MaintenanceAlert />
        </div>
    )
};

/**
 * Interactive
 * Edit every piece of copy and toggle the dismiss button inline.
 */
export const Interactive = {
    render: (args) => (
        <div style={{ maxWidth: '672px' }}>
            <MaintenanceAlert {...args} />
        </div>
    ),
    args: {
        title: 'Scheduled Maintenance',
        greeting: 'Hello tutor,',
        intro: 'please note that the PLUS app will undergo scheduled maintenance from',
        startTime: 'August 1st at 9:00 PM EST',
        endTime: 'August 2nd at 01:00 AM EST',
        closing: 'We appreciate your patience. Good luck with your upcoming sessions :-)',
        dismissable: true,
    },
    argTypes: {
        title: { control: 'text', table: { category: 'Content' } },
        greeting: { control: 'text', table: { category: 'Content' } },
        intro: { control: 'text', table: { category: 'Content' } },
        startTime: { control: 'text', table: { category: 'Content' } },
        endTime: { control: 'text', table: { category: 'Content' } },
        closing: { control: 'text', table: { category: 'Content' } },
        dismissable: { control: 'boolean', table: { category: 'Behavior' } },
    }
};
