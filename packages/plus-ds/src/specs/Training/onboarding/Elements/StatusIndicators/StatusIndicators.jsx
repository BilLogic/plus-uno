/**
 * StatusIndicators Component
 * 
 * Status indicator icons showing different stages: not started, in progress, completed.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121906
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StatusIndicators.scss';

const StatusIndicators = ({
    stage = 'not started',
    size = 'medium',
    className = '',
    ...props
}) => {
    // Map stage to icon and color
    const stageConfig = {
        'not started': {
            icon: 'fa-circle-stop',
            colorClass: 'status-indicators--not-started'
        },
        'in progress': {
            icon: 'fa-spinner',
            colorClass: 'status-indicators--in-progress'
        },
        'completed': {
            icon: 'fa-circle-check',
            colorClass: 'status-indicators--completed'
        }
    };

    const config = stageConfig[stage] || stageConfig['not started'];

    return (
        <div 
            className={`status-indicators status-indicators--${size} ${config.colorClass} ${className}`}
            role="status"
            aria-label={`Status: ${stage}`}
            {...props}
        >
            <i className={`fas ${config.icon}`} aria-hidden="true" />
        </div>
    );
};

StatusIndicators.propTypes = {
    /** Status stage: "not started", "in progress", "completed" */
    stage: PropTypes.oneOf(['not started', 'in progress', 'completed']),
    /** Size variant */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StatusIndicators;
