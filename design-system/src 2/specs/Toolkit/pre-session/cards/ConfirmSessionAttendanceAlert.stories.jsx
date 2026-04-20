import React from 'react';
import Alert from '../../../../components/Alert/Alert';

export default {
    title: 'Specs/Toolkit/Pre-Session/Cards/Confirm Session Attendance Alert (Tutor View)',
    component: Alert,
    parameters: {
        layout: 'padded',
    },
    argTypes: {
        style: {
            control: { type: 'select' },
            options: ['warning', 'danger', 'info', 'success', 'primary'],
        },
    },
};

/**
 * Standard container for the alert to ensure it takes full width in the story
 */
const AlertContainer = ({ children }) => (
    <div style={{ width: 'var(--size-columns-col-12)' }}>
        {children}
    </div>
);

/**
 * State: Session Time Change (One time)
 * Style: Warning
 */
export const SessionTimeChange_OneTime = () => (
    <AlertContainer>
        <Alert
            style="warning"
            dismissable={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                The start time for one of your sessions on <span className="font-weight-bold">Tues, Oct 28</span> has been moved to <span className="font-weight-bold">2:00 PM</span>.
            </span>
        </Alert>
    </AlertContainer>
);

/**
 * State: Session Time Change (Recurring)
 * Style: Warning
 */
export const SessionTimeChange_Recurring = () => (
    <AlertContainer>
        <Alert
            style="warning"
            dismissable={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                The start time for your recurring session starting on <span className="font-weight-bold">Tues, Oct 28</span> has been moved to <span className="font-weight-bold">2:00 PM</span>.
            </span>
        </Alert>
    </AlertContainer>
);

/**
 * State: Session Canceled
 * Style: Danger
 */
export const SessionCanceled = () => (
    <AlertContainer>
        <Alert
            style="danger"
            dismissable={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                Your session on <span className="font-weight-bold">Tues, Oct 28</span> at <span className="font-weight-bold">2:00 PM</span> has been cancelled.
            </span>
        </Alert>
    </AlertContainer>
);

