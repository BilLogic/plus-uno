import React from 'react';
import { Button } from '@/components'; // Assuming generic Button component exists

const OnboardingModuleCard = ({ title, duration, state = 'default', stage = 'not started' }) => {
    return (
        <div className="card flex-shrink-0" style={{ width: '280px' }}>
            <div className="h-100 bg-light" style={{ height: '140px' }}>
                {/* Placeholder for Image */}
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                    Image Placeholder
                </div>
            </div>
            <div className="card-body d-flex flex-column gap-2">
                <div className="card-title h6 m-0 text-truncate">{title}</div>
                <div className="d-flex align-items-center gap-2 text-muted small">
                    <i className="fa-regular fa-clock"></i>
                    <span>{duration}</span>
                </div>
                <div className="mt-2">
                    {stage === 'completed' ? (
                        <Button spacing="compact" text="Completed" isDisabled />
                    ) : (
                        <Button appearance="primary" spacing="compact" text="Start" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModuleCard;
