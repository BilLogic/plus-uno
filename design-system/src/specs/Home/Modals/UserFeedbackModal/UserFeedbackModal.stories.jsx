import React, { useState } from 'react';
import UserFeedbackModal from './UserFeedbackModal';

export default {
    title: 'Specs/Home/Modals/User Feedback Modal',
    component: UserFeedbackModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        show: {
            control: 'boolean',
            description: 'Whether the modal is visible',
            table: { category: 'State' },
        },
        noOverlay: {
            control: 'boolean',
            description: 'Render inline without the fixed fullscreen overlay',
            table: { category: 'Behavior' },
        },
    },
};

export const Overview = {
    render: () => {
        const [showProblem, setShowProblem] = useState(false);
        const [showQuestion, setShowQuestion] = useState(false);
        const [showFeedback, setShowFeedback] = useState(false);

        return (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowProblem(true)}>Open Problem Modal</button>
                <button onClick={() => setShowQuestion(true)}>Open Question Modal</button>
                <button onClick={() => setShowFeedback(true)}>Open Feedback Modal</button>

                <UserFeedbackModal
                    show={showProblem}
                    type="problem"
                    onClose={() => setShowProblem(false)}
                    onSubmit={(data) => {
                        console.log('Problem submitted:', data);
                        setShowProblem(false);
                    }}
                />

                <UserFeedbackModal
                    show={showQuestion}
                    type="question"
                    onClose={() => setShowQuestion(false)}
                    onSubmit={(data) => {
                        console.log('Question submitted:', data);
                        setShowQuestion(false);
                    }}
                />

                <UserFeedbackModal
                    show={showFeedback}
                    type="feedback"
                    onClose={() => setShowFeedback(false)}
                    onSubmit={(data) => {
                        console.log('Feedback submitted:', data);
                        setShowFeedback(false);
                    }}
                />
            </div>
        );
    }
};

export const Problem = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="problem"
            onClose={() => console.log('Close clicked')}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'problem',
        show: true,
        noOverlay: true,
    }
};

export const Question = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="question"
            onClose={() => console.log('Close clicked')}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'question',
        show: true,
        noOverlay: true,
    }
};

export const Feedback = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="feedback"
            onClose={() => console.log('Close clicked')}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'feedback',
        show: true,
        noOverlay: true,
    }
};

