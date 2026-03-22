import React from 'react';
import Badge from '@/components/Badge';

const FormSidebar = ({ steps, currentStep, onStepClick, hasEscalations }) => {
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
            <div style={{ marginBottom: 'var(--size-element-gap-sm, 8px)' }}>
                <span className="h6" style={{ color: 'var(--color-on-surface)' }}>
                    Reflection Form
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                {steps.map((step, index) => {
                    const isSelected = index === currentStep;
                    const isCompleted = index < currentStep;
                    const showEscalation = step.id === 'review-submit' && hasEscalations;

                    return (
                        <div
                            key={step.id}
                            onClick={() => onStepClick(index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 16px',
                                width: '100%',
                                cursor: 'pointer',
                                borderRadius: isSelected ? 'var(--size-legacy-radius-3, 6px)' : undefined,
                                backgroundColor: isSelected ? 'var(--color-primary-state-16)' : undefined,
                                transition: 'background-color 0.15s ease',
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    fontSize: '12px',
                                    color: isCompleted
                                        ? 'var(--color-success)'
                                        : isSelected
                                            ? 'var(--color-primary-text)'
                                            : 'var(--color-on-surface-variant)',
                                }}
                            >
                                {isCompleted ? (
                                    <i className="fa-solid fa-check" />
                                ) : (
                                    <i className={`fa-solid fa-${step.icon}`} />
                                )}
                            </span>

                            <span
                                className={isSelected ? 'body2-txt font-weight-semibold' : 'body2-txt'}
                                style={{
                                    flex: '1 0 0',
                                    color: isSelected
                                        ? 'var(--color-primary-text)'
                                        : 'var(--color-on-surface)',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {step.label}
                            </span>

                            {showEscalation && (
                                <Badge text="!" style="danger" size="b3" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FormSidebar;
