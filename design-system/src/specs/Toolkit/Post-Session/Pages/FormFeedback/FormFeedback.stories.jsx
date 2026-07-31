import React from 'react';
import FormFeedbackForm from '@/specs/Toolkit/Post-Session/Sections/FormFeedbackForm/FormFeedbackForm';
import {
    BreakpointPreview,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

const completedThroughSelf = {
    'session-information': true,
    'student-reflection': true,
    'session-reflection': true,
    'self-reflection': true,
};

/**
 * @param {object} formProps
 * @param {boolean} [showSaveExit]
 */
function renderShell(formProps, showSaveExit = false) {
    return (
        <BreakpointPreview>
            <ReflectionPageShell
                activeTab="form-feedback"
                completedSections={completedThroughSelf}
                initialExitModal={showSaveExit ? 'saved' : null}
                id="form-feedback-page-story"
            >
                {({ openDiscard, openSaved }) => (
                    <FormFeedbackForm
                        {...formProps}
                        onCancel={openDiscard}
                        onSaveAndExit={openSaved}
                        onPrevious={() => {}}
                        onSubmit={() => {}}
                    />
                )}
            </ReflectionPageShell>
        </BreakpointPreview>
    );
}

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Form Feedback',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
    argTypes: {
        formState: {
            control: 'radio',
            options: ['empty', 'filled'],
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
        initialData: { rating: 0 },
    },
    filled: {
        initialData: {
            rating: 4,
            experience: 'The chip questions were clear; the AI follow-up felt optional in a good way.',
            comments: 'Would love a way to save mid-student without leaving the flow.',
        },
    },
};

/**
 * Primary docs canvas — switch Form state in Controls.
 */
export const Overview = {
    render: ({ formState = 'empty' }) => renderShell(STATE_PROPS[formState] || STATE_PROPS.empty),
};

/** Empty — form rating unanswered. */
export const Empty = {
    render: () => renderShell(STATE_PROPS.empty),
};

/** Filled — rating + both free-response answers. */
export const Filled = {
    render: () => renderShell(STATE_PROPS.filled),
};
