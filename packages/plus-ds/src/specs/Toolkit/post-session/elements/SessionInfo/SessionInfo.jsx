import React from 'react';
import PropTypes from 'prop-types';
import Card from '../../../../../components/Card';
import Divider from '../../../../../components/Divider';

/**
 * SessionInfo
 * 
 * Displays key information about a session including date, time, client, and topic.
 * Used in the Post-Session flow to provide context.
 */
const SessionInfo = ({
    date,
    time,
    clientName,
    topic,
    className
}) => {
    return (
        <Card
            className={className}
            style={{
                backgroundColor: 'var(--color-surface-container-low)',
                border: 'none',
                height: '100%'
            }}
        >
            <div className="d-flex flex-column gap-3">
                {/* Header */}
                <div>
                    <h6 className="label-sm-txt text-uppercase text-muted mb-1" style={{ letterSpacing: '0.5px' }}>
                        Session Details
                    </h6>
                    <h5 className="h5-txt mb-0">
                        {topic || 'General Session'}
                    </h5>
                </div>

                <Divider />

                {/* Details Grid */}
                <div className="d-flex flex-column gap-3">
                    {/* Client */}
                    <div className="d-flex align-items-center gap-2">
                        <i className="fa-regular fa-user" style={{ color: 'var(--color-primary)', width: '16px' }}></i>
                        <div>
                            <div className="body2-txt font-weight-semibold">{clientName}</div>
                            <div className="label-sm-txt text-muted">Client</div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="d-flex align-items-center gap-2">
                        <i className="fa-regular fa-calendar" style={{ color: 'var(--color-primary)', width: '16px' }}></i>
                        <div>
                            <div className="body2-txt font-weight-semibold">{date}</div>
                            <div className="label-sm-txt text-muted">Date</div>
                        </div>
                    </div>

                    {/* Time */}
                    <div className="d-flex align-items-center gap-2">
                        <i className="fa-regular fa-clock" style={{ color: 'var(--color-primary)', width: '16px' }}></i>
                        <div>
                            <div className="body2-txt font-weight-semibold">{time}</div>
                            <div className="label-sm-txt text-muted">Time</div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

SessionInfo.propTypes = {
    date: PropTypes.string,
    time: PropTypes.string,
    clientName: PropTypes.string,
    topic: PropTypes.string,
    className: PropTypes.string,
};

SessionInfo.defaultProps = {
    date: 'Mon, Oct 24, 2026',
    time: '4:00 PM - 5:00 PM',
    clientName: 'Kiera Wintervale',
    topic: 'Calculus I: Limits and Continuity',
    className: '',
};

export default SessionInfo;
