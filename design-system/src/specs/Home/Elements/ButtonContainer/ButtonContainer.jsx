import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import { Select } from '@/components';
import './ButtonContainer.scss';

/**
 * ButtonContainer Component
 * Join a session: a Select of today's sessions beside the Join button, which
 * waits for a pick. A session is required to join, so the field has no clear ×.
 */
export const ButtonContainer = ({
    enabled = false,
    buttonText = 'Join session',
    sessions = [],
    selectedSession,
    message = enabled 
        ? 'Session starting soon — join early to check your setup and be ready to tutor.'
        : 'Session links will appear 5 minutes before your scheduled start time.',
    messageType = enabled ? 'success' : 'warning',
    onButtonClick,
    onSelectChange,
    className = '',
    id
}) => {

    const messageIcon = messageType === 'success' ? 'info-circle' : 'info-circle';
    const messageColorClass = messageType === 'success' 
        ? 'plus-button-container-message--success' 
        : 'plus-button-container-message--warning';

    return (
        <div 
            id={id}
            className={`plus-button-container plus-button-container--${enabled ? 'enabled' : 'disabled'} ${className}`}
        >
            <div className="plus-button-container-group">
                <Button
                    style="primary"
                    fill="outline"
                    size="medium"
                    text={buttonText}
                    leadingVisual={enabled ? 'arrow-up-right-from-square' : undefined}
                    onClick={onButtonClick}
                    disabled={!enabled}
                    className="plus-button-container-button"
                />
                <Select
                    aria-label="Session"
                    placeholder="Select a session"
                    options={sessions}
                    value={onSelectChange ? (selectedSession ?? '') : undefined}
                    defaultValue={selectedSession ?? ''}
                    onChange={onSelectChange}
                    clearable={false}
                    className="plus-button-container-select"
                />
            </div>
            <div className={`plus-button-container-message ${messageColorClass}`}>
                <div className="plus-button-container-message-icon">
                    <i className={`fa-solid fa-${messageIcon}`} aria-hidden="true"></i>
                </div>
                <span className="plus-button-container-message-text body3-txt">
                    {message}
                </span>
            </div>
        </div>
    );
};

ButtonContainer.propTypes = {
    /** Whether the button container is enabled */
    enabled: PropTypes.bool,
    /** Text for the button */
    buttonText: PropTypes.string,
    /** Today's sessions: `value` is the id, `label` what is shown */
    sessions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })),
    /** The picked session's id */
    selectedSession: PropTypes.string,
    /** Message text to display below */
    message: PropTypes.string,
    /** Message type (success or warning) */
    messageType: PropTypes.oneOf(['success', 'warning']),
    /** Callback when button is clicked */
    onButtonClick: PropTypes.func,
    /** `(id)` when a session is picked */
    onSelectChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string
};

export default ButtonContainer;

