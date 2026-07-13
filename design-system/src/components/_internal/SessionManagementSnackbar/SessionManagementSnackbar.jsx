import React from 'react';
import PropTypes from 'prop-types';
import './SessionManagementSnackbar.scss';

export const SessionManagementSnackbar = ({
    type = 'session created',
    timestamp = '1 mins ago',
    onClose,
    className = '',
    ...props
}) => {
    // Content configuration based on type
    const config = {
        'session created': {
            icon: 'fa-circle-check', // Solid circle check
            headerClass: 'plus-session-snackbar__header--created',
            title: 'Session created',
            body: (
                <>
                    Your <a href="#" className="plus-session-snackbar__link">new session</a> is now live.
                </>
            )
        },
        'session updated': {
            icon: 'fa-circle-info',
            headerClass: 'plus-session-snackbar__header--updated',
            title: 'Session updated',
            body: 'Changes have been saved successfully.'
        },
        'session canceled': {
            icon: 'fa-circle-exclamation',
            headerClass: 'plus-session-snackbar__header--canceled',
            title: 'Session canceled',
            body: 'The session has been removed.'
        },
        'sessions cancelled': {
            icon: 'fa-circle-exclamation',
            headerClass: 'plus-session-snackbar__header--cancelled',
            title: 'Sessions canceled',
            body: 'The sessions have been removed.'
        }
    };

    const currentConfig = config[type] || config['session created'];

    return (
        <div className={`plus-session-snackbar ${className}`} {...props}>
            <div className={`plus-session-snackbar__header ${currentConfig.headerClass}`}>
                <div className="plus-session-snackbar__header-content">
                    <i className={`fa-solid ${currentConfig.icon} plus-session-snackbar__icon`}></i>
                    <span className="plus-session-snackbar__title">{currentConfig.title}</span>
                </div>
                <div className="plus-session-snackbar__meta">
                    <span className="plus-session-snackbar__timestamp">{timestamp}</span>
                    <button type="button" className="plus-session-snackbar__close" onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div className="plus-session-snackbar__body">
                {currentConfig.body}
            </div>
        </div>
    );
};

SessionManagementSnackbar.propTypes = {
    type: PropTypes.oneOf(['session created', 'session updated', 'session canceled', 'sessions cancelled']),
    onClose: PropTypes.func,
    timestamp: PropTypes.string,
    className: PropTypes.string
};

export default SessionManagementSnackbar;
