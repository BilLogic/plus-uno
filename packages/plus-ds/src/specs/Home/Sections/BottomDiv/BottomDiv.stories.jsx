import React from 'react';
import BottomDiv from './BottomDiv';

export default {
    title: 'Specs/Home/Sections/BottomDiv',
    component: BottomDiv,
    tags: ['autodocs'],
};

const defaultOverviewCards = [
    {
        type: 'relationships',
        value: 'Relationships',
        label: '3/3 students need relationship support'
    },
    {
        type: 'status',
        value: '37.5%',
        label: 'students has status: outstanding.'
    },
    {
        type: 'effort',
        value: '2/10',
        label: 'students have fulfilled their effort goals.'
    },
    {
        type: 'progress',
        value: '2/10',
        label: 'students have fulfilled their progress goals.'
    }
];

const defaultStudents = [
    {
        name: 'Hermione Granger',
        status: 'Needs Motivation',
        focusArea: null
    },
    {
        name: 'Ron Weasley',
        status: 'Needs Motivation',
        focusArea: null
    },
    {
        name: 'Harry Potter',
        status: 'Needs Motivation',
        focusArea: null
    },
    {
        name: 'Luna Lovegood',
        status: 'Needs Motivation',
        focusArea: 'Relationships'
    },
    {
        name: 'Harry Potter',
        status: 'Needs Motivation',
        focusArea: 'Advocacy'
    }
];

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BottomDiv
            variant="default"
            overviewCards={defaultOverviewCards}
            students={defaultStudents}
        />
        <BottomDiv
            variant="variant2"
            overviewCards={defaultOverviewCards}
            students={defaultStudents}
        />
    </div>
);

export const Default = {
    args: {
        variant: 'default',
        overviewCards: defaultOverviewCards,
        students: defaultStudents,
        onViewAll: () => console.log('View all clicked'),
    },
};

export const Variant2 = {
    args: {
        variant: 'variant2',
        overviewCards: defaultOverviewCards,
        students: defaultStudents,
        onViewAll: () => console.log('View all clicked'),
    },
};

