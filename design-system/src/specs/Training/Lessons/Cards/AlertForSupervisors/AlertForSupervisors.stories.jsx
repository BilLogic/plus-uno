/**
 * AlertForSupervisors - Training Lessons Card
 * 
 * Alert card for supervisors reviewing student training performance.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177693
 */

import React from 'react';
import AlertForSupervisors from './AlertForSupervisors';
import './AlertForSupervisors.scss';

export default {
    title: 'Specs/Training/Lessons/Cards/Alert For Supervisors',
    component: AlertForSupervisors,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Alert card for supervisors about AI features. Supports enabled and disabled states.',
            },
        },
    },
    argTypes: {
        aiFeature: {
            control: 'boolean',
            description: 'Whether AI feature is enabled',
            table: { category: 'State' }
        },
        studentName: {
            control: 'text',
            description: 'Student name to display',
            table: { category: 'Content' }
        }
    }
};

/**
 * Overview
 * Shows both enabled and disabled states
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-start'
        }}>
            <AlertForSupervisors 
                aiFeature={true}
                studentName="Sarah Johnson"
            />
            <AlertForSupervisors 
                aiFeature={false}
                studentName="Michael Chen"
            />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <AlertForSupervisors
                aiFeature={args.aiFeature}
                studentName={args.studentName}
            />
        </div>
    ),
    args: {
        aiFeature: true,
        studentName: '[Student Name]'
    }
};
