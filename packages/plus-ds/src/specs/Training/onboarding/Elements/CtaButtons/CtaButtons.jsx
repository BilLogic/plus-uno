/**
 * CtaButtons Component
 * 
 * CTA button component with different states: not started (Get Started), in progress (Continue), completed (Review).
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121928
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import './CtaButtons.scss';

const CtaButtons = ({
    state = 'not started',
    onClick,
    disabled = false,
    className = '',
    ...props
}) => {
    // Map state to button configuration
    const stateConfig = {
        'not started': {
            text: 'Get Started',
            buttonStyle: 'primary',
            fill: 'filled'
        },
        'in progress': {
            text: 'Continue',
            buttonStyle: 'primary',
            fill: 'filled'
        },
        'completed': {
            text: 'Review',
            buttonStyle: 'primary',
            fill: 'filled'
        }
    };

    const config = stateConfig[state] || stateConfig['not started'];

    return (
        <div className={`cta-buttons ${className}`} {...props}>
            <Button
                text={config.text}
                style={config.buttonStyle}
                fill={config.fill}
                size="small"
                onClick={onClick}
                disabled={disabled}
            />
        </div>
    );
};

CtaButtons.propTypes = {
    /** Button state: "not started", "in progress", "completed" */
    state: PropTypes.oneOf(['not started', 'in progress', 'completed']),
    /** Click handler */
    onClick: PropTypes.func,
    /** Disabled state */
    disabled: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default CtaButtons;
