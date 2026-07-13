import React from 'react';
import PropTypes from 'prop-types';
import './SessionAvailabilitySnackbar.scss';

export const SessionAvailabilitySnackbar = ({
    type = 'one-time session',
    available = true,
    timestamp = '1 mins ago',
    onClose,
    className = '',
    ...props
}) => {

    const statusText = available ? 'Available' : 'Unavailable';
    const sessionText = type === 'recurring session' ? 'recurring session' : 'session';

    // Construct body text with bold status
    const bodyContent = (
        <>
            You are confirmed as <strong>‘{statusText}’</strong> for this {sessionText}.
        </>
    );

    return (
        <div className={`plus-session-availability-snackbar ${className}`} {...props}>
            <div className="plus-session-availability-snackbar__header">
                <div className="plus-session-availability-snackbar__header-content">
                    <i className="fa-solid fa-circle-check plus-session-availability-snackbar__icon"></i>
                    <span className="plus-session-availability-snackbar__title">Success</span>
                </div>
                <div className="plus-session-availability-snackbar__meta">
                    <span className="plus-session-availability-snackbar__timestamp">{timestamp}</span>
                    <button type="button" className="plus-session-availability-snackbar__close" onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div className="plus-session-availability-snackbar__body">
                {bodyContent}
            </div>
        </div>
    );
};

SessionAvailabilitySnackbar.propTypes = {
    type: PropTypes.oneOf(['one-time session', 'recurring session']),
    available: PropTypes.bool,
    onClose: PropTypes.func,
    timestamp: PropTypes.string,
    className: PropTypes.string
};

export default SessionAvailabilitySnackbar;
