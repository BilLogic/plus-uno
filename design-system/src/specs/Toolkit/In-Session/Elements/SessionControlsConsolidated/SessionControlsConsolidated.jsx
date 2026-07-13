import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Badge from '@/components/status-and-loading/Badge/Badge';
import Dropdown from '@/components/forms-and-inputs/Dropdown';
import './SessionControlsConsolidated.scss';

/**
 * SessionControlsConsolidated
 *
 * In-session header controls, consolidated per the "Session Controls Consolidation"
 * spec (Figma Web App Specs 149-110250; Notion hand-off, v2.3 Jul 2026).
 *
 * Button hierarchy (spec): tonal = the live info badges · filled = the primary action
 * (Manage session) · outlined = the secondary overflow ("…" / "Tutor tools"). "View
 * session info" lives inside the overflow menu — there is no standalone ℹ.
 *
 * - Lead: [student · tutor · room badges] · Manage session (filled) · "…" (outlined)
 *         → Request tutors · View session info · Copy assignments
 * - Non-lead: [student · tutor badges] · Tutor tools (outlined)
 *         → Request lead tutor · View session info · Copy assignments
 */

/** Live session-info badges (tonal). Room count is lead-only. */
const SessionInfoBadges = ({ studentCount, tutorCount, roomCount, showRoom }) => (
    <div className="plus-session-controls__badges">
        <Badge
            style="info"
            size="b3"
            className="fw-normal"
            leadingVisual={<i className="fa-solid fa-user-graduate" aria-hidden="true"></i>}
            text={studentCount}
            title="Students marked present / listed on roster for this session"
        />
        <Badge
            style="mastering-content"
            size="b3"
            className="fw-normal"
            leadingVisual={<i className="fa-solid fa-chalkboard-user" aria-hidden="true"></i>}
            text={tutorCount}
            title="Tutors marked present / listed on roster for this session"
        />
        {showRoom && (
            <Badge
                style="secondary"
                size="b3"
                className="fw-normal"
                leadingVisual={<i className="fa-solid fa-door-open" aria-hidden="true"></i>}
                text={roomCount}
                title={roomCount === '—'
                    ? 'Assign students to tutors to size breakout rooms'
                    : 'Rooms to create in Zoom (includes each tutor\'s buffer)'}
            />
        )}
    </div>
);

const SessionControlsConsolidated = ({
    role = 'lead',
    studentCount = '6/8',
    tutorCount = '2/2',
    roomCount = '10',
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

    // "Copy assignments" flips to a non-interactive "Copied" confirmation for ~2s.
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
                <SessionInfoBadges
                    studentCount={studentCount}
                    tutorCount={tutorCount}
                    roomCount={roomCount}
                    showRoom
                />
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
                    fill="outline"
                    size="small"
                    toggle={
                        <Button
                            style="primary"
                            fill="outline"
                            size="small"
                            leadingVisual="ellipsis"
                            aria-label="More session actions"
                        />
                    }
                />
            </div>
        );
    }

    // Non-lead tutor: student + tutor badges (no room count) + "Tutor tools" (outlined).
    const tutorItems = [
        { text: 'Request lead tutor', leadingIcon: 'user-plus', onClick: onRequestLeadTutor },
        { text: 'View session info', leadingIcon: 'circle-info', onClick: onViewSessionInfo },
        { ...copyItem },
    ];

    return (
        <div className="plus-session-controls">
            <SessionInfoBadges
                studentCount={studentCount}
                tutorCount={tutorCount}
                showRoom={false}
            />
            <Dropdown
                id="tutor-tools"
                buttonText="Tutor tools"
                items={tutorItems}
                style="primary"
                fill="outline"
                size="small"
            />
        </div>
    );
};

SessionInfoBadges.propTypes = {
    studentCount: PropTypes.string,
    tutorCount: PropTypes.string,
    roomCount: PropTypes.string,
    showRoom: PropTypes.bool,
};

SessionControlsConsolidated.propTypes = {
    role: PropTypes.oneOf(['lead', 'tutor']),
    /** Student count badge text, e.g. "6/8" (present / roster). */
    studentCount: PropTypes.string,
    /** Tutor count badge text, e.g. "2/2". */
    tutorCount: PropTypes.string,
    /** Room count badge text (lead only), e.g. "10" or "—" while waiting. */
    roomCount: PropTypes.string,
    onManageSession: PropTypes.func,
    onRequestTutors: PropTypes.func,
    onRequestLeadTutor: PropTypes.func,
    onViewSessionInfo: PropTypes.func,
    onCopyAssignments: PropTypes.func,
};

export default SessionControlsConsolidated;
