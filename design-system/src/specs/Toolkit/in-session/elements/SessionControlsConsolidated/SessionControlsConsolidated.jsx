import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import './SessionControlsConsolidated.scss';

/**
 * SessionControlsConsolidated
 *
 * Consolidated session controls per Card #2357 PRD.
 * Renders role-aware controls:
 * - Lead tutor: "Manage session" button + "..." overflow dropdown
 * - Non-lead tutor: "Tutor tools" dropdown
 */
const SessionControlsConsolidated = ({
    role = 'lead',
    onManageSession,
    onRequestTutors,
    onRequestLeadTutor,
    onViewSessionInfo,
    onCopyAssignments,
}) => {
    const [copyState, setCopyState] = useState('default'); // 'default' | 'copied'

    const handleCopyAssignments = useCallback(() => {
        setCopyState('copied');
        if (onCopyAssignments) onCopyAssignments();
        setTimeout(() => setCopyState('default'), 2000);
    }, [onCopyAssignments]);

    const copyItem = {
        text: copyState === 'copied' ? 'Copied' : 'Copy assignments',
        leadingIcon: copyState === 'copied' ? 'check' : 'copy',
        onClick: handleCopyAssignments,
        keepOpen: copyState === 'copied',
    };

    if (role === 'lead') {
        const overflowItems = [
            { text: 'Request tutors', leadingIcon: 'user-plus', onClick: onRequestTutors },
            { text: 'View session info', leadingIcon: 'circle-info', onClick: onViewSessionInfo },
            { ...copyItem },
        ];

        return (
            <div className="plus-session-controls">
                <Button
                    text="Manage session"
                    style="primary"
                    fill="filled"
                    size="small"
                    leadingVisual="gear"
                    onClick={onManageSession}
                />
                <Dropdown
                    id="session-overflow"
                    items={overflowItems}
                    style="primary"
                    fill="filled"
                    size="small"
                    toggle={
                        <Button
                            style="primary"
                            fill="filled"
                            size="small"
                            leadingVisual="ellipsis"
                            aria-label="More session options"
                        />
                    }
                />
            </div>
        );
    }

    // Non-lead tutor
    const tutorItems = [
        { text: 'Request lead tutor', leadingIcon: 'user-plus', onClick: onRequestLeadTutor },
        { text: 'View session info', leadingIcon: 'circle-info', onClick: onViewSessionInfo },
        { ...copyItem },
    ];

    return (
        <div className="plus-session-controls">
            <Dropdown
                id="tutor-tools"
                buttonText="Tutor tools"
                items={tutorItems}
                style="primary"
                fill="filled"
                size="small"
            />
        </div>
    );
};

SessionControlsConsolidated.propTypes = {
    role: PropTypes.oneOf(['lead', 'tutor']),
    onManageSession: PropTypes.func,
    onRequestTutors: PropTypes.func,
    onRequestLeadTutor: PropTypes.func,
    onViewSessionInfo: PropTypes.func,
    onCopyAssignments: PropTypes.func,
};

export default SessionControlsConsolidated;
