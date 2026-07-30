import React from 'react';
import SessionReflectionFormV2 from '@/specs/Toolkit/Post-Session/Sections/SessionReflectionForm/SessionReflectionFormV2';
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
                showSaveExit={showSaveExit}
                id="session-reflection-page-story"
            >
                {({ openSaveExit }) => (
                    <SessionReflectionFormV2
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
    title: 'Specs/Toolkit/Post-Session/Pages/Session Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/** Empty — rating only. */
export const Empty = {
    render: () => renderShell({ initialData: { rating: 0 }, simulateAi: false }),
};

/** AI generating after gated chips. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => renderShell({
        simulateAi: false,
        aiState: 'generating',
        initialData: {
            rating: 4,
            whatWorked: ['good-pacing', 'smooth-tech', 'strong-rapport'],
            whatImprove: [],
            followUp: ['no'],
        },
    }),
};

/** Filled happy path. */
export const Filled = {
    render: () => renderShell({
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
    }),
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

/** Save & Exit confirmation. */
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

/** @deprecated Prefer Empty — live-app alias. */
export const Part1 = Empty;
/** @deprecated Prefer InProgressAi. */
export const Part2 = InProgressAi;
/** @deprecated Prefer Filled. */
export const Part3 = Filled;
/** @deprecated Prefer WorstCase. */
export const Part4 = WorstCase;
