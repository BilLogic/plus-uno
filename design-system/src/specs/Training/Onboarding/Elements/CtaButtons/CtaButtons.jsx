/**
 * CtaButtons Component
 * 
 * CTA button component with different states: not started (Get Started), in progress (Continue), completed (Review).
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121928
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
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
            appearance: 'primary'
        },
        'in progress': {
            text: 'Continue',
            appearance: 'primary'
        },
        'completed': {
            text: 'Review',
            appearance: 'default'
        }
    };

    const config = stateConfig[state] || stateConfig['not started'];

    return (
        <div className={`cta-buttons ${className}`} {...props}>
            <Button
                text={config.text}
                appearance={config.appearance}
                spacing="compact"
                onClick={onClick}
                isDisabled={disabled}
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
