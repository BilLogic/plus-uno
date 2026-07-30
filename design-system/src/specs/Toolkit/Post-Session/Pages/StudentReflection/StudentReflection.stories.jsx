import React from 'react';
import StudentReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionFormV2';
import {
    BreakpointPreview,
    DEFAULT_PAGE_STUDENTS,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

const students = DEFAULT_PAGE_STUDENTS.map((student, index) => ({
    ...student,
    status: index === 0 ? 'complete' : 'incomplete',
}));

/**
 * @param {object} formProps
 */
function renderShell(formProps) {
    return (
        <BreakpointPreview>
            <ReflectionPageShell
                activeTab="student-1"
                students={students}
                completedSections={{ 'session-information': true }}
                id="student-reflection-page-story"
            >
                {({ openSaveExit }) => (
                    <StudentReflectionFormV2
                        studentName="Baxter Ellington"
                        {...formProps}
                        onCancel={openSaveExit}
                        onSaveAndExit={openSaveExit}
                        onNext={() => {}}
                    />
                )}
            </ReflectionPageShell>
        </BreakpointPreview>
    );
}

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Student Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/** Empty — chip questions unanswered. */
export const Empty = {
    render: () => renderShell({
        initialData: {},
        simulateAi: false,
        aiState: 'idle',
    }),
};

/** AI generating after chips. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => renderShell({
        simulateAi: false,
        aiState: 'generating',
        initialData: {
            goalProgress: ['steady'],
            effort: ['consistent'],
            engagement: ['responsive'],
        },
    }),
};

/** Filled with AI ready. */
export const Filled = {
    render: () => renderShell({
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
    }),
};

/** Worst case — Other + escalation. */
export const WorstCase = {
    name: 'Worst case (Other everywhere)',
    render: () => renderShell({
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
    }),
};
