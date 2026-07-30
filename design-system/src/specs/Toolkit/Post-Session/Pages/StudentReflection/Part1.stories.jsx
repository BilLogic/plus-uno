import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import StudentReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionFormV2';

const defaultStudents = [
    { name: 'Kiera Wintervale', status: 'complete' },
    { name: 'Baxter Ellington', status: 'incomplete' },
    { name: 'Milo Thorne', status: 'incomplete' },
];

/**
 * @param {object} props
 */
const Shell = ({ formProps = {}, students = defaultStudents, activeStudentTab = 'student-1' }) => {
    const [activeTab, setActiveTab] = useState(activeStudentTab);
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'John Doe', type: 'lead tutor' },
                }}
                sidebarConfig={{ user: 'tutor', activeTab: 'sessions' }}
                id="student-reflection-story"
            >
                <div style={{ display: 'flex', gap: 'var(--size-surface-gap-md)', width: '100%', minHeight: '100%' }}>
                    <SideNavBar
                        students={students}
                        activeTab={activeTab}
                        completedSections={{ 'session-information': true }}
                        onTabClick={setActiveTab}
                    />
                    <StudentReflectionFormV2 {...formProps} />
                </div>
            </PageLayout>
        </div>
    );
};

Shell.propTypes = {
    formProps: PropTypes.object,
    students: PropTypes.array,
    activeStudentTab: PropTypes.string,
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Student Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/** Empty student reflection — rating required. */
export const Empty = {
    render: () => (
        <Shell
            formProps={{
                studentName: 'Baxter Ellington',
                initialData: { rating: 0 },
                aiState: 'idle',
            }}
        />
    ),
};

/** AI generating follow-up after chips. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => (
        <Shell
            formProps={{
                studentName: 'Baxter Ellington',
                aiState: 'generating',
                initialData: {
                    rating: 4,
                    whatWorked: ['good-pacing', 'strong-rapport'],
                    whatImprove: [],
                },
            }}
        />
    ),
};

/** Filled student reflection with AI prompt ready. */
export const Filled = {
    render: () => (
        <Shell
            formProps={{
                studentName: 'Baxter Ellington',
                aiState: 'ready',
                initialData: {
                    rating: 4,
                    whatWorked: ['good-pacing', 'strong-rapport'],
                    whatImprove: ['pacing'],
                },
            }}
        />
    ),
};

/** Worst case — Other selected. */
export const WorstCase = {
    name: 'Worst case (Other everywhere)',
    render: () => (
        <Shell
            formProps={{
                studentName: 'Baxter Ellington',
                aiState: 'ready',
                initialData: {
                    rating: 2,
                    whatWorked: ['other'],
                    whatImprove: ['other'],
                    otherImprove: 'Camera off for most of the block.',
                },
            }}
        />
    ),
};

/** @deprecated Prefer Empty. */
export const Part1 = Empty;
/** @deprecated Prefer InProgressAi. */
export const Part2 = InProgressAi;
/** @deprecated Prefer Filled. */
export const Part3 = Filled;
