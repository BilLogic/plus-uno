import React from 'react';
import SelfReflectionForm from '@/specs/Toolkit/Post-Session/Sections/SelfReflectionForm/SelfReflectionForm';
import {
    BreakpointPreview,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

const completedThroughSession = {
    'session-information': true,
    'student-reflection': true,
    'session-reflection': true,
};

/**
 * @param {object} formProps
 * @param {boolean} [showSaveExit]
 */
function renderShell(formProps, showSaveExit = false) {
    return (
        <BreakpointPreview>
            <ReflectionPageShell
                activeTab="self-reflection"
                completedSections={completedThroughSession}
                initialExitModal={showSaveExit ? 'saved' : null}
                id="self-reflection-page-story"
            >
                {({ openDiscard, openSaved }) => (
                    <SelfReflectionForm
                        {...formProps}
                        onCancel={openDiscard}
                        onSaveAndExit={openSaved}
                        onPrevious={() => {}}
                        onNext={() => {}}
                    />
                )}
            </ReflectionPageShell>
        </BreakpointPreview>
    );
}

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Self Reflection',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
    argTypes: {
        formState: {
            control: 'radio',
            options: ['empty', 'filled', 'aiGenerating'],
            name: 'Form state',
            table: { category: 'State' },
        },
    },
    args: {
        formState: 'empty',
    },
};

const STATE_PROPS = {
    empty: {
        simulateAi: false,
        initialData: { rating: 0 },
    },
    filled: {
        simulateAi: false,
        aiState: 'ready',
        initialData: {
            rating: 5,
            effective: ['scaffolding', 'engagement'],
            improve: ['time'],
            support: 'More worked examples for fractions.',
            aiPrompt: 'Which of your moves is most worth repeating next time?',
            aiHelper: 'E.g. I would keep the “you try first” pause before I jump in to hint.',
            aiAnswer: 'The pause before hinting — students solved more on their own.',
        },
    },
    aiGenerating: {
        simulateAi: false,
        aiState: 'generating',
        initialData: {
            rating: 4,
            effective: ['scaffolding'],
            improve: [],
        },
    },
};

/**
 * Primary docs canvas — switch Form state in Controls.
 */
export const Overview = {
    render: ({ formState = 'empty' }) => renderShell(STATE_PROPS[formState] || STATE_PROPS.empty),
};

/** Empty — scale unanswered. */
export const Empty = {
    render: () => renderShell(STATE_PROPS.empty),
};

/** Filled — rating, chips, AI answer, support request. */
export const Filled = {
    render: () => renderShell(STATE_PROPS.filled),
};

/** AI loading after gated selections. */
export const InProgressAi = {
    name: 'In progress (AI generating)',
    render: () => renderShell(STATE_PROPS.aiGenerating),
};
