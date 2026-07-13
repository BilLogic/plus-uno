/**
 * MaintenanceAlert Component
 *
 * Top-of-page warning banner announcing a scheduled-maintenance window.
 * Built on top of the PLUS Alert component so dismiss, title, and color
 * tokens stay aligned with the design system.
 *
 * Figma Spec: node-id=2370-194322
 */

import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@/components/messaging/Alert/Alert';

const MaintenanceAlert = ({
    title = 'Scheduled Maintenance',
    greeting = 'Hello tutor,',
    intro = 'please note that the PLUS app will undergo scheduled maintenance from',
    startTime = 'August 1st at 9:00 PM EST',
    endTime = 'August 2nd at 01:00 AM EST',
    closing = 'We appreciate your patience. Good luck with your upcoming sessions :-)',
    dismissable = true,
    onDismiss,
    id,
    className = '',
}) => {
    return (
        <Alert
            id={id}
            style="warning"
            title={title}
            dismissable={dismissable}
            onDismiss={onDismiss}
            className={`plus-maintenance-alert ${className}`}
        >
            <span>{greeting} {intro} </span>
            <strong>{startTime}</strong>
            <span> to </span>
            <strong>{endTime}</strong>
            <span>. {closing}</span>
        </Alert>
    );
};

MaintenanceAlert.propTypes = {
    /** Alert heading */
    title: PropTypes.string,
    /** Salutation that opens the message */
    greeting: PropTypes.string,
    /** Sentence leading into the maintenance window */
    intro: PropTypes.string,
    /** Emphasized start of the maintenance window */
    startTime: PropTypes.string,
    /** Emphasized end of the maintenance window */
    endTime: PropTypes.string,
    /** Closing sentence after the maintenance window */
    closing: PropTypes.string,
    /** Whether the dismiss (X) button is shown */
    dismissable: PropTypes.bool,
    /** Callback fired when the user dismisses the alert */
    onDismiss: PropTypes.func,
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default MaintenanceAlert;
