/**
 * Toast Stories
 * 
 * Matches Figma design: node-id=63-178085
 */

import React from 'react';
import Toast from './Toast';

export default {
    title: 'Specs/Training/TrainingLessons/Elements/Toast',
    component: Toast,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'A robust toast notification component with header and body actions. Matches "Congratulations!" style from Figma.',
            },
        },
    },
    argTypes: {
        title: { control: 'text' },
        message: { control: 'text' },
        actionLabel: { control: 'text' },
        show: { control: 'boolean' }
    }
};

/**
 * Overview
 * The primary use case matching the Figma screenshot.
 */
export const Overview = {
    render: (args) => (
        <div style={{ padding: '40px', background: '#e0e5eb' }}>
            {/* Background color set to differentiate the white toast body */}
            <Toast {...args} />
        </div>
    ),
    args: {
        title: 'Congratulations!',
        message: "You've unlocked a new badge for completing all training lessons.",
        actionLabel: 'Claim My Badge',
        onClose: () => alert('Close clicked!'),
        onAction: () => alert('Action clicked!'),
        show: true
    }
};

/**
 * Interactive
 * Toggle visibility
 */
export const Interactive = {
    render: (args) => {
        const [show, setShow] = React.useState(true);
        return (
            <div style={{ padding: '40px', background: '#ccc' }}>
                <button
                    onClick={() => setShow(!show)}
                    style={{ marginBottom: '20px', padding: '8px 16px' }}
                >
                    {show ? 'Hide Toast' : 'Show Toast'}
                </button>
                <Toast
                    {...args}
                    show={show}
                    onClose={() => setShow(false)}
                />
            </div>
        );
    },
    args: {
        title: 'Notification',
        message: 'This is an interactive toast example.',
        actionLabel: 'Undo',
        onAction: () => alert('Undo action!')
    }
};
