import React from 'react';
import SectionMessage from '@/components/messaging/SectionMessage/SectionMessage';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Cards/Confirm Session Attendance Alert (Tutor View)',
    component: SectionMessage,
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
    <div style={{ width: 'var(--col-12)' }}>
        {children}
    </div>
);

/**
 * State: Session Time Change (One time)
 * Style: Warning
 */
export const SessionTimeChange_OneTime = () => (
    <AlertContainer>
        <SectionMessage
            appearance="warning"
            dismissible={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                The start time for one of your sessions on <span className="font-weight-bold">Tues, Oct 28</span> has been moved to <span className="font-weight-bold">2:00 PM</span>.
            </span>
        </SectionMessage>
    </AlertContainer>
);

/**
 * State: Session Time Change (Recurring)
 * Style: Warning
 */
export const SessionTimeChange_Recurring = () => (
    <AlertContainer>
        <SectionMessage
            appearance="warning"
            dismissible={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                The start time for your recurring session starting on <span className="font-weight-bold">Tues, Oct 28</span> has been moved to <span className="font-weight-bold">2:00 PM</span>.
            </span>
        </SectionMessage>
    </AlertContainer>
);

/**
 * State: Session Canceled
 * Style: Danger
 */
export const SessionCanceled = () => (
    <AlertContainer>
        <SectionMessage
            appearance="danger"
            dismissible={true}
            onDismiss={() => { }}
        >
            <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                Your session on <span className="font-weight-bold">Tues, Oct 28</span> at <span className="font-weight-bold">2:00 PM</span> has been canceled.
            </span>
        </SectionMessage>
    </AlertContainer>
);

