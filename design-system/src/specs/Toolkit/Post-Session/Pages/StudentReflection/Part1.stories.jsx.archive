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

/** Empty student reflection — chip questions unanswered. */
export const Empty = {
    render: () => (
        <Shell
            formProps={{
                studentName: 'Baxter Ellington',
                initialData: {},
                simulateAi: false,
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
                simulateAi: false,
                aiState: 'generating',
                initialData: {
                    goalProgress: ['steady'],
                    effort: ['consistent'],
                    engagement: ['responsive'],
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
                simulateAi: false,
                aiState: 'ready',
                initialData: {
                    goalProgress: ['steady'],
                    effort: ['consistent'],
                    engagement: ['responsive'],
                    followUp: ['no'],
                    aiPrompt: 'What’s one moment from this session you’d want the next tutor to know?',
                    aiAnswer: 'He solved the last two problems without prompts.',
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
                simulateAi: false,
                aiState: 'ready',
                initialData: {
                    goalProgress: ['other'],
                    effort: ['other'],
                    engagement: ['other'],
                    otherGoal: 'Worked ahead on a custom packet.',
                    otherEffort: 'Needed frequent nudges after break.',
                    otherEngagement: 'Camera off for most of the block.',
                    followUp: ['behavioral'],
                    followUpDescription: 'Repeatedly redirected peers off-task.',
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
