/**
 * UserFeedbackModal Stories
 *
 * Unified Home feedback dialog (problem · question · feedback).
 * Figma: User Feedback Modal — node 83:126557
 */

import React from 'react';
import UserFeedbackModal from './UserFeedbackModal';
import './UserFeedbackModal.scss';

/**
 * Lightweight faux home chrome for modal docs stages.
 * @returns {React.ReactElement}
 */
const HomeChromeBackdrop = () => (
    <div className="plus-user-feedback-modal-demo-stage__app" aria-hidden="true">
        <div className="plus-user-feedback-modal-demo-stage__topbar">
            <span className="h6 font-weight-semibold">PLUS</span>
            <span className="body3-txt">Home</span>
        </div>
        <div className="plus-user-feedback-modal-demo-stage__content">
            <div className="plus-user-feedback-modal-demo-stage__hero">
                <div className="h4 font-weight-semibold">Sign up for your next session, John!</div>
                <p className="body2-txt" style={{ margin: 0 }}>
                    Find a session that fits your schedule.
                </p>
            </div>
            <div className="plus-user-feedback-modal-demo-stage__cards">
                <div className="plus-user-feedback-modal-demo-stage__card-ph" />
                <div className="plus-user-feedback-modal-demo-stage__card-ph" />
                <div className="plus-user-feedback-modal-demo-stage__card-ph" />
            </div>
        </div>
    </div>
);

export default {
    title: 'Specs/Home/Modals/User Feedback Modal',
    component: UserFeedbackModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        type: {
            control: { type: 'radio' },
            options: ['problem', 'question', 'feedback'],
            table: { category: 'Content' },
        },
        show: {
            control: 'boolean',
            table: { category: 'State' },
        },
        noOverlay: {
            control: 'boolean',
            description: 'Render inline without the scrim',
            table: { category: 'Behavior' },
        },
        containOverlay: {
            control: 'boolean',
            description: 'Keep the scrim inside the demo stage',
            table: { category: 'Behavior' },
        },
    },
};

/**
 * App chrome + scrim + open problem modal (docs Overview default).
 */
export const Overview = {
    render: () => (
        <div className="plus-user-feedback-modal-demo-stage">
            <HomeChromeBackdrop />
            <UserFeedbackModal
                id="user-feedback-overview"
                show
                type="problem"
                containOverlay
                onClose={() => {}}
                onSubmit={() => {}}
            />
        </div>
    ),
};

/**
 * Problem mode — inline for layout inspection.
 */
export const Problem = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="problem"
            onClose={() => {}}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'problem',
        show: true,
        noOverlay: true,
    },
    parameters: { layout: 'centered' },
};

/**
 * Question mode — inline for layout inspection.
 */
export const Question = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="question"
            onClose={() => {}}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'question',
        show: true,
        noOverlay: true,
    },
    parameters: { layout: 'centered' },
};

/**
 * Feedback mode — inline for layout inspection.
 */
export const Feedback = {
    render: (args) => (
        <UserFeedbackModal
            {...args}
            type="feedback"
            onClose={() => {}}
            onSubmit={(data) => console.log('Submit:', data)}
        />
    ),
    args: {
        type: 'feedback',
        show: true,
        noOverlay: true,
    },
    parameters: { layout: 'centered' },
};
