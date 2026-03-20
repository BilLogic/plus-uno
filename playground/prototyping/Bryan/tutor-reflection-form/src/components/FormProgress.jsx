import React from 'react';
import Progress from '@/components/Progress';

export default function FormProgress({ currentStep, totalSteps, skippedSteps = [] }) {
    const activeSteps = totalSteps - skippedSteps.length;
    const effectiveStep = Math.min(currentStep, activeSteps);
    const value = Math.round(((effectiveStep - 1) / (activeSteps - 1)) * 100);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)' }}>
            <Progress
                value={value}
                min={0}
                max={100}
                style="primary"
                size="small"
            />
            <span
                className="body3-txt"
                style={{ color: 'var(--color-on-surface-variant)', whiteSpace: 'nowrap' }}
            >
                Step {currentStep} of {totalSteps}
            </span>
        </div>
    );
}
