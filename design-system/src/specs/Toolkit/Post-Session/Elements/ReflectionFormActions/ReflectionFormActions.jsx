import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';

const ACTION_CONFIG = {
    start: { text: 'Start', appearance: 'default' },
    continue: { text: 'Continue', appearance: 'default' },
    edit: { text: 'Edit', appearance: 'default' },
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
            appearance={config.appearance}
            spacing="compact"
            isDisabled={disabled}
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
