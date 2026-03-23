/**
 * AlertForSupervisors Component
 * 
 * Alert card for supervisors reviewing student training performance.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177693
 */

import React from 'react';
import PropTypes from 'prop-types';
import './AlertForSupervisors.scss';

const AlertForSupervisors = ({
    aiFeature = true,
    studentName = '[Student Name]',
    className = '',
    ...props
}) => {
    const isEnabled = aiFeature;

    return (
        <div className={`alert-for-supervisors ${className}`} {...props}>
            <div className={`alert-for-supervisors__alert alert-for-supervisors__alert--${isEnabled ? 'enabled' : 'disabled'}`}>
                <div className="alert-for-supervisors__content">
                    <div className="alert-for-supervisors__message">
                        <p className="alert-for-supervisors__text body1-txt">
                            You are reviewing{' '}
                            <span className="alert-for-supervisors__name">{studentName}</span>
                            's training performance. AI-powered feedback was{' '}
                            <span className="alert-for-supervisors__status">
                                {isEnabled ? 'enabled' : 'disabled'}
                            </span>
                            {isEnabled ? ' for this lesson to provide real-time insights.' : ' for this lesson.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

AlertForSupervisors.propTypes = {
    /** Whether AI feature is enabled */
    aiFeature: PropTypes.bool,
    /** Student name to display */
    studentName: PropTypes.string,
    /** Additional CSS class */
    className: PropTypes.string,
};

export default AlertForSupervisors;
