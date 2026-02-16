import React from 'react';
import SessionReflectionForm from './SessionReflectionForm';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Session Reflection Form',
    component: SessionReflectionForm,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export const Default = {
    args: {
        initialData: {
            successes: 'The group activity went really well, everyone participated.',
            challenges: 'Managing time validation was a bit tricky.',
            nextSteps: 'Focus on time management strategies next time.',
        }
    },
};

export const Empty = {
    args: {
        initialData: {}
    },
};
