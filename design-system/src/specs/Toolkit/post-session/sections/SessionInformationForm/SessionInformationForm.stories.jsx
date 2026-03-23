import React from 'react';
import SessionInformationForm from './SessionInformationForm';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Session Information Form',
    component: SessionInformationForm,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export const Default = {
    args: {
        initialData: {
            client: 'Kiera Wintervale',
            date: '2026-10-24',
            startTime: '16:00',
            endTime: '17:00',
            topic: 'Calculus I',
        }
    },
};

export const Empty = {
    args: {
        initialData: {}
    },
};
