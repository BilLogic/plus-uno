import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Tutor View Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

// ========================================
// Reusable CTA Button Components (Tutor View)
// Import these in modals and other components
// ========================================

// Sign Up / Fill In Buttons
export const SignUpButton = ({ disabled = false, ...props }) => (
    <Button text="Sign up" iconBefore="user" appearance="primary" isDisabled={disabled} {...props} />
);

export const FillInButton = (props) => (
    <Button text="Fill in for this session" iconBefore="user" appearance="primary" {...props} />
);

export const SignUpRecurringButton = (props) => (
    <Button text="Sign up for recurring session" iconBefore="user" appearance="primary" {...props} />
);

// Session List Buttons
export const SeeSessionsFillInButton = (props) => (
    <Button text="See sessions open to fill-in" {...props} />
);

export const SeeSessionsSignUpButton = (props) => (
    <Button text="See sessions open for sign-up" {...props} />
);

// Navigation / Action Buttons
export const CloseButton = (props) => (
    <Button text="Close" {...props} />
);

export const RequestCallOffButton = (props) => (
    <Button text="Request Call-off" {...props} />
);

export const CancelButton = (props) => (
    <Button text="Cancel" {...props} />
);

export const BackButton = (props) => (
    <Button text="Back" {...props} />
);

// Session Action Buttons
export const JoinSessionButton = ({ block = false, ...props }) => (
    <Button text="Join session" iconBefore="video" appearance="primary" shouldFitContainer={block} {...props} />
);

export const SessionCanceledButton = (props) => (
    <Button text="Session canceled" iconBefore="user" appearance="primary" isDisabled {...props} />
);

// Request Buttons
export const SubmitRequestButton = ({ disabled = false, ...props }) => (
    <Button text="Submit Request" appearance="warning" isDisabled={disabled} {...props} />
);

export const ViewPendingRequestButton = (props) => (
    <Button text="View Pending Request" appearance="primary" {...props} />
);

// Schedule & Withdrawal Buttons
export const ViewUpdatedScheduleButton = (props) => (
    <Button text="View Updated Schedule" appearance="primary" {...props} />
);

export const WithdrawRequestButton = (props) => (
    <Button text="Withdraw Request" {...props} />
);

export const ConfirmWithdrawalButton = (props) => (
    <Button text="Confirm Withdrawal" {...props} />
);

// ========================================
// Story Component
// ========================================

export const CtaTutorViewButtons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--ds-text)' }}>
            Overview of CTA (Tutor View) buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Sign Up / Fill In</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button text="Sign up" iconBefore="user" appearance="primary" />
                <Button text="Sign up" iconBefore="user" appearance="primary" isDisabled />
                <Button text="Fill in for this session" iconBefore="user" appearance="primary" />
                <Button text="Sign up for recurring session" iconBefore="user" appearance="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Session Lists</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="See sessions open to fill-in" />
                <Button text="See sessions open for sign-up" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Navigation / Actions</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Close" />
                {/* Request Call-off appears red/danger in design. Using style='danger' */}
                <Button text="Request Call-off" />
                <Button text="Cancel" />
                <Button text="Back" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Session Actions</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Join session (video icon) */}
                <Button text="Join session" iconBefore="video" appearance="primary" />
                {/* Session canceled (disabled state) */}
                <Button text="Session canceled" iconBefore="user" appearance="primary" isDisabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Requests</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Submit Request - Goldish color. Trying 'warning' or standard primary if warning isn't right. 
                    Design shows a dark yellow/gold. 'warning' is usually acceptable for this. */}
                <Button text="Submit Request" appearance="warning" />
                <Button text="Submit Request" appearance="warning" isDisabled />
                <Button text="View Pending Request" appearance="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Schedule & Withdrawal</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                {/* Live/Green dot usually implies 'success' or specific visual. 
                     Using 'success' style for now, or just primary if simple. 
                     Figma shows teal/blue background for 'View Updated Schedule'. */}
                <Button text="View Updated Schedule" appearance="primary" />

                {/* Withdraw Request - outline red */}
                <Button text="Withdraw Request" />
                <Button text="Confirm Withdrawal" />
            </div>
        </section>
    </div>
);
CtaTutorViewButtons.storyName = 'CTA (Tutor View) Buttons';
