/**
 * MaintenanceAlert Component
 *
 * Top-of-page warning banner announcing a scheduled-maintenance window.
 * Built on the PLUS Banner component.
 *
 * Figma Spec: node-id=2370-194322
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Banner from '@/components/messaging/Banner/Banner';
import CloseButton from '@/components/forms-and-inputs/CloseButton';

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
    const [show, setShow] = useState(true);

    if (!show) return null;

    const handleDismiss = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    return (
        <Banner
            id={id}
            appearance="warning"
            className={`plus-maintenance-alert ${className}`}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--inline-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <strong>{title}</strong>
                    <span>
                        {greeting} {intro} <strong>{startTime}</strong> to <strong>{endTime}</strong>. {closing}
                    </span>
                </div>
                {dismissable && <CloseButton label="Dismiss maintenance notice" onClick={handleDismiss} />}
            </div>
        </Banner>
    );
};

MaintenanceAlert.propTypes = {
    /** Banner heading */
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
    /** Callback fired when the user dismisses the banner */
    onDismiss: PropTypes.func,
    /** HTML id attribute */
    id: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default MaintenanceAlert;
