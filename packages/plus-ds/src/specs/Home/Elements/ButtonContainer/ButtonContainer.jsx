import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import './ButtonContainer.scss';

/**
 * ButtonContainer Component
 * A button group with a button and select dropdown, with enabled/disabled states
 */
export const ButtonContainer = ({
    enabled = false,
    buttonText = 'Join session',
    sessionInfo = 'Jackson, 9:05 am - 9:55 am, 10/13/2023',
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
                    leadingVisual="arrow-up-right-from-square"
                    onClick={onButtonClick}
                    disabled={!enabled}
                    className="plus-button-container-button"
                />
                <div className="plus-button-container-select-wrapper">
                    <div className="plus-button-container-select-inner">
                        <span className="plus-button-container-select-text body2-txt">
                            {sessionInfo}
                        </span>
                        <div className="plus-button-container-select-icon">
                            <i className="fa-solid fa-caret-down" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
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
    /** Session information text */
    sessionInfo: PropTypes.string,
    /** Message text to display below */
    message: PropTypes.string,
    /** Message type (success or warning) */
    messageType: PropTypes.oneOf(['success', 'warning']),
    /** Callback when button is clicked */
    onButtonClick: PropTypes.func,
    /** Callback when select changes */
    onSelectChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string
};

export default ButtonContainer;

