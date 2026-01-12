import React from 'react';
import LessonsTableSection from './LessonsTableSection';

export default {
    title: 'Specs/Training/Lessons/Sections/LessonsTableSection',
    component: LessonsTableSection,
    tags: ['autodocs'],
};

export const Docs = {
    render: () => (
        <div style={{ padding: '24px' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>LessonsTableSection</h3>
            <p className="body2-txt">Table section container for lessons list.</p>
        </div>
    ),
};

export const Overview = {
    render: () => <LessonsTableSection />,
};

export const Interactive = {
    args: { title: 'My Lessons', showTitle: true },
    render: (args) => <LessonsTableSection {...args} />,
};
