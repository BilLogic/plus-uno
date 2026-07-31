import React from 'react';
import { BreakpointPreview } from '../pageShell';
import ReflectionFlow from './ReflectionFlow';
import { STUDENT_FOLLOWUP_OPTIONS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

const COMPLETE_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'complete' },
    { id: 'baxter', name: 'Baxter Ellington', status: 'complete' },
    { id: 'milo', name: 'Milo Thorne', status: 'complete' },
];

const PRIOR_SECTIONS = {
    'session-information': true,
    'student-reflection': true,
    'session-reflection': true,
    'self-reflection': true,
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Reflection Flow',
    component: ReflectionFlow,
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
    args: {
        showSelfReflection: true,
        showFormFeedback: true,
        showSubmittedOnMount: false,
        initialTab: 'session-information',
        initialExitModal: null,
    },
    argTypes: {
        initialTab: {
            control: 'select',
            options: [
                'session-information',
                'student-0',
                'session-reflection',
                'self-reflection',
                'form-feedback',
            ],
        },
        showSelfReflection: { control: 'boolean' },
        showFormFeedback: { control: 'boolean' },
        initialExitModal: {
            control: 'select',
            options: [null, 'discard', 'saved'],
        },
        showSubmittedOnMount: { control: 'boolean' },
    },
};

/**
 * Interactive end-to-end reflection flow (in-memory). Controllable via args.
 *
 * @param {object} args
 */
export const Default = {
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow {...args} />
        </BreakpointPreview>
    ),
};

/** Opens on Session Reflection with prior sections marked complete. */
export const SessionReflectionStep = {
    name: 'Start at Session Reflection',
    args: {
        initialTab: 'session-reflection',
        initialCompletedSections: {
            'session-information': true,
            'student-reflection': true,
        },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS}
            />
        </BreakpointPreview>
    ),
};

/** Saved (Save & Exit) modal visible on mount. */
export const SaveAndExit = {
    name: 'Save & Exit',
    args: {
        initialTab: 'session-reflection',
        initialExitModal: 'saved',
        initialCompletedSections: {
            'session-information': true,
            'student-reflection': true,
        },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS.slice(0, 2)}
            />
        </BreakpointPreview>
    ),
};

/** Discard (exit without saving) modal on mount. */
export const DiscardOnMount = {
    name: 'Discard confirmation',
    args: {
        initialTab: 'session-reflection',
        initialExitModal: 'discard',
        initialCompletedSections: {
            'session-information': true,
            'student-reflection': true,
        },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS.slice(0, 2)}
            />
        </BreakpointPreview>
    ),
};

/** Reflection submitted modal on mount. */
export const Submitted = {
    name: 'Reflection submitted',
    args: {
        showSubmittedOnMount: true,
        initialCompletedSections: {
            ...PRIOR_SECTIONS,
            'form-feedback': true,
        },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS.slice(0, 1)}
            />
        </BreakpointPreview>
    ),
};

/** Cadence off — no Self Reflection / Form Feedback tabs (PRD §6–7). */
export const WithoutCadenceSections = {
    name: 'Without Self + Form Feedback',
    args: {
        showSelfReflection: false,
        showFormFeedback: false,
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow {...args} />
        </BreakpointPreview>
    ),
};

/** Cadence off, prior steps complete — Submit ready without Form Feedback. */
export const CadenceOffSubmitReady = {
    name: 'Cadence off · Submit ready',
    args: {
        showSelfReflection: false,
        showFormFeedback: false,
        initialTab: 'session-reflection',
        initialCompletedSections: {
            'session-information': true,
            'student-reflection': true,
            'session-reflection': true,
        },
        initialSessionReflection: {
            rating: 4,
            whatWorked: ['clear-explanations'],
            whatImprove: ['pacing'],
            followUp: ['no'],
        },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS}
            />
        </BreakpointPreview>
    ),
};

/** Cancellation branch from Session Information. */
export const CancellationBranch = {
    name: 'Cancellation branch',
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                initialSessionInfo={{
                    date: '2026-07-15',
                    sessionOption: 'session-1',
                    didNotHappen: true,
                }}
            />
        </BreakpointPreview>
    ),
};

/** Seed AI empty state on Student Reflection without waiting on the timer. */
export const AiEmptySeed = {
    name: 'AI empty seed',
    args: {
        initialTab: 'student-0',
        initialCompletedSections: { 'session-information': true },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={[{ id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' }]}
                initialStudentReflections={{
                    kiera: {
                        goalProgress: ['steady'],
                        effort: ['consistent'],
                        engagement: ['responsive'],
                        followUp: ['no'],
                        aiState: 'empty',
                        forceAiEmpty: true,
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** Filled-low student — Other chips + escalate concern (no UI walk). */
export const FilledLowStudent = {
    name: 'Filled-low student',
    args: {
        initialTab: 'student-0',
        initialCompletedSections: { 'session-information': true },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={[{ id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' }]}
                initialStudentReflections={{
                    kiera: {
                        goalProgress: ['other'],
                        effort: ['other'],
                        engagement: ['other'],
                        otherGoal: 'Worked around materials shortage.',
                        otherEffort: 'Needed extra prompts to stay on task.',
                        otherEngagement: 'Checked out after the first activity.',
                        followUp: [STUDENT_FOLLOWUP_OPTIONS.find((o) => o.id !== 'no')?.id || 'behavior'],
                        followUpDescription: 'Repeated off-task behavior after redirects.',
                        escalate: true,
                        aiState: 'ready',
                        aiPrompt: 'What should the next tutor try first with Kiera?',
                        forceAiEmpty: false,
                        simulateAi: false,
                    },
                }}
            />
        </BreakpointPreview>
    ),
};

/** Form Feedback step with rating already set — Submit finalizes. */
export const FormFeedbackSubmitReady = {
    name: 'Form Feedback · Submit ready',
    args: {
        initialTab: 'form-feedback',
        initialCompletedSections: PRIOR_SECTIONS,
        initialFormFeedback: { rating: 4, experience: '', comments: '' },
    },
    render: (args) => (
        <BreakpointPreview>
            <ReflectionFlow
                {...args}
                students={COMPLETE_STUDENTS}
            />
        </BreakpointPreview>
    ),
};
