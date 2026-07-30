import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';

const ACTION_CONFIG = {
    start: { text: 'Start', style: 'primary', fill: 'outline' },
    continue: { text: 'Continue', style: 'primary', fill: 'outline' },
    edit: { text: 'Edit', style: 'secondary', fill: 'outline' },
};

/**
 * Row action on the Reflections table (Figma: Reflection Form Actions).
 *
 * @param {object} props
 * @param {'start'|'continue'|'edit'} [props.action='start']
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 */
const ReflectionFormActions = ({ action = 'start', onClick, disabled = false }) => {
    const config = ACTION_CONFIG[action] || ACTION_CONFIG.start;
    return (
        <Button
            text={config.text}
            style={config.style}
            fill={config.fill}
            size="small"
            disabled={disabled}
            onClick={onClick}
        />
    );
};

ReflectionFormActions.propTypes = {
    action: PropTypes.oneOf(['start', 'continue', 'edit']),
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
};

export default ReflectionFormActions;
