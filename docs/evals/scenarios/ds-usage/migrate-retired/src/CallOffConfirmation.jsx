import React, { useState } from 'react';
import { Alert, Badge, Button, Toast } from '@/components';
import './CallOffConfirmation.scss';

const SESSION = { school: 'Lincoln Middle School', date: 'Thursday, March 12', time: '3:30 PM', hoursAway: 18 };

export default function CallOffConfirmation() {
    const [sent, setSent] = useState(false);
    const late = SESSION.hoursAway < 24;

    return (
        <div className="call-off">
            <div className="call-off__header">
                <h2 className="h4">Call off this session?</h2>
                {late && <Badge color="warning" size="small">Late</Badge>}
            </div>
            <p className="body2-txt">
                {SESSION.school}, {SESSION.date} at {SESSION.time}
            </p>
            {late && (
                <Alert variant="warning" dismissible={false}>
                    This session starts in less than 24 hours. A late call-off counts as a strike.
                </Alert>
            )}
            <div className="call-off__actions">
                <Button text="Keep session" fill="outline" variant="secondary" size="small" />
                <Button text="Call off" fill="filled" variant="danger" size="small" onClick={() => setSent(true)} />
            </div>
            <Toast show={sent} onClose={() => setSent(false)} delay={4000} autohide>
                Call-off sent. Your supervisor has been notified.
            </Toast>
        </div>
    );
}
