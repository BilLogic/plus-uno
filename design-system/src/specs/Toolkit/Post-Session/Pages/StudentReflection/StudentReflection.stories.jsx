import React from 'react';
import StudentReflectionForm from '@/specs/Toolkit/Post-Session/Sections/StudentReflectionForm/StudentReflectionForm';
import {
    BreakpointPreview,
    DEFAULT_PAGE_STUDENTS,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

/** Roster — Baxter is the active student in Figma page masters. */
const students = DEFAULT_PAGE_STUDENTS.map((student) => ({
    ...student,
    status: student.id === 'kiera' ? 'complete' : 'incomplete',
}));

/**
 * Figma Pages · Student Reflection (`10662:18965`) states.
 * Keys match Controls + story names: unfilled · filled · filledLow.
 */
const STATE_PROPS = {
    unfilled: {
        initialData: {},
        simulateAi: false,
        aiState: 'idle',
    },
    filled: {
        simulateAi: false,
        aiState: 'ready',
        initialData: {
            goalProgress: ['steady'],
            effort: ['consistent'],
            engagement: ['responsive'],
            followUp: ['no'],
            aiPrompt: 'What’s one moment from this session you’d want the next tutor to know?',
            aiHelper: 'E.g. He solved the last two problems without prompts.',
            aiAnswer: 'He solved the last two problems without prompts.',
        },
    },
    filledLow: {
        simulateAi: false,
        aiState: 'empty',
        initialData: {
            goalProgress: ['other'],
            effort: ['other'],
            engagement: ['other'],
            otherGoal: 'Finished early but skipped the stretch goal.',
            otherEffort: 'Started strong, then stalled after the first break.',
            otherEngagement: 'Camera off for half the block.',
            followUp: ['behavioral', 'other'],
            followUpDescription: 'Repeatedly redirected peers and refused the warm-up.',
            escalate: true,
            forceAiEmpty: true,
        },
    },
};

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
                {({ openDiscard, openSaved }) => (
                    <StudentReflectionForm
                        studentName="Baxter Ellington"
                        {...formProps}
                        onCancel={openDiscard}
                        onSaveAndExit={openSaved}
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
    args: { formState: 'unfilled' },
    argTypes: {
        formState: {
            name: 'Form state',
            control: 'radio',
            options: ['unfilled', 'filled', 'filledLow'],
            labels: {
                unfilled: 'Unfilled',
                filled: 'Filled',
                filledLow: 'Filled-low',
            },
        },
    },
};

/**
 * Controllable Overview — switch Form state via Controls (Figma page variants).
 *
 * @param {object} args
 */
export const Overview = {
    render: (args) => renderShell(STATE_PROPS[args.formState] || STATE_PROPS.unfilled),
};

/** Figma state=unfilled — unanswered chips for the active student. */
export const Unfilled = {
    name: 'Unfilled',
    render: () => renderShell(STATE_PROPS.unfilled),
};

/** @deprecated Prefer Unfilled — kept so old Storybook URLs / HMR keep working. */
export const Empty = Unfilled;

/** Figma state=filled — happy path with AI follow-up ready. */
export const Filled = {
    render: () => renderShell(STATE_PROPS.filled),
};

/** Figma state=filled-low — Other chips, empty AI, escalate concern. */
export const FilledLow = {
    name: 'Filled-low',
    render: () => renderShell(STATE_PROPS.filledLow),
};
