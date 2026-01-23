import React from 'react';
import LessonListSection from './LessonListSection';

export default {
    title: 'Specs/Training/Lessons/Sections/LessonListSection',
    component: LessonListSection,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'My Students table section. Matches Figma node 686-296266 using PLUS design system tokens.',
            },
        },
    },
    argTypes: {
        title: { control: 'text' },
        onViewAll: { action: 'view all clicked' },
    }
};

const sampleStudents = [
    { id: 1, name: 'Hermione Granger', status: 'Needs Motivation', focusArea: null },
    { id: 2, name: 'Ron Weasley', status: 'Needs Motivation', focusArea: null },
    { id: 3, name: 'Harry Potter', status: 'Needs Motivation', focusArea: null },
    { id: 4, name: 'Luna Lovegood', status: 'Needs Motivation', focusArea: 'relationships' },
    { id: 5, name: 'Draco Malfoy', status: 'Needs Motivation', focusArea: 'advocacy' },
    { id: 6, name: 'Neville Longbottom', status: 'On Track', focusArea: 'socio-emotional' },
    { id: 7, name: 'Ginny Weasley', status: 'Excelling', focusArea: 'mastering-content' }
];

export const Overview = {
    args: {
        title: 'My Students',
        students: sampleStudents.slice(0, 5), // Match Figma with 5 students
        onViewAll: () => console.log('View All clicked'),
    },
    render: (args) => <div style={{ maxWidth: '800px' }}><LessonListSection {...args} /></div>
};

export const Interactive = {
    args: {
        title: 'My Students',
        students: sampleStudents,
        onViewAll: () => console.log('View All clicked'),
    },
    render: (args) => <div style={{ maxWidth: '800px' }}><LessonListSection {...args} /></div>
};
