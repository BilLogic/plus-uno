import React from 'react';
import StudentReflectionForm from './StudentReflectionForm';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Student Reflection Form',
    component: StudentReflectionForm,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export const Default = {
    args: {
        studentName: 'Kiera Wintervale',
        initialData: {
            attendance: 'present',
            engagement: '4',
            understanding: '5',
            comments: 'Kiera was very engaged today and seemed to grasp the concepts quickly.',
        }
    },
};

export const Empty = {
    args: {
        studentName: 'Baxter Ellington',
        initialData: {}
    },
};
