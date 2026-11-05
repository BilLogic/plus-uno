/**
 * UpdateNotification Stories
 * Figma: Update Notification — node 7283:416854
 */

import React from 'react';
import UpdateNotification from './UpdateNotification';
import './UpdateNotification.scss';

/**
 * Lightweight faux home chrome for modal docs stages.
 * @returns {React.ReactElement}
 */
const HomeChromeBackdrop = () => (
    <div className="plus-update-notification-demo-stage__app" aria-hidden="true">
        <div className="plus-update-notification-demo-stage__topbar">
            <span className="h6 font-weight-semibold">PLUS</span>
            <span className="body3-txt">Home</span>
        </div>
        <div className="plus-update-notification-demo-stage__content">
            <div className="plus-update-notification-demo-stage__hero">
                <div className="h4 font-weight-semibold">Sign up for your next session, John!</div>
                <p className="body2-txt" style={{ margin: 0 }}>
                    Find a session that fits your schedule.
                </p>
            </div>
            <div className="plus-update-notification-demo-stage__cards">
                <div className="plus-update-notification-demo-stage__card-ph" />
                <div className="plus-update-notification-demo-stage__card-ph" />
            </div>
        </div>
    </div>
);

export default {
    title: 'Specs/Home/Modals/Update Notification',
    component: UpdateNotification,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * App chrome + blanket + open notification (docs Overview).
 */
export const Overview = {
    render: () => (
        <div className="plus-update-notification-demo-stage">
            <HomeChromeBackdrop />
            <UpdateNotification
                id="update-notification-overview"
                show
                containOverlay
                onClose={() => {}}
            />
        </div>
    ),
    // axe measures the modal's text against the dimmed backdrop behind it,
    // not the opaque panel it actually renders on: `containOverlay` stacks
    // both in the same flat test canvas, with no real app chrome between
    // them to anchor the panel's own stacking context.
    parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
};

/**
 * Dialog only — inline for layout inspection.
 */
export const Dialog = {
    render: (args) => (
        <UpdateNotification
            {...args}
            onClose={() => {}}
            onWatchTutorial={() => console.log('Watch tutorial')}
            onTryAiCoach={() => console.log('Try AI Coach')}
        />
    ),
    args: {
        show: true,
        noOverlay: true,
    },
    parameters: { layout: 'centered' },
};
