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
    title: 'Specs/Training/Lessons/Cards/AlertForSupervisors',
    component: AlertForSupervisors,
    tags: ['autodocs'],
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
 * Docs
 * Documentation page
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>AlertForSupervisors</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Alert card for supervisors reviewing student training performance. Shows whether AI-powered feedback
                was enabled or disabled for the lesson.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Info alert style when AI feature is enabled</li>
                <li>Warning alert style when AI feature is disabled</li>
                <li>Dynamic student name display</li>
                <li>Bold status text (enabled/disabled)</li>
            </ul>
        </div>
    )
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
