import React from 'react';
import Button from '@/components/Button';

const SideBarTab = ({ text, state = 'enabled', trailingIcon = null, onClick }) => {
    const isSelected = state === 'selected';
    const isDisabled = state === 'disabled';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                width: '100%',
                cursor: isDisabled ? 'default' : 'pointer',
                borderRadius: isSelected ? 'var(--size-legacy-radius-3, 6px)' : undefined,
                backgroundColor: isSelected ? 'var(--color-primary-state-16)' : undefined,
            }}
            onClick={!isDisabled ? onClick : undefined}
        >
            <span
                className={isSelected ? 'body2-txt font-weight-semibold' : 'body2-txt'}
                style={{
                    flex: '1 0 0',
                    color: isSelected ? 'var(--color-primary-text)' : 'var(--color-on-surface)',
                    opacity: isDisabled ? 0.38 : 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {text}
            </span>
            {trailingIcon && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                    }}
                >
                    {trailingIcon}
                </span>
            )}
        </div>
    );
};

const STEPS = [
    { id: 'session-info', label: 'Session Information' },
    { id: 'session-overview', label: 'Session Overview' },
    { id: 'student-checkin', label: 'Student Check-In', hasChildren: true },
    { id: 'student-deepdive', label: 'Student Deep Dive' },
    { id: 'teaching-strategies', label: 'Teaching Strategies' },
    { id: 'review-submit', label: 'Review & Submit' },
];

const STEP_ID_TO_NUMBER = {
    'session-info': 1,
    'session-overview': 2,
    'student-checkin': 3,
    'student-deepdive': 4,
    'teaching-strategies': 5,
    'review-submit': 6,
};

const checkIcon = (
    <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)' }} />
);

export default function FormSidebar({
    currentStep,
    completedSteps = [],
    skippedSteps = [],
    students = [],
    onStepClick,
    onSubmitClick,
}) {
    const activeId = STEPS[currentStep - 1]?.id;

    const getTabState = (stepId) => {
        const stepNum = STEP_ID_TO_NUMBER[stepId];
        if (skippedSteps.includes(stepNum)) return 'disabled';
        if (stepId === activeId) return 'selected';
        return 'enabled';
    };

    const getTrailingIcon = (stepId) => {
        const stepNum = STEP_ID_TO_NUMBER[stepId];
        if (completedSteps.includes(stepNum)) return checkIcon;
        return null;
    };

    const canSubmit = currentStep === 6;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-sm, 8px)',
                padding: 'var(--size-section-pad-y-sm, 16px) var(--size-section-pad-x-sm, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '16px',
                minWidth: '240px',
                width: '240px',
                alignSelf: 'flex-start',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                {STEPS.map((step) => {
                    const tabState = getTabState(step.id);
                    const trailing = getTrailingIcon(step.id);

                    return (
                        <React.Fragment key={step.id}>
                            <SideBarTab
                                text={step.label}
                                state={tabState}
                                trailingIcon={trailing}
                                onClick={() => {
                                    const num = STEP_ID_TO_NUMBER[step.id];
                                    if (!skippedSteps.includes(num)) {
                                        onStepClick?.(num);
                                    }
                                }}
                            />
                            {step.hasChildren && tabState === 'selected' && students.length > 0 && (
                                <div style={{ paddingLeft: '16px', width: '100%' }}>
                                    {students.map((student, idx) => (
                                        <SideBarTab
                                            key={student.id}
                                            text={student.name}
                                            state="enabled"
                                            trailingIcon={
                                                student.checked
                                                    ? checkIcon
                                                    : null
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div style={{ opacity: canSubmit ? 1 : 0.38, width: '100%' }}>
                <Button
                    text="Submit"
                    style="default"
                    fill="filled"
                    size="medium"
                    disabled={!canSubmit}
                    block={true}
                    onClick={onSubmitClick}
                />
            </div>
        </div>
    );
}
