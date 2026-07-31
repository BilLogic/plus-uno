import React from 'react';
import SessionReflectionForm from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionForm';
import {
    BreakpointPreview,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';
import {
    WHAT_WORKED_OPTIONS,
    WHAT_COULD_IMPROVE_OPTIONS,
    SUPERVISOR_FOLLOWUP_OPTIONS,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

const completedPrior = {
    'session-information': true,
    'student-reflection': true,
};

const STATE_PROPS = {
    empty: { initialData: { rating: 0 }, simulateAi: false },
    generating: {
        simulateAi: false,
        aiState: 'generating',
        initialData: {
            rating: 4,
            whatWorked: ['good-pacing', 'smooth-tech', 'strong-rapport'],
            whatImprove: [],
            followUp: ['no'],
        },
    },
    filled: {
        simulateAi: false,
        aiState: 'ready',
        initialData: {
            rating: 4,
            whatWorked: ['good-pacing', 'smooth-tech', 'strong-rapport'],
            whatImprove: ['pacing'],
            followUp: ['no'],
            aiPrompt: 'Based on what you selected, what would you try differently next time to protect pacing?',
            aiAnswer: 'Open with a tighter warm-up and park tech checks before content.',
        },
    },
};

/**
 * @param {object} formProps
 * @param {boolean} [showSaveExit]
 */
function renderShell(formProps, showSaveExit = false) {
    return (
        <BreakpointPreview>
            <ReflectionPageShell
                activeTab="session-reflection"
                completedSections={completedPrior}
                initialExitModal={showSaveExit ? 'saved' : null}
                id="session-reflection-page-story"
            >
                {({ openDiscard, openSaved }) => (
                    <SessionReflectionForm
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
    title: 'Specs/Toolkit/Post-Session/Pages/Session Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
    args: { formState: 'empty' },
    argTypes: {
        formState: {
            control: 'radio',
            options: Object.keys(STATE_PROPS),
        },
    },
};

/** Controllable Overview — switch formState via Controls. */
export const Overview = {
    render: (args) => renderShell(STATE_PROPS[args.formState] || STATE_PROPS.empty),
};

/** Empty — rating only. */
export const Empty = {
    render: () => renderShell(STATE_PROPS.empty),
};

/** AI generating after gated chips. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => renderShell(STATE_PROPS.generating),
};

/** Filled happy path. */
export const Filled = {
    render: () => renderShell(STATE_PROPS.filled),
};

/** Worst case — Other + escalation. */
export const WorstCase = {
    name: 'Worst case (Other everywhere)',
    render: () => renderShell({
        simulateAi: false,
        aiState: 'ready',
        initialData: {
            rating: 2,
            whatWorked: ['other'],
            whatImprove: ['other'],
            followUp: ['other-urgent'],
            otherWorked: 'Students stayed engaged despite a late start.',
            otherImprove: 'Room audio kept cutting out mid-explanation.',
            followUpDescription: 'Urgent tech failure blocked the lesson.',
            aiPrompt: 'What support do you need before the next session?',
            aiAnswer: '',
        },
    }),
};

/** Save & Exit confirmation (discard modal on mount). */
export const SaveAndExitConfirmation = {
    name: 'Save & Exit confirmation',
    render: () => renderShell({
        simulateAi: false,
        aiState: 'ready',
        initialData: {
            rating: 4,
            whatWorked: WHAT_WORKED_OPTIONS.slice(0, 3).map((o) => o.id),
            whatImprove: WHAT_COULD_IMPROVE_OPTIONS.slice(0, 1).map((o) => o.id),
            followUp: SUPERVISOR_FOLLOWUP_OPTIONS.slice(0, 1).map((o) => o.id),
            aiPrompt: 'Anything else to capture before you leave?',
        },
    }, true),
};
