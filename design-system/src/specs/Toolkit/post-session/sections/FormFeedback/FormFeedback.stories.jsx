import React from 'react';
import FormFeedback from './FormFeedback';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Form Feedback',
    component: FormFeedback,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export const Default = {
    args: {
        title: 'Reflection Submitted',
        message: 'Your reflection for this session has been successfully saved.',
        primaryAction: {
            label: 'Return to Dashboard',
            onClick: () => alert('Navigating to dashboard...')
        },
        secondaryAction: {
            label: 'Edit Reflection',
            onClick: () => alert('Editing reflection...')
        }
    },
};

export const Simple = {
    args: {
        title: 'Saved',
        message: 'Changes saved successfully.',
        primaryAction: {
            label: 'Close',
            onClick: () => { }
        }
    },
};
