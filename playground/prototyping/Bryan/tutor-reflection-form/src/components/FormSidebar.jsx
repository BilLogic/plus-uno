import React from 'react';
import Badge from '@/components/Badge';
import { STEP_CONFIG } from '../data/mockData';

const stepStatus = (stepId, currentStep, completedSteps, skippedSteps) => {
    if (skippedSteps.includes(stepId)) return 'skipped';
    if (stepId === currentStep) return 'active';
    if (completedSteps.includes(stepId)) return 'completed';
    return 'pending';
};

const statusIcon = (status) => {
    switch (status) {
        case 'completed':
            return <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)' }} />;
        case 'active':
            return <i className="fa-solid fa-circle-dot" style={{ color: 'var(--color-primary)' }} />;
        case 'skipped':
            return <i className="fa-solid fa-forward" style={{ color: 'var(--color-on-surface-variant)' }} />;
        default:
            return <i className="fa-regular fa-circle" style={{ color: 'var(--color-outline-variant)' }} />;
    }
};

export default function FormSidebar({
    currentStep,
    completedSteps = [],
    skippedSteps = [],
    escalationCount = 0,
    onStepClick,
}) {
    return (
        <nav className="reflection-sidebar">
            <div
                style={{
                    padding: '0 var(--size-section-pad-x-sm)',
                    marginBottom: 'var(--size-section-gap-sm)',
                }}
            >
                <span className="h6-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Reflection Form
                </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {STEP_CONFIG.map((step) => {
                    const status = stepStatus(step.id, currentStep, completedSteps, skippedSteps);
                    const isClickable = status === 'completed' || status === 'active';

                    return (
                        <li
                            key={step.id}
                            onClick={() => isClickable && onStepClick?.(step.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--size-element-gap-sm)',
                                padding:
                                    'var(--size-element-pad-y-sm) var(--size-section-pad-x-sm)',
                                cursor: isClickable ? 'pointer' : 'default',
                                background:
                                    status === 'active'
                                        ? 'var(--color-primary-container)'
                                        : 'transparent',
                                borderLeft:
                                    status === 'active'
                                        ? '3px solid var(--color-primary)'
                                        : '3px solid transparent',
                                opacity: status === 'skipped' ? 0.5 : 1,
                                transition: 'background 0.15s ease',
                            }}
                        >
                            <span style={{ width: 20, textAlign: 'center' }}>
                                {statusIcon(status)}
                            </span>
                            <span
                                className="body2-txt"
                                style={{
                                    flex: 1,
                                    fontWeight:
                                        status === 'active'
                                            ? 'var(--font-weight-body2-semibold)'
                                            : 'var(--font-weight-body2-regular)',
                                    color:
                                        status === 'active'
                                            ? 'var(--color-primary)'
                                            : 'var(--color-on-surface)',
                                }}
                            >
                                {step.label}
                            </span>
                            {step.id === 4 && escalationCount > 0 && (
                                <Badge
                                    text={String(escalationCount)}
                                    style="warning"
                                    size="b3"
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
