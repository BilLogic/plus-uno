import React from 'react';
import { Toast } from '../../../../components/Toast';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Review Assignments Toast',
    parameters: {
        layout: 'centered',
    },
};

/**
 * Review Assignments - For Leads
 *
 * Appears automatically 10 minutes after assignments are initially announced.
 * "Edit Assignment" navigates directly to the assignment modal on the sessions page.
 */
export const ForLeads = () => (
    <div style={{ width: '672px' }}>
        <Toast
            style="secondary"
            title="Review Assignments"
            timestamp="11 mins ago"
            show={true}
            autohide={false}
            onClose={() => {}}
            className="w-100"
        >
            <span
                className="body3-txt font-weight-light"
                style={{ color: 'var(--color-on-surface)' }}
            >
                It's been 10 minutes since the session started. Would you like to{' '}
                <a
                    href="#"
                    className="body3-txt font-weight-bold"
                    style={{
                        color: 'var(--color-on-surface)',
                        textDecoration: 'underline',
                    }}
                    onClick={(e) => e.preventDefault()}
                >
                    review and adjust assignments
                </a>
                ?{' '}
            </span>
        </Toast>
    </div>
);

/**
 * Review Assignments - For All
 *
 * Appears to all tutors after lead tutor clicks on "update assignments" button.
 */
export const ForAll = () => (
    <div style={{ width: '672px' }}>
        <Toast
            style="secondary"
            title="Review Assignments"
            timestamp="11 mins ago"
            show={true}
            autohide={false}
            onClose={() => {}}
            className="w-100"
        >
            <span
                className="body3-txt font-weight-light"
                style={{ color: 'var(--color-on-surface)' }}
            >
                Your student roster was just updated. Take a moment to review your new assignments.
            </span>
        </Toast>
    </div>
);

/**
 * Warmup Phase in Progress
 *
 * Appears during the warmup phase for goal-setting sessions.
 * Dismissible by user, reappears at start of each new session until warmup phase ends.
 */
export const WarmupPhase = () => (
    <div style={{ width: '672px' }}>
        <Toast
            style="info"
            title="Warmup phase in progress."
            show={true}
            autohide={false}
            onClose={() => {}}
            className="w-100"
        >
            <span
                className="body3-txt font-weight-light"
                style={{ color: 'var(--color-on-surface)' }}
            >
                Students are working toward default IXL expectations (e.g., 40 min/week, 2 skills/week).
                Personalized goals will be available in a few weeks.{' '}
                <span className="body3-txt font-weight-semibold">
                    Remember to check in with each student and mark them as helped.
                </span>
            </span>
        </Toast>
    </div>
);
