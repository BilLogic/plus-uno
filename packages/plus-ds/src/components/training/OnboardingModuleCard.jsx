import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Button } from '../../components'; // Assuming generic Button component exists

const OnboardingModuleCard = ({ title, duration, state = 'default', stage = 'not started' }) => {
    return (
        <Card className="flex-shrink-0" style={{ width: '280px' }}>
            <div className="h-100 bg-light" style={{ height: '140px' }}>
                {/* Placeholder for Image */}
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                    Image Placeholder
                </div>
            </div>
            <Card.Body className="d-flex flex-column gap-2">
                <Card.Title className="h6 m-0 text-truncate">{title}</Card.Title>
                <div className="d-flex align-items-center gap-2 text-muted small">
                    <i className="far fa-clock"></i>
                    <span>{duration}</span>
                </div>
                <div className="mt-2">
                    {stage === 'completed' ? (
                        <Button style="success" fill="tonal" size="small" text="Completed" disabled />
                    ) : (
                        <Button style="primary" fill="filled" size="small" text="Start" />
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default OnboardingModuleCard;
